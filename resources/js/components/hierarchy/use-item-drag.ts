import {
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type MouseEvent,
} from 'react';
import { createExplorerDragPreview } from './explorer-drag-preview';
import {
    findExplorerDropDestination,
    type DropHint,
} from './explorer-drop-target';
import type { TreeNode } from '@/components/navigation/navigation-types';

export type MoveItem = (
    nodeId: number,
    parentId: number | null,
    position: number,
) => void;

export function useItemDrag(
    nodes: TreeNode[],
    onMove: MoveItem,
    disabled: boolean,
    selectedIds: number[] = [],
) {
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropHint, setDropHint] = useState<DropHint | null>(null);
    const cancelSession = useRef<(() => void) | null>(null);
    const suppressClickUntil = useRef(0);
    useEffect(() => () => cancelSession.current?.(), []);

    function beginPointerSession(
        event: ReactPointerEvent<HTMLElement>,
        sourceNode: TreeNode,
    ) {
        if (
            disabled ||
            cancelSession.current ||
            event.button !== 0 ||
            (event.target as HTMLElement).closest('button, input, a')
        )
            return;
        const source = event.currentTarget;
        const container = source.closest('.floating-contents');
        if (!container) return;
        const sources = selectedIds.includes(sourceNode.id)
            ? nodes.filter((node) => selectedIds.includes(node.id))
            : [sourceNode];
        const pointerId = event.pointerId;
        const start = { x: event.clientX, y: event.clientY };
        let preview: ReturnType<typeof createExplorerDragPreview> | null = null;
        let parentZone: HTMLElement | null = null;
        let ending = false;
        function updateDestination(x: number, y: number) {
            const destination = findExplorerDropDestination(
                container!,
                nodes,
                sources,
                x,
                y,
            );
            if (parentZone) parentZone.dataset.active = 'false';
            parentZone = destination?.parentZone ?? null;
            if (parentZone) parentZone.dataset.active = 'true';
            const nextHint = destination?.hint ?? null;
            setDropHint((previous) =>
                previous?.targetId === nextHint?.targetId &&
                previous?.placement === nextHint?.placement
                    ? previous
                    : nextHint,
            );
            return destination;
        }
        function removeListeners() {
            document.removeEventListener('pointermove', movePointer);
            document.removeEventListener('pointerup', releasePointer);
            document.removeEventListener('pointercancel', cancelPointer);
            document.removeEventListener('keydown', cancelWithEscape, true);
            window.removeEventListener('blur', cancelPointer);
        }
        function complete() {
            setTimeout(
                () =>
                    document.removeEventListener(
                        'click',
                        suppressReleaseClick,
                        true,
                    ),
                0,
            );
            cancelSession.current = null;
            setDraggedId(null);
            setDropHint(null);
        }
        function finish(x: number, y: number, canceled: boolean) {
            if (ending) return;
            ending = true;
            removeListeners();
            const destination =
                !canceled && preview ? updateDestination(x, y) : null;
            if (parentZone) parentZone.dataset.active = 'false';
            setDropHint(null);
            if (!preview) {
                complete();
                return;
            }
            suppressClickUntil.current = performance.now() + 500;
            preview.returnToPlaces(() => {
                complete();
                if (destination)
                    onMove(
                        sourceNode.id,
                        destination.parentId,
                        destination.position,
                    );
            });
        }
        function movePointer(pointer: PointerEvent) {
            if (pointer.pointerId !== pointerId || ending) return;
            if (!preview) {
                if (
                    Math.hypot(
                        pointer.clientX - start.x,
                        pointer.clientY - start.y,
                    ) < 6
                )
                    return;
                preview = createExplorerDragPreview(source, sources, {
                    x: pointer.clientX,
                    y: pointer.clientY,
                });
                setDraggedId(sourceNode.id);
            } else preview.follow({ x: pointer.clientX, y: pointer.clientY });
            pointer.preventDefault();
            updateDestination(pointer.clientX, pointer.clientY);
        }
        function releasePointer(pointer: PointerEvent) {
            if (pointer.pointerId === pointerId)
                finish(pointer.clientX, pointer.clientY, false);
        }
        function suppressReleaseClick(click: globalThis.MouseEvent) {
            if (!preview) return;
            click.preventDefault();
            click.stopPropagation();
        }
        function cancelPointer() {
            finish(start.x, start.y, true);
        }
        function cancelWithEscape(key: KeyboardEvent) {
            if (key.key !== 'Escape' || !preview) return;
            key.preventDefault();
            key.stopPropagation();
            cancelPointer();
        }
        cancelSession.current = () => {
            ending = true;
            removeListeners();
            document.removeEventListener('click', suppressReleaseClick, true);
            preview?.remove();
            if (parentZone) parentZone.dataset.active = 'false';
        };
        document.addEventListener('pointermove', movePointer, {
            passive: false,
        });
        document.addEventListener('click', suppressReleaseClick, true);
        document.addEventListener('pointerup', releasePointer);
        document.addEventListener('pointercancel', cancelPointer);
        document.addEventListener('keydown', cancelWithEscape, true);
        window.addEventListener('blur', cancelPointer);
    }
    function dragHandlers(node: TreeNode) {
        return {
            draggable: false,
            onPointerDown: (event: ReactPointerEvent<HTMLElement>) =>
                beginPointerSession(event, node),
            onClickCapture(event: MouseEvent<HTMLElement>) {
                if (performance.now() < suppressClickUntil.current) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            },
        };
    }
    return { draggedId, dropHint, dragHandlers };
}
