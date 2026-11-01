// Summary: Provides active V3 Live Preview keyboard, clipboard and embedded shortcut delegation; depends on existing owner dispatch/history, scoped selection and structural protection.
import { v3CompositionTracking } from './v3-composition';
import { v3SpacerWritingOperation } from './v3-spacer-writing';
import { focusV3FollowingEmptyParagraph } from './v3-paragraph-focus';
import { v3StructureField } from '../structure/v3-structure-state';
import {
    v3ClipboardScope,
    readV3NativeClipboard,
    v3ClipboardHtml,
} from '../runtime/v3-menu-clipboard';
import { completionStatus } from '@codemirror/autocomplete';
import { Prec } from '@codemirror/state';
import { EditorView, keymap, ViewPlugin } from '@codemirror/view';
import { executeV3Operation } from '../transactions/v3-transaction-dispatch';
import {
    V3OperationError,
    type V3BlockOperation,
} from '../transactions/v3-transaction-types';
import {
    v3BlockSelectionField,
    v3BlockSelectionTransaction,
    v3SelectAllField,
    v3SelectAllTransaction,
} from './v3-block-selection';
import {
    resolveV3KeyboardOperation,
    isV3ProtectedTextBoundary,
    type V3EditingKey,
} from './v3-keyboard-operations';
import {
    resolveV3PasteOperation,
    selectedV3BlockClipboard,
    readV3PlainTextSelection,
    v3ClipboardMime,
} from './v3-editing-clipboard';
import { v3LiveStructureExtensions } from './v3-live-structure';
import { resolveV3EmbeddedColumnBlock } from '../columns/v3/v3-column-registry';
import { normalizeV3PastedMarkdown } from './v3-paste-source';

export type V3LiveEditingOptions = {
    isAvailable: () => boolean;
    clipboardScope: string;
    onError: (error: Error) => void;
    resolveEmbeddedBlock?: (target: EventTarget | null) => string | null;
    dispatchOperation?: (view: EditorView, operation: V3BlockOperation) => void;
    selectDocument?: (view: EditorView) => boolean;
    renderColumnLayouts?: boolean;
    renderRichBodies?: boolean;
};

