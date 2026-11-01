// Summary: Resolves reference-style links within their explicit V3 body scope; depends on scoped syntax, immutable source caching and the existing CommonMark label rules.
import type { EditorState, Text } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { v3StructureField } from '../structure/v3-structure-state';
import {
    markdownSourceParser,
    markdownBodyParser,
} from './markdown-source-parser';

type MarkdownReferenceSource = { destination: string; title: string | null };
const definitions = new WeakMap<
    Text,
    Map<string, Map<string, MarkdownReferenceSource>>
>();
function normalizeLabel(label: string) {
    return label
        .replace(/^\[|\]$/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

export function markdownReferenceSource(
    state: EditorState,
    node: SyntaxNode,
): MarkdownReferenceSource | null {
    const index = state.field(v3StructureField, false)?.current;
    const scopeAt = (position: number) =>
        index?.blockAt(position)?.id ?? 'body';
    let scopes = definitions.get(state.doc);
    if (!scopes) {
        scopes = new Map();
        const source = state.doc.toString();
        (index ? markdownSourceParser : markdownBodyParser)
            .parse(source)
            .iterate({
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
                    const title = reference.node.getChild('LinkTitle');
                    if (label && url) {
                        const scope = scopeAt(reference.from);
                        const entries =
                            scopes!.get(scope) ??
                            new Map<string, MarkdownReferenceSource>();
                        const key = normalizeLabel(
                            source.slice(label.from, label.to),
                        );
                        if (!entries.has(key))
                            entries.set(key, {
                                destination: source.slice(url.from, url.to),
                                title: title
                                    ? source.slice(title.from, title.to)
                                    : null,
                            });
                        scopes!.set(scope, entries);
                    }
                    return false;
                },
            });
        definitions.set(state.doc, scopes);
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
    return label ? (scopes.get(scopeAt(node.from))?.get(label) ?? null) : null;
}
export function markdownReferenceDestination(
    state: EditorState,
    node: SyntaxNode,
) {
    return markdownReferenceSource(state, node)?.destination ?? null;
}
