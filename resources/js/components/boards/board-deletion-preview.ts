// Summary: Builds bounded, inert deletion feedback without copying live editors; depends on canonical ink geometry when the active graphics plane is external to its native card.

import { boardDrawingStrokePath } from './board-drawing-data';
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
    if (
        object.data.drawing &&
        !preview.querySelector('.board-drawing-stroke')
    ) {
        const drawing = object.data.drawing;
        const svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
        );
        svg.setAttribute('class', 'board-drawing-stroke');
        svg.setAttribute(
            'viewBox',
            `0 0 ${drawing.view_width} ${drawing.view_height}`,
        );
        svg.setAttribute('preserveAspectRatio', 'none');
        const path = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
        );
        for (const [name, value] of Object.entries({
            d: boardDrawingStrokePath(drawing),
            fill: 'none',
            stroke: drawing.color,
            'stroke-width': String(drawing.stroke_width),
            'stroke-opacity': String(drawing.opacity),
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
        }))
            path.setAttribute(name, value);
        svg.append(path);
        (preview.querySelector('.board-object-body') ?? preview).append(svg);
    }
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
