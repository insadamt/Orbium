import { useEffect, useState } from 'react';
import { useIconRecents } from './use-icon-recents';
import { announceInsertedIcon } from './icon-preferences';
import { EditorView } from '@codemirror/view';
import { isolateHistory } from '@codemirror/commands';
import { closeCompletion } from '@codemirror/autocomplete';
import { InlineIconPicker } from './inline-icon-picker';
import {
    iconPickerEvent,
    type IconPickerRequest,
} from './markdown-icon-widget';
import { serializeInlineIcon } from './markdown-icon-source';
import type { InlineIconChoice } from './icon-catalog';
import {
    markdownUploadAnchor,
    setMarkdownUploadAnchor,
} from '@/components/editor/markdown/markdown-upload-anchor';
import type { MarkdownUploadRequest } from '@/components/editor/markdown/markdown-slash-commands';

export function MarkdownInlineIcons({
    view,
    workspaceId,
    nodeId,
    onUpload,
}: {
    view: EditorView | null;
    workspaceId: number;
    nodeId: number;
    onUpload: (request: MarkdownUploadRequest) => void;
}) {
    const [request, setRequest] = useState<
        (IconPickerRequest & { id: string }) | null
    >(null);
    const [error, setError] = useState('');
    useIconRecents(view?.dom ?? null, workspaceId);
    useEffect(() => {
        if (!view) return;
        const open = (event: Event) => {
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
            setRequest({ ...detail, id });
        };
        view.dom.addEventListener(iconPickerEvent, open);
        return () => view.dom.removeEventListener(iconPickerEvent, open);
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
        if (view?.dom.isConnected) {
            view.dispatch({ effects: setMarkdownUploadAnchor.of(null) });
            view.focus();
        }
        setRequest(null);
    }
    function choose(choice: InlineIconChoice) {
        const anchor = currentAnchor();
        if (!view || !anchor) {
            close();
            return;
        }
        const source = serializeInlineIcon(choice);
        view.dispatch({
            changes: { from: anchor.from, to: anchor.to, insert: source },
            selection: { anchor: anchor.from + source.length },
            effects: setMarkdownUploadAnchor.of(null),
            annotations: isolateHistory.of('full'),
            userEvent: 'input.icon',
        });
        setRequest(null);
        view.focus();
        announceInsertedIcon(view.dom, choice);
    }
    return (
        <>
            {error && (
                <p role="alert" className="mb-2 text-sm text-destructive">
                    {error}
                </p>
            )}
            {request && (
                <InlineIconPicker
                    workspaceId={workspaceId}
                    nodeId={nodeId}
                    initialQuery={request.query}
                    onChoose={choose}
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
                        onUpload({
                            view,
                            from: anchor.from,
                            to: anchor.to,
                            kind: 'image',
                            inlineIcon: true,
                        });
                        setRequest(null);
                    }}
                />
            )}
        </>
    );
}
