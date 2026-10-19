import {
    preserveRichWidgetsDuringMove,
    richBlockMove,
} from '../rich/rich-widget-move';
import { markdownAlignmentElements } from './markdown-alignment-elements';
import { animateAlignmentChange } from '../../alignment-motion';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState, StateEffect } from '@codemirror/state';
import { isolateHistory } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { readRichBlock } from '../rich/read-rich-block';
import { fencedCodeSource } from '../rich/code-widget';
import { markdownBlockMotion } from './markdown-block-motion';
import { markdownBlockMotionEffect } from './markdown-block-history-motion';
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

export function isStructuralMarkdownSeparator(
    state: EditorState,
    position: number,
) {
    const line = state.doc.lineAt(position);
    if (
        line.text.trim() ||
        line.number === 1 ||
        line.number === state.doc.lines
    )
        return false;
    return (
        Boolean(state.doc.line(line.number - 1).text.trim()) &&
        markdownBlockAt(state, position).source.trim() === ''
    );
}

export function markdownBlockAt(
    state: EditorState,
    position: number,
): MarkdownBlockRange {
    let node = syntaxTree(state).resolveInner(position, 1);
    if (node.name === 'Document') {
        const previous = node.childBefore(position + 1);
        if (previous && previous.from <= position && previous.to >= position)
            node = previous;
    }
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

type MarkdownBlockEditOptions = {
    effects?: readonly StateEffect<unknown>[];
    focusEditor?: boolean;
    scrollIntoView?: boolean;
};

export function replaceMarkdownBlock(
    view: EditorView,
    block: MarkdownBlockRange,
    source: string,
    caret = 0,
    options: MarkdownBlockEditOptions = {},
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
        scrollIntoView: options.scrollIntoView ?? true,
        effects: options.effects,
    });
    if (options.focusEditor !== false) view.focus();
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

export function deleteMarkdownBlock(
    view: EditorView,
    block: MarkdownBlockRange,
) {
    if (
        !view.state.facet(EditorView.editable) ||
        view.state.readOnly ||
        view.compositionStarted ||
        view.state.sliceDoc(block.from, block.to) !== block.source
    )
        return false;
    let from = block.from;
    let to = block.to;
    while (from > 0) {
        const previous = view.state.doc.lineAt(from - 1);
        from = previous.to;
        if (previous.text.trim()) break;
        from = previous.from;
    }
    while (to < view.state.doc.length) {
        const next = view.state.doc.lineAt(to + 1);
        to = next.from;
        if (next.text.trim()) break;
        to = next.to;
    }
    const insert = from > 0 && to < view.state.doc.length ? '\n\n' : '';
    const changes = view.state.changes({ from, to, insert });
    const motion = view.plugin(markdownBlockMotion);
    const snapshot = motion?.capture(block);
    view.dispatch({
        changes,
        selection: {
            anchor: Math.min(from + insert.length, changes.newLength),
        },
        annotations: isolateHistory.of('full'),
        userEvent: 'delete.block',
        effects: markdownBlockMotionEffect.of({
            before: { from: block.from, to: block.to },
        }),
    });
    if (snapshot) motion?.play(snapshot, changes);
    view.focus();
    return true;
}

export function moveMarkdownBlock(
    view: EditorView,
    block: MarkdownBlockRange,
    target: MarkdownBlockRange,
    placement = target.from < block.from ? 'before' : 'after',
    options: { preserveViewport?: boolean } = {},
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
    if (
        !view.state.facet(EditorView.editable) ||
        view.state.readOnly ||
        view.compositionStarted
    )
        return;
    if (
        (placement === 'before' &&
            block.to <= target.from &&
            !view.state.sliceDoc(block.to, target.from).trim()) ||
        (placement === 'after' &&
            target.to <= block.from &&
            !view.state.sliceDoc(target.to, block.from).trim())
    )
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
    const motion = view.plugin(markdownBlockMotion);
    const snapshot = motion?.capture(block);
    const move = { from: block.from, to: block.to, destination: anchor };
    preserveRichWidgetsDuringMove(view, move, changes, () => {
        view.dispatch({
            changes,
            selection: options.preserveViewport ? undefined : { anchor },
            annotations: [isolateHistory.of('full'), richBlockMove.of(move)],
            userEvent: 'move.block',
            effects: markdownBlockMotionEffect.of({
                before: { from: block.from, to: block.to },
                after: { from: anchor, to: anchor + block.source.length },
            }),
            scrollIntoView: !options.preserveViewport,
        });
        if (snapshot)
            motion?.play(snapshot, changes, {
                from: anchor,
                to: anchor + block.source.length,
            });
    });
    if (!options.preserveViewport) view.focus();
    return changes;
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
    options: MarkdownBlockEditOptions = {},
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
    for (const key of [
        'dividerColor',
        'dividerThickness',
        'dividerStyle',
    ] as const) {
        if (key in patch && patch[key] === undefined) delete metadata[key];
    }
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
    if ('align' in patch || 'dir' in patch) {
        let contentPosition = current.contentFrom;
        return animateAlignmentChange({
            container: view.contentDOM,
            readElements: () =>
                markdownAlignmentElements(view, contentPosition, block.from),
            applyChange: () => {
                const changed = replaceMarkdownBlock(
                    view,
                    block,
                    source,
                    contentStart + offset,
                    options,
                );
                contentPosition = view.state.selection.main.head;
                return changed;
            },
            onComplete: () => view.requestMeasure(),
        });
    }
    return replaceMarkdownBlock(
        view,
        block,
        source,
        contentStart + offset,
        options,
    );
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
