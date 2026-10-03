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

export function findFirstBlockIndex(
    blocks: HTMLCollection,
    matches: (block: Element) => boolean,
): number {
    let lower = 0;
    let upper = blocks.length;
    while (lower < upper) {
        const middle = Math.floor((lower + upper) / 2);
        if (matches(blocks[middle])) upper = middle;
        else lower = middle + 1;
    }
    return lower;
}

export function findHoveredBlock(
    editor: Editor,
    editorArea: HTMLElement,
    target: EventTarget,
    pointerY?: number,
): { index: number; top: number } | null {
    const element = target instanceof Node ? target : null;
    if (!element) return null;
    const editorElement = editor.view.dom;
    const blocks = editorElement.children;
    let block: Node | null = element;
    while (block && block.parentNode !== editorElement)
        block = block.parentNode;
    let index =
        block instanceof Element
            ? editor.state.doc.resolve(editor.view.posAtDOM(block, 0)).index(0)
            : -1;
    if (index < 0 && pointerY !== undefined) {
        index = findFirstBlockIndex(
            blocks,
            (candidate) =>
                candidate.getBoundingClientRect().bottom + 8 >= pointerY,
        );
        if (
            index >= blocks.length ||
            blocks[index].getBoundingClientRect().top - 8 > pointerY
        )
            return null;
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
