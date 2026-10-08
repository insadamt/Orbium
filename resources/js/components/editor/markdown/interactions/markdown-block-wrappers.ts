import { syntaxTree } from '@codemirror/language';
import { StateField, type EditorState, type Range } from '@codemirror/state';
import { BlockWrapper, EditorView } from '@codemirror/view';
import type { SyntaxNode, Tree } from '@lezer/common';
import { refreshRichBlocks } from '../rich/rich-effects';
import { readRichBlock } from '../rich/read-rich-block';

function collectMarkdownWrappers(
    state: EditorState,
    tree: Tree,
    from: number,
    to: number,
) {
    const ranges: Range<BlockWrapper>[] = [];
    tree.iterate({
        from,
        to,
        enter(reference) {
            const node = reference.node;
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
            if (node.name === 'Paragraph' || node.name === 'Task')
                className = 'orbium-paragraph';
            if (node.name === 'Blockquote')
                className = 'orbium-quote cm-md-quote';
            if (node.name === 'BulletList') {
                const taskList = node
                    .getChildren('ListItem')
                    .some((item) => item.getChild('Task'));
                className = taskList
                    ? 'orbium-checklist'
                    : 'orbium-bullet-list';
                role = 'list';
            }
            if (node.name === 'OrderedList') {
                className = 'orbium-ordered-list';
                role = 'list';
            }
            if (node.name === 'ListItem') role = 'listitem';
            if (!className && !role) return;
            let depth = 0;
            for (
                let parent: SyntaxNode | null = node.parent;
                parent;
                parent = parent.parent
            )
                depth++;
            const start = state.doc.lineAt(node.from).from;
            const end = state.doc.lineAt(Math.max(node.from, node.to - 1)).to;
            if (end <= start) return;
            const attributes: Record<string, string> = {};
            if (className) attributes.class = className;
            if (role) attributes.role = role;
            ranges.push(
                BlockWrapper.create({
                    tagName: 'div',
                    attributes,
                    rank: Math.max(1, 100 - depth),
                }).range(start, end),
            );
        },
    });
    return ranges;
}

export const markdownBlockWrappers = StateField.define({
    create: (state) =>
        BlockWrapper.set(
            collectMarkdownWrappers(
                state,
                syntaxTree(state),
                0,
                Math.min(state.doc.length, 4000),
            ),
            true,
        ),
    update(previous, transaction) {
        let wrappers = previous.map(transaction.changes);
        for (const effect of transaction.effects) {
            if (!effect.is(refreshRichBlocks)) continue;
            const { from, to, tree } = effect.value;
            const ranges: Range<BlockWrapper>[] = [];
            for (const cursor = wrappers.iter(); cursor.value; cursor.next())
                if (cursor.to < from || cursor.from > to)
                    ranges.push(cursor.value.range(cursor.from, cursor.to));
            ranges.push(
                ...collectMarkdownWrappers(transaction.state, tree, from, to),
            );
            wrappers = BlockWrapper.set(ranges, true);
        }
        return wrappers;
    },
    provide: (field) => EditorView.blockWrappers.from(field),
});
