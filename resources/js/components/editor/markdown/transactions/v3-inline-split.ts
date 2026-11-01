// Summary: Splits paragraph/heading Markdown while balancing existing inline marks; depends on the local dialect parser and atomic reference/icon rules, refusing cuts through opaque syntax.
import type { SyntaxNode } from '@lezer/common';
import { markdownSourceParser } from '../interactions/markdown-source-parser';
import { V3OperationError } from './v3-transaction-types';

const pairedMarkers: Record<string, string> = {
    StrongEmphasis: 'EmphasisMark',
    Emphasis: 'EmphasisMark',
    Strikethrough: 'StrikethroughMark',
    InlineCode: 'CodeMark',
    Link: 'LinkMark',
    OrbiumSpan: 'OrbiumSpanMark',
};
const atomic =
    /^(Image|OrbiumMath|OrbiumInlineMath|HTMLTag|HTMLBlock|FencedCode|CodeBlock|OrbiumDirective|OrbiumMathBlock|OrbiumUnclosed|Escape|Entity)$/;
const syntax =
    /^(EmphasisMark|StrikethroughMark|CodeMark|LinkMark|URL|LinkTitle|OrbiumMetadata|OrbiumSpanMark)$/;

export function splitV3InlineContent(content: string, offset: number) {
    if (!Number.isInteger(offset) || offset < 0 || offset > content.length)
        throw new V3OperationError(
            'invalid-offset',
            'The split position is outside this block content.',
        );
    const tree = markdownSourceParser.parse(content);
    const visited = new Set<string>();
    const ancestors: SyntaxNode[] = [];
    for (const side of [-1, 1] as const)
        for (
            let node: SyntaxNode | null = tree.resolveInner(offset, side);
            node;
            node = node.parent
        ) {
            const key = `${node.name}:${node.from}:${node.to}`;
            if (!visited.has(key)) {
                visited.add(key);
                ancestors.push(node);
            }
        }
    for (const node of ancestors) {
        const source = content.slice(node.from, node.to);
        const opaqueSpan =
            node.name === 'OrbiumSpan' && /"icon"\s*:/.test(source);
        const mention =
            node.name === 'Link' &&
            node
                .getChildren('URL')
                .some((url) =>
                    /^(orbium:|#orbium-missing-page-)/.test(
                        content.slice(url.from, url.to),
                    ),
                );
        if (
            offset > node.from &&
            offset < node.to &&
            (atomic.test(node.name) ||
                syntax.test(node.name) ||
                opaqueSpan ||
                mention)
        )
            throw new V3OperationError(
                'atomic-split',
                'Move the split position outside this atomic content or syntax.',
            );
    }
    const boundaries = ancestors
        .flatMap((node) => {
            const marker = pairedMarkers[node.name];
            if (!marker) return [];
            const markers = node.getChildren(marker);
            const opening = markers[0];
            const closing =
                node.name === 'Link'
                    ? markers.find(
                          (entry) =>
                              content.slice(entry.from, entry.to) === ']',
                      )
                    : markers.at(-1);
            return opening &&
                closing &&
                opening !== closing &&
                offset >= opening.to &&
                offset <= closing.from
                ? [
                      {
                          from: node.from,
                          to: node.to,
                          contentFrom: opening.to,
                          contentTo: closing.from,
                          opening: content.slice(node.from, opening.to),
                          closing: content.slice(closing.from, node.to),
                      },
                  ]
                : [];
        })
        .sort((left, right) => right.from - left.from || left.to - right.to);
    let from = offset;
    let to = offset;
    const closing: string[] = [];
    const opening: string[] = [];
    for (const boundary of boundaries) {
        const before = from > boundary.contentFrom;
        const after = to < boundary.contentTo;
        if (!before) from = boundary.from;
        if (!after) to = boundary.to;
        if (before) closing.push(boundary.closing);
        if (after) opening.unshift(boundary.opening);
    }
    return {
        earlier: content.slice(0, from) + closing.join(''),
        later: opening.join('') + content.slice(to),
    };
}
