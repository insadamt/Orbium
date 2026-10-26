import { Node, type Editor } from '@tiptap/core';
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state';
import { createInlineIconElement } from './inline-icon-dom';
import { iconPickerEvent } from './markdown-icon-widget';
import { isBuiltinIcon, type InlineIconChoice } from './icon-catalog';

export type LegacyIconAnchor = { from: number; to: number; source: string };
export const legacyIconAnchor = new PluginKey<LegacyIconAnchor | null>(
    'orbiumInlineIconAnchor',
);

export function openLegacyIconPicker(editor: Editor, query = '') {
    if (!editor.isEditable || editor.view.composing) return;
    editor.view.dom.dispatchEvent(
        new CustomEvent(iconPickerEvent, { detail: { query } }),
    );
}

export function legacyIconAttributes(
    choice: Exclude<InlineIconChoice, { kind: 'emoji' }>,
) {
    return {
        version: 1,
        kind: choice.kind,
        label: choice.label,
        name: choice.kind === 'builtin' ? choice.name : null,
        attachmentId: choice.kind === 'custom' ? choice.attachmentId : null,
    };
}

export function createInlineIconNode(workspaceId: number, nodeId: number) {
    return Node.create({
        name: 'inlineIcon',
        inline: true,
        group: 'inline',
        atom: true,
        addAttributes() {
            return Object.fromEntries(
                ['version', 'kind', 'label', 'name', 'attachmentId'].map(
                    (name) => [
                        name,
                        { default: name === 'version' ? 1 : null },
                    ],
                ),
            );
        },
        renderText({ node }) {
            return String(node.attrs.label ?? 'Icon');
        },
        parseHTML() {
            return [
                {
                    tag: 'span[data-orbium-inline-icon]',
                    getAttrs(element) {
                        try {
                            const attrs = JSON.parse(
                                element.getAttribute(
                                    'data-orbium-inline-icon',
                                ) ?? '{}',
                            );
                            if (
                                attrs.version !== 1 ||
                                typeof attrs.label !== 'string' ||
                                !attrs.label.trim() ||
                                attrs.label.length > 160
                            )
                                return false;
                            if (
                                attrs.kind === 'builtin' &&
                                isBuiltinIcon(attrs.name)
                            )
                                return attrs;
                            if (
                                attrs.kind === 'custom' &&
                                Number.isSafeInteger(attrs.attachmentId) &&
                                attrs.attachmentId > 0
                            )
                                return attrs;
                        } catch {
                            //
                            // Invalid clipboard metadata falls back to readable text.
                            //
                        }
                        return false;
                    },
                },
            ];
        },
        renderHTML({ node }) {
            return [
                'span',
                {
                    'data-orbium-inline-icon': JSON.stringify(node.attrs),
                    class: 'orbium-inline-icon',
                    role: 'img',
                    'aria-label': node.attrs.label,
                },
                node.attrs.label,
            ];
        },
        addNodeView() {
            return ({ node, editor, getPos }) => {
                const choice: Exclude<InlineIconChoice, { kind: 'emoji' }> =
                    node.attrs.kind === 'custom'
                        ? {
                              kind: 'custom',
                              attachmentId: Number(node.attrs.attachmentId),
                              label: String(node.attrs.label),
                          }
                        : {
                              kind: 'builtin',
                              name: String(node.attrs.name),
                              label: String(node.attrs.label),
                          };
                const dom = createInlineIconElement(choice, {
                    workspaceId,
                    nodeId,
                });
                dom.dataset.orbiumInlineIcon = JSON.stringify(node.attrs);
                dom.setAttribute('role', 'button');
                dom.tabIndex = 0;
                dom.setAttribute('aria-label', `Replace ${choice.label} icon`);
                function replace() {
                    const position = getPos();
                    if (
                        typeof position !== 'number' ||
                        !editor.isEditable ||
                        editor.view.composing
                    )
                        return;
                    editor.view.dispatch(
                        editor.state.tr.setSelection(
                            NodeSelection.create(editor.state.doc, position),
                        ),
                    );
                    openLegacyIconPicker(editor);
                }
                dom.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    replace();
                });
                dom.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        replace();
                    }
                    if (event.key === 'Backspace' || event.key === 'Delete') {
                        const position = getPos();
                        if (typeof position !== 'number' || !editor.isEditable)
                            return;
                        event.preventDefault();
                        event.stopPropagation();
                        editor
                            .chain()
                            .focus()
                            .deleteRange({
                                from: position,
                                to: position + node.nodeSize,
                            })
                            .run();
                    }
                });
                return { dom, stopEvent: () => true };
            };
        },
        addProseMirrorPlugins() {
            return [
                new Plugin<LegacyIconAnchor | null>({
                    key: legacyIconAnchor,
                    state: {
                        init: () => null,
                        apply(transaction, anchor) {
                            const next = transaction.getMeta(
                                legacyIconAnchor,
                            ) as LegacyIconAnchor | null | undefined;
                            if (next !== undefined) return next;
                            if (!anchor || !transaction.docChanged)
                                return anchor;
                            return {
                                ...anchor,
                                from: transaction.mapping.map(anchor.from, 1),
                                to: transaction.mapping.map(anchor.to, -1),
                            };
                        },
                    },
                }),
            ];
        },
    });
}
