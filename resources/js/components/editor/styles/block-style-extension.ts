import { findTransactionBlockRanges } from '../document-change-range';
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node } from '@tiptap/pm/model';

function blockClass(node: Node): string | undefined {
    if (node.type.name === 'heading')
        return `orbium-heading-${node.attrs.level}`;
    return {
        paragraph: 'orbium-paragraph',
        bulletList: 'orbium-bullet-list',
        orderedList: 'orbium-ordered-list',
        taskList: 'orbium-checklist',
        blockquote: 'orbium-quote',
        callout: 'orbium-callout',
        codeBlock: 'orbium-code',
        horizontalRule: 'orbium-divider',
    }[node.type.name];
}

function isBrowserContainmentEligibleBlock(node: Node): boolean {
    if (node.type.name === 'horizontalRule') return true;
    if (!['paragraph', 'heading'].includes(node.type.name)) return false;

    // Inline NodeViews can position controls outside the block's paint boundary.
    for (let index = 0; index < node.childCount; index++) {
        const child = node.child(index);
        if (!child.isText && child.type.name !== 'hardBreak') return false;
    }
    return true;
}

function blockDecorations(
    doc: Node,
    from = 0,
    to = doc.content.size,
): Decoration[] {
    const decorations: Decoration[] = [];
    doc.nodesBetween(from, to, (node, position, parent) => {
        const className = blockClass(node);
        if (className)
            decorations.push(
                Decoration.node(position, position + node.nodeSize, {
                    class: className,
                    ...(parent === doc &&
                    isBrowserContainmentEligibleBlock(node)
                        ? { 'data-editor-containment-block': node.type.name }
                        : {}),
                }),
            );
    });
    return decorations;
}

export const BlockStyleClasses = Extension.create({
    name: 'blockStyleClasses',
    addProseMirrorPlugins() {
        return [
            new Plugin({
                state: {
                    init: (_, state) =>
                        DecorationSet.create(
                            state.doc,
                            blockDecorations(state.doc),
                        ),
                    apply: (transaction, previous) => {
                        if (!transaction.docChanged) return previous;
                        const range =
                            findTransactionBlockRanges(transaction)?.current;
                        const mapped = previous.map(
                            transaction.mapping,
                            transaction.doc,
                        );
                        if (!range) return mapped;
                        return mapped
                            .remove(
                                mapped
                                    .find(range.from, range.to)
                                    .filter(
                                        (decoration) =>
                                            decoration.from >= range.from &&
                                            decoration.to <= range.to,
                                    ),
                            )
                            .add(
                                transaction.doc,
                                blockDecorations(
                                    transaction.doc,
                                    range.from,
                                    range.to,
                                ),
                            );
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                },
            }),
        ];
    },
});
