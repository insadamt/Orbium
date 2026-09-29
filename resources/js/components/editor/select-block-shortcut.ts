import { Extension } from '@tiptap/core';

export const SelectBlockShortcut = Extension.create({
    name: 'selectBlockShortcut',
    priority: 200,

    addKeyboardShortcuts() {
        return {
            'Mod-a': () => {
                const { selection } = this.editor.state;
                const { $from, $to } = selection;

                if (!$from.sameParent($to) || !$from.parent.isTextblock) {
                    return this.editor.commands.selectAll();
                }

                const blockStart = $from.start();
                const blockEnd = $from.end();
                if (blockStart === blockEnd) {
                    return this.editor.commands.selectParentNode();
                }
                if (
                    selection.from === blockStart &&
                    selection.to === blockEnd
                ) {
                    return this.editor.commands.selectAll();
                }

                return this.editor.commands.setTextSelection({
                    from: blockStart,
                    to: blockEnd,
                });
            },
        };
    },
});
