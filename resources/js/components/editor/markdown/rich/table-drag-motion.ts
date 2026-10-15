import { gsap } from 'gsap';
import type { TableAxis } from './table-structure';

type AxisGroup = { cells: HTMLTableCellElement[]; bounds: DOMRect };
type DragMotionOptions = {
    grid: HTMLTableElement;
    axis: TableAxis;
    index: number;
    onInterrupt: () => void;
};

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
        const minimum = Math.min(
            ...groups.map(({ bounds }) =>
                axis === 'row' ? bounds.top : bounds.left,
            ),
        );
        const maximum = Math.max(
            ...groups.map(({ bounds }) =>
                axis === 'row' ? bounds.bottom : bounds.right,
            ),
        );
        const start = axis === 'row' ? source.bounds.top : source.bounds.left;
        const end = axis === 'row' ? source.bounds.bottom : source.bounds.right;
        const offset = Math.max(
            minimum - start,
            Math.min(maximum - end, delta),
        );
        gsap.set(
            source.cells,
            axis === 'row' ? { y: offset / scaleY } : { x: offset / scaleX },
        );
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
        const tween = gsap.to(source.cells, {
            x: axis === 'column' ? destination / scaleX : 0,
            y: axis === 'row' ? destination / scaleY : 0,
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
