import {
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type MouseEvent as ReactMouseEvent,
    type RefObject,
} from 'react';
import { mindMapDescendants, type MindMapData } from './mindmap-data';
import type { BranchDrop } from './mindmap-branch-actions';

type Options = {
    data: MindMapData;
    viewport: RefObject<HTMLDivElement | null>;
    onStart: (id: string) => void;
    onDrop: (drop: BranchDrop, original: MindMapData) => void;
    composing: RefObject<boolean>;
};
type DragGesture = {
    sourceId: string;
    pointerId: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    element: HTMLElement;
    original: MindMapData;
    excluded: Set<string>;
    active: boolean;
    target: BranchDrop | null;
};
export function useMindMapBranchDrag(options: Options) {
    const callbacks = useRef(options);
    callbacks.current = options;
    const gesture = useRef<DragGesture | null>(null);
    const frame = useRef(0);
    const suppressClick = useRef(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<BranchDrop | null>(null);
    function finish() {
        const current = gesture.current;
        gesture.current = null;
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        if (current) {
            delete current.element.dataset.mindmapDragging;
            if (current.element.hasPointerCapture(current.pointerId))
                current.element.releasePointerCapture(current.pointerId);
        }
        if (current?.active)
            setTimeout(() => {
                suppressClick.current = false;
            }, 0);
        setDraggedId(null);
        setDropTarget(null);
        return current;
    }
    useEffect(() => {
        const document = callbacks.current.viewport.current?.ownerDocument;
        const cancel = (event: KeyboardEvent) => {
            if (!gesture.current || event.isComposing) return;
            if (
                event.key !== 'Escape' &&
                !(
                    (event.ctrlKey || event.metaKey) &&
                    ['z', 'y'].includes(event.key.toLowerCase())
                )
            )
                return;
            event.preventDefault();
            event.stopPropagation();
            finish();
        };
        const blur = () => {
            if (gesture.current) finish();
        };
        document?.addEventListener('keydown', cancel, true);
        document?.defaultView?.addEventListener('blur', blur);
        return () => {
            document?.removeEventListener('keydown', cancel, true);
            document?.defaultView?.removeEventListener('blur', blur);
            finish();
        };
    }, []);
    function resolveTarget(current: DragGesture): BranchDrop | null {
        const host = callbacks.current.viewport.current;
        const hit = host?.ownerDocument
            .elementFromPoint(current.x, current.y)
            ?.closest<HTMLElement>('[data-topic-container-id]');
        if (!hit || !host?.contains(hit)) return null;
        const targetId = hit.dataset.topicContainerId!;
        if (current.excluded.has(targetId)) return null;
        const target = callbacks.current.data.topics.find(
            (topic) => topic.id === targetId,
        );
        if (!target) return null;
        const axis = ['up', 'down'].includes(hit.dataset.topicDirection ?? '')
            ? 'x'
            : 'y';
        const bounds = hit.getBoundingClientRect();
        const ratio =
            axis === 'x'
                ? (current.x - bounds.left) / bounds.width
                : (current.y - bounds.top) / bounds.height;
        const position =
            target.parent_id === null
                ? 'inside'
                : ratio < 0.25
                  ? 'before'
                  : ratio > 0.75
                    ? 'after'
                    : 'inside';
        return { sourceId: current.sourceId, targetId, position, axis };
    }
    function updateDrag() {
        frame.current = 0;
        const current = gesture.current;
        const host = callbacks.current.viewport.current;
        if (!current?.active || !host) return;
        const bounds = host.getBoundingClientRect();
        const scrollX =
            current.x < bounds.left + 28
                ? -12
                : current.x > bounds.right - 28
                  ? 12
                  : 0;
        const scrollY =
            current.y < bounds.top + 28
                ? -12
                : current.y > bounds.bottom - 28
                  ? 12
                  : 0;
        const previousX = host.scrollLeft,
            previousY = host.scrollTop;
        host.scrollLeft += scrollX;
        host.scrollTop += scrollY;
        current.target = resolveTarget(current);
        setDropTarget((previous) =>
            JSON.stringify(previous) === JSON.stringify(current.target)
                ? previous
                : current.target,
        );
        //
        // Continue only while edge scrolling actually moves; an idle pointer never keeps an animation loop alive.
        //
        if (host.scrollLeft !== previousX || host.scrollTop !== previousY)
            frame.current = requestAnimationFrame(updateDrag);
    }
    function start(event: ReactPointerEvent<HTMLElement>, id: string) {
        if (
            event.button !== 0 ||
            gesture.current ||
            callbacks.current.composing.current ||
            id === callbacks.current.data.root_id
        )
            return;
        if (
            (event.target as Element).closest(
                'button, a, input, textarea, [contenteditable]',
            ) &&
            !(event.target as Element).closest('[data-mindmap-drag-handle]')
        )
            return;
        event.stopPropagation();
        const element = event.currentTarget;
        element.setPointerCapture(event.pointerId);
        gesture.current = {
            sourceId: id,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            x: event.clientX,
            y: event.clientY,
            element,
            original: callbacks.current.data,
            excluded: mindMapDescendants(callbacks.current.data, id),
            active: false,
            target: null,
        };
    }
    function move(event: ReactPointerEvent<HTMLElement>) {
        const current = gesture.current;
        if (!current || current.pointerId !== event.pointerId) return;
        current.x = event.clientX;
        current.y = event.clientY;
        if (
            !current.active &&
            Math.hypot(current.x - current.startX, current.y - current.startY) <
                6
        )
            return;
        event.preventDefault();
        event.stopPropagation();
        if (!current.active) {
            current.active = true;
            current.element.dataset.mindmapDragging = 'true';
            suppressClick.current = true;
            setDraggedId(current.sourceId);
            callbacks.current.onStart(current.sourceId);
        }
        if (!frame.current) frame.current = requestAnimationFrame(updateDrag);
    }
    function end(event: ReactPointerEvent<HTMLElement>) {
        const current = gesture.current;
        if (!current || current.pointerId !== event.pointerId) return;
        if (current.active) {
            event.preventDefault();
            event.stopPropagation();
            current.x = event.clientX;
            current.y = event.clientY;
            current.target = resolveTarget(current);
        }
        const completed = finish();
        if (completed?.active && completed.target)
            callbacks.current.onDrop(completed.target, completed.original);
    }
    function cancel() {
        if (gesture.current) finish();
    }
    function blockClick(event: ReactMouseEvent) {
        if (!suppressClick.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
    }
    return { draggedId, dropTarget, start, move, end, cancel, blockClick };
}
