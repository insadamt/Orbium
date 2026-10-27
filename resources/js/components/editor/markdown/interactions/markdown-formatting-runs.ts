import type { EditorSelection, EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { readRichBlock } from '../rich/read-rich-block';
import { readOrbiumMetadata, type OrbiumMetadata } from '../dialect/metadata';
import { readEditableMarkdownPresentation } from './markdown-editable-presentation';
import { markdownFormattingTree } from './markdown-formatting-source';

export type TextMarks = {
    bold?: boolean;
    italic?: boolean;
    strike?: boolean;
    code?: boolean;
    underline?: boolean;
    color?: string;
    href?: string;
    linkTitle?: string;
};
export type FormattingRun = {
    from: number;
    to: number;
    source: string;
    marks: TextMarks;
    selected: boolean;
    literal?: boolean;
    protected?: boolean;
    icon?: { prefix: string; metadata: OrbiumMetadata };
};
export type FormattingBlock = {
    from: number;
    to: number;
    runs: FormattingRun[];
};
const inlineMarks: Record<string, string> = {
    StrongEmphasis: 'EmphasisMark',
    Emphasis: 'EmphasisMark',
    Strikethrough: 'StrikethroughMark',
    InlineCode: 'CodeMark',
    Link: 'LinkMark',
    OrbiumSpan: 'OrbiumSpanMark',
};
const protectedNodes = new Set([
    'HeaderMark',
    'TaskMarker',
    'QuoteMark',
    'ListMark',
    'Image',
    'OrbiumMath',
    'OrbiumInlineMath',
    'HTMLTag',
    'Autolink',
    'LinkReference',
    'HardBreak',
]);

export function selectedMarkdownBlocks(
    state: EditorState,
    selection: EditorSelection = state.selection,
): FormattingBlock[] {
    const blocks: FormattingBlock[] = [];
    const selectedRanges = selection.ranges.filter((range) => !range.empty);
    if (!selectedRanges.length) return blocks;
    markdownFormattingTree(state).iterate({
        from: selectedRanges[0].from,
        to: selectedRanges.at(-1)!.to,
        enter(node) {
            if (
                node.name === 'OrbiumDirective' &&
                !readEditableMarkdownPresentation(state, node.node)
            )
                return false;
            if (
                !/^(Paragraph|Task|ATXHeading[1-6]|SetextHeading[12])$/.test(
                    node.name,
                )
            )
                return;
            if (
                !selection.ranges.some(
                    (range) =>
                        !range.empty &&
                        range.from < node.to &&
                        range.to > node.from,
                )
            )
                return false;
            const richBlock = readRichBlock(state, node.node);
            if (richBlock?.kind === 'image' || richBlock?.kind === 'file')
                return false;
            const runs: FormattingRun[] = [];
            readInlineRuns(state, node.node, {}, runs);
            const splitRuns = runs.flatMap((run) =>
                splitRunAtSelection(run, selection),
            );
            if (splitRuns.some((run) => run.selected))
                blocks.push({ from: node.from, to: node.to, runs: splitRuns });
            return false;
        },
    });
    return blocks;
}

function readInlineRuns(
    state: EditorState,
    node: SyntaxNode,
    inherited: TextMarks,
    runs: FormattingRun[],
) {
    let from = node.from,
        to = node.to;
    const marks = { ...inherited };
    const markerName = inlineMarks[node.name];
    if (node.name === 'Link' && !node.getChild('URL')) {
        appendSourceRuns(state, from, to, marks, runs, true);
        return;
    }
    if (markerName) {
        const markers = node.getChildren(markerName);
        const opening = markers[0];
        const closing =
            node.name === 'Link'
                ? markers.find(
                      (marker) =>
                          state.sliceDoc(marker.from, marker.to) === ']',
                  )
                : markers.at(-1);
        if (!opening || !closing || opening === closing) {
            appendSourceRuns(state, from, to, marks, runs, true);
            return;
        }
        from = opening.to;
        to = closing.from;
        if (node.name === 'StrongEmphasis') marks.bold = true;
        if (node.name === 'Emphasis') marks.italic = true;
        if (node.name === 'Strikethrough') marks.strike = true;
        if (node.name === 'Link') {
            const url = node.getChild('URL');
            if (url)
                marks.href = state
                    .sliceDoc(url.from, url.to)
                    .replace(/^<|>$/g, '');
            const title = node.getChild('LinkTitle');
            if (title) marks.linkTitle = state.sliceDoc(title.from, title.to);
        }
        if (node.name === 'OrbiumSpan') {
            const json = node.getChild('OrbiumMetadata');
            const metadata =
                json &&
                readOrbiumMetadata(
                    state.sliceDoc(json.from, json.to),
                    'inline',
                );
            if (metadata?.color) marks.color = metadata.color;
            if (metadata?.underline) marks.underline = true;
            if (metadata?.icon) {
                //
                // Keep icon syntax atomic while letting the text toolbar recolor the selected symbol.
                //
                runs.push({
                    from: node.from,
                    to: node.to,
                    source: state.sliceDoc(node.from, node.to),
                    marks,
                    protected: true,
                    selected: false,
                    icon: {
                        prefix: state.sliceDoc(node.from, json!.from),
                        metadata,
                    },
                });
                return;
            }
        }
        if (node.name === 'InlineCode') {
            marks.code = true;
            const literal = state.sliceDoc(from, to);
            if (
                literal.startsWith(' ') &&
                literal.endsWith(' ') &&
                literal.trim()
            ) {
                from++;
                to--;
            }
            appendSourceRuns(state, from, to, marks, runs, false, true);
            return;
        }
    }
    let position = from;
    for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.from < from || child.to > to) continue;
        if (child.from > position)
            appendSourceRuns(state, position, child.from, marks, runs);
        if (inlineMarks[child.name]) readInlineRuns(state, child, marks, runs);
        else
            appendSourceRuns(
                state,
                child.from,
                child.to,
                marks,
                runs,
                protectedNodes.has(child.name),
            );
        position = child.to;
    }
    if (position < to) appendSourceRuns(state, position, to, marks, runs);
}

