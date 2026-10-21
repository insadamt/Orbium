import { validBoardObjects, type BoardValidationCache } from './board-api';
import {
    BoardRecordHistory,
    type BoardRecordChange,
    type BoardHistoryEntry,
} from './board-record-history';
import { boardLimits, type BoardObject } from './board-types';

type Listener = () => void;
type BoardRecordTransaction = {
    changes: Map<string, BoardRecordChange>;
    order: string[];
    bytes: number;
    notifyHistory?: boolean;
    persist?: boolean;
};
export type BoardObjectSource = BoardObject[] | (() => BoardObject[]);
export const materializeBoardObjects = (source: BoardObjectSource) =>
    typeof source === 'function' ? source() : source;

function sameGeometry(first: BoardObject, second: BoardObject) {
    return (
        first.x === second.x &&
        first.y === second.y &&
        first.width === second.width &&
        first.height === second.height &&
        first.layer === second.layer &&
        first.block_type === second.block_type
    );
}

export class BoardRecordStore {
    private records = new Map<string, BoardObject>();
    private order: string[] = [];
    private objects: BoardObject[] | undefined;
    private layout: BoardObject[] = [];
    private totalBytes = 0;
    private validationCache: BoardValidationCache = new WeakMap();
    private recordListeners = new Map<string, Set<Listener>>();
    private layoutListeners = new Set<Listener>();
    private historyListeners = new Set<Listener>();
    readonly history = new BoardRecordHistory();

    constructor(
        initial: BoardObject[],
        private onChanged: (source: BoardObjectSource) => void,
    ) {
        this.replaceSnapshot(initial);
    }

    readonly getObject = (id: string) => this.records.get(id);
    readonly getObjects = () =>
        (this.objects ??= this.order.map((id) => this.records.get(id)!));
    readonly getLayoutSnapshot = () => this.layout;
    readonly getHistoryState = () => this.history.state;
    readonly subscribeLayout = (listener: Listener) =>
        this.subscribe(this.layoutListeners, listener);
    readonly subscribeHistory = (listener: Listener) =>
        this.subscribe(this.historyListeners, listener);

