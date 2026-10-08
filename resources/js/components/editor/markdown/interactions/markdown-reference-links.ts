import type { EditorState, Text } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { markdownSourceParser } from './markdown-source-parser';

const definitions = new WeakMap<Text, Map<string, string>>();
function normalizeLabel(label: string) {
    return label
        .replace(/^\[|\]$/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

export function markdownReferenceDestination(
    state: EditorState,
    node: SyntaxNode,
) {
    let references = definitions.get(state.doc);
    if (!references) {
        references = new Map();
        const source = state.doc.toString();
        markdownSourceParser.parse(source).iterate({
            enter(reference) {
                if (
                    ['FencedCode', 'CodeBlock', 'InlineCode'].includes(
                        reference.name,
                    )
                )
                    return false;
                if (reference.name !== 'LinkReference') return;
                const label = reference.node.getChild('LinkLabel');
                const url = reference.node.getChild('URL');
                if (label && url) {
                    const key = normalizeLabel(
                        source.slice(label.from, label.to),
                    );
                    if (!references!.has(key))
                        references!.set(key, source.slice(url.from, url.to));
                }
                return false;
            },
        });
        definitions.set(state.doc, references);
    }
    const explicit = node.getChild('LinkLabel');
    let label =
        explicit && normalizeLabel(state.sliceDoc(explicit.from, explicit.to));
    if (!label) {
        const marks = node.getChildren('LinkMark');
        const closer = marks.find(
            (mark) => state.sliceDoc(mark.from, mark.to) === ']',
        );
        if (marks[0] && closer)
            label = normalizeLabel(state.sliceDoc(marks[0].to, closer.from));
    }
    return label ? (references.get(label) ?? null) : null;
}
