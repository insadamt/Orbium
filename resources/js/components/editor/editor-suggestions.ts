import { Extension, type Editor } from '@tiptap/core';
import Mention from '@tiptap/extension-mention';
import Suggestion from '@tiptap/suggestion';
import { findBlockCommands, type BlockCommand } from './editor-commands';

export type MentionCandidate = { id: number; title: string; type: string };
export type EditorMenu =
    | {
          type: 'slash';
          items: BlockCommand[];
          query: string;
          from: number;
          to: number;
          rect: DOMRect | null;
          selectedIndex: number;
      }
    | {
          type: 'mention';
          items: MentionCandidate[];
          query: string;
          from: number;
          to: number;
          rect: DOMRect | null;
          selectedIndex: number;
      };

type SuggestionContext = {
    workspaceId: number;
    onMenuChange: (menu: EditorMenu | null) => void;
    onUpload: () => void;
};

export function createSuggestionExtensions(context: SuggestionContext) {
    let slashSelection = 0;
    let mentionSelection = 0;
    let slashItemCount = 0;
    let mentionItemCount = 0;
    let runSlashItem: ((index: number) => void) | null = null;
    let runMentionItem: ((index: number) => void) | null = null;
    let slashMenu: EditorMenu | null = null;
    let mentionMenu: EditorMenu | null = null;
    const slash = Extension.create({
        name: 'orbiumSlashCommands',
        addProseMirrorPlugins() {
            return [
                Suggestion({
                    editor: this.editor,
                    char: '/',
                    startOfLine: false,
                    items: ({ query }) => [
                        ...findBlockCommands(query),
                        ...['Image', 'File']
                            .filter((label) =>
                                label
                                    .toLowerCase()
                                    .includes(query.toLowerCase()),
                            )
                            .map((label) => ({
                                label,
                                search: label.toLowerCase(),
                                run: () => context.onUpload(),
                            })),
                    ],
                    command: ({
                        editor,
                        range,
                        props,
                    }: {
                        editor: Editor;
                        range: { from: number; to: number };
                        props: BlockCommand;
                    }) => {
                        editor.chain().focus().deleteRange(range).run();
                        props.run(editor);
                    },
                    render: () => ({
                        onStart: (props) => {
                            slashSelection = 0;
                            slashItemCount = props.items.length;
                            runSlashItem = (index) =>
                                props.command(props.items[index]);
                            slashMenu = {
                                type: 'slash',
                                items: props.items,
                                query: props.query,
                                from: props.range.from,
                                to: props.range.to,
                                rect: props.clientRect?.() ?? null,
                                selectedIndex: 0,
                            };
                            context.onMenuChange(slashMenu);
                        },
                        onUpdate: (props) => {
                            slashSelection = 0;
                            slashItemCount = props.items.length;
                            runSlashItem = (index) =>
                                props.command(props.items[index]);
                            slashMenu = {
                                type: 'slash',
                                items: props.items,
                                query: props.query,
                                from: props.range.from,
                                to: props.range.to,
                                rect: props.clientRect?.() ?? null,
                                selectedIndex: 0,
                            };
                            context.onMenuChange(slashMenu);
                        },
                        onExit: () => context.onMenuChange(null),
                        onKeyDown: ({ event }) => {
                            if (event.key === 'Escape') {
                                context.onMenuChange(null);
                                return true;
                            }
                            if (event.key === 'ArrowDown') {
                                slashSelection =
                                    (slashSelection + 1) %
                                    Math.max(slashItemCount, 1);
                                if (slashMenu)
                                    context.onMenuChange({
                                        ...slashMenu,
                                        selectedIndex: slashSelection,
                                    });
                                return true;
                            }
                            if (event.key === 'ArrowUp') {
                                slashSelection =
                                    (slashSelection - 1 + slashItemCount) %
                                    Math.max(slashItemCount, 1);
                                if (slashMenu)
                                    context.onMenuChange({
                                        ...slashMenu,
                                        selectedIndex: slashSelection,
                                    });
                                return true;
                            }
                            if (event.key === 'Enter' && slashItemCount > 0) {
                                runSlashItem?.(slashSelection);
                                return true;
                            }
                            return false;
                        },
                    }),
                }),
            ];
        },
    });

    const mention = Mention.configure({
        HTMLAttributes: { class: 'editor-mention' },
        renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
        renderHTML: ({ node }) => [
            'span',
            {
                class: 'editor-mention',
                'data-type': 'mention',
                'data-id': node.attrs.id,
                'data-label': node.attrs.label,
                'data-mention-id': node.attrs.id,
            },
            `@${node.attrs.label ?? node.attrs.id}`,
        ],
        suggestion: {
            char: '@',
            debounce: 180,
            items: async ({ query, signal }) => {
                const response = await fetch(
                    `/workspaces/${context.workspaceId}/mentions?q=${encodeURIComponent(query)}`,
                    { headers: { Accept: 'application/json' }, signal },
                );
                return response.ok
                    ? ((await response.json()) as MentionCandidate[])
                    : [];
            },
            render: () => ({
                onStart: (props) => {
                    mentionSelection = 0;
                    mentionItemCount = props.items.length;
                    runMentionItem = (index) =>
                        props.command({
                            id: String(props.items[index].id),
                            label: props.items[index].title,
                        });
                    mentionMenu = {
                        type: 'mention',
                        items: props.items,
                        query: props.query,
                        from: props.range.from,
                        to: props.range.to,
                        rect: props.clientRect?.() ?? null,
                        selectedIndex: 0,
                    };
                    context.onMenuChange(mentionMenu);
                },
                onUpdate: (props) => {
                    mentionSelection = 0;
                    mentionItemCount = props.items.length;
                    runMentionItem = (index) =>
                        props.command({
                            id: String(props.items[index].id),
                            label: props.items[index].title,
                        });
                    mentionMenu = {
                        type: 'mention',
                        items: props.items,
                        query: props.query,
                        from: props.range.from,
                        to: props.range.to,
                        rect: props.clientRect?.() ?? null,
                        selectedIndex: 0,
                    };
                    context.onMenuChange(mentionMenu);
                },
                onExit: () => context.onMenuChange(null),
                onKeyDown: ({ event }) => {
                    if (event.key === 'Escape') {
                        context.onMenuChange(null);
                        return true;
                    }
                    if (event.key === 'ArrowDown') {
                        mentionSelection =
                            (mentionSelection + 1) %
                            Math.max(mentionItemCount, 1);
                        if (mentionMenu)
                            context.onMenuChange({
                                ...mentionMenu,
                                selectedIndex: mentionSelection,
                            });
                        return true;
                    }
                    if (event.key === 'ArrowUp') {
                        mentionSelection =
                            (mentionSelection - 1 + mentionItemCount) %
                            Math.max(mentionItemCount, 1);
                        if (mentionMenu)
                            context.onMenuChange({
                                ...mentionMenu,
                                selectedIndex: mentionSelection,
                            });
                        return true;
                    }
                    if (event.key === 'Enter' && mentionItemCount > 0) {
                        runMentionItem?.(mentionSelection);
                        return true;
                    }
                    return false;
                },
            }),
        },
    });

    return [slash, mention];
}
