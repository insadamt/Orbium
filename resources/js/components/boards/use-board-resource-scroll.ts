import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { BoardPoint } from './board-types';
import {
    captureBoardDocumentAnchor,
    focusBoardDocumentAtPoint,
    restoreBoardDocumentAnchor,
    type BoardDocumentAnchor,
} from './board-document-anchor';

export function useBoardResourceScroll({
    surfaceKey,
    editing,
    editPoint,
}: {
    surfaceKey: string;
    editing: boolean;
    editPoint?: RefObject<BoardPoint | null>;
}) {
    const viewport = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const position = useRef({ top: 0, left: 0, height: 0 });
    const restoring = useRef(false);
    const anchor = useRef<BoardDocumentAnchor | null>(null);
    const previousEditing = useRef(false);

    useLayoutEffect(() => {
        const body = viewport.current;
        const surface = content.current;
        if (!body || !surface) return;
        const enteringEditor = editing && !previousEditing.current;
        previousEditing.current = editing;
        const saved = { ...position.current };
        restoring.current = true;
        //
        // Loading placeholders must retain the previous scroll range until the replacement renderer has mounted.
        //
        surface.style.minHeight = `${Math.max(saved.height, saved.top + body.clientHeight)}px`;
        body.scrollTo({
            top: saved.top,
            left: saved.left,
            behavior: 'instant',
        });
        let frame: number | undefined;
        let finished = false;
        const observer = new MutationObserver(restoreWhenReady);
        observer.observe(surface, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-preview-ready'],
        });

        function replacementIsReady() {
            return surface?.querySelector(
                '.cm-content, .ProseMirror, [data-preview-ready="true"], [role="alert"]',
            );
        }
        function restoreWhenReady() {
            if (finished || frame !== undefined || !replacementIsReady())
                return;
            //
            // Lazy editors finish measuring after attachment; restore after that layout rather than focusing the first line.
            //
            frame = requestAnimationFrame(() => {
                frame = requestAnimationFrame(() => {
                    frame = undefined;
                    if (!body || !surface || !replacementIsReady()) return;
                    finished = true;
                    observer.disconnect();
                    surface.style.minHeight = '';
                    body.scrollTo({
                        top: saved.top,
                        left: saved.left,
                        behavior: 'instant',
                    });
                    restoreBoardDocumentAnchor(body, anchor.current);
                    //
                    // CodeMirror may replace estimated offscreen heights after the first anchor scroll.
                    //
                    frame = requestAnimationFrame(() => {
                        restoreBoardDocumentAnchor(body, anchor.current);
                        if (enteringEditor) {
                            focusBoardDocumentAtPoint(
                                body,
                                editPoint?.current ?? null,
                                anchor.current,
                            );
                            if (editPoint) editPoint.current = null;
                            restoreBoardDocumentAnchor(body, anchor.current);
                        }
                        restoring.current = false;
                        rememberScroll();
                    });
                    position.current = {
                        top: body.scrollTop,
                        left: body.scrollLeft,
                        height: body.scrollHeight,
                    };
                });
            });
        }
        restoreWhenReady();
        return () => {
            observer.disconnect();
            if (frame !== undefined) cancelAnimationFrame(frame);
            surface.style.minHeight = '';
            restoring.current = false;
        };
    }, [surfaceKey, editing, editPoint]);

    function rememberScroll() {
        const body = viewport.current;
        if (!body || restoring.current) return;
        anchor.current = captureBoardDocumentAnchor(body);
        position.current = {
            top: body.scrollTop,
            left: body.scrollLeft,
            height: body.scrollHeight,
        };
    }

    return { viewport, content, rememberScroll };
}
