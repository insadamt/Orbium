import { syntaxTree } from '@codemirror/language';
import { StateField, type EditorState, type Range } from '@codemirror/state';
import { BlockWrapper, Decoration, EditorView } from '@codemirror/view';
import type { SyntaxNode, Tree } from '@lezer/common';
import { refreshRichBlocks } from '../rich/rich-effects';
import { readRichBlock } from '../rich/read-rich-block';
import { readEditableMarkdownPresentation } from './markdown-editable-presentation';

function collectMarkdownWrappers(
    state: EditorState,
    tree: Tree,
    from: number,
    to: number,
) {
    const ranges: Range<BlockWrapper>[] = [];
    const markers: Range<Decoration>[] = [];
    tree.iterate({
        from,
        to,
        enter(reference) {
            const node = reference.node;
            const start = state.doc.lineAt(node.from).from;
            const end = state.doc.lineAt(Math.max(node.from, node.to - 1)).to;
            if (
                node.parent?.name === 'Document' &&
                !node.parent.parent &&
                end > start
            ) {
                // CodeMirror measures wrapper contents, including contained block margins.
                ranges.push(
                    BlockWrapper.create({
                        tagName: 'div',
                        attributes: { class: 'orbium-markdown-block-layout' },
                        rank: 100,
                    }).range(start, end),
                );
            }
            const presentation = readEditableMarkdownPresentation(state, node);
            if (presentation) {
                const { body, header, close, metadata } = presentation;
                markers.push(
                    Decoration.replace({ block: true }).range(
                        header.from,
                        body.from,
                    ),
                );
                markers.push(
                    Decoration.replace({ block: true }).range(
                        body.to,
                        close.to,
                    ),
                );
                const attributes: Record<string, string> = {
                    class: 'orbium-block-presentation',
                };
                if (metadata.dir) attributes.dir = metadata.dir;
                if (metadata.align)
                    attributes.style = `text-align:${metadata.align}`;
                ranges.push(
                    BlockWrapper.create({
                        tagName: 'div',
                        attributes,
                        rank: 99,
                    }).range(body.from, body.to),
                );
                return;
            }
            if (
                [
                    'FencedCode',
                    'CodeBlock',
                    'OrbiumDirective',
                    'OrbiumMathBlock',
                    'OrbiumUnclosed',
                    'HTMLBlock',
                    'Table',
                ].includes(node.name) ||
                readRichBlock(state, node)
            )
                return false;
            let className = '';
            let role = '';
            let tagName = 'div';
            const attributes: Record<string, string> = {};
            if (node.name === 'Paragraph' || node.name === 'Task')
                className = 'orbium-paragraph';
            if (node.name === 'Blockquote') {
                className = 'orbium-quote cm-md-quote';
                tagName = 'blockquote';
            }
            if (node.name === 'BulletList') {
                const taskList = node
                    .getChildren('ListItem')
                    .some((item) => item.getChild('Task'));
                className = taskList
                    ? 'orbium-checklist'
                    : 'orbium-bullet-list';
                role = 'list';
                tagName = 'ul';
                if (taskList) attributes['data-type'] = 'taskList';
            }
            if (node.name === 'OrderedList') {
                className = 'orbium-ordered-list';
                role = 'list';
                tagName = 'ol';
                const firstMarker = node.firstChild?.getChild('ListMark');
                const start =
                    firstMarker &&
                    /^\d+/.exec(
                        state.sliceDoc(firstMarker.from, firstMarker.to),
                    );
                if (start) attributes.start = start[0];
                for (
                    let parent: SyntaxNode | null = node.parent;
                    parent;
                    parent = parent.parent
                ) {
                    const presentation = readEditableMarkdownPresentation(
                        state,
                        parent,
                    );
                    if (presentation?.metadata.listType) {
                        attributes.type = presentation.metadata.listType;
                        break;
                    }
                }
            }
            if (node.name === 'ListItem') {
                role = 'listitem';
                tagName = 'li';
                const list = node.parent;
                if (list?.name === 'OrderedList') {
                    const items = list.getChildren('ListItem');
                    const marker = items[0]?.getChild('ListMark');
                    const start =
                        marker &&
                        /^\d+/.exec(state.sliceDoc(marker.from, marker.to));
                    attributes.value = String(
                        Number(start?.[0] ?? 1) +
                            items.findIndex((item) => item.from === node.from),
                    );
                }
            }
            if (!className && !role) return;
            let depth = 0;
            for (
                let parent: SyntaxNode | null = node.parent;
                parent;
                parent = parent.parent
            )
                depth++;
            if (end <= start) return;
            if (className) attributes.class = className;
            if (role) attributes.role = role;
            ranges.push(
                BlockWrapper.create({
                    tagName,
                    attributes,
                    rank: Math.max(1, 100 - depth),
                }).range(start, end),
            );
        },
    });
    return { ranges, markers };
}

export const markdownBlockWrappers = StateField.define({
    create(state) {
        const collected = collectMarkdownWrappers(
            state,
            syntaxTree(state),
            0,
            Math.min(state.doc.length, 4000),
        );
        return {
            wrappers: BlockWrapper.set(collected.ranges, true),
            markers: Decoration.set(collected.markers, true),
        };
    },
    update(previous, transaction) {
        let wrappers = previous.wrappers.map(transaction.changes);
        let markers = previous.markers.map(transaction.changes);
        if (transaction.docChanged) {
            const from = Math.max(
                0,
                transaction.state.selection.main.from - 2000,
            );
            const to = Math.min(
                transaction.state.doc.length,
                transaction.state.selection.main.to + 4000,
            );
            const collected = collectMarkdownWrappers(
                transaction.state,
                syntaxTree(transaction.state),
                from,
                to,
            );
            wrappers = wrappers.update({
                filter: (start, end) => end < from || start > to,
                add: collected.ranges,
                sort: true,
            });
            markers = markers.update({
                filter: (start, end) => end < from || start > to,
                add: collected.markers,
                sort: true,
            });
        }
        for (const effect of transaction.effects) {
            if (!effect.is(refreshRichBlocks)) continue;
            const { from, to, tree } = effect.value;
            const ranges: Range<BlockWrapper>[] = [];
            for (const cursor = wrappers.iter(); cursor.value; cursor.next())
                if (cursor.to < from || cursor.from > to)
                    ranges.push(cursor.value.range(cursor.from, cursor.to));
            const collected = collectMarkdownWrappers(
                transaction.state,
                tree,
                from,
                to,
            );
            ranges.push(...collected.ranges);
            wrappers = BlockWrapper.set(ranges, true);
            markers = markers.update({
                filter: (start, end) => end < from || start > to,
                add: collected.markers,
                sort: true,
            });
        }
        return { wrappers, markers };
    },
    provide: (field) => [
        EditorView.blockWrappers.from(field, (value) => value.wrappers),
        EditorView.decorations.from(field, (value) => value.markers),
        EditorView.atomicRanges.of((view) => view.state.field(field).markers),
    ],
});
