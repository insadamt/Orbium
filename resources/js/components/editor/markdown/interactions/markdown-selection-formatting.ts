import type { EditorSelection, EditorState } from '@codemirror/state';
import { selectedTextRuns } from './markdown-formatting-transaction';

export function markdownSelectionFormatting(
    state: EditorState,
    selection: EditorSelection = state.selection,
) {
    const runs = selectedTextRuns(state, selection);
    const allHave = (
        mark: 'bold' | 'italic' | 'underline' | 'strike' | 'code',
    ) => runs.length > 0 && runs.every((run) => Boolean(run.marks[mark]));
    const first = runs[0]?.marks;
    return {
        bold: allHave('bold'),
        italic: allHave('italic'),
        underline: allHave('underline'),
        strike: allHave('strike'),
        code: allHave('code'),
        link: runs.length > 0 && runs.every((run) => Boolean(run.marks.href)),
        color: runs.every((run) => run.marks.color === first?.color)
            ? first?.color
            : undefined,
        href: runs.every((run) => run.marks.href === first?.href)
            ? first?.href
            : undefined,
    };
}
