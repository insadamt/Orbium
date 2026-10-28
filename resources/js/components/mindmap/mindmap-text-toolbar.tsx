import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/core';
import { BoardNativeFormatting } from '@/components/boards/board-native-formatting';
import { ToolbarHighlight } from '@/components/editor/ui/toolbar-motion';
import '../boards/board-interaction-polish.css';

export function MindMapTextToolbar({
    editor,
    onFinish,
}: {
    editor: Editor;
    onFinish: () => void;
}) {
    const [surface, setSurface] = useState<HTMLElement | null>(null);
    const [position, setPosition] = useState<{
        left: number;
        top: number;
    } | null>(null);
    const [linkOpen, setLinkOpen] = useState(false);
    const selecting = useRef(false);
    const toolbar = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const dialog = editor.view.dom.closest<HTMLElement>(
            '[data-mindmap-dialog]',
        );
        if (!dialog) return;
        setSurface(dialog);
        let frame = 0;
        function updatePosition() {
            cancelAnimationFrame(frame);
            if (editor.isDestroyed) return;
            const { from, to, empty } = editor.state.selection;
            if (
                (empty && !linkOpen) ||
                selecting.current ||
                editor.view.composing
            ) {
                setPosition(null);
                return;
            }
            const start = editor.view.coordsAtPos(from);
            const end = editor.view.coordsAtPos(to);
            const bounds = dialog!.getBoundingClientRect();
            const toolbarWidth = toolbar.current?.offsetWidth || 400;
            const toolbarHeight = toolbar.current?.offsetHeight || 40;
            setPosition({
                left: Math.max(
                    8,
                    Math.min(
                        bounds.width - toolbarWidth,
                        (start.left + end.right) / 2 -
                            bounds.left -
                            toolbarWidth / 2,
                    ),
                ),
                top: Math.max(
                    8,
                    Math.min(start.top, end.top) -
                        bounds.top -
                        toolbarHeight -
                        12,
                ),
            });
        }
        function schedulePosition() {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(updatePosition);
        }
        const pointerDown = (event: PointerEvent) => {
            if (
                event.button === 0 &&
                editor.view.dom.contains(event.target as Node)
            ) {
                selecting.current = true;
                setPosition(null);
            }
        };
        const pointerUp = () => {
            selecting.current = false;
            updatePosition();
        };
        editor.on('selectionUpdate', updatePosition);
        editor.on('transaction', schedulePosition);
        //
        // The fullscreen dialog stops bubbling pointer events; observe the gesture before its boundary so the toolbar waits for release.
        //
        dialog.ownerDocument.addEventListener('pointerdown', pointerDown, true);
        dialog.ownerDocument.addEventListener('pointerup', pointerUp, true);
        dialog.ownerDocument.addEventListener('pointercancel', pointerUp, true);
        dialog.ownerDocument.defaultView?.addEventListener('blur', pointerUp);
        dialog.addEventListener('scroll', schedulePosition, true);
        const sizeObserver = new ResizeObserver(schedulePosition);
        if (toolbar.current) sizeObserver.observe(toolbar.current);
        updatePosition();
        return () => {
            sizeObserver.disconnect();
            cancelAnimationFrame(frame);
            editor.off('selectionUpdate', updatePosition);
            editor.off('transaction', schedulePosition);
            dialog.ownerDocument.removeEventListener(
                'pointerdown',
                pointerDown,
                true,
            );
            dialog.ownerDocument.removeEventListener(
                'pointerup',
                pointerUp,
                true,
            );
            dialog.ownerDocument.removeEventListener(
                'pointercancel',
                pointerUp,
                true,
            );
            dialog.ownerDocument.defaultView?.removeEventListener(
                'blur',
                pointerUp,
            );
            dialog.removeEventListener('scroll', schedulePosition, true);
        };
    }, [editor, linkOpen, surface]);
    if (!surface) return null;
    return createPortal(
        <div
            ref={toolbar}
            className="mindmap-text-toolbar orbium-editor-toolbar editor-animated-toolbar glass-surface"
            role="toolbar"
            aria-label="Text formatting"
            hidden={!position}
            style={{ left: position?.left ?? 0, top: position?.top ?? 0 }}
        >
            <ToolbarHighlight />
            <BoardNativeFormatting
                fullscreen
                editor={editor}
                disabled={false}
                onLinkOpenChange={setLinkOpen}
                onFinish={onFinish}
            />
        </div>,
        surface,
    );
}
