import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { isolateHistory } from '@codemirror/commands';
import {
    inspectMarkdownImport,
    prepareMarkdownImport,
    type MarkdownTransferContext,
} from './markdown-transfer';

export function useMarkdownTransfer(
    view: EditorView | null,
    context: MarkdownTransferContext,
) {
    const controller = useRef<AbortController | null>(null);
    const [empty, setEmpty] = useState(!view?.state.doc.toString().trim());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const updateEmpty = useCallback(
        () => setEmpty(!view?.state.doc.toString().trim()),
        [view],
    );
    useEffect(() => {
        updateEmpty();
    }, [updateEmpty]);
    useEffect(() => () => controller.current?.abort(), []);
    const importSource = useCallback(
        async (inputSource: string) => {
            if (
                !view ||
                !view.state.facet(EditorView.editable) ||
                view.state.doc.toString().trim() ||
                controller.current
            )
                return;
            const original = view.state.doc;
            const request = new AbortController();
            controller.current = request;
            setBusy(true);
            setError('');
            try {
                const source = await inspectMarkdownImport(
                    prepareMarkdownImport(inputSource),
                    context,
                    request.signal,
                );
                if (request.signal.aborted || !view.dom.isConnected) return;
                if (
                    view.state.doc !== original ||
                    !view.state.facet(EditorView.editable)
                )
                    throw new Error(
                        'The document changed while importing. Your current content was kept.',
                    );
                view.dispatch({
                    changes: { from: 0, to: original.length, insert: source },
                    selection: { anchor: 0 },
                    annotations: isolateHistory.of('full'),
                    userEvent: 'input.import',
                });
                view.focus();
            } catch (failure) {
                if (!request.signal.aborted)
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not import Markdown.',
                    );
            } finally {
                if (!request.signal.aborted) {
                    setBusy(false);
                    controller.current = null;
                }
            }
        },
        [view, context],
    );
    const replacementBaseline = useRef(view?.state.doc);
    const validateReplacement = useCallback(
        async (source: string) => {
            if (!view || !view.state.facet(EditorView.editable))
                throw new Error('The document is not editable.');
            const baseline = view.state.doc;
            const normalized = await inspectMarkdownImport(
                source,
                context,
                new AbortController().signal,
            );
            if (view.state.doc !== baseline)
                throw new Error(
                    'The document changed while verifying. Choose the file again.',
                );
            replacementBaseline.current = baseline;
            return normalized;
        },
        [view, context],
    );
    const replaceContent = useCallback(
        async (source: string) => {
            if (
                !view ||
                !view.dom.isConnected ||
                !view.state.facet(EditorView.editable)
            )
                throw new Error('The document is no longer editable.');
            if (view.state.doc !== replacementBaseline.current)
                throw new Error(
                    'The document changed after verification. Choose the file again.',
                );
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: source },
                selection: { anchor: 0 },
                annotations: isolateHistory.of('full'),
                userEvent: 'input.import',
            });
            view.focus();
        },
        [view],
    );
    return {
        empty,
        busy,
        error,
        updateEmpty,
        importSource,
        validateReplacement,
        replaceContent,
    };
}
