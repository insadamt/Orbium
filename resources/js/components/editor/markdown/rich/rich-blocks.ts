import { syntaxTree } from '@codemirror/language';
import { StateField, type EditorState, type Range } from '@codemirror/state';
import { getSearchQuery } from '@codemirror/search';
import {
    Decoration,
    EditorView,
    ViewPlugin,
    type ViewUpdate,
} from '@codemirror/view';
import type { Tree } from '@lezer/common';
import { measureEditorWork } from '@/lib/editor-performance';
import { readRichBlock } from './read-rich-block';
import {
    refreshRichBlocks,
    toggleRichSource,
    revealRichSource,
} from './rich-effects';
import type { RichBlock, RichContext } from './rich-model';
import { MarkdownRichWidget } from './rich-widget';

function collectBlocks(
    state: EditorState,
    tree: Tree,
    from: number,
    to: number,
): RichBlock[] {
    const blocks: RichBlock[] = [];
    tree.iterate({
        from,
        to,
        enter(reference) {
            const node = reference.node;
            if (
                [
                    'FencedCode',
                    'CodeBlock',
                    'HTMLBlock',
                    'HTMLTag',
                    'OrbiumUnclosed',
                ].includes(node.name)
            ) {
                const block = readRichBlock(state, node);
                if (block && node.parent?.name === 'Document')
                    blocks.push(block);
                return false;
            }
            const block = readRichBlock(state, node);
            if (
                block &&
                (block.kind === 'inline-math' ||
                    node.parent?.name === 'Document')
            ) {
                blocks.push(block);
                return false;
            }
            if (node.name === 'OrbiumDirective') return false;
        },
    });
    return blocks;
}

