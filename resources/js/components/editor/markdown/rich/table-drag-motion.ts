import { gsap } from 'gsap';
import type { TableAxis } from './table-structure';

type AxisGroup = { cells: HTMLTableCellElement[]; bounds: DOMRect };
type DragMotionOptions = {
    grid: HTMLTableElement;
    axis: TableAxis;
    index: number;
    onInterrupt: () => void;
};

let snapshotSequence = 0;

function cloneDragTable(grid: HTMLTableElement) {
    const clone = grid.cloneNode(true) as HTMLTableElement;
    clone.querySelectorAll('button').forEach((control) => control.remove());
    const prefix = `table-drag-${++snapshotSequence}-`;
    const identifiers = new Map<string, string>();
    for (const child of clone.querySelectorAll<HTMLElement>('[id]')) {
        identifiers.set(child.id, `${prefix}${child.id}`);
        child.id = `${prefix}${child.id}`;
    }
    for (const child of clone.querySelectorAll('*')) {
        child.removeAttribute('data-rich-from');
        for (const attribute of Array.from(child.attributes)) {
            const value = attribute.value.replace(
                /url\(#([^)]*)\)/g,
                (reference, id: string) =>
                    identifiers.has(id)
                        ? `url(#${identifiers.get(id)})`
                        : reference,
            );
            const linkedId = identifiers.get(value.slice(1));
            child.setAttribute(
                attribute.name,
                (attribute.name === 'href' ||
                    attribute.name === 'xlink:href') &&
                    linkedId
                    ? `#${linkedId}`
                    : value,
            );
        }
    }
    Array.from(grid.rows).forEach((row, y) => {
        Array.from(row.cells).forEach((cell, x) => {
            Object.assign(clone.rows[y].cells[x].style, {
                width: `${cell.offsetWidth}px`,
                minWidth: `${cell.offsetWidth}px`,
                height: `${cell.offsetHeight}px`,
                boxSizing: 'border-box',
            });
        });
    });
    return clone;
}

function dragViewport(grid: HTMLTableElement) {
    const ownerWindow = grid.ownerDocument.defaultView!;
    let left = 0;
    let top = 0;
    let right = ownerWindow.innerWidth;
    let bottom = ownerWindow.innerHeight;
    for (
        let parent = grid.parentElement;
        parent;
        parent = parent.parentElement
    ) {
        const style = ownerWindow.getComputedStyle(parent);
        const bounds = parent.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
            left = Math.max(left, bounds.left);
            right = Math.min(right, bounds.right);
        }
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
            top = Math.max(top, bounds.top);
            bottom = Math.min(bottom, bounds.bottom);
        }
    }
    return {
        left,
        top,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
    };
}

