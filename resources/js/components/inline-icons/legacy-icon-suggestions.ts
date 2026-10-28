import { inlineIconInsertionMarks } from '@/components/inline-icons/inline-icon-node';
import { Extension, type Editor } from '@tiptap/core';
import Suggestion, { exitSuggestion } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import type { EditorMenu } from '@/components/editor/editor-suggestions';
import type { BlockCommand } from '@/components/editor/editor-commands';
import { findInlineIcons } from './icon-catalog';
import { announceInsertedIcon } from './icon-preferences';
import { legacyIconAttributes, openLegacyIconPicker } from './inline-icon-node';

export const legacyIconSuggestionKey = new PluginKey('orbiumIconSuggestions');

export function createLegacyIconSuggestions(
    isActive: () => boolean,
    onMenuChange: (menu: EditorMenu | null) => void,
) {
    return Extension.create({
        name: 'orbiumIconSuggestions',
        //
        // Completion acceptance must run before StarterKit's ordinary Enter/newline keymap.
        //
        priority: 200,
        addProseMirrorPlugins() {
            const editor = this.editor;
            let selectedIndex = 0;
            let menu: Extract<EditorMenu, { type: 'slash' | 'icon' }> | null =
                null;
            let run: ((index: number) => void) | null = null;
            return [
                Suggestion<BlockCommand>({
                    editor: this.editor,
                    pluginKey: legacyIconSuggestionKey,
                    char: ':',
                    allowedPrefixes: [' ', '\n', '(', '['],
                    allow: ({ state, range }) =>
                        isActive() &&
                        !this.editor.view.composing &&
                        !state.selection.$from.parent.type.spec.code &&
                        !state.doc.rangeHasMark(
                            range.from,
                            range.to,
                            state.schema.marks.code,
                        ),
                    items: ({ query }) => [
                        ...findInlineIcons(query)
                            .slice(0, 24)
                            .map((choice) => ({
                                label: choice.label,
                                inlineIcon: choice,
                                search: choice.label,
                                run(editor: Editor) {
                                    editor
                                        .chain()
                                        .focus()
                                        .insertContent(
                                            choice.kind === 'emoji'
                                                ? {
                                                      type: 'text',
                                                      text: choice.value,
                                                  }
                                                : {
                                                      type: 'inlineIcon',
                                                      marks: inlineIconInsertionMarks(
                                                          editor,
                                                      ),
                                                      attrs: legacyIconAttributes(
                                                          choice,
                                                      ),
                                                  },
                                        )
                                        .run();
                                    announceInsertedIcon(
                                        editor.view.dom,
                                        choice,
                                    );
                                },
                            })),
                        {
                            label: 'Browse all icons…',
                            search: 'icons',
                            run: (editor: Editor) =>
                                openLegacyIconPicker(editor, query),
                        },
                    ],
                    command({ editor, range, props }) {
                        editor.chain().focus().deleteRange(range).run();
                        props.run(editor);
                    },
                    render: () => ({
                        onStart(props) {
                            selectedIndex = 0;
                            run = (index) => props.command(props.items[index]);
                            menu = {
                                type: 'icon',
                                items: props.items,
                                query: props.query,
                                from: props.range.from,
                                to: props.range.to,
                                rect: props.clientRect?.() ?? null,
                                selectedIndex,
                            };
                            onMenuChange(menu);
                        },
                        onUpdate(props) {
                            selectedIndex = 0;
                            run = (index) => props.command(props.items[index]);
                            menu = {
                                type: 'icon',
                                items: props.items,
                                query: props.query,
                                from: props.range.from,
                                to: props.range.to,
                                rect: props.clientRect?.() ?? null,
                                selectedIndex,
                            };
                            onMenuChange(menu);
                        },
                        onExit() {
                            menu = null;
                            onMenuChange(null);
                        },
                        onKeyDown({ event }) {
                            if (!menu || !isActive()) return false;
                            if (event.key === 'Escape') {
                                exitSuggestion(
                                    editor.view,
                                    legacyIconSuggestionKey,
                                );
                                onMenuChange(null);
                                return true;
                            }
                            if (
                                event.key === 'ArrowDown' ||
                                event.key === 'ArrowUp'
                            ) {
                                selectedIndex =
                                    (selectedIndex +
                                        (event.key === 'ArrowDown'
                                            ? 1
                                            : menu.items.length - 1)) %
                                    Math.max(1, menu.items.length);
                                menu = { ...menu, selectedIndex };
                                onMenuChange(menu);
                                return true;
                            }
                            if (
                                (event.key === 'Enter' ||
                                    event.key === 'Tab') &&
                                menu.items.length
                            ) {
                                run?.(selectedIndex);
                                return true;
                            }
                            return false;
                        },
                    }),
                }),
            ];
        },
    });
}
