// Summary: Allows paragraph joins only when existing inline syntax retains its parsed meaning; depends on local Markdown trees and refuses new cross-boundary formatting instead of silently changing styled content.
import { markdownSourceParser } from '../interactions/markdown-source-parser';
import { V3OperationError } from '../transactions/v3-transaction-types';

function inlineV3Signature(source: string, offset = 0) {
    const nodes: string[] = [];
    markdownSourceParser.parse(source).iterate({
        enter({ node }) {
            if (node.name !== 'Document' && node.name !== 'Paragraph')
                nodes.push(
                    `${node.name}:${node.from + offset}:${node.to + offset}`,
                );
        },
    });
    return nodes;
}

export function joinV3InlineContent(earlier: string, later: string) {
    const source = earlier + later;
    const expected = [
        ...inlineV3Signature(earlier),
        ...inlineV3Signature(later, earlier.length),
    ].sort();
    const actual = inlineV3Signature(source).sort();
    if (
        expected.length !== actual.length ||
        expected.some((entry, index) => entry !== actual[index])
    )
        throw new V3OperationError(
            'ambiguous-inline-join',
            'Joining here would change inline formatting or create Markdown structure. Neither paragraph was changed.',
        );
    return source;
}
