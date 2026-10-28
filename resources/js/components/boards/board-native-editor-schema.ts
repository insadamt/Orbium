import { Node, type Editor, type JSONContent } from '@tiptap/core';
import { Table, TableCell, TableRow } from '@tiptap/extension-table';
import { TextSelection } from '@tiptap/pm/state';
import { createBoardListItemView } from './board-list-item-view';
import type {
    BoardBlockData,
    BoardBlockKind,
    BoardInline,
} from './board-types';

export function nativeEditorDocument(
    kind: BoardBlockKind,
    data: BoardBlockData,
): JSONContent {
    if (kind === 'list')
        return {
            type: 'doc',
            content: data.items!.map((item) => ({
                type: 'boardListItem',
                attrs: {
                    indent: item.indent,
                    checked: item.checked,
                },
                content: item.content as JSONContent[],
            })),
        };
    if (kind === 'table')
        return {
            type: 'doc',
            content: [
                {
                    type: 'table',
                    content: data.rows!.map((row) => ({
                        type: 'tableRow',
                        content: row.map((cell) => ({
                            type: 'tableCell',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: cell as JSONContent[],
                                },
                            ],
                        })),
                    })),
                },
            ],
        };
    return {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: (data.content ?? []) as JSONContent[],
            },
        ],
    };
}

function readInline(content: JSONContent[] = []): BoardInline[] {
    return content.map((node) =>
        node.type === 'inlineIcon'
            ? {
                  type: 'inlineIcon',
                  attrs: node.attrs as BoardInline['attrs'],
                  ...(node.marks?.length
                      ? { marks: node.marks as BoardInline['marks'] }
                      : {}),
              }
            : node.type === 'hardBreak'
              ? { type: 'hardBreak' }
              : {
                    type: 'text',
                    text: node.text ?? '',
                    ...(node.marks?.length
                        ? {
                              marks: node.marks.map((mark) => ({
                                  type: mark.type as NonNullable<
                                      BoardInline['marks']
                                  >[number]['type'],
                                  ...(mark.type === 'link'
                                      ? {
                                            attrs: {
                                                href: String(
                                                    mark.attrs?.href ?? '',
                                                ),
                                            },
                                        }
                                      : mark.type === 'textColor'
                                        ? {
                                              attrs: {
                                                  color: String(
                                                      mark.attrs?.color ?? '',
                                                  ),
                                              },
                                          }
                                        : {}),
                              })),
                          }
                        : {}),
                },
    );
}

export function nativeEditorData(
    kind: BoardBlockKind,
    original: BoardBlockData,
    document: JSONContent,
): BoardBlockData {
    if (kind === 'list')
        return {
            ...original,
            items: document.content!.map((item) => ({
                content: readInline(item.content),
                indent: Number(item.attrs?.indent ?? 0),
                checked: Boolean(item.attrs?.checked),
            })),
        };
    if (kind === 'table')
        return {
            ...original,
            rows: document.content![0].content!.map((row) =>
                row.content!.map((cell) =>
                    readInline(cell.content?.[0].content),
                ),
            ),
        };
    return { ...original, content: readInline(document.content?.[0].content) };
}

function indentSelectedItems(editor: Editor, delta: number) {
    return editor.commands.command(({ tr, state }) => {
        state.doc.nodesBetween(
            state.selection.from,
            state.selection.to,
            (node, position) => {
                if (node.type.name !== 'boardListItem') return;
                tr.setNodeMarkup(position, undefined, {
                    ...node.attrs,
                    indent: Math.max(
                        0,
                        Math.min(12, node.attrs.indent + delta),
                    ),
                });
            },
        );
        tr.setMeta('boardAction', true);
        return true;
    });
}

export function nativeEditorExtensions(
    kind: BoardBlockKind,
    finish: () => void,
) {
    const root = Node.create({
        name: 'doc',
        topNode: true,
        content:
            kind === 'list'
                ? 'boardListItem+'
                : kind === 'table'
                  ? 'table'
                  : 'paragraph',
    });
    if (kind === 'table')
        return [
            root,
            Table.configure({
                HTMLAttributes: { class: 'orbium-rich-table' },
                resizable: false,
                allowTableNodeSelection: false,
            }),
            TableRow.extend({ content: 'tableCell+' }),
            TableCell.extend({ content: 'paragraph' }),
        ];
    if (kind !== 'list') return [root];
    const item = Node.create({
        name: 'boardListItem',
        priority: 1000,
        content: 'inline*',
        group: 'block',
        defining: true,
        addNodeView() {
            return createBoardListItemView;
        },
        addAttributes() {
            return {
                indent: { default: 0 },
                checked: { default: false },
            };
        },
        parseHTML() {
            return [{ tag: 'div[data-native-list-item]' }];
        },
        renderHTML({ node }) {
            return [
                'div',
                {
                    'data-native-list-item': '',
                    class: 'board-list-item',
                    style: `padding-inline-start:${node.attrs.indent * 20}px`,
                },
                [
                    'input',
                    {
                        type: 'checkbox',
                        contenteditable: 'false',
                        'data-board-interactive': '',
                        'aria-label': 'Complete list item',
                        ...(node.attrs.checked ? { checked: 'checked' } : {}),
                    },
                ],
                [
                    'span',
                    {
                        contenteditable: 'false',
                        class: 'board-list-marker',
                        'aria-hidden': 'true',
                    },
                ],
                ['div', { class: 'board-list-content' }, 0],
            ];
        },
        addKeyboardShortcuts() {
            return {
                Tab: () => indentSelectedItems(this.editor, 1),
                'Shift-Tab': () => indentSelectedItems(this.editor, -1),
                Enter: () => {
                    const { state } = this.editor;
                    if (
                        state.selection.empty &&
                        !state.selection.$from.parent.content.size
                    ) {
                        if (state.selection.$from.parent.attrs.indent > 0)
                            return indentSelectedItems(this.editor, -1);
                        if (state.doc.childCount > 1)
                            this.editor.commands.command(({ tr }) => {
                                const position = tr.selection.$from.before();
                                tr.delete(
                                    position,
                                    position +
                                        tr.selection.$from.parent.nodeSize,
                                ).setMeta('boardAction', true);
                                return true;
                            });
                        finish();
                        return true;
                    }
                    return this.editor.commands.command(({ tr }) => {
                        tr.deleteSelection();
                        const { $from } = tr.selection;
                        tr.split($from.pos, 1, [
                            {
                                type: $from.parent.type,
                                attrs: {
                                    ...$from.parent.attrs,
                                    checked: false,
                                },
                            },
                        ]).setMeta('boardAction', true);
                        tr.setSelection(
                            TextSelection.near(
                                tr.doc.resolve(tr.selection.from),
                            ),
                        );
                        return true;
                    });
                },
            };
        },
    });
    return [root, item];
}

export function nativeStructureChanged(
    kind: BoardBlockKind,
    previous: BoardBlockData,
    next: BoardBlockData,
) {
    if (kind === 'list')
        return (
            previous.items?.length !== next.items?.length ||
            previous.list_style !== next.list_style ||
            previous.items?.some(
                (item, index) =>
                    item.indent !== next.items?.[index]?.indent ||
                    item.checked !== next.items?.[index]?.checked,
            )
        );
    if (kind === 'table')
        return (
            previous.rows?.length !== next.rows?.length ||
            previous.rows?.[0]?.length !== next.rows?.[0]?.length
        );
    return false;
}