export function startTableDragMotion({
    grid,
    axis,
    index,
    onInterrupt,
}: DragMotionOptions) {
    const ownerDocument = grid.ownerDocument;
    const ownerWindow = ownerDocument.defaultView!;
    const reducedMotion = ownerWindow.matchMedia(
        '(prefers-reduced-motion: reduce)',
    );
    const style = ownerWindow.getComputedStyle(grid);
    const rtl = axis === 'column' && style.direction === 'rtl';
    const gridBounds = grid.getBoundingClientRect();
    const scaleX = gridBounds.width / grid.offsetWidth || 1;
    const scaleY = gridBounds.height / grid.offsetHeight || 1;
    const groups: AxisGroup[] =
        axis === 'row'
            ? Array.from(grid.rows).map((row) => ({
                  cells: Array.from(row.cells),
                  bounds: row.getBoundingClientRect(),
              }))
            : Array.from(grid.rows[0].cells).map((cell, column) => ({
                  cells: Array.from(grid.rows).map((row) => row.cells[column]),
                  bounds: cell.getBoundingClientRect(),
              }));
    const source = groups[index];
    const left = axis === 'column' ? source.bounds.left : gridBounds.left;
    const top = axis === 'row' ? source.bounds.top : gridBounds.top;
    const width = axis === 'column' ? source.bounds.width : gridBounds.width;
    const height = axis === 'row' ? source.bounds.height : gridBounds.height;
    const viewport = dragViewport(grid);
    const scrollPositions: {
        element: HTMLElement;
        left: number;
        top: number;
    }[] = [];
    for (
        let parent = grid.parentElement;
        parent;
        parent = parent.parentElement
    ) {
        scrollPositions.push({
            element: parent,
            left: parent.scrollLeft,
            top: parent.scrollTop,
        });
    }
    const windowScroll = {
        left: ownerWindow.scrollX,
        top: ownerWindow.scrollY,
    };
    const layer = ownerDocument.createElement('div');
    layer.className =
        'orbium-editor orbium-markdown-content orbium-table-drag-layer';
    layer.inert = true;
    layer.setAttribute('aria-hidden', 'true');
    if (grid.closest('[data-document-styles]'))
        layer.setAttribute('data-document-styles', '');
    Object.assign(layer.style, {
        left: `${viewport.left}px`,
        top: `${viewport.top}px`,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
        font: style.font,
        color: style.color,
        direction: style.direction,
    });
    for (const property of style) {
        if (property.startsWith('--'))
            layer.style.setProperty(property, style.getPropertyValue(property));
    }
    const ghost = ownerDocument.createElement('div');
    ghost.className = 'orbium-table-drag-ghost';
    Object.assign(ghost.style, {
        left: `${left - viewport.left}px`,
        top: `${top - viewport.top}px`,
        width: `${width}px`,
        height: `${height}px`,
    });
    const clone = cloneDragTable(grid);
    Object.assign(clone.style, {
        position: 'absolute',
        left: `${gridBounds.left - left}px`,
        top: `${gridBounds.top - top}px`,
        width: `${grid.offsetWidth}px`,
        margin: '0',
        tableLayout: 'fixed',
        font: style.font,
        letterSpacing: style.letterSpacing,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: 'top left',
    });
    ghost.append(clone);
    layer.append(ghost);
    ownerDocument.body.append(layer);
    const originalStyles = groups.flatMap((group) =>
        group.cells.map((cell) => ({
            cell,
            style: cell.getAttribute('style'),
        })),
    );
    source.cells.forEach((cell) =>
        cell.classList.add('orbium-table-drag-source'),
    );
    const tweens = new Set<gsap.core.Tween>();
    let active = true;
    let target = index;
    let destination = 0;

    function animate(elements: gsap.TweenTarget, properties: gsap.TweenVars) {
        if (reducedMotion.matches) {
            gsap.set(elements, properties);
            return;
        }
        const tween = gsap.to(elements, {
            ...properties,
            duration: 0.16,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => tweens.delete(tween),
        });
        tweens.add(tween);
    }
    if (!reducedMotion.matches) animate(ghost, { scale: 1.012, opacity: 0.98 });

    function preview(nextTarget: number) {
        if (nextTarget === target) return;
        target = nextTarget;
        const order = groups.map((_, position) => position);
        order.splice(target, 0, order.splice(index, 1)[0]);
        let cursor =
            axis === 'row'
                ? groups[0].bounds.top
                : rtl
                  ? groups[0].bounds.right
                  : groups[0].bounds.left;
        for (const position of order) {
            const group = groups[position];
            const size =
                axis === 'row' ? group.bounds.height : group.bounds.width;
            const start = rtl ? cursor - size : cursor;
            const offset =
                start - (axis === 'row' ? group.bounds.top : group.bounds.left);
            if (position === index) destination = offset;
            else
                animate(
                    group.cells,
                    axis === 'row'
                        ? { y: offset / scaleY }
                        : { x: offset / scaleX },
                );
            cursor += rtl ? -size : size;
        }
    }
    function follow(delta: number) {
        if (!active) return;
        gsap.set(ghost, axis === 'row' ? { y: delta } : { x: delta });
    }
    function findTarget(clientX: number, clientY: number) {
        let nearest = index;
        let distance = Infinity;
        groups.forEach(({ bounds }, position) => {
            const center =
                axis === 'row'
                    ? (bounds.top + bounds.bottom) / 2
                    : (bounds.left + bounds.right) / 2;
            const nextDistance = Math.abs(
                (axis === 'row' ? clientY : clientX) - center,
            );
            if (nextDistance < distance) {
                distance = nextDistance;
                nearest = position;
            }
        });
        return nearest;
    }
    function destroy() {
        if (!active) return;
        active = false;
        tweens.forEach((tween) => tween.kill());
        gsap.set(
            originalStyles.map(({ cell }) => cell),
            { clearProps: 'transform' },
        );
        originalStyles.forEach(({ cell, style: original }) => {
            cell.classList.remove('orbium-table-drag-source');
            if (original === null) cell.removeAttribute('style');
            else cell.setAttribute('style', original);
        });
        layer.remove();
        ownerWindow.removeEventListener('resize', onInterrupt);
        ownerWindow.removeEventListener('blur', onInterrupt);
        ownerDocument.removeEventListener('scroll', interruptAfterScroll, true);
        ownerDocument.removeEventListener('pointerdown', onInterrupt, true);
        ownerDocument.removeEventListener('keydown', cancelWithEscape, true);
        reducedMotion.removeEventListener('change', onInterrupt);
    }
    function cancelWithEscape(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.preventDefault();
            onInterrupt();
        }
    }
    function interruptAfterScroll() {
        if (
            ownerWindow.scrollX !== windowScroll.left ||
            ownerWindow.scrollY !== windowScroll.top ||
            scrollPositions.some(
                ({ element, left, top }) =>
                    element.scrollLeft !== left || element.scrollTop !== top,
            )
        )
            onInterrupt();
    }
    function settle(onComplete: () => void) {
        if (reducedMotion.matches) {
            destroy();
            onComplete();
            return;
        }
        const tween = gsap.to(ghost, {
            x: axis === 'column' ? destination : 0,
            y: axis === 'row' ? destination : 0,
            scale: 1,
            opacity: 1,
            duration: 0.18,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => {
                destroy();
                onComplete();
            },
        });
        tweens.add(tween);
    }
    ownerWindow.addEventListener('resize', onInterrupt);
    ownerWindow.addEventListener('blur', onInterrupt);
    ownerDocument.addEventListener('scroll', interruptAfterScroll, true);
    ownerDocument.addEventListener('pointerdown', onInterrupt, true);
    ownerDocument.addEventListener('keydown', cancelWithEscape, true);
    reducedMotion.addEventListener('change', onInterrupt);
    return { findTarget, follow, preview, settle, destroy };
}
