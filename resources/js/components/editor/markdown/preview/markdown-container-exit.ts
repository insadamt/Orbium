import { insertNewlineContinueMarkupCommand } from '@codemirror/lang-markdown';
import { isolateHistory } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { isMarkdownLiteralPosition } from '../markdown-syntax';
import { insertPresentedContainerExit } from './markdown-presented-container-exit';

const exitListLevel = insertNewlineContinueMarkupCommand({
    nonTightLists: false,
});

export function exitEmptyMarkdownContainer(view: EditorView): boolean {
    const { state } = view;
    const selection = state.selection.main;
    if (
        !state.facet(EditorView.editable) ||
        view.compositionStarted ||
        !selection.empty ||
        state.selection.ranges.length !== 1
    )
        return false;
    const line = state.doc.lineAt(selection.head);
    if (isMarkdownLiteralPosition(state, selection.head)) return false;
    if (/^\s*(?:>\s*)+$/.test(line.text)) {
        const prefix = line.text.replace(/>\s*$/, '');
        const insert = prefix.trim() ? `${prefix}\n${prefix}` : '\n';
        const transaction = state.update({
            changes: { from: line.from, to: line.to, insert },
            selection: { anchor: line.from + insert.length },
            annotations: isolateHistory.of('full'),
            userEvent: 'input.paragraph',
            scrollIntoView: true,
        });
        if (!prefix.trim() && insertPresentedContainerExit(view, transaction))
            return true;
        view.dispatch(transaction);
        return true;
    }
    if (!/^\s*(?:>\s*)*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s*)?$/.test(line.text))
        return false;
    return exitListLevel({
        state,
        dispatch(transaction) {
            const nextLine = transaction.state.doc.lineAt(
                transaction.state.selection.main.head,
            );
            if (nextLine.text.trim()) view.dispatch(transaction);
            else if (!insertPresentedContainerExit(view, transaction))
                view.dispatch(
                    state.update(transaction, {
                        changes: {
                            from: nextLine.from,
                            to: nextLine.to,
                            insert: '\n',
                        },
                        selection: { anchor: nextLine.from + 1 },
                        sequential: true,
                        annotations: isolateHistory.of('full'),
                        userEvent: 'input.paragraph',
                        scrollIntoView: true,
                    }),
                );
        },
    });
}
