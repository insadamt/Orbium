// Summary: Maps an owning Document's source positions to mounted column editors so outline navigation reaches actual headings; depends on the column registry and reserved directive parser.
import type { EditorView } from '@codemirror/view';
import { readOrbiumMetadata } from '../dialect/metadata';
import { markdownSourceParser } from '../interactions/markdown-source-parser';
import { mountedDocumentColumns } from './column-registry';

export function resolveColumnDocumentPosition(
    owner: EditorView,
    position: number,
): { view: EditorView; position: number } | null {
    for (const columns of mountedDocumentColumns(owner)) {
        const { block } = columns.current();
        if (position < block.from || position > block.to) continue;
        const relativePosition = position - block.from;
        let index = -1;
        let result: { view: EditorView; position: number } | null = null;
        markdownSourceParser.parse(block.source).iterate({
            enter({ node }) {
                if (node.name !== 'OrbiumDirective') return;
                const header = node.getChild('OrbiumHeader');
                const close = node.getChild('OrbiumClose');
                if (!header || !close) return;
                const text = block.source.slice(header.from, header.to);
                const metadata = readOrbiumMetadata(
                    text.slice(text.indexOf('{')).trimEnd(),
                );
                if (metadata?.kind !== 'column') return;
                index++;
                const view = columns.editors()[index];
                const start = Math.min(header.to + 1, close.from);
                if (
                    view &&
                    relativePosition >= start &&
                    relativePosition < close.from
                ) {
                    result = {
                        view,
                        position: Math.min(
                            view.state.doc.length,
                            relativePosition - start,
                        ),
                    };
                }
                return false;
            },
        });
        if (result) return result;
    }
    return null;
}
