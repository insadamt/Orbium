import { Extension, type Editor } from '@tiptap/core';

export type BlockAlignment = 'left' | 'center' | 'right';

const alignments = new Set<BlockAlignment>(['left', 'center', 'right']);

export const BlockTextAlignment = Extension.create({
    name: 'blockTextAlignment',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    textAlign: {
                        default: null,
                        parseHTML: (element) => {
                            const alignment = element.style.textAlign;
                            return alignments.has(alignment as BlockAlignment)
                                ? alignment
                                : null;
                        },
                        renderHTML: (attributes) =>
                            alignments.has(attributes.textAlign)
                                ? {
                                      style: `text-align: ${attributes.textAlign}`,
                                  }
                                : {},
                    },
                },
            },
        ];
    },
});

function blockRange(editor: Editor, index: number) {
    let from = 0;
    for (let current = 0; current < index; current++) {
        from += editor.state.doc.child(current).nodeSize;
    }
    return { from, to: from + editor.state.doc.child(index).nodeSize };
}

export function blockFormatting(
    editor: Editor,
    index: number,
): {
    alignment: BlockAlignment | null;
    canAlign: boolean;
} {
    const block = editor.state.doc.child(index);
    let alignment: BlockAlignment | null = null;
    let canAlign = false;
    block.descendants((node) => {
        if (node.type.name !== 'paragraph' && node.type.name !== 'heading')
            return true;
        canAlign = true;
        alignment = alignments.has(node.attrs.textAlign)
            ? node.attrs.textAlign
            : null;
        return false;
    });
    if (block.type.name === 'paragraph' || block.type.name === 'heading') {
        canAlign = true;
        alignment = alignments.has(block.attrs.textAlign)
            ? block.attrs.textAlign
            : null;
    }
    return {
        alignment,
        canAlign,
    };
}

export function setBlockAlignment(
    editor: Editor,
    index: number,
    alignment: BlockAlignment,
): void {
    const { from, to } = blockRange(editor, index);
    const transaction = editor.state.tr;
    editor.state.doc.nodesBetween(from, to, (node, position) => {
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            transaction.setNodeMarkup(position, undefined, {
                ...node.attrs,
                textAlign: alignment,
            });
        }
    });
    if (transaction.docChanged) editor.view.dispatch(transaction);
    editor.commands.focus();
}
