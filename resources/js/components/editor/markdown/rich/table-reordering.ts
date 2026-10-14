import type { TableAxis } from './table-structure';
import { startTableDragMotion } from './table-drag-motion';

type ReorderingOptions = {
    grid: HTMLTableElement;
    canMove: () => boolean;
    beforeMove: () => void;
    onMove: (axis: TableAxis, from: number, to: number) => void;
};

export function mountTableReordering(options: ReorderingOptions) {
    const { grid } = options;
    const ownerDocument = grid.ownerDocument;
    let cancelDrag: (() => void) | undefined;
    let cancelMotion: (() => void) | undefined;

    function bindHandle(
        handle: HTMLButtonElement,
        axis: TableAxis,
        index: number,
    ) {
        let suppressClick = false;
        handle.addEventListener('click', (event) => {
            if (suppressClick) {
                event.preventDefault();
                event.stopImmediatePropagation();
                suppressClick = false;
            }
        });
        handle.addEventListener('dragstart', (event) => event.preventDefault());
        handle.addEventListener('pointerdown', (start) => {
            start.stopPropagation();
            suppressClick = false;
            if (start.button !== 0 || !options.canMove()) return;
            cancelDrag?.();
            cancelMotion?.();
            let dragging = false;
            let target = index;
            let motion: ReturnType<typeof startTableDragMotion> | undefined;
            function releasePointer() {
                grid.classList.remove('orbium-table-reordering');
                ownerDocument.removeEventListener('pointermove', move);
                ownerDocument.removeEventListener('pointerup', drop);
                ownerDocument.removeEventListener('pointercancel', cancel);
                ownerDocument.removeEventListener('keydown', escape);
                ownerDocument.defaultView?.removeEventListener('blur', cancel);
                cancelDrag = undefined;
                if (handle.hasPointerCapture(start.pointerId))
                    handle.releasePointerCapture(start.pointerId);
            }
            function cancel() {
                suppressClick = dragging;
                releasePointer();
                motion?.destroy();
                cancelMotion = undefined;
            }
            function escape(event: KeyboardEvent) {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                event.stopPropagation();
                cancel();
            }
            function move(event: PointerEvent) {
                if (event.pointerId !== start.pointerId) return;
                if (!dragging) {
                    if (
                        Math.hypot(
                            event.clientX - start.clientX,
                            event.clientY - start.clientY,
                        ) < 6
                    )
                        return;
                    options.beforeMove();
                    motion = startTableDragMotion({
                        grid,
                        axis,
                        index,
                        onInterrupt: cancel,
                    });
                    dragging = true;
                    suppressClick = true;
                    handle.setPointerCapture(start.pointerId);
                    grid.classList.add('orbium-table-reordering');
                }
                event.preventDefault();
                target = motion!.findTarget(event.clientX, event.clientY);
                motion!.preview(target);
                motion!.follow(
                    axis === 'row'
                        ? event.clientY - start.clientY
                        : event.clientX - start.clientX,
                );
            }
            function drop(event: PointerEvent) {
                if (event.pointerId !== start.pointerId) return;
                releasePointer();
                if (!motion) return;
                cancelMotion = cancel;
                motion.settle(() => {
                    cancelMotion = undefined;
                    if (
                        target !== index &&
                        grid.isConnected &&
                        options.canMove()
                    )
                        options.onMove(axis, index, target);
                });
            }
            cancelDrag = cancel;
            ownerDocument.addEventListener('pointermove', move, {
                passive: false,
            });
            ownerDocument.addEventListener('pointerup', drop);
            ownerDocument.addEventListener('pointercancel', cancel);
            ownerDocument.addEventListener('keydown', escape);
            ownerDocument.defaultView?.addEventListener('blur', cancel);
        });
    }

    function cancel() {
        cancelDrag?.();
        cancelMotion?.();
    }
    function animateMove(axis: TableAxis, from: number, to: number) {
        cancel();
        if (from === to || !options.canMove()) return;
        options.beforeMove();
        const motion = startTableDragMotion({
            grid,
            axis,
            index: from,
            onInterrupt: cancel,
        });
        cancelMotion = () => {
            motion.destroy();
            cancelMotion = undefined;
        };
        motion.preview(to);
        motion.settle(() => {
            cancelMotion = undefined;
            if (grid.isConnected && options.canMove())
                options.onMove(axis, from, to);
        });
    }
    return {
        bindHandle,
        animateMove,
        cancel,
        destroy: cancel,
    };
}
