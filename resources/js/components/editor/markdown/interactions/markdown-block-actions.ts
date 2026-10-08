import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import { isolateHistory } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import {
    readOrbiumMetadata,
    serializeOrbiumBlock,
    type OrbiumMetadata,
} from '../dialect/metadata';

export type MarkdownBlockRange = {
    from: number;
    to: number;
    name: string;
    source: string;
};

export function markdownBlockAt(
    state: EditorState,
    position: number,
): MarkdownBlockRange {
    let node = syntaxTree(state).resolveInner(position, 1);
    if (node.name === 'Document') node = node.childBefore(position + 1) ?? node;
    while (node.parent && node.parent.parent) node = node.parent;
    if (node.name === 'Document') {
        const line = state.doc.lineAt(position);
        return {
            from: line.from,
            to: line.to,
            name: 'Paragraph',
            source: line.text,
        };
    }
    const from = state.doc.lineAt(node.from).from;
    const to = state.doc.lineAt(Math.max(node.from, node.to - 1)).to;
    return { from, to, name: node.name, source: state.sliceDoc(from, to) };
}

export function replaceMarkdownBlock(
    view: EditorView,
    block: MarkdownBlockRange,
    source: string,
    caret = 0,
) {
    if (
        !view.state.facet(EditorView.editable) ||
        view.compositionStarted ||
        view.state.sliceDoc(block.from, block.to) !== block.source
    )
        return false;
    view.dispatch({
        changes: { from: block.from, to: block.to, insert: source },
        selection: { anchor: block.from + Math.min(caret, source.length) },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.block',
        scrollIntoView: true,
    });
    view.focus();
    return true;
}

export function adjacentMarkdownBlock(
    view: EditorView,
    block: MarkdownBlockRange,
    previous: boolean,
) {
    const tree =
        ensureSyntaxTree(view.state, view.state.doc.length, 100) ??
        syntaxTree(view.state);
    let node: SyntaxNode | null = tree.topNode.firstChild;
    while (node && (node.to <= block.from || node.from > block.to))
        node = node.nextSibling;
    const neighbor = previous ? node?.prevSibling : node?.nextSibling;
    return neighbor ? markdownBlockAt(view.state, neighbor.from) : null;
}

export function moveMarkdownBlock(
    view: EditorView,
    block: MarkdownBlockRange,
    target: MarkdownBlockRange,
) {
    if (
        block.from === target.from ||
        (block.from < target.to && block.to > target.from)
    )
        return;
    if (
        view.state.sliceDoc(block.from, block.to) !== block.source ||
        view.state.sliceDoc(target.from, target.to) !== target.source
    )
        return;
    if (!view.state.facet(EditorView.editable) || view.compositionStarted)
        return;
    // Leave separator spelling at its destination while moving each complete authored block.
    const removalTo =
        block.to < view.state.doc.length ? block.to + 1 : block.to;
    const removalFrom =
        removalTo === block.to && block.from > 0 ? block.from - 1 : block.from;
    const destination = target.from < block.from ? target.from : target.to;
    const insert =
        target.from < block.from
            ? `${block.source}\n\n`
            : `\n\n${block.source}`;
    const changes = view.state.changes([
        { from: removalFrom, to: removalTo },
        { from: destination, insert },
    ]);
    const anchor =
        changes.mapPos(destination, -1) + (target.from < block.from ? 0 : 2);
    view.dispatch({
        changes,
        selection: { anchor },
        annotations: isolateHistory.of('full'),
        userEvent: 'move.block',
        scrollIntoView: true,
    });
    view.focus();
}

export function markdownBlockPresentation(
    view: EditorView,
    block: MarkdownBlockRange,
) {
    const node = syntaxTree(view.state).topNode.childAfter(block.from);
    const header = node?.getChild('OrbiumHeader');
    const close = node?.getChild('OrbiumClose');
    const metadata =
        header &&
        readOrbiumMetadata(
            view.state
                .sliceDoc(header.from, header.to)
                .replace(/^:{3,}orbium /, '')
                .trimEnd(),
        );
    if (
        metadata &&
        ['block', 'empty'].includes(String(metadata.kind)) &&
        close &&
        header
    )
        return {
            metadata,
            body: view.state.sliceDoc(
                Math.min(header.to + 1, close.from),
                Math.max(header.to + 1, close.from - 1),
            ),
            name: node?.getChild('Document')?.firstChild?.name ?? 'Paragraph',
        };
    return {
        metadata: { kind: 'block' } as OrbiumMetadata,
        body: block.source,
        name: block.name,
    };
}

export function setMarkdownBlockPresentation(
    view: EditorView,
    block: MarkdownBlockRange,
    patch: Partial<OrbiumMetadata>,
) {
    const current = markdownBlockPresentation(view, block);
    if (
        patch.align &&
        !/^(?:Paragraph|(?:ATX|Setext)Heading[1-6])$/.test(current.name)
    )
        throw new Error(
            'Alignment applies to paragraphs and headings. Use cell or image alignment for those blocks.',
        );
    const metadata = { ...current.metadata, ...patch };
    if (!current.body.trim()) metadata.kind = 'empty';
    if (patch.dir === 'auto') delete metadata.dir;
    if ('align' in patch && !patch.align) delete metadata.align;
    const source =
        Object.keys(metadata).length === 1 && metadata.kind === 'block'
            ? current.body
            : serializeOrbiumBlock(metadata, current.body);
    replaceMarkdownBlock(view, block, source);
}

export function turnMarkdownBlockInto(
    view: EditorView,
    block: MarkdownBlockRange,
    prefix: string,
) {
    const current = markdownBlockPresentation(view, block);
    if (!/^(?:Paragraph|(?:ATX|Setext)Heading[1-6])$/.test(current.name))
        throw new Error(
            'Turn into is available for text and headings. Other blocks retain their structure.',
        );
    const body = current.body
        .replace(/^ {0,3}#{1,6}[ \t]+/, '')
        .replace(/\n {0,3}(?:=+|-+)[ \t]*$/, '');
    let source = body;
    if (/^#+ $/.test(prefix)) source = `${prefix}${body.replace(/\n/g, ' ')}`;
    else if (prefix.startsWith('>'))
        source = `${prefix}${body.replace(/\n/g, '\n> ')}`;
    else if (prefix)
        source = `${prefix}${body.replace(/\n/g, `\n${' '.repeat(prefix.length)}`)}`;
    const metadata = { ...current.metadata };
    if (metadata.kind === 'empty' && source.trim()) metadata.kind = 'block';
    if (prefix && !/^#+ $/.test(prefix)) delete metadata.align;
    replaceMarkdownBlock(
        view,
        block,
        Object.keys(metadata).length > 1
            ? serializeOrbiumBlock(metadata, source)
            : source,
    );
}
