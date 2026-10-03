import { Extension } from '@tiptap/core';
import { Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, Selection } from '@tiptap/pm/state';
import { findChangedBlockRanges } from './document-change-range';

import {
    inferBlockDirection,
    type ResolvedDirection,
} from './block-direction-inference';

const directionalBlockTypes = [
    'paragraph',
    'heading',
    'bulletList',
    'orderedList',
    'taskList',
    'blockquote',
    'codeBlock',
    'callout',
    'table',
    'horizontalRule',
    'image',
    'file',
    'mermaid',
    'blockMath',
];

type NormalizedDescendants = {
    direction: ResolvedDirection;
    automatic: boolean;
    result: ProseMirrorNode;
};
const normalizedDescendants = new WeakMap<
    ProseMirrorNode,
    NormalizedDescendants
>();

function normalizeDescendantDirections(
    block: ProseMirrorNode,
    direction: ResolvedDirection,
    automatic: boolean,
): ProseMirrorNode {
    if (block.isTextblock || block.isLeaf) return block;
    const cached = normalizedDescendants.get(block);
    if (cached?.direction === direction && cached.automatic === automatic)
        return cached.result;
    const children: ProseMirrorNode[] = [];
    let changed = false;
    block.forEach((child) => {
        if (!child.isBlock) {
            children.push(child);
            return;
        }
        const childDirection = automatic
            ? inferBlockDirection(child, direction)
            : direction;
        const normalized = normalizeDescendantDirections(
            child,
            childDirection,
            automatic,
        );
        const directed =
            normalized.attrs.dir === childDirection
                ? normalized
                : normalized.type.create(
                      { ...normalized.attrs, dir: childDirection },
                      normalized.content,
                      normalized.marks,
                  );
        normalizedDescendants.set(directed, {
            direction: childDirection,
            automatic,
            result: directed,
        });
        children.push(directed);
        changed ||= directed !== child;
    });
    const result = changed ? block.copy(Fragment.fromArray(children)) : block;
    normalizedDescendants.set(block, { direction, automatic, result });
    normalizedDescendants.set(result, { direction, automatic, result });
    return result;
}

function normalizeBlockDirection(
    block: ProseMirrorNode,
    precedingDirection: ResolvedDirection,
): ProseMirrorNode {
    const manual =
        block.attrs.directionMode === 'manual' ||
        (block.attrs.directionMode == null && block.attrs.dir === 'rtl');
    const direction = manual
        ? block.attrs.dir === 'rtl'
            ? 'rtl'
            : 'ltr'
        : inferBlockDirection(block, precedingDirection);
    const normalized = normalizeDescendantDirections(block, direction, !manual);
    if (
        normalized.attrs.dir === direction &&
        (manual || normalized.attrs.directionMode === 'auto')
    )
        return normalized;
    return normalized.type.create(
        {
            ...normalized.attrs,
            dir: direction,
            ...(!manual ? { directionMode: 'auto' } : {}),
        },
        normalized.content,
        normalized.marks,
    );
}

const automaticBlockDirectionKey = new PluginKey('automaticBlockDirection');

export const AutomaticBlockDirection = Extension.create({
    name: 'automaticBlockDirection',

    onCreate() {
        this.editor.view.dispatch(
            this.editor.state.tr.setMeta(automaticBlockDirectionKey, true),
        );
    },

    addGlobalAttributes() {
        return [
            {
                types: directionalBlockTypes,
                attributes: {
                    directionMode: {
                        default: null,
                        rendered: false,
                    },
                },
            },
        ];
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: automaticBlockDirectionKey,
                appendTransaction: (transactions, oldState, newState) => {
                    const initializing = transactions.some((transaction) =>
                        transaction.getMeta(automaticBlockDirectionKey),
                    );
                    if (
                        !initializing &&
                        !transactions.some(
                            (transaction) => transaction.docChanged,
                        )
                    )
                        return null;
                    const changed = initializing
                        ? { from: 0, to: newState.doc.content.size }
                        : findChangedBlockRanges(oldState.doc, newState.doc)
                              ?.current;
                    if (!changed) return null;

                    const start = newState.doc.resolve(changed.from);
                    let direction: ResolvedDirection = 'ltr';
                    for (let index = start.index(0) - 1; index >= 0; index--) {
                        const previous = newState.doc.child(index);
                        if ('directionMode' in previous.attrs) {
                            direction =
                                previous.attrs.dir === 'rtl' ? 'rtl' : 'ltr';
                            break;
                        }
                    }
                    const blocks: ProseMirrorNode[] = [];
                    let position = changed.from;
                    let contentChanged = false;
                    for (
                        let index = start.index(0);
                        index < newState.doc.childCount;
                        index++
                    ) {
                        const block = newState.doc.child(index);
                        const normalized =
                            'directionMode' in block.attrs
                                ? normalizeBlockDirection(block, direction)
                                : block;
                        // Direction inheritance can continue beyond the edited range through empty blocks.
                        if (
                            position >= changed.to &&
                            normalized === block &&
                            'directionMode' in block.attrs
                        )
                            break;
                        if ('directionMode' in normalized.attrs)
                            direction =
                                normalized.attrs.dir === 'rtl' ? 'rtl' : 'ltr';
                        blocks.push(normalized);
                        contentChanged ||= normalized !== block;
                        position += block.nodeSize;
                    }
                    if (!contentChanged) return null;
                    const transaction = newState.tr.replaceWith(
                        changed.from,
                        position,
                        Fragment.fromArray(blocks),
                    );
                    // Attribute normalization preserves positions; replacement mapping would move the caret.
                    transaction.setSelection(
                        Selection.fromJSON(
                            transaction.doc,
                            newState.selection.toJSON(),
                        ),
                    );
                    transaction.setStoredMarks(newState.storedMarks);
                    if (initializing)
                        transaction.setMeta('addToHistory', false);
                    return transaction;
                },
            }),
        ];
    },
});
