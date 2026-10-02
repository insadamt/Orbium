import type { Editor } from '@tiptap/core';

const blockControlHeight = 25;

function firstLineElement(block: Element): Element {
    if (block.matches('ul, ol')) return block.querySelector('li') ?? block;
    if (block.matches('blockquote')) return block.querySelector('p') ?? block;
    return block;
}

function blockControlTop(block: Element, editorArea: HTMLElement): number {
    const firstLine = firstLineElement(block);
    const firstLineStyle = window.getComputedStyle(firstLine);
    const lineHeight = Number.parseFloat(firstLineStyle.lineHeight);
    const paddingTop = Number.parseFloat(firstLineStyle.paddingTop) || 0;
    const lineOffset = Number.isFinite(lineHeight)
        ? (lineHeight - blockControlHeight) / 2
        : 0;

    return Math.max(
        0,
        firstLine.getBoundingClientRect().top -
            editorArea.getBoundingClientRect().top +
            paddingTop +
            lineOffset,
    );
}

export function findHoveredBlock(
    editor: Editor,
    editorArea: HTMLElement,
    target: EventTarget,
    pointerY?: number,
): { index: number; top: number } | null {
    const element = target instanceof Node ? target : null;
    if (!element) return null;
    const blocks = Array.from(editor.view.dom.children);
    let index = blocks.findIndex((block) => block.contains(element));
    if (index < 0 && pointerY !== undefined) {
        index = blocks.findIndex((block) => {
            const bounds = block.getBoundingClientRect();
            return pointerY >= bounds.top - 8 && pointerY <= bounds.bottom + 8;
        });
    }
    if (index < 0) return null;
    return {
        index,
        top: blockControlTop(blocks[index], editorArea),
    };
}

export function insertParagraphAfterBlock(editor: Editor, index: number): void {
    let insertionPosition = editor.state.doc.content.size;
    let direction = 'ltr';
    editor.state.doc.forEach((block, offset, blockIndex) => {
        if (blockIndex === index) {
            insertionPosition = offset + block.nodeSize;
            direction =
                block.attrs.dir === 'rtl'
                    ? 'rtl'
                    : block.attrs.dir === 'auto'
                      ? 'auto'
                      : 'ltr';
        }
    });
    editor
        .chain()
        .focus()
        .insertContentAt(insertionPosition, {
            type: 'paragraph',
            attrs: { dir: direction, directionMode: 'auto' },
        })
        .run();
}
