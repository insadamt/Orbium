import { EditorSelection, EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { orbiumMarkdownDialect } from '../dialect/markdown-dialect';
import { selectedMarkdownBlocks } from './markdown-formatting-runs';
import { serializeFormattingRuns } from './markdown-formatting-serialize';

function contentBlocks(source: string) {
    const state = EditorState.create({
        doc: source,
        extensions: [
            markdown({
                base: markdownLanguage,
                extensions: [orbiumMarkdownDialect],
            }),
        ],
    });
    return selectedMarkdownBlocks(
        state,
        EditorSelection.single(0, source.length),
    );
}

export function markdownContentColors(source: string): (string | undefined)[] {
    return contentBlocks(source).flatMap((block) =>
        block.runs.filter((run) => run.selected).map((run) => run.marks.color),
    );
}

export function colorMarkdownContent(
    source: string,
    color: string | null,
): string {
    let result = source;
    //
    // Work backwards so changing one cell's metadata cannot shift later source ranges.
    //
    for (const block of contentBlocks(source).reverse()) {
        const runs = block.runs.map((run) => {
            if (!run.selected) return run;
            const marks = { ...run.marks };
            if (color) marks.color = color;
            else delete marks.color;
            return { ...run, marks };
        });
        const next = serializeFormattingRuns(runs, []).source;
        result = result.slice(0, block.from) + next + result.slice(block.to);
    }
    return result;
}