function appendSourceRuns(
    state: EditorState,
    from: number,
    to: number,
    marks: TextMarks,
    runs: FormattingRun[],
    protectedSource = false,
    literal = false,
) {
    let position = from;
    while (position < to) {
        const line = state.doc.lineAt(position);
        const end = Math.min(to, line.to);
        const calloutHeader = /^\s*>\s*\[![A-Za-z][A-Za-z0-9_-]*\]/.test(
            line.text,
        );
        if (end > position)
            runs.push({
                from: position,
                to: end,
                source: state.sliceDoc(position, end),
                marks,
                literal,
                protected: protectedSource || calloutHeader,
                selected: false,
            });
        if (end < to)
            runs.push({
                from: end,
                to: end + 1,
                source: '\n',
                marks: {},
                protected: true,
                selected: false,
            });
        position = end + 1;
    }
}

function splitRunAtSelection(
    run: FormattingRun,
    selection: EditorSelection,
): FormattingRun[] {
    if (run.icon)
        return [
            {
                ...run,
                selected: selection.ranges.some(
                    (range) =>
                        !range.empty &&
                        range.from < run.to &&
                        range.to > run.from,
                ),
            },
        ];
    if (run.protected) return [run];
    const boundaries = new Set([run.from, run.to]);
    for (const range of selection.ranges) {
        if (range.empty || range.to <= run.from || range.from >= run.to)
            continue;
        boundaries.add(Math.max(run.from, range.from));
        boundaries.add(Math.min(run.to, range.to));
    }
    const positions = [...boundaries].sort((a, b) => a - b);
    return positions.slice(0, -1).map((from, index) => {
        const to = positions[index + 1];
        const source = run.source.slice(from - run.from, to - run.from);
        return {
            ...run,
            from,
            to,
            source,
            selected:
                Boolean(source.trim()) &&
                selection.ranges.some(
                    (range) =>
                        !range.empty && range.from <= from && range.to >= to,
                ),
        };
    });
}
