// Summary: Expands external Markdown reference uses before splitting content into independent V3 bodies; depends on the existing label resolver and body parser so sibling isolation does not break imported links or image titles.
import { v3Contract } from '../structure/v3-contract';
import { V3OperationError } from '../transactions/v3-transaction-types';
import { EditorState } from '@codemirror/state';
import { markdownBodyParser } from '../interactions/markdown-source-parser';
import { markdownReferenceSource } from '../interactions/markdown-reference-links';

export function expandV3ImportedReferences(source: string) {
    const encoder = new TextEncoder();
    let expandedBytes = encoder.encode(source).length;
    const requireBudget = () => {
        if (expandedBytes > v3Contract.limits.sourceBytes)
            throw new V3OperationError(
                'reference-expansion-limit',
                'Expanded Markdown references exceed the document source limit.',
            );
    };
    requireBudget();
    const state = EditorState.create({ doc: source });
    const edits: { from: number; to: number; insert: string }[] = [];
    markdownBodyParser.parse(source).iterate({
        enter({ node }) {
            if (
                [
                    'FencedCode',
                    'CodeBlock',
                    'InlineCode',
                    'OrbiumMathBlock',
                    'OrbiumMath',
                    'OrbiumInlineMath',
                ].includes(node.name)
            )
                return false;
            if (!['Link', 'Image'].includes(node.name) || node.getChild('URL'))
                return;
            const reference = markdownReferenceSource(state, node);
            const closer = node
                .getChildren('LinkMark')
                .find((mark) => source.slice(mark.from, mark.to) === ']');
            if (!reference || !closer) return;
            //
            // Replacing only the reference suffix preserves nested images/inline marks and keeps nested replacement ranges disjoint.
            //
            const insert = `(${reference.destination}${reference.title ? ` ${reference.title}` : ''})`;
            expandedBytes +=
                encoder.encode(insert).length -
                encoder.encode(source.slice(closer.to, node.to)).length;
            requireBudget();
            edits.push({ from: closer.to, to: node.to, insert });
        },
    });
    return edits.length
        ? state
              .changes(
                  edits.sort(
                      (left, right) =>
                          left.from - right.from || left.to - right.to,
                  ),
              )
              .apply(state.doc)
              .toString()
        : source;
}
