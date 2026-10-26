import type { BoardObject } from './board-types';

function canClonePreview(source: HTMLElement, object: BoardObject) {
    if (
        ![
            'text',
            'heading',
            'quote',
            'callout',
            'list',
            'table',
            'drawing',
            'divider',
        ].includes(object.block_type) ||
        source.dataset.editing === 'true'
    )
        return false;
    //
    // A short exit must not duplicate a rich editor, media task or unbounded rendered subtree.
    //
    const walker = document.createTreeWalker(source, NodeFilter.SHOW_ELEMENT);
    let count = 0;
    while (walker.nextNode()) {
        const element = walker.currentNode as Element;
        if (
            ++count > 400 ||
            element.matches(
                'canvas, video, audio, img, iframe, object, embed, script, style, link, svg use, svg foreignObject, .cm-editor, [contenteditable="true"], svg defs',
            )
        )
            return false;
    }
    return true;
}

export function createBoardDeletionPreview(
    source: HTMLElement,
    object: BoardObject,
) {
    const preview = canClonePreview(source, object)
        ? (source.cloneNode(true) as HTMLElement)
        : document.createElement('div');
    if (!preview.hasChildNodes()) {
        const summary = document.createElement('div');
        summary.className = 'board-deletion-summary';
        summary.textContent = source.getAttribute('aria-label') ?? 'Block';
        preview.append(summary);
    }
    for (const element of [preview, ...preview.querySelectorAll('*')]) {
        for (const name of element.getAttributeNames()) {
            if (
                name === 'id' ||
                name === 'tabindex' ||
                name === 'contenteditable' ||
                name.startsWith('data-board-') ||
                name.startsWith('aria-') ||
                name === 'autofocus' ||
                name.startsWith('on')
            )
                element.removeAttribute(name);
        }
    }
    preview
        .querySelectorAll(
            'button, input, textarea, select, a, .board-resize, [role="toolbar"]',
        )
        .forEach((element) => element.remove());
    preview.className = 'board-object board-object-exit';
    delete preview.dataset.selected;
    delete preview.dataset.editing;
    preview.style.cssText = source.style.cssText;
    preview.dataset.boardKind = object.block_type;
    preview.dataset.surface = source.dataset.surface;
    preview.setAttribute('aria-hidden', 'true');
    preview.inert = true;
    return preview;
}
