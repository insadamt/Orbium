import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';

type ResolvedDirection = 'ltr' | 'rtl';

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

const rtlLetter =
    /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Hanifi_Rohingya}]/u;
const letter = /\p{Letter}/u;
const strongDirections = new WeakMap<
    ProseMirrorNode,
    ResolvedDirection | null
>();

function firstStrongDirection(text: string): ResolvedDirection | null {
    for (const character of text) {
        if (rtlLetter.test(character)) return 'rtl';
        if (letter.test(character)) return 'ltr';
    }
    return null;
}

function inferredDirection(
    block: ProseMirrorNode,
    precedingDirection: ResolvedDirection,
): { attribute: 'auto' | ResolvedDirection; resolved: ResolvedDirection } {
    let strongDirection = strongDirections.get(block);
    if (strongDirection === undefined) {
        strongDirection = firstStrongDirection(
            block.textContent ||
                String(
                    block.attrs.caption ||
                        block.attrs.alt ||
                        block.attrs.name ||
                        block.attrs.source ||
                        block.attrs.latex ||
                        '',
                ),
        );
        strongDirections.set(block, strongDirection);
    }
    return {
        attribute: strongDirection ? 'auto' : precedingDirection,
        resolved: strongDirection ?? precedingDirection,
    };
}

function updateDescendantDirections(
    block: ProseMirrorNode,
    position: number,
    direction: 'auto' | ResolvedDirection,
    transaction: Transaction,
): void {
    block.descendants((child, childPosition) => {
        if (!child.isBlock || child.attrs.dir === direction) return;
        transaction.setNodeMarkup(position + childPosition + 1, undefined, {
            ...child.attrs,
            dir: direction,
        });
    });
}

export const AutomaticBlockDirection = Extension.create({
    name: 'automaticBlockDirection',

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
                key: new PluginKey('automaticBlockDirection'),
                appendTransaction: (transactions, _oldState, newState) => {
                    if (
                        !transactions.some(
                            (transaction) => transaction.docChanged,
                        )
                    )
                        return null;

                    const transaction = newState.tr;
                    let precedingDirection: ResolvedDirection = 'ltr';

                    newState.doc.forEach((block, position) => {
                        if (!('directionMode' in block.attrs)) return;
                        const legacyManualRtl =
                            block.attrs.directionMode == null &&
                            block.attrs.dir === 'rtl';
                        if (
                            block.attrs.directionMode === 'manual' ||
                            legacyManualRtl
                        ) {
                            precedingDirection =
                                block.attrs.dir === 'rtl' ? 'rtl' : 'ltr';
                            updateDescendantDirections(
                                block,
                                position,
                                precedingDirection,
                                transaction,
                            );
                            return;
                        }

                        const direction = inferredDirection(
                            block,
                            precedingDirection,
                        );
                        precedingDirection = direction.resolved;

                        if (
                            block.attrs.dir !== direction.attribute ||
                            block.attrs.directionMode !== 'auto'
                        ) {
                            transaction.setNodeMarkup(position, undefined, {
                                ...block.attrs,
                                dir: direction.attribute,
                                directionMode: 'auto',
                            });
                        }

                        updateDescendantDirections(
                            block,
                            position,
                            direction.attribute,
                            transaction,
                        );
                    });

                    return transaction.docChanged ? transaction : null;
                },
            }),
        ];
    },
});
