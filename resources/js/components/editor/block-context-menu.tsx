import type { Editor } from '@tiptap/core';
import {
    blockFormatting,
    setBlockAlignment,
    setBlockDirection,
} from './block-formatting';
import { changeBlockOrder } from './editor-controls';
import { findBlockCommands } from './editor-commands';
import {
    BlockMenuSurface,
    type BlockMenuAnchor,
} from './ui/block-menu-surface';
type Props = {
    editor: Editor;
    index: number;
    anchor: BlockMenuAnchor;
    onClose: () => void;
};
function blockStart(editor: Editor, index: number): number {
    let position = 0;
    for (let blockIndex = 0; blockIndex < index; blockIndex++)
        position += editor.state.doc.child(blockIndex).nodeSize;
    return position;
}

function deleteBlock(editor: Editor, index: number): void {
    const { doc, schema, tr } = editor.state;
    const position = blockStart(editor, index);
    tr.delete(position, position + doc.child(index).nodeSize);
    if (tr.doc.childCount === 0) tr.insert(0, schema.nodes.paragraph.create());
    editor.view.dispatch(tr.scrollIntoView());
}

export default function BlockContextMenu({
    editor,
    index,
    anchor,
    onClose,
}: Props) {
    return (
        <BlockMenuSurface
            anchor={anchor}
            formatting={blockFormatting(editor, index)}
            canMoveUp={index > 0}
            canMoveDown={index < editor.state.doc.childCount - 1}
            onClose={onClose}
            onFocusEditor={() => editor.commands.focus()}
            onConvert={(label) => {
                const command = findBlockCommands('').find(
                    (item) => item.label === label,
                );
                if (!command) return;
                editor
                    .chain()
                    .focus()
                    .setTextSelection(blockStart(editor, index) + 1)
                    .run();
                command.run(editor);
            }}
            onAlignment={(alignment) =>
                setBlockAlignment(editor, index, alignment)
            }
            onDirection={(direction) =>
                setBlockDirection(editor, index, direction)
            }
            onAction={(action) => {
                if (action === 'delete') deleteBlock(editor, index);
                else if (action === 'copy')
                    void navigator.clipboard.writeText(
                        editor.state.doc.child(index).textContent,
                    );
                else
                    changeBlockOrder(
                        editor,
                        index,
                        action === 'up' ? index - 1 : index + 1,
                        action === 'duplicate',
                    );
            }}
        />
    );
}
