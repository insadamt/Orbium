import { usePage } from '@inertiajs/react';
import {
    uploadAttachment,
    type ContentOwnerKind,
} from '@/components/editor/editor-api';
import { inlineIconLabel } from './icon-catalog';
import { useEffect, useRef, useState } from 'react';
import { useScopedIconRecents } from './use-icon-recents';
import { announceInsertedIcon } from './icon-preferences';
import { EditorView } from '@codemirror/view';
import { isolateHistory } from '@codemirror/commands';
import { closeCompletion } from '@codemirror/autocomplete';
import { InlineIconPicker } from './inline-icon-picker';
import {
    iconPickerEvent,
    type IconPickerRequest,
} from './markdown-icon-widget';
import { serializeReplacementIcon } from './markdown-icon-source';
import type { InlineIconChoice } from './icon-catalog';
import {
    markdownUploadAnchor,
    setMarkdownUploadAnchor,
} from '@/components/editor/markdown/markdown-upload-anchor';
import type { MarkdownUploadRequest } from '@/components/editor/markdown/markdown-slash-commands';

type MarkdownInlineIconsProps = {
    view: EditorView | null;
    workspaceId: number;
    nodeId: number;
    onUpload?: (request: MarkdownUploadRequest) => void;
    ownerKind?: ContentOwnerKind;
    preferenceScope?: string;
    portalContainer?: HTMLElement;
    onBusy?: (busy: boolean) => void;
};

export function MarkdownInlineIcons(props: MarkdownInlineIconsProps) {
    return props.preferenceScope ? (
        <MarkdownInlineIconsContent
            {...props}
            preferenceScope={props.preferenceScope}
        />
    ) : (
        <AuthenticatedMarkdownInlineIcons {...props} />
    );
}

function AuthenticatedMarkdownInlineIcons(props: MarkdownInlineIconsProps) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    return (
        <MarkdownInlineIconsContent
            {...props}
            preferenceScope={`orbium:inline-icons:v1:${auth.user.id}:${props.workspaceId}`}
        />
    );
}

function MarkdownInlineIconsContent({
    view,
    workspaceId,
    nodeId,
    onUpload,
    ownerKind,
    preferenceScope,
    portalContainer,
    onBusy,
}: MarkdownInlineIconsProps & { preferenceScope: string }) {
    const [request, setRequest] = useState<
        (IconPickerRequest & { id: string }) | null
    >(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const busy = useRef(false);
    const mounted = useRef(true);
    const fileInput = useRef<HTMLInputElement>(null);
    const busyCallback = useRef(onBusy);
    busyCallback.current = onBusy;
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            if (busy.current) busyCallback.current?.(false);
        };
    }, []);
    useScopedIconRecents(view?.dom ?? null, preferenceScope);
    useEffect(() => {
        if (!view) return;
        const open = (event: Event) => {
            event.stopPropagation();
            if (busy.current) return;
            const detail = (event as CustomEvent<IconPickerRequest>).detail;
            if (
                !view.state.facet(EditorView.editable) ||
                view.compositionStarted
            )
                return;
            const id = crypto.randomUUID();
            closeCompletion(view);
            view.dispatch({
                effects: setMarkdownUploadAnchor.of({
                    id,
                    from: detail.from,
                    to: detail.to,
                    source: view.state.sliceDoc(detail.from, detail.to),
                }),
            });
            setError('');
            view.dom.dataset.inlineIconPickerOpen = 'true';
            setRequest({ ...detail, id });
        };
        view.dom.addEventListener(iconPickerEvent, open);
        return () => {
            view.dom.removeEventListener(iconPickerEvent, open);
            delete view.dom.dataset.inlineIconPickerOpen;
        };
    }, [view]);

    function currentAnchor() {
        if (
            !view?.dom.isConnected ||
            !view.state.facet(EditorView.editable) ||
            view.compositionStarted
        )
            return null;
        const anchor = view.state.field(markdownUploadAnchor);
        if (
            !anchor ||
            anchor.id !== request?.id ||
            anchor.from > anchor.to ||
            view.state.sliceDoc(anchor.from, anchor.to) !== anchor.source
        ) {
            setError(
                'The insertion text changed. Open the icon picker again at the desired position.',
            );
            return null;
        }
        return anchor;
    }
    function close() {
        if (busy.current) return;
        if (view?.dom.isConnected) {
            view.dispatch({ effects: setMarkdownUploadAnchor.of(null) });
            view.focus();
        }
        if (view) delete view.dom.dataset.inlineIconPickerOpen;
        setRequest(null);
    }
    function choose(choice: InlineIconChoice) {
        const anchor = currentAnchor();
        if (!view || !anchor) {
            close();
            return;
        }
        const source = serializeReplacementIcon(
            view.state,
            anchor.from,
            anchor.to,
            choice,
        );
        view.dispatch({
            changes: { from: anchor.from, to: anchor.to, insert: source },
            selection: { anchor: anchor.from + source.length },
            effects: setMarkdownUploadAnchor.of(null),
            annotations: isolateHistory.of('full'),
            userEvent: 'input.icon',
        });
        if (view) delete view.dom.dataset.inlineIconPickerOpen;
        setRequest(null);
        view.focus();
        announceInsertedIcon(view.dom, choice);
    }
    async function uploadIcon(file: File) {
        if (!view || busy.current || !currentAnchor()) return;
        if (
            !['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
                file.type,
            )
        ) {
            setError('Choose a PNG, JPEG, GIF or WebP icon.');
            return;
        }
        busy.current = true;
        setUploading(true);
        busyCallback.current?.(true);
        setError('');
        try {
            const attachment = await uploadAttachment(
                workspaceId,
                nodeId,
                file,
                ownerKind,
            );
            if (mounted.current)
                choose({
                    kind: 'custom',
                    attachmentId: attachment.id,
                    label: inlineIconLabel(attachment.name),
                });
        } catch (failure) {
            if (mounted.current)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Could not upload the icon.',
                );
        } finally {
            busy.current = false;
            busyCallback.current?.(false);
            if (mounted.current) setUploading(false);
        }
    }
    return (
        <>
            {error && (
                <p role="alert" className="mb-2 text-sm text-destructive">
                    {error}
                </p>
            )}
            <input
                ref={fileInput}
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/gif,image/webp"
                aria-label="Upload inline icon"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadIcon(file);
                    event.target.value = '';
                }}
            />
            {request && (
                <InlineIconPicker
                    workspaceId={workspaceId}
                    nodeId={nodeId}
                    ownerKind={ownerKind}
                    preferenceScope={preferenceScope}
                    portalContainer={portalContainer}
                    busy={uploading}
                    error={error}
                    initialQuery={request.query}
                    onChoose={(choice) => {
                        if (!busy.current) choose(choice);
                    }}
                    onClose={close}
                    onReturnFocus={() => {
                        if (view?.dom.isConnected) view.focus();
                    }}
                    onUpload={() => {
                        const anchor = currentAnchor();
                        if (!view || !anchor) {
                            close();
                            return;
                        }
                        if (!onUpload) {
                            fileInput.current?.click();
                            return;
                        }
                        onUpload({
                            view,
                            from: anchor.from,
                            to: anchor.to,
                            kind: 'image',
                            inlineIcon: true,
                        });
                        if (view) delete view.dom.dataset.inlineIconPickerOpen;
                        setRequest(null);
                    }}
                />
            )}
        </>
    );
}
