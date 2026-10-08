import { Prec, type EditorState } from '@codemirror/state';
import { formatMarkdownSelection } from './interactions/markdown-inline-format';
import { indentLess, indentMore, isolateHistory } from '@codemirror/commands';
import { EditorView, keymap, type Command } from '@codemirror/view';
import {
    pendingInlineFormatting,
    setPendingInlineFormatting,
} from './markdown-pending-formatting';
import {
    hasMarkdownAncestor,
    markdownNodeAt,
    isMarkdownLiteralPosition,
    isMarkdownSourceOnlyLine,
} from './markdown-syntax';

function toggleInlineDelimiter(delimiter: '**' | '*' | '~~'): Command {
    return (view) => {
        if (!view.state.facet(EditorView.editable) || view.compositionStarted)
            return false;
        if (
            view.state.selection.ranges.some(
                (range) =>
                    isMarkdownLiteralPosition(view.state, range.head) ||
                    isMarkdownSourceOnlyLine(
                        view.state.doc.lineAt(range.head).text,
                    ),
            )
        )
            return true;
        const selection = view.state.selection.main;
        if (view.state.selection.ranges.length === 1 && selection.empty) {
            const before = view.state.sliceDoc(
                Math.max(0, selection.head - delimiter.length),
                selection.head,
            );
            const after = view.state.sliceDoc(
                selection.head,
                selection.head + delimiter.length,
            );
            if (after === delimiter && before !== delimiter) {
                view.dispatch({
                    selection: { anchor: selection.head + delimiter.length },
                });
                return true;
            }
            const pending = view.state.field(pendingInlineFormatting);
            const delimiters =
                pending?.anchor === selection.head ? pending.delimiters : [];
            const next = delimiters.includes(delimiter)
                ? delimiters.filter((item) => item !== delimiter)
                : [...delimiters, delimiter];
            view.dispatch({
                effects: setPendingInlineFormatting.of(
                    next.length
                        ? { anchor: selection.head, delimiters: next }
                        : null,
                ),
            });
            return true;
        }
        formatMarkdownSelection(view, delimiter);
        return true;
    };
}

function completeMarkdownFence(view: EditorView): boolean {
    const selection = view.state.selection.main;
    if (
        !selection.empty ||
        view.state.selection.ranges.length !== 1 ||
        view.compositionStarted ||
        !view.state.facet(EditorView.editable)
    )
        return false;
    const line = view.state.doc.lineAt(selection.head);
    if (selection.head !== line.to) return false;
    const opening = /^( {0,3})(`{3,}|~{3,})([^`~]*)$/.exec(line.text);
    if (!opening) return false;
    const node = markdownNodeAt(view.state, selection.head);
    let fence = node;
    while (fence.parent && fence.name !== 'FencedCode') fence = fence.parent;
    if (fence.name === 'FencedCode') {
        const marks = fence.getChildren('CodeMark');
        if (
            marks.length > 1 ||
            (marks[0] &&
                view.state.doc.lineAt(marks[0].from).number !== line.number)
        )
            return false;
    } else if (isMarkdownLiteralPosition(view.state, selection.head))
        return false;
    view.dispatch({
        changes: {
            from: line.to,
            insert: `\n${opening[1]}\n${opening[1]}${opening[2]}`,
        },
        selection: { anchor: line.to + 1 + opening[1].length },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.fence',
    });
    return true;
}

function isListPosition(state: EditorState): boolean {
    return hasMarkdownAncestor(
        markdownNodeAt(state, state.selection.main.head),
        new Set(['ListItem']),
    );
}

export const markdownTypingShortcuts = Prec.highest(
    keymap.of([
        { key: 'Enter', run: completeMarkdownFence },
        { key: 'Mod-b', run: toggleInlineDelimiter('**') },
        { key: 'Mod-i', run: toggleInlineDelimiter('*') },
        { key: 'Mod-Shift-x', run: toggleInlineDelimiter('~~') },
        {
            key: 'Tab',
            run: (view) => isListPosition(view.state) && indentMore(view),
        },
        {
            key: 'Shift-Tab',
            run: (view) => isListPosition(view.state) && indentLess(view),
        },
    ]),
);
