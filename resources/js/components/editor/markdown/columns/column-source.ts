// Summary: Reads and serializes two/three-column layouts without moving content out of canonical Markdown; depends on the shared dialect parser and metadata contract.
import { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { markdownSourceParser } from '../interactions/markdown-source-parser';
import { readOrbiumMetadata, serializeOrbiumBlock } from '../dialect/metadata';

export type ColumnLayout = { widths: number[]; bodies: string[] };

export function equalColumnWidths(count: number) {
    return count === 3 ? [3333, 3333, 3334] : [5000, 5000];
}

export function serializeColumns(layout: ColumnLayout) {
    return serializeOrbiumBlock(
        { kind: 'columns', version: 1, widths: layout.widths },
        layout.bodies
            .map((body) => serializeOrbiumBlock({ kind: 'column' }, body))
            .join('\n\n'),
    );
}

export function createColumns(count = 2) {
    return serializeColumns({
        widths: equalColumnWidths(count),
        bodies: Array<string>(count).fill(''),
    });
}

function directiveBody(state: EditorState, node: SyntaxNode) {
    const header = node.getChild('OrbiumHeader');
    const close = node.getChild('OrbiumClose');
    return header && close
        ? state.sliceDoc(
              Math.min(header.to + 1, close.from),
              Math.max(header.to + 1, close.from - 1),
          )
        : '';
}

export function readColumns(source: string): ColumnLayout | null {
    const state = EditorState.create({ doc: source });
    const node = markdownSourceParser.parse(source).topNode.firstChild;
    const header = node?.getChild('OrbiumHeader');
    if (
        !node ||
        node.name !== 'OrbiumDirective' ||
        !node.getChild('OrbiumClose') ||
        !header
    )
        return null;
    const line = state.sliceDoc(header.from, header.to);
    const metadata = readOrbiumMetadata(
        line.slice(line.indexOf('{')).trimEnd(),
    );
    if (metadata?.kind !== 'columns' || !metadata.widths) return null;
    const bodies: string[] = [];
    for (
        let child = node.getChild('Document')?.firstChild;
        child;
        child = child.nextSibling
    ) {
        if (child.name !== 'OrbiumDirective' || !child.getChild('OrbiumClose'))
            return null;
        const childHeader = child.getChild('OrbiumHeader');
        const line =
            childHeader && state.sliceDoc(childHeader.from, childHeader.to);
        if (
            !line ||
            readOrbiumMetadata(line.slice(line.indexOf('{')).trimEnd())
                ?.kind !== 'column'
        )
            return null;
        const body = directiveBody(state, child);
        if (containsColumnLayout(body)) return null;
        bodies.push(body);
    }
    return bodies.length === metadata.widths.length
        ? { widths: metadata.widths, bodies }
        : null;
}

export function containsColumnLayout(source: string) {
    if (!source.includes('orbium ')) return false;
    let found = false;
    markdownSourceParser.parse(source).iterate({
        enter({ node }) {
            if (node.name !== 'OrbiumDirective') return;
            const header = node.getChild('OrbiumHeader');
            const text = header && source.slice(header.from, header.to);
            if (
                text &&
                readOrbiumMetadata(text.slice(text.indexOf('{')).trimEnd())
                    ?.kind === 'columns'
            )
                found = true;
        },
    });
    return found;
}
