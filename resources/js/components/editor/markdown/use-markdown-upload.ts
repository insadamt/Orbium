import { serializeOrbiumBlock } from './dialect/metadata';
import { announceInsertedIcon } from '@/components/inline-icons/icon-preferences';
import { inlineIconLabel } from '@/components/inline-icons/icon-catalog';
import { closeCompletion } from '@codemirror/autocomplete';
import { isolateHistory } from '@codemirror/commands';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import { useNavigation } from '@/components/navigation/navigation-store';
import {
    type UploadedAttachment,
    type ContentOwnerKind,
    uploadAttachment,
} from '../editor-api';
import {
    acceptsUploadKind,
    uploadAccept,
    uploadKindForMime,
} from '@/components/media/attachment-media';
import type {
    MarkdownUploadKind,
    MarkdownUploadRequest,
} from './markdown-slash-commands';
import {
    markdownUploadAnchor,
    setMarkdownUploadAnchor,
} from './markdown-upload-anchor';
import {
    escapeMarkdownLabel,
    isMarkdownLiteralPosition,
} from './markdown-syntax';
import { markdownBlockAt } from './interactions/markdown-block-actions';

export function useMarkdownUpload(
    workspaceId: number,
    nodeId: number,
    options?: {
        ownerKind?: ContentOwnerKind;
        onUploadingChange?: (busy: boolean) => void;
    },
) {
    const uploadOptions = useRef(options);
    uploadOptions.current = options;
    const fileInput = useRef<HTMLInputElement>(null);
    const request = useRef<(MarkdownUploadRequest & { id: string }) | null>(
        null,
    );
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [kind, setKind] = useState<MarkdownUploadKind>('file');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const uploadingNow = useRef(false);
    const mounted = useRef(true);
    const { tabId, active } = useDocumentTab();
    const activeTab = useRef(active);
    activeTab.current = active;

    const clearUploadRequest = useCallback(() => {
        const current = request.current;
        if (current?.view.dom.isConnected)
            current.view.dispatch({
                effects: setMarkdownUploadAnchor.of(null),
            });
        request.current = null;
    }, []);

    const prepareUpload = useCallback(
        (next: MarkdownUploadRequest) => {
            if (uploadingNow.current || !activeTab.current) return false;
            if (
                next.from === next.to &&
                isMarkdownLiteralPosition(next.view.state, next.from)
            ) {
                const position = markdownBlockAt(next.view.state, next.from).to;
                next = { ...next, from: position, to: position };
            }
            clearUploadRequest();
            setError('');
            setKind(next.kind);
            const id = crypto.randomUUID();
            request.current = { ...next, id };
            next.view.dispatch({
                effects: setMarkdownUploadAnchor.of({
                    id,
                    from: next.from,
                    to: next.to,
                    source: next.view.state.sliceDoc(next.from, next.to),
                }),
            });
            closeCompletion(next.view);
            return true;
        },
        [clearUploadRequest],
    );

    const openFileInput = useCallback(
        (next: MarkdownUploadRequest) => {
            if (!fileInput.current || !prepareUpload(next)) return;
            fileInput.current.multiple = next.kind === 'file';
            fileInput.current.accept = uploadAccept(next.kind);
            fileInput.current.value = '';
            fileInput.current.click();
        },
        [prepareUpload],
    );

    const chooseFile = useCallback(
        (next: MarkdownUploadRequest) => {
            if (prepareUpload(next)) setLibraryOpen(true);
        },
        [prepareUpload],
    );

    function uploadNewFile() {
        const current = request.current;
        setLibraryOpen(false);
        if (current) openFileInput(current);
    }

    const uploadFile = useCallback(
        async (file: File | UploadedAttachment) => {
            const current = request.current;
            if (!current || uploadingNow.current) return;
            if (
                !acceptsUploadKind(
                    current.kind,
                    file instanceof File ? file.type : file.mime_type,
                )
            ) {
                setError(`Choose a supported ${current.kind} file.`);
                clearUploadRequest();
                return;
            }
            uploadingNow.current = true;
            uploadOptions.current?.onUploadingChange?.(true);
            setUploading(true);
            try {
                const attachment =
                    file instanceof File
                        ? await uploadAttachment(
                              workspaceId,
                              nodeId,
                              file,
                              uploadOptions.current?.ownerKind,
                          )
                        : file;
                const label = escapeMarkdownLabel(
                    current.inlineIcon
                        ? inlineIconLabel(attachment.name || file.name)
                        : attachment.name || file.name,
                );
                let source = `${current.kind === 'image' ? '!' : ''}[${label}](orbium:attachment/${attachment.id})`;
                if (current.inlineIcon)
                    source = `:orbium[${source}]{"icon":"custom"}`;
                if (
                    current.kind === 'image' &&
                    current.imageMetadata?.kind === 'image'
                )
                    source = serializeOrbiumBlock(
                        current.imageMetadata,
                        source,
                    );
                const wrappers =
                    current.wrappers ??
                    (current.presentation?.kind === 'block'
                        ? [current.presentation]
                        : []);
                for (const wrapper of [...wrappers].reverse())
                    source = serializeOrbiumBlock(wrapper, source);
                const anchor = current.view.state.field(markdownUploadAnchor);
                if (!acceptsUploadKind(current.kind, attachment.mime_type))
                    throw new Error(
                        `The uploaded file is not a supported ${current.kind}.`,
                    );
                if (!mounted.current || !current.view.dom.isConnected) return;
                if (
                    !anchor ||
                    anchor.id !== current.id ||
                    anchor.from > anchor.to ||
                    current.view.state.sliceDoc(anchor.from, anchor.to) !==
                        anchor.source
                )
                    throw new Error(
                        `Upload completed, but the insertion text changed. Paste this reference where you want it: ${source}`,
                    );
                setError('');
                const line = current.view.state.doc.lineAt(anchor.from);
                const prefix =
                    current.view.state
                        .sliceDoc(line.from, anchor.from)
                        .trim() && !current.inlineIcon
                        ? '\n\n'
                        : '';
                const suffix =
                    current.view.state
                        .sliceDoc(
                            anchor.to,
                            current.view.state.doc.lineAt(anchor.to).to,
                        )
                        .trim() && !current.inlineIcon
                        ? '\n\n'
                        : '';
                const insertion = `${prefix}${source}${suffix}`;
                current.view.dispatch({
                    changes: {
                        from: anchor.from,
                        to: anchor.to,
                        insert: insertion,
                    },
                    selection: { anchor: anchor.from + insertion.length },
                    effects: setMarkdownUploadAnchor.of(null),
                    annotations: isolateHistory.of('full'),
                    userEvent: 'input.attachment',
                });
                if (current.inlineIcon) current.view.focus();
                if (current.inlineIcon)
                    announceInsertedIcon(current.view.dom, {
                        kind: 'custom',
                        attachmentId: attachment.id,
                        label: inlineIconLabel(attachment.name || file.name),
                    });
                return anchor.from + insertion.length;
            } catch (failure) {
                if (mounted.current)
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not upload the attachment.',
                    );
            } finally {
                uploadingNow.current = false;
                uploadOptions.current?.onUploadingChange?.(false);
                if (mounted.current) {
                    setUploading(false);
                    clearUploadRequest();
                }
            }
        },
        [workspaceId, nodeId, clearUploadRequest],
    );

    useEffect(() => {
        mounted.current = true;
        const input = fileInput.current;
        input?.addEventListener('cancel', clearUploadRequest);
        const blockUploadRemoval = (event: Event) => {
            if (!uploadingNow.current) return;
            if (
                event.type === 'orbium:before-tab-close' &&
                (event as CustomEvent<{ tabId: string }>).detail.tabId !== tabId
            )
                return;
            event.preventDefault();
            setError(
                'Wait for the attachment upload to finish before leaving this page.',
            );
        };
        const removeGuard = router.on('before', (event) => {
            if (
                !uploadingNow.current ||
                ((!activeTab.current ||
                    (tabId && useNavigation.getState().activeId !== tabId)) &&
                    event.detail.visit.url.pathname !== '/logout')
            )
                return;
            setError(
                'Wait for the attachment upload to finish before leaving this page.',
            );
            return false;
        });
        window.addEventListener('orbium:before-page-leave', blockUploadRemoval);
        window.addEventListener('beforeunload', blockUploadRemoval);
        window.addEventListener('orbium:before-tab-close', blockUploadRemoval);
        return () => {
            mounted.current = false;
            input?.removeEventListener('cancel', clearUploadRequest);
            removeGuard();
            window.removeEventListener(
                'orbium:before-page-leave',
                blockUploadRemoval,
            );
            window.removeEventListener('beforeunload', blockUploadRemoval);
            window.removeEventListener(
                'orbium:before-tab-close',
                blockUploadRemoval,
            );
        };
    }, [tabId, clearUploadRequest]);

    const uploadDroppedFiles = useCallback(
        async (files: File[], next: MarkdownUploadRequest) => {
            if (uploadingNow.current) return;
            let position = next.from;
            let first = true;
            for (const file of files) {
                if (
                    !mounted.current ||
                    !next.view.dom.isConnected ||
                    !activeTab.current
                )
                    break;
                const kind = uploadKindForMime(file.type);
                if (
                    !prepareUpload({
                        ...next,
                        from: position,
                        to: first ? next.to : position,
                        kind,
                    })
                )
                    break;
                const insertedAt = await uploadFile(file);
                if (insertedAt === undefined) break;
                position = insertedAt;
                first = false;
            }
        },
        [prepareUpload, uploadFile],
    );

    const uploadSelectedFiles = useCallback(
        async (files: File[]) => {
            const selected = request.current;
            if (!selected || !files.length) return;
            const insertedAt = await uploadFile(files[0]);
            if (
                insertedAt !== undefined &&
                files.length > 1 &&
                selected.view.dom.isConnected
            ) {
                await uploadDroppedFiles(files.slice(1), {
                    ...selected,
                    from: insertedAt,
                    to: insertedAt,
                });
            }
        },
        [uploadFile, uploadDroppedFiles],
    );

    return {
        openFileInput,
        libraryOpen,
        uploadNewFile,
        closeLibrary: () => {
            setLibraryOpen(false);
            clearUploadRequest();
        },
        chooseLibraryFile: (file: UploadedAttachment) => {
            setLibraryOpen(false);
            void uploadFile(file);
        },
        uploadDroppedFiles,
        uploadSelectedFiles,
        fileInput,
        kind,
        uploading,
        error,
        chooseFile,
        uploadFile,
        clearUploadRequest,
    };
}
