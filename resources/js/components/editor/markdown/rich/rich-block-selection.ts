import { isolateHistory } from '@codemirror/commands';
import { Prec } from '@codemirror/state';
import {
    EditorView,
    ViewPlugin,
    keymap,
    type ViewUpdate,
} from '@codemirror/view';
import type { RichBlock } from './rich-model';
import { revealRichSource } from './rich-effects';

const interactiveTarget =
    'button, a, input, textarea, select, summary, [role="button"], .cm-editor, [data-rich-writing]';

function adjacentWritingPosition(
    view: EditorView,
    block: RichBlock,
    before: boolean,
) {
    const edgeLine = view.state.doc.lineAt(before ? block.from : block.to);
    for (
        let number = edgeLine.number + (before ? -1 : 1);
        number >= 1 && number <= view.state.doc.lines;
        number += before ? -1 : 1
    ) {
        const line = view.state.doc.line(number);
        if (line.text.trim()) return before ? line.to : line.from;
    }
    return null;
}

export function createOrFocusRichParagraph(
    view: EditorView,
    {
        block,
        placement = 'after',
        text = '',
    }: {
        block: RichBlock;
        placement?: 'before' | 'after';
        text?: string;
    },
) {
    if (!view.state.facet(EditorView.editable)) return;
    const before = placement === 'before';
    const edge = before ? block.from : block.to;
    const adjacent = before
        ? view.state.sliceDoc(Math.max(0, edge - 2), edge)
        : view.state.sliceDoc(edge, Math.min(view.state.doc.length, edge + 2));
    const separated = adjacent === '\n\n';
    const from = before ? edge : separated ? edge + 2 : edge;
    const existingWritingLine =
        !before && separated && !view.state.doc.lineAt(from).text.trim();
    const writingLine = view.state.doc.lineAt(from);
    const needsTrailingSeparator =
        existingWritingLine &&
        writingLine.number < view.state.doc.lines &&
        Boolean(view.state.doc.line(writingLine.number + 1).text.trim());
    const insert = existingWritingLine
        ? `${text}${needsTrailingSeparator ? '\n' : ''}`
        : before
          ? `${text}\n\n`
          : separated
            ? `${text}\n\n`
            : `\n\n${text}\n\n`;
    const anchor = from + (before || separated ? text.length : 2 + text.length);
    view.dispatch({
        changes: insert ? { from, insert } : undefined,
        selection: { anchor },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.paragraph',
        scrollIntoView: true,
    });
    view.focus();
}

export function bindRichBlockSelection(
    root: HTMLElement,
    view: EditorView,
    current: () => RichBlock,
) {
    root.tabIndex = 0;
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', `${current().kind} block`);
    root.addEventListener('focus', () =>
        root.ownerDocument.getSelection()?.removeAllRanges(),
    );
    root.addEventListener('pointerdown', (event) => {
        const interactive = (event.target as Element).closest(
            interactiveTarget,
        );
        if (event.button !== 0 || (interactive && root.contains(interactive)))
            return;
        event.preventDefault();
        root.focus({ preventScroll: true });
        view.dispatch({ selection: { anchor: current().from } });
    });
    root.addEventListener('keydown', (event) => {
        if (event.target !== root || event.defaultPrevented) return;
        const block = current();
        if (
            (event.ctrlKey || event.metaKey) &&
            event.shiftKey &&
            event.key.toLowerCase() === 'a'
        ) {
            event.preventDefault();
            event.stopPropagation();
            view.dispatch({
                selection: { anchor: block.from, head: block.to },
                effects: revealRichSource.of(block.from),
            });
            view.focus();
            return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === 'Enter') {
            createOrFocusRichParagraph(view, {
                block,
                placement: event.shiftKey ? 'before' : 'after',
            });
        } else if (
            [
                'ArrowUp',
                'ArrowLeft',
                'ArrowDown',
                'ArrowRight',
                'Escape',
            ].includes(event.key)
        ) {
            const before = ['ArrowUp', 'ArrowLeft'].includes(event.key);
            const anchor = adjacentWritingPosition(view, block, before);
            if (anchor === null)
                createOrFocusRichParagraph(view, {
                    block,
                    placement: before ? 'before' : 'after',
                });
            else {
                view.dispatch({
                    selection: event.shiftKey
                        ? {
                              anchor: before ? block.to : block.from,
                              head: anchor,
                          }
                        : { anchor },
                    scrollIntoView: true,
                });
                view.focus();
            }
        } else if (['Backspace', 'Delete'].includes(event.key)) {
            if (!view.state.facet(EditorView.editable)) return;
            view.dispatch({
                changes: { from: block.from, to: block.to },
                selection: { anchor: block.from },
                annotations: isolateHistory.of('full'),
                userEvent: 'delete.block',
            });
            view.focus();
        } else if (event.key.length === 1 && !event.isComposing) {
            createOrFocusRichParagraph(view, { block, text: event.key });
        } else return;
        event.preventDefault();
        event.stopPropagation();
    });
    root.addEventListener('paste', (event) => {
        if (event.target !== root) return;
        const text = event.clipboardData?.getData('text/plain');
        if (!text) return;
        event.preventDefault();
        event.stopPropagation();
        createOrFocusRichParagraph(view, { block: current(), text });
    });
}

export function richBlockSelection(blocks: (view: EditorView) => RichBlock[]) {
    function hiddenBlock(view: EditorView) {
        const range = view.state.selection.main;
        if (!range.empty) return null;
        return blocks(view).find(
            (block) =>
                !['inline-math', 'metadata', 'empty'].includes(block.kind) &&
                block.from <= range.head &&
                block.to >= range.head &&
                view.dom.querySelector(`[data-rich-from="${block.from}"]`),
        );
    }
    const focus = ViewPlugin.fromClass(
        class {
            frame: number | null = null;
            constructor(readonly view: EditorView) {}
            update(update: ViewUpdate) {
                if (
                    (!update.selectionSet || update.docChanged) &&
                    !update.focusChanged
                )
                    return;
                if (this.frame !== null) cancelAnimationFrame(this.frame);
                this.frame = requestAnimationFrame(() => {
                    this.frame = null;
                    if (!this.view.hasFocus) return;
                    const block = hiddenBlock(this.view);
                    if (block)
                        this.view.dom
                            .querySelector<HTMLElement>(
                                `[data-rich-from="${block.from}"]`,
                            )
                            ?.focus({ preventScroll: true });
                });
            }
            destroy() {
                if (this.frame !== null) cancelAnimationFrame(this.frame);
            }
        },
    );
    return [
        focus,
        Prec.highest(
            EditorView.inputHandler.of((view, from, to, text) => {
                const block = from === to && hiddenBlock(view);
                if (!block) return false;
                createOrFocusRichParagraph(view, { block, text });
                return true;
            }),
        ),
        Prec.high(
            keymap.of([
                {
                    key: 'Enter',
                    run(view) {
                        const block = hiddenBlock(view);
                        if (!block) return false;
                        createOrFocusRichParagraph(view, { block });
                        return true;
                    },
                },
            ]),
        ),
    ];
}