    subscribeObject(id: string, listener: Listener) {
        let listeners = this.recordListeners.get(id);
        if (!listeners) this.recordListeners.set(id, (listeners = new Set()));
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
            if (!listeners.size) this.recordListeners.delete(id);
        };
    }

    changeObject(replacement: BoardObject, group: string | null = null) {
        const before = this.records.get(replacement.id);
        if (!before) return false;
        if (before === replacement) return true;
        if (!validBoardObjects([replacement], this.validationCache))
            return false;
        const nextBytes =
            this.totalBytes -
            this.dataBytes(before) +
            this.dataBytes(replacement);
        if (
            nextBytes > boardLimits.totalBytes ||
            replacement.layer !== before.layer
        )
            return false;
        const changes = new Map([
            [
                replacement.id,
                { id: replacement.id, before, after: replacement },
            ],
        ]);
        this.history.record(
            { changes, beforeOrder: this.order, afterOrder: this.order },
            group,
        );
        this.publish({ changes, order: this.order, bytes: nextBytes });
        return true;
    }

    commitSnapshot(next: BoardObject[], group: string | null = null) {
        if (!validBoardObjects(next, this.validationCache)) return false;
        if (next.some((object, index) => object.layer !== index))
            next = [...next]
                .sort((a, b) => a.layer - b.layer)
                .map((object, layer) =>
                    object.layer === layer ? object : { ...object, layer },
                );
        const { changes, order, bytes } = this.compareSnapshot(next);
        if (!changes.size) return true;
        this.history.record(
            { changes, beforeOrder: this.order, afterOrder: order },
            group,
        );
        this.publish({ changes, order, bytes });
        return true;
    }

    applyMeasuredHeights(
        measurements: Map<string, { object: BoardObject; height: number }>,
    ) {
        const changes = new Map<string, BoardRecordChange>();
        for (const [id, measured] of measurements) {
            const before = this.records.get(id);
            //
            // A measurement belongs to its immutable record; newer editing/history geometry must win over stale observer work.
            //
            if (
                !before ||
                before !== measured.object ||
                Math.abs(before.height - measured.height) <= 1
            )
                continue;
            changes.set(id, {
                id,
                before,
                after: { ...before, height: measured.height },
            });
        }
        if (changes.size)
            this.publish({
                changes,
                order: this.order,
                bytes: this.totalBytes,
                notifyHistory: false,
            });
    }

    replaceSnapshot(next: BoardObject[], rememberInsertion = false) {
        if (!validBoardObjects(next, this.validationCache))
            throw new Error('Invalid Board snapshot.');
        const { changes, order, bytes } = this.compareSnapshot(next);
        if (rememberInsertion && changes.size)
            this.history.record(
                { changes, beforeOrder: this.order, afterOrder: order },
                null,
            );
        else if (!rememberInsertion) this.history.clear();
        this.publish({ changes, order, bytes, persist: false });
    }

    undo() {
        const entry = this.history.undo();
        if (!entry) return false;
        this.restore(entry, 'undo');
        return true;
    }

    redo() {
        const entry = this.history.redo();
        if (!entry) return false;
        this.restore(entry, 'redo');
        return true;
    }

    private restore(entry: BoardHistoryEntry, direction: 'undo' | 'redo') {
        const changes = new Map<string, BoardRecordChange>();
        let bytes = this.totalBytes;
        for (const [id, change] of entry.changes) {
            const before = this.records.get(id);
            const after = direction === 'redo' ? change.after : change.before;
            bytes +=
                (after ? this.dataBytes(after) : 0) -
                (before ? this.dataBytes(before) : 0);
            changes.set(id, { id, before, after });
        }
        this.publish({
            changes,
            order: direction === 'redo' ? entry.afterOrder : entry.beforeOrder,
            bytes,
        });
    }

    private compareSnapshot(next: BoardObject[]) {
        const changes = new Map<string, BoardRecordChange>();
        const nextIds = new Set<string>();
        let bytes = 0;
        for (const after of next) {
            nextIds.add(after.id);
            bytes += this.dataBytes(after);
            const before = this.records.get(after.id);
            if (before !== after)
                changes.set(after.id, { id: after.id, before, after });
        }
        for (const [id, before] of this.records)
            if (!nextIds.has(id)) changes.set(id, { id, before });
        const order =
            next.length === this.order.length &&
            next.every((object, index) => object.id === this.order[index])
                ? this.order
                : next.map((object) => object.id);
        return { changes, order, bytes };
    }

    private publish({
        changes,
        order,
        bytes,
        notifyHistory = true,
        persist = true,
    }: BoardRecordTransaction) {
        let geometryChanged = order !== this.order;
        for (const { id, before, after } of changes.values()) {
            if (after) this.records.set(id, after);
            else this.records.delete(id);
            geometryChanged ||=
                !before || !after || !sameGeometry(before, after);
        }
        this.order = order;
        this.totalBytes = bytes;
        this.objects = undefined;
        if (geometryChanged) this.layout = this.getObjects();
        //
        // Publish a completed transaction before notifying any subscriber so cards, selection and persistence observe one coherent version.
        //
        if (persist) this.onChanged(this.getObjects);
        for (const id of changes.keys())
            this.recordListeners.get(id)?.forEach((listener) => listener());
        if (geometryChanged)
            this.layoutListeners.forEach((listener) => listener());
        if (notifyHistory)
            this.historyListeners.forEach((listener) => listener());
    }

    private dataBytes(object: BoardObject) {
        let validation = this.validationCache.get(object.data);
        if (!validation || validation.kind !== object.block_type) {
            validBoardObjects([object], this.validationCache);
            validation = this.validationCache.get(object.data);
        }
        return validation!.bytes;
    }

    private subscribe(listeners: Set<Listener>, listener: Listener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }
}
