import { enclosingBounds } from './board-geometry';
import type { BoardObject } from './board-types';
import type { BoardGuide } from './board-alignment';

export type BoardPaintTargets = Map<string, HTMLElement>;

export function collectBoardPaintTargets(viewport: HTMLElement | null) {
    return new Map(
        [
            ...(viewport?.querySelectorAll<HTMLElement>(
                '[data-board-object-id]',
            ) ?? []),
        ].map((element) => [element.dataset.boardObjectId!, element]),
    );
}

function writeStyle(element: HTMLElement, name: string, value: string) {
    //
    // Unchanged style assignments still wake mutation observers, including PDF density and toolbar observers.
    //
    if (element.style.getPropertyValue(name) !== value)
        element.style.setProperty(name, value);
}

export function paintBoardMovement(
    viewport: HTMLElement | null,
    objects: BoardObject[],
    targets = collectBoardPaintTargets(viewport),
) {
    for (const object of objects) {
        const target = targets.get(object.id);
        if (!target) continue;
        //
        // Translation preserves the laid-out rich surface during dragging; release writes canonical coordinates once.
        //
        writeStyle(
            target,
            'translate',
            `${object.x - parseFloat(target.style.left)}px ${object.y - parseFloat(target.style.top)}px`,
        );
    }
    paintSelectionBounds(viewport, objects, targets);
}

export function paintBoardObjects(
    viewport: HTMLElement | null,
    objects: BoardObject[],
    targets = collectBoardPaintTargets(viewport),
) {
    for (const object of objects) {
        const target = targets.get(object.id);
        if (!target) continue;
        if (target.style.translate) target.style.removeProperty('translate');
        if (target.dataset.boardMoving) delete target.dataset.boardMoving;
        writeStyle(
            target,
            '--board-content-scale',
            String(object.data.text_scale ?? 1),
        );
        writeStyle(target, '--board-frame-width', `${object.width - 2}px`);
        writeStyle(target, '--board-frame-height', `${object.height - 2}px`);
        writeStyle(target, 'left', `${object.x}px`);
        writeStyle(target, 'top', `${object.y}px`);
        writeStyle(target, 'width', `${object.width}px`);
        writeStyle(target, 'height', `${object.height}px`);
        const image = target.querySelector<HTMLImageElement>(
            '.board-media-image img',
        );
        if (image)
            writeStyle(image, 'object-fit', object.data.image_fit ?? 'cover');
    }
    paintSelectionBounds(viewport, objects, targets);
}

function paintSelectionBounds(
    viewport: HTMLElement | null,
    objects: BoardObject[],
    targets: BoardPaintTargets,
) {
    const selection = viewport?.querySelector<HTMLElement>(
        '[data-board-multi-selection]',
    );
    if (!selection) return;
    if (objects.length > 1) {
        const bounds = enclosingBounds(objects);
        if (bounds) {
            writeStyle(selection, 'left', `${bounds.x}px`);
            writeStyle(selection, 'top', `${bounds.y}px`);
            writeStyle(selection, 'width', `${bounds.width}px`);
            writeStyle(selection, 'height', `${bounds.height}px`);
        }
        return;
    }
    const selected = [...targets.values()]
        .filter((element) => element.dataset.selected === 'true')
        .map((element) => ({
            x: parseFloat(element.style.left),
            y: parseFloat(element.style.top),
            width: parseFloat(element.style.width),
            height: parseFloat(element.style.height),
        }));
    const bounds = enclosingBounds(objects.length > 1 ? objects : selected);
    if (!bounds) return;
    writeStyle(selection, 'left', `${bounds.x}px`);
    writeStyle(selection, 'top', `${bounds.y}px`);
    writeStyle(selection, 'width', `${bounds.width}px`);
    writeStyle(selection, 'height', `${bounds.height}px`);
}

const paintedGuides = new WeakMap<HTMLElement, string>();

export function paintBoardGuides(
    host: HTMLElement | null,
    guides: BoardGuide[],
) {
    if (!host) return;
    const signature = JSON.stringify(guides);
    if (paintedGuides.get(host) === signature) return;
    paintedGuides.set(host, signature);
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
