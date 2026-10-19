import { enclosingBounds } from './board-geometry';
import type { BoardObject } from './board-types';
import type { BoardGuide } from './board-alignment';

export function paintBoardObjects(
    viewport: HTMLElement | null,
    objects: BoardObject[],
) {
    const elements = new Map(
        [
            ...(viewport?.querySelectorAll<HTMLElement>(
                '[data-board-object-id]',
            ) ?? []),
        ].map((element) => [element.dataset.boardObjectId, element]),
    );
    for (const object of objects) {
        const target = elements.get(object.id);
        if (target)
            target.style.setProperty(
                '--board-content-scale',
                String(object.data.text_scale ?? 1),
            );
        if (target) {
            target.style.setProperty(
                '--board-frame-width',
                `${object.width - 2}px`,
            );
            target.style.setProperty(
                '--board-frame-height',
                `${object.height - 2}px`,
            );
        }
        const image = target?.querySelector<HTMLImageElement>(
            '.board-media-image img',
        );
        if (image) image.style.objectFit = object.data.image_fit ?? 'cover';
        if (target)
            Object.assign(target.style, {
                left: `${object.x}px`,
                top: `${object.y}px`,
                width: `${object.width}px`,
                height: `${object.height}px`,
            });
    }
    const selection = viewport?.querySelector<HTMLElement>(
        '[data-board-multi-selection]',
    );
    const selected = [
        ...(viewport?.querySelectorAll<HTMLElement>(
            '[data-board-object-id][data-selected="true"]',
        ) ?? []),
    ].map((element) => ({
        x: parseFloat(element.style.left),
        y: parseFloat(element.style.top),
        width: parseFloat(element.style.width),
        height: parseFloat(element.style.height),
    }));
    const bounds = enclosingBounds(objects.length > 1 ? objects : selected);
    if (selection && bounds)
        Object.assign(selection.style, {
            left: `${bounds.x}px`,
            top: `${bounds.y}px`,
            width: `${bounds.width}px`,
            height: `${bounds.height}px`,
        });
}

export function paintBoardGuides(
    host: HTMLElement | null,
    guides: BoardGuide[],
) {
    if (!host) return;
    host.replaceChildren(
        ...guides.map((guide) => {
            const line = document.createElement('div');
            line.className = 'board-alignment-guide';
            line.dataset.axis = guide.axis;
            Object.assign(
                line.style,
                guide.axis === 'x'
                    ? {
                          left: `${guide.position}px`,
                          top: `${guide.from}px`,
                          height: `${guide.to - guide.from}px`,
                      }
                    : {
                          top: `${guide.position}px`,
                          left: `${guide.from}px`,
                          width: `${guide.to - guide.from}px`,
                      },
            );
            return line;
        }),
    );
}
