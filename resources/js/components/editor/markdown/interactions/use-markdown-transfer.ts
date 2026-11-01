// Summary: Applies verified V3 imports atomically and detects meaningful document content; depends on server validation, source baselines and trusted owner history annotations.
import { requireValidV3Structure } from '../structure/v3-document-file';
import { focusV3OwnerColumnSelection } from '../columns/v3/v3-column-registry';
import { v3OwnerOperation } from '../transactions/v3-transaction-types';
import { v3StructureField } from '../structure/v3-structure-state';
import { initialV3Caret } from '../runtime/v3-initial-selection';
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
    const [empty, setEmpty] = useState(!hasV3Content(view));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const updateEmpty = useCallback(
        () => setEmpty(!hasV3Content(view)),
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
                hasV3Content(view) ||
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
                    selection: {
                        anchor:
                            requireValidV3Structure(
                                source,
                            ).structure.blocks.find(
                                (block) => block.type !== 'columns',
                            )?.bodyFrom ?? 0,
                    },
                    annotations: [
                        isolateHistory.of('full'),
                        v3OwnerOperation.of(true),
                    ],
                    userEvent: 'input.import',
                });
                view.focus();
                queueMicrotask(() => {
                    if (view.dom.isConnected) focusV3OwnerColumnSelection(view);
                });
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
                selection: {
                    anchor: initialV3Caret(source),
                },
                annotations: [
                    isolateHistory.of('full'),
                    v3OwnerOperation.of(true),
                ],
                userEvent: 'input.import',
            });
            view.focus();
            queueMicrotask(() => {
                if (view.dom.isConnected) focusV3OwnerColumnSelection(view);
            });
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

function hasV3Content(view: EditorView | null) {
    if (!view) return false;
    const index = view.state.field(v3StructureField, false)?.current;
    if (!index?.valid) return Boolean(view.state.doc.toString().trim());
    return index.structure.blocks.some(
        (block) =>
            block.type !== 'paragraph' ||
            Boolean(view.state.sliceDoc(block.bodyFrom, block.bodyTo).trim()),
    );
}
