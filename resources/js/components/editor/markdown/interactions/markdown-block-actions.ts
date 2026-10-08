import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import { isolateHistory } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { readRichBlock } from '../rich/read-rich-block';
import { fencedCodeSource } from '../rich/code-widget';
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
    placement = target.from < block.from ? 'before' : 'after',
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
    // Move an adjacent separator too, so repeated drags do not accumulate empty paragraphs.
    let removalTo = block.to;
    let removalFrom = block.from;
    if (block.to < view.state.doc.length) {
        removalTo++;
        while (removalTo < view.state.doc.length) {
            const line = view.state.doc.lineAt(removalTo);
            if (line.text.trim()) break;
            removalTo = Math.min(view.state.doc.length, line.to + 1);
        }
    } else if (block.from > 0) {
        removalFrom--;
        while (removalFrom > 0) {
            const line = view.state.doc.lineAt(removalFrom);
            if (line.text.trim()) break;
            removalFrom = Math.max(0, line.from - 1);
        }
    }
    const destination = placement === 'before' ? target.from : target.to;
    const insert =
        placement === 'before' ? `${block.source}\n\n` : `\n\n${block.source}`;
    const changes = view.state.changes([
        { from: removalFrom, to: removalTo },
        { from: destination, insert },
    ]);
    const anchor =
        changes.mapPos(destination, -1) + (placement === 'before' ? 0 : 2);
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
            contentFrom: Math.min(header.to + 1, close.from),
        };
    return {
        metadata: { kind: 'block' } as OrbiumMetadata,
        body: block.source,
        name: block.name,
        contentFrom: block.from,
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
    const contentStart = source === current.body ? 0 : source.indexOf('\n') + 1;
    const offset = Math.max(
        0,
        Math.min(
            current.body.length,
            view.state.selection.main.head - current.contentFrom,
        ),
    );
    replaceMarkdownBlock(view, block, source, contentStart + offset);
}

export function turnMarkdownBlockInto(
    view: EditorView,
    block: MarkdownBlockRange,
    prefix: string,
) {
    const current = markdownBlockPresentation(view, block);
    if (
        !/^(?:Paragraph|(?:ATX|Setext)Heading[1-6]|BulletList|OrderedList|Blockquote|FencedCode)$/.test(
            current.name,
        )
    )
        throw new Error(
            'Choose a text, heading, list, quote or code block to change its type.',
        );
    let body = current.body
        .replace(/^ {0,3}#{1,6}[ \t]+/, '')
        .replace(/\n {0,3}(?:=+|-+)[ \t]*$/, '');
    if (current.name === 'FencedCode') {
        const node = syntaxTree(view.state).topNode.childAfter(block.from);
        const code = node && readRichBlock(view.state, node);
        if (code?.kind !== 'code')
            throw new Error('Diagrams keep their diagram source.');
        body = code.content;
    }
    if (current.name === 'BulletList' || current.name === 'OrderedList')
        body = body
            .split('\n')
            .map((line) =>
                line
                    .replace(/^\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/, '')
                    .replace(/^ {1,4}/, ''),
            )
            .join('\n');
    if (current.name === 'Blockquote') {
        if (/^\s*>\s*\[!/.test(body))
            throw new Error('Callouts keep their callout source.');
        body = body.replace(/^\s*>[ \t]?/gm, '');
    }
    let source = body;
    if (prefix === '```') source = fencedCodeSource(body, 'text');
    else if (/^#+ $/.test(prefix))
        source = `${prefix}${body.replace(/\n/g, ' ')}`;
    else if (prefix.startsWith('>'))
        source = `${prefix}${body.replace(/\n/g, '\n> ')}`;
    else if (prefix)
        source = body
            .split('\n')
            .map(
                (line, index) =>
                    `${prefix === '1. ' ? `${index + 1}. ` : prefix}${line}`,
            )
            .join('\n');
    const metadata = { ...current.metadata };
    if (metadata.kind === 'empty' && source.trim()) metadata.kind = 'block';
    if (prefix && !/^#+ $/.test(prefix)) delete metadata.align;
    if (prefix !== '1. ') delete metadata.listType;
    replaceMarkdownBlock(
        view,
        block,
        Object.keys(metadata).length > 1
            ? serializeOrbiumBlock(metadata, source)
            : source,
    );
}
