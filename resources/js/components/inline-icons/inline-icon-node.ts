import { inlineIconColorStyle } from './inline-icon-color';
import { readInlineIconClipboard } from './inline-icon-clipboard';
import { serializeInlineIcon } from './markdown-icon-source';
import { validInlineIconAttributes } from './inline-icon-data';
import { createInlineIconSelectionPlugin } from './inline-icon-selection';
import type { ContentOwnerKind } from '@/components/editor/editor-api';
import { Node, type Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { createInlineIconElement } from './inline-icon-dom';
import { iconPickerEvent } from './markdown-icon-widget';
import { iconPickerSearchQuery, type InlineIconChoice } from './icon-catalog';

export type LegacyIconAnchor = { from: number; to: number; source: string };
export const legacyIconAnchor = new PluginKey<LegacyIconAnchor | null>(
    'orbiumInlineIconAnchor',
);

export function openLegacyIconPicker(editor: Editor, query = '') {
    if (!editor.isEditable || editor.view.composing) return;
    editor.view.dom.dispatchEvent(
        new CustomEvent(iconPickerEvent, {
            detail: { query: iconPickerSearchQuery(query) },
        }),
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

export function inlineIconInsertionMarks(
    editor: Editor,
    from = editor.state.selection.from,
    to = editor.state.selection.to,
) {
    const selected = editor.state.doc.nodeAt(from);
    if (selected?.type.name === 'inlineIcon' && to === from + selected.nodeSize)
        return selected.toJSON().marks ?? [];
    return (
        editor.state.storedMarks ?? editor.state.doc.resolve(from).marks()
    ).map((mark) => mark.toJSON());
}

export function createInlineIconNode(
    workspaceId: number,
    nodeId: number,
    ownerKind?: ContentOwnerKind,
) {
    return Node.create({
        name: 'inlineIcon',
        inline: true,
        group: 'inline',
        atom: true,
        //
        // Keep pointer and keyboard selection in the text range instead of switching an inline glyph to object selection.
        //
        selectable: false,
        draggable: false,
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
            const choice =
                node.attrs.kind === 'custom'
                    ? {
                          kind: 'custom' as const,
                          label: String(node.attrs.label),
                          attachmentId: Number(node.attrs.attachmentId),
                      }
                    : {
                          kind: 'builtin' as const,
                          label: String(node.attrs.label),
                          name: String(node.attrs.name),
                      };
            const color = node.marks.find(
                (mark) => mark.type.name === 'textColor',
            )?.attrs.color as string | undefined;
            return serializeInlineIcon(choice, {
                ...(color ? { color } : {}),
                ...(node.marks.some((mark) => mark.type.name === 'underline')
                    ? { underline: true }
                    : {}),
            });
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
                            return validInlineIconAttributes(attrs)
                                ? attrs
                                : false;
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
            return ({ node }) => {
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
                              color: node.marks.find(
                                  (mark) => mark.type.name === 'textColor',
                              )?.attrs.color as string | undefined,
                              label: String(node.attrs.label),
                          };
                const dom = createInlineIconElement(choice, {
                    workspaceId,
                    nodeId,
                    ownerKind,
                });
                dom.dataset.orbiumInlineIcon = JSON.stringify(node.attrs);
                return {
                    dom,
                    update(next) {
                        if (
                            next.type !== node.type ||
                            JSON.stringify(next.attrs) !==
                                JSON.stringify(node.attrs)
                        )
                            return false;
                        if (next.attrs.kind === 'builtin')
                            dom.style.color =
                                inlineIconColorStyle(
                                    next.marks.find(
                                        (mark) =>
                                            mark.type.name === 'textColor',
                                    )?.attrs.color as string | undefined,
                                ) ?? '';
                        return true;
                    },
                };
            };
        },
        addProseMirrorPlugins() {
            const editor = this.editor;
            return [
                createInlineIconSelectionPlugin(),
                new Plugin({
                    props: {
                        handlePaste(view, event) {
                            if (
                                !editor.isEditable ||
                                view.composing ||
                                view.state.selection.$from.parent.type.spec
                                    .code ||
                                editor.isActive('code')
                            )
                                return false;
                            if (
                                event.clipboardData
                                    ?.getData('text/html')
                                    .includes('data-orbium-inline-icon')
                            )
                                return false;
                            const content = readInlineIconClipboard(
                                event.clipboardData?.getData('text/plain') ??
                                    '',
                            );
                            if (!content) return false;
                            editor
                                .chain()
                                .setMeta('boardAction', true)
                                .insertContent(content)
                                .run();
                            return true;
                        },
                    },
                }),
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