export function v3LiveEditingExtensions(options: V3LiveEditingOptions) {
    function isEmbeddedClipboardTarget(
        view: EditorView,
        target: EventTarget | null,
    ) {
        return (
            target instanceof Element &&
            (target.closest('.cm-editor') !== view.dom ||
                target.closest('textarea, input') !== null ||
                Boolean(options.resolveEmbeddedBlock?.(target)))
        );
    }
    function report(error: unknown) {
        options.onError(
            error instanceof Error
                ? error
                : new Error('The V3 editing action failed.'),
        );
    }
    function apply(view: EditorView, operation: V3BlockOperation) {
        if (options.dispatchOperation) {
            options.dispatchOperation(view, operation);
            return;
        }
        const result = executeV3Operation({
            view,
            operation,
            isAvailable: options.isAvailable,
        });
        if (result.warning) report(new Error(result.warning));
    }
    function key(view: EditorView, name: V3EditingKey, blockId?: string) {
        if (view.composing || view.compositionStarted) return false;
        if (name === 'Enter' && completionStatus(view.state) !== null)
            return false;
        try {
            const selected = view.state.field(v3BlockSelectionField);
            if (
                selected &&
                (name === 'Backspace' ||
                    name === 'Ctrl-Backspace' ||
                    name === 'Delete')
            ) {
                apply(view, {
                    kind: 'delete',
                    blockIds: selected.ids,
                    ensureParagraph: true,
                });
                return true;
            }
            const operation = resolveV3KeyboardOperation({
                state: view.state,
                key: name,
                blockId:
                    blockId ??
                    (selected?.ids.length === 1 &&
                    view.state
                        .field(v3StructureField)
                        .current.blockById(selected.ids[0])?.type === 'spacer'
                        ? selected.ids[0]
                        : undefined) ??
                    (name === 'Shift-Enter' ? selected?.ids.at(-1) : undefined),
            });
            if (!operation) return isV3ProtectedTextBoundary(view.state, name);
            if (
                name === 'Enter' &&
                focusV3FollowingEmptyParagraph(view, operation)
            )
                return true;
            apply(
                view,
                name === 'Enter' || name === 'Shift-Enter'
                    ? { ...operation, motion: 'none' }
                    : operation,
            );
        } catch (error) {
            report(error);
        }
        return true;
    }
    const events = EditorView.domEventHandlers({
        copy(event, view) {
            return copyBlocks(event, view, false);
        },
        cut(event, view) {
            return copyBlocks(event, view, true);
        },
        paste(event, view) {
            if (isEmbeddedClipboardTarget(view, event.target)) return false;
            if (!event.clipboardData || event.clipboardData.files.length)
                return false;
            event.preventDefault();
            try {
                const block = view.state
                    .field(v3StructureField)
                    .current.blockAt(view.state.selection.main.from);
                if (
                    block?.type === 'spacer' &&
                    (view.state.field(v3BlockSelectionField)?.ids.length ??
                        0) <= 1 &&
                    !readV3NativeClipboard(event.clipboardData)
                ) {
                    const operation = v3SpacerWritingOperation(
                        block.id,
                        event.clipboardData.getData('text/plain'),
                    );
                    if (operation) apply(view, operation);
                    return true;
                }
                const operation = resolveV3PasteOperation({
                    state: view.state,
                    scope: options.clipboardScope,
                    text: event.clipboardData.getData('text/plain'),
                    native: readV3NativeClipboard(event.clipboardData),
                });
                if (operation) apply(view, operation);
            } catch (error) {
                report(error);
            }
            return true;
        },
    });
    function copyBlocks(event: ClipboardEvent, view: EditorView, cut: boolean) {
        if (isEmbeddedClipboardTarget(view, event.target)) return false;
        try {
            const clipboard = selectedV3BlockClipboard(
                view.state,
                options.clipboardScope,
            );
            if (!event.clipboardData) return false;
            if (!clipboard) {
                const text = readV3PlainTextSelection(view.state);
                if (!text.containsStructure) return false;
                event.preventDefault();
                event.clipboardData.setData('text/plain', text.plain);
                if (cut)
                    report(
                        new V3OperationError(
                            'protected-text-cut',
                            'Use the handle selection to cut complete blocks across structural boundaries.',
                        ),
                    );
                return true;
            }
            event.preventDefault();
            event.clipboardData.setData('text/plain', clipboard.plain);
            event.clipboardData.setData(v3ClipboardMime, clipboard.native);
            event.clipboardData.setData(
                'text/html',
                v3ClipboardHtml(clipboard.native, clipboard.plain),
            );
            if (cut)
                apply(view, {
                    kind: 'delete',
                    blockIds: clipboard.ids,
                    ensureParagraph: true,
                });
        } catch (error) {
            event.preventDefault();
            report(error);
        }
        return true;
    }
    const embeddedShortcut = ViewPlugin.define((view) => {
        const capture = (event: KeyboardEvent) => {
            if (
                event.key !== 'Enter' ||
                !event.shiftKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.isComposing
            )
                return;
            const target =
                event.target instanceof Element ? event.target : null;
            if (!target) return;
            const spacerId = target.closest<HTMLElement>('[data-v3-spacer-id]')
                ?.dataset.v3SpacerId;
            const blockId =
                (spacerId &&
                view.state.field(v3StructureField).current.blockById(spacerId)
                    ?.type === 'spacer'
                    ? spacerId
                    : null) ??
                options.resolveEmbeddedBlock?.(event.target) ??
                resolveV3EmbeddedColumnBlock(view, event.target);
            if (
                !blockId &&
                target.closest('.cm-editor') === view.dom &&
                !target.closest('textarea, input')
            )
                return;
            event.preventDefault();
            event.stopPropagation();
            if (blockId) key(view, 'Shift-Enter', blockId);
            else
                report(
                    new V3OperationError(
                        'missing-embedded-owner',
                        'The embedded editor must register its owning V3 block.',
                    ),
                );
        };
        view.dom.addEventListener('keydown', capture, true);
        return {
            destroy() {
                view.dom.removeEventListener('keydown', capture, true);
            },
        };
    });
    return [
        v3ClipboardScope.of(options.clipboardScope),
        EditorView.inputHandler.of((view, from, to, text) => {
            if (view.composing || view.compositionStarted) return false;
            const selected = view.state.field(v3BlockSelectionField)?.ids;
            const index = view.state.field(v3StructureField).current;
            const block = index.blockAt(from);
            try {
                if (block?.type === 'spacer' && (selected?.length ?? 0) <= 1) {
                    const operation = v3SpacerWritingOperation(block.id, text);
                    if (operation) apply(view, operation);
                    return true;
                }
                if (selected?.length) {
                    const source = normalizeV3PastedMarkdown(text).source;
                    if (source)
                        apply(view, {
                            kind: 'paste-blocks',
                            blockIds: selected,
                            source,
                        });
                    else
                        apply(view, {
                            kind: 'delete',
                            blockIds: selected,
                            ensureParagraph: true,
                        });
                    return true;
                }
                if (
                    from === to &&
                    block?.type === 'columns' &&
                    from >= block.bodyTo
                ) {
                    const next = index.neighbor(block.id, 1);
                    apply(view, {
                        kind: 'insert',
                        type: 'paragraph',
                        body: text,
                        caret: text.length,
                        target: { parentId: null, beforeId: next?.id },
                        motion: 'none',
                    });
                    return true;
                }
            } catch (error) {
                report(error);
                return true;
            }
            return false;
        }),
        v3CompositionTracking,
        v3BlockSelectionField,
        v3SelectAllField,
        v3LiveStructureExtensions(
            () =>
                report(
                    new V3OperationError(
                        'protected-structure',
                        'That edit would remove a block marker or cross its boundary. Select visible text, or use a block control to change its type.',
                    ),
                ),
            options.renderColumnLayouts,
            options.renderRichBodies,
        ),
        Prec.highest(
            keymap.of([
                ...(
                    [
                        'Enter',
                        'Shift-Enter',
                        'Backspace',
                        'Ctrl-Backspace',
                        'Delete',
                    ] as const
                ).map((name) => ({
                    key: name,
                    run: (view: EditorView) => key(view, name),
                })),
                {
                    key: 'Mod-a',
                    run(view) {
                        if (
                            view.state.field(v3SelectAllField) &&
                            options.selectDocument?.(view)
                        )
                            return true;
                        const transaction = v3SelectAllTransaction(view.state);
                        if (!transaction) return false;
                        view.dispatch(transaction);
                        return true;
                    },
                },
            ]),
        ),
        events,
        embeddedShortcut,
    ];
}

export function selectV3BlockFromHandle(
    view: EditorView,
    blockId: string,
    extend = false,
) {
    view.dispatch(v3BlockSelectionTransaction(view.state, blockId, extend));
    view.focus();
}