export function markdownRichBlocks(context: RichContext) {
    const field = StateField.define<{
        blocks: RichBlock[];
        editors: Set<number>;
        revealed: number | null;
        decorations: ReturnType<typeof Decoration.set>;
    }>({
        create(state) {
            const blocks = collectBlocks(
                state,
                syntaxTree(state),
                0,
                Math.min(4000, state.doc.length),
            );
            return {
                blocks,
                editors: new Set(),
                revealed: null,
                decorations: decorate(state, blocks),
            };
        },
        update(previous, transaction) {
            let blocks = previous.blocks;
            let editors = previous.editors;
            let revealed = previous.revealed;
            if (revealed !== null && transaction.docChanged)
                revealed = transaction.changes.mapPos(revealed, -1);
            if (transaction.docChanged) {
                editors = new Set(
                    [...editors].map((from) =>
                        transaction.changes.mapPos(from, -1),
                    ),
                );
                blocks = blocks
                    .map((block) => {
                        const from = transaction.changes.mapPos(block.from, -1);
                        const to = transaction.changes.mapPos(block.to, 1);
                        const contentFrom = transaction.changes.mapPos(
                            block.contentFrom,
                            -1,
                        );
                        const contentTo = transaction.changes.mapPos(
                            block.contentTo,
                            1,
                        );
                        const source = transaction.state.sliceDoc(from, to);
                        if (source === block.source)
                            return {
                                ...block,
                                from,
                                to,
                                contentFrom,
                                contentTo,
                            };
                        const node = syntaxTree(transaction.state).resolveInner(
                            from,
                            1,
                        );
                        let current = node;
                        while (current.parent && current.parent.parent)
                            current = current.parent;
                        const parsed = readRichBlock(
                            transaction.state,
                            current,
                        );
                        return parsed?.from === from &&
                            parsed.to === to &&
                            (!editors.has(from) || parsed.kind === block.kind)
                            ? parsed
                            : {
                                  ...block,
                                  from,
                                  to,
                                  source,
                                  contentFrom,
                                  contentTo,
                                  content: transaction.state.sliceDoc(
                                      contentFrom,
                                      contentTo,
                                  ),
                                  diagnostic:
                                      'Source is incomplete or has changed block type. Finish editing, then Preview.',
                              };
                    })
                    .filter((block) => block.from < block.to);
            }
            for (const effect of transaction.effects) {
                if (effect.is(revealRichSource)) revealed = effect.value;
                if (effect.is(toggleRichSource)) {
                    editors = new Set(editors);
                    if (effect.value.open) editors.add(effect.value.from);
                    else editors.delete(effect.value.from);
                }
                if (effect.is(refreshRichBlocks)) {
                    const { from, to, tree } = effect.value;
                    const next = collectBlocks(
                        transaction.state,
                        tree,
                        from,
                        to,
                    );
                    const editing = blocks.filter((block) =>
                        editors.has(block.from),
                    );
                    blocks = [
                        ...blocks.filter(
                            (block) => block.to < from || block.from > to,
                        ),
                        ...next.filter((block) => !editors.has(block.from)),
                        ...editing,
                    ]
                        .filter(
                            (block, index, all) =>
                                all.findIndex(
                                    (other) =>
                                        other.from === block.from &&
                                        other.to === block.to,
                                ) === index,
                        )
                        .sort((left, right) => left.from - right.from);
                }
            }
            if (revealed !== null && transaction.selection) {
                const block = blocks.find((item) => item.from === revealed);
                const range = transaction.state.selection.main;
                if (!block || range.head < block.from || range.head > block.to)
                    revealed = null;
            }
            if (
                revealed === previous.revealed &&
                blocks === previous.blocks &&
                editors === previous.editors &&
                !transaction.selection &&
                getSearchQuery(transaction.startState).search ===
                    getSearchQuery(transaction.state).search &&
                transaction.startState.facet(EditorView.editable) ===
                    transaction.state.facet(EditorView.editable)
            )
                return previous;
            return {
                blocks,
                editors,
                revealed,
                decorations: decorate(transaction.state, blocks, revealed),
            };
        },
        provide: (source) => [
            EditorView.decorations.from(source, (value) => value.decorations),
            EditorView.atomicRanges.of(
                (view) => view.state.field(source).decorations,
            ),
        ],
    });

    function decorate(
        state: EditorState,
        blocks: RichBlock[],
        revealed: number | null = null,
    ) {
        const ranges: Range<Decoration>[] = [];
        const search = Boolean(getSearchQuery(state).search);
        for (const block of blocks) {
            if (revealed === block.from) continue;
            if (
                search &&
                state.selection.ranges.some(
                    (range) =>
                        !range.empty &&
                        range.from < block.to &&
                        range.to > block.from,
                )
            )
                continue;
            ranges.push(
                Decoration.replace({
                    block: block.kind !== 'inline-math',
                    widget: new MarkdownRichWidget(
                        block,
                        context,
                        !state.facet(EditorView.editable),
                    ),
                }).range(block.from, block.to),
            );
        }
        return Decoration.set(ranges, true);
    }

    const manager = ViewPlugin.fromClass(
        class {
            private frame: number | null = null;
            private destroyed = false;
            constructor(readonly view: EditorView) {
                this.schedule();
            }
            update(update: ViewUpdate) {
                if (
                    update.startState.facet(EditorView.editable) !==
                        update.state.facet(EditorView.editable) ||
                    update.docChanged ||
                    update.viewportChanged ||
                    syntaxTree(update.startState) !==
                        syntaxTree(update.state) ||
                    update.transactions.some((transaction) =>
                        transaction.effects.some((effect) =>
                            effect.is(toggleRichSource),
                        ),
                    )
                )
                    this.schedule();
            }
            schedule() {
                if (this.frame !== null) return;
                this.frame = requestAnimationFrame(() => {
                    this.frame = null;
                    if (
                        this.destroyed ||
                        !this.view.dom.isConnected ||
                        !context.isVisible()
                    )
                        return;
                    const from = Math.max(0, this.view.viewport.from - 2000);
                    const to = Math.min(
                        this.view.state.doc.length,
                        this.view.viewport.to + 2000,
                    );
                    measureEditorWork('codemirror.rich.decorations', () =>
                        this.view.dispatch({
                            effects: refreshRichBlocks.of({
                                from,
                                to,
                                tree: syntaxTree(this.view.state),
                            }),
                        }),
                    );
                });
            }
            destroy() {
                this.destroyed = true;
                if (this.frame !== null) cancelAnimationFrame(this.frame);
            }
        },
    );
    return [field, manager];
}
