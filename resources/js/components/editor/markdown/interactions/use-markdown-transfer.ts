import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { isolateHistory } from '@codemirror/commands';
import { downloadMarkdown } from '../../markdown-download';
import {
    inspectMarkdownImport,
    prepareMarkdownImport,
    serializeOnlineMarkdown,
    type MarkdownTransferContext,
} from './markdown-transfer';

export function useMarkdownTransfer(
    view: EditorView | null,
    context: MarkdownTransferContext,
    title: string,
) {
    const input = useRef<HTMLInputElement>(null);
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
    const importFile = useCallback(
        async (file: File) => {
            if (!/\.(?:md|markdown)$/i.test(file.name)) {
                setError('Choose a .md or .markdown file.');
                return;
            }
            if (file.size > 400000) {
                setError('Markdown import accepts files up to 400 KB.');
                return;
            }
            try {
                const source = new TextDecoder('utf-8', { fatal: true }).decode(
                    await file.arrayBuffer(),
                );
                await importSource(source);
            } catch {
                setError('The Markdown file could not be read as UTF-8.');
            }
        },
        [importSource],
    );
    const exportMarkdown = useCallback(
        (online: boolean) => {
            if (!view) return;
            const source = view.state.doc.toString();
            downloadMarkdown(
                title,
                online ? serializeOnlineMarkdown(source, context) : source,
            );
        },
        [view, title, context],
    );
    return {
        input,
        empty,
        busy,
        error,
        updateEmpty,
        importSource,
        importFile,
        exportMarkdown,
    };
}
