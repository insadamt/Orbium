import type { UploadedAttachment } from '@/components/editor/editor-api';
import type {
    PdfReaderEvent,
    PdfViewSession,
    PdfViewState,
    PreparedPdfPage,
} from '@/components/media/pdf-view-session';
import type { BoardRecordStore } from '../board-record-store';
import type { BoardWorkScheduler } from '../board-work-scheduler';

const preparedPdfBudgets = {
    entries: 32,
    bytes: 64 * 1024 * 1024,
    viewStates: 1000,
    pinnedReaders: 1,
} as const;
type PdfEntry = { attachment: UploadedAttachment; view?: PdfViewState };
type CachedPage = { page: PreparedPdfPage; bytes: number };

export class BoardPdfSceneStore {
    private entries = new Map<string, PdfEntry>();
    private pages = new Map<string, CachedPage>();
    private pageBytes = 0;
    private pinnedIds: readonly string[] = [];
    private pinListeners = new Set<() => void>();
    private counters = {
        readerShellCreations: 0,
        readerShellDestructions: 0,
        documentLoads: 0,
        documentDisposals: 0,
        documentDisposalFailures: 0,
        pageRasterizations: 0,
        skippedRasters: 0,
        pageHits: 0,
        pageMisses: 0,
        evictions: 0,
    };

    constructor(
        private records: BoardRecordStore,
        private scheduler: BoardWorkScheduler,
    ) {}

    readonly getPinnedIds = () => this.pinnedIds;
    readonly subscribePins = (listener: () => void) => {
        this.pinListeners.add(listener);
        return () => {
            this.pinListeners.delete(listener);
        };
    };

    reconcile(ids: Iterable<string>) {
        for (const id of ids) {
            const object = this.records.getObject(id);
            const entry = this.entries.get(id);
            if (
                entry &&
                (object?.block_type !== 'file' ||
                    object.data.attachment_id !== entry.attachment.id)
            )
                this.invalidateObject(id);
        }
    }

    reuseMetadata(objectId: string, attachmentId: number) {
        const entry = this.entries.get(objectId);
        return entry?.attachment.id === attachmentId
            ? entry.attachment
            : undefined;
    }

    createSession(
        objectId: string,
        attachment: UploadedAttachment,
    ): PdfViewSession | undefined {
        const object = this.records.getObject(objectId);
        if (
            attachment.mime_type !== 'application/pdf' ||
            object?.block_type !== 'file' ||
            object.data.attachment_id !== attachment.id
        )
            return;
        let entry = this.entries.get(objectId);
        if (
            !entry ||
            entry.attachment.id !== attachment.id ||
            entry.attachment.size_bytes !== attachment.size_bytes ||
            entry.attachment.mime_type !== attachment.mime_type
        ) {
            this.invalidateObject(objectId);
            entry = { attachment };
            this.entries.set(objectId, entry);
        } else entry.attachment = attachment;
        const currentEntry = entry;
        const current = () => this.entries.get(objectId) === currentEntry;
        return {
            reusePreparedPage: () => {
                const cached = current() ? this.pages.get(objectId) : undefined;
                if (!cached) {
                    this.counters.pageMisses++;
                    return;
                }
                this.counters.pageHits++;
                this.pages.delete(objectId);
                this.pages.set(objectId, cached);
                return cached.page;
            },
            readViewState: () => (current() ? currentEntry.view : undefined),
            rememberViewState: (state) => {
                if (current()) currentEntry.view = { ...state };
            },
            rememberPreparedPage: (page) => {
                if (current()) this.rememberPage(objectId, page);
            },
            scheduleDocumentLoad: (run) => this.schedule('fetch', current, run),
            schedulePageRender: (run) => this.schedule('render', current, run),
            activateReader: () => {
                if (!current() || this.pinnedIds[0] === objectId) return;
                this.pinnedIds = [objectId];
                this.publishPins();
            },
            isReaderActive: () => current() && this.pinnedIds[0] === objectId,
            subscribeActivation: this.subscribePins,
            record: (event: PdfReaderEvent) => {
                this.counters[event]++;
            },
        };
    }

    scheduleMetadataFetch(run: () => Promise<void>) {
        return this.scheduler.enqueue('fetch', run, () => 0);
    }

    releaseForOtherEditor(editingId: string | null) {
        if (
            !editingId ||
            !this.pinnedIds.length ||
            this.pinnedIds[0] === editingId
        )
            return;
        this.pinnedIds = [];
        this.publishPins();
    }

    invalidateAttachment(attachmentId: number) {
        for (const [id, entry] of this.entries)
            if (entry.attachment.id === attachmentId) this.invalidateObject(id);
    }

    clear() {
        for (const id of this.pages.keys()) this.releasePage(id);
        this.entries.clear();
        if (this.pinnedIds.length) {
            this.pinnedIds = [];
            this.publishPins();
        }
    }

    snapshot() {
        return {
            ...this.counters,
            activeDocuments:
                this.counters.documentLoads - this.counters.documentDisposals,
            preparedPages: this.pages.size,
            preparedBytes: this.pageBytes,
            viewStates: this.entries.size,
            pinnedReaders: this.pinnedIds.length,
            budgets: preparedPdfBudgets,
        };
    }

    private schedule(
        kind: 'fetch' | 'render',
        current: () => boolean,
        run: () => Promise<void>,
    ) {
        return this.scheduler.enqueue(
            kind,
            async () => {
                if (current()) await run();
            },
            () => 0,
        );
    }

    private rememberPage(objectId: string, page: PreparedPdfPage) {
        const bytes =
            page.pixelWidth * page.pixelHeight * 4 + page.text.length * 2;
        this.releasePage(objectId);
        if (bytes > preparedPdfBudgets.bytes) return;
        while (
            this.pages.size >= preparedPdfBudgets.entries ||
            this.pageBytes + bytes > preparedPdfBudgets.bytes
        ) {
            const oldest = this.pages.keys().next().value;
            if (!oldest) break;
            this.releasePage(oldest);
            this.counters.evictions++;
        }
        //
        // Own a pixel copy independent of the reader's canvas, which is explicitly cleared when its card is evicted.
        //
        const canvas = document.createElement('canvas');
        canvas.width = page.pixelWidth;
        canvas.height = page.pixelHeight;
        canvas.getContext('2d')?.drawImage(page.canvas, 0, 0);
        this.pages.set(objectId, { page: { ...page, canvas }, bytes });
        this.pageBytes += bytes;
    }

    private invalidateObject(id: string) {
        this.entries.delete(id);
        this.releasePage(id);
        if (this.pinnedIds.includes(id)) {
            this.pinnedIds = [];
            this.publishPins();
        }
    }

    private releasePage(id: string) {
        const entry = this.pages.get(id);
        if (!entry) return;
        entry.page.canvas.width = entry.page.canvas.height = 0;
        this.pageBytes -= entry.bytes;
        this.pages.delete(id);
    }

    private publishPins() {
        this.pinListeners.forEach((listener) => listener());
    }
}
