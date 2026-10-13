import { syntaxTree } from '@codemirror/language';
import {
    EditorSelection,
    type EditorState,
    type SelectionRange,
} from '@codemirror/state';
import { markdownReferenceDestination } from '../interactions/markdown-reference-links';
import { missingReferenceKind } from './missing-reference-dialog';

type MentionRange = { from: number; to: number };
export function pageMentionAtPosition(
    state: EditorState,
    position: number,
): MentionRange | null {
    for (let node = syntaxTree(state).resolveInner(position, 1); node;) {
        if (node.name === 'Link' || node.name === 'Autolink') {
            const destination = node.getChild('URL');
            const raw = destination
                ? state.sliceDoc(destination.from, destination.to)
                : markdownReferenceDestination(state, node);
            const url = raw
                ?.replace(/^<|>$/g, '')
                .replace(/\\([\\`*_{}[\]()#+.!<>-])/g, '$1');
            if (
                url &&
                (/^orbium:node\/[1-9]\d*$/.test(url) ||
                    missingReferenceKind(url) === 'page')
            )
                return { from: node.from, to: node.to };
        }
        if (!node.parent) break;
        node = node.parent;
    }
    return null;
}

export function normalizeMentionSelection(
    state: EditorState,
    range: SelectionRange,
    previousHead: number,
): SelectionRange {
    if (range.empty) {
        const mention = pageMentionAtPosition(state, range.head);
        if (!mention || range.head <= mention.from || range.head >= mention.to)
            return range;
        const position =
            previousHead <= mention.from
                ? mention.to
                : previousHead >= mention.to
                  ? mention.from
                  : range.head - mention.from < mention.to - range.head
                    ? mention.from
                    : mention.to;
        return EditorSelection.cursor(position, range.assoc);
    }
    let from = range.from;
    let to = range.to;
    const first = pageMentionAtPosition(state, from);
    const last = pageMentionAtPosition(state, to);
    if (first && from > first.from && from < first.to) from = first.from;
    if (last && to > last.from && to < last.to) to = last.to;
    return range.anchor <= range.head
        ? EditorSelection.range(from, to)
        : EditorSelection.range(to, from);
}
