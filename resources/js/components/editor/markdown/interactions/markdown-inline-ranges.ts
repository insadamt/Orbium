import type { EditorView } from '@codemirror/view';
import { EditorView as CodeMirrorView } from '@codemirror/view';
import { selectedMarkdownBlocks } from './markdown-formatting-runs';

export function inlineFormattingRange(
    view: Pick<EditorView, 'state' | 'compositionStarted'>,
) {
    if (view.compositionStarted || !view.state.facet(CodeMirrorView.editable))
        return null;
    const runs = selectedMarkdownBlocks(view.state).flatMap((block) =>
        block.runs.filter((run) => run.selected),
    );
    return runs.length ? { from: runs[0].from, to: runs.at(-1)!.to } : null;
}
