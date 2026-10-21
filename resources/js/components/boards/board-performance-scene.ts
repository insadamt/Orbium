import type { RefObject } from 'react';
import { intersects } from './board-geometry';
import type { BoardBounds, BoardCamera, BoardObject } from './board-types';

export type BoardPerformanceContext = {
    viewportRef: RefObject<HTMLDivElement | null>;
    objectsRef: RefObject<BoardObject[]>;
    cameraRef: RefObject<BoardCamera>;
    mountingBounds: BoardBounds;
};

export function readBoardPerformanceScene(context: BoardPerformanceContext) {
    const viewport = context.viewportRef.current;
    if (!viewport?.isConnected) return null;
    const camera = context.cameraRef.current;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const viewportBounds = {
        x: -camera.x / camera.zoom,
        y: -camera.y / camera.zoom,
        width: width / camera.zoom,
        height: height / camera.zoom,
    };
    const mountedIds = new Set(
        Array.from(
            viewport.querySelectorAll<HTMLElement>('[data-board-object-id]'),
        ).map((element) => element.dataset.boardObjectId),
    );
    const counts = {
        total: {} as Record<string, number>,
        intersectingViewport: {} as Record<string, number>,
        inMountingRegion: {} as Record<string, number>,
        mounted: {} as Record<string, number>,
        retainedOutsideRegion: {} as Record<string, number>,
        pinnedOutsideRegion: {} as Record<string, number>,
        unmountedInViewport: {} as Record<string, number>,
    };
    const editingId = viewport.querySelector<HTMLElement>(
        '[data-board-object-id][data-editing="true"]',
    )?.dataset.boardObjectId;
    const regionReady =
        context.mountingBounds.width > 0 && context.mountingBounds.height > 0;
    for (const object of context.objectsRef.current) {
        const kind = object.data.media_kind ?? object.block_type;
        const visible =
            width > 0 && height > 0 && intersects(viewportBounds, object);
        const inRegion =
            regionReady && intersects(context.mountingBounds, object);
        const mounted = mountedIds.has(object.id);
        increment(counts.total, kind);
        if (visible) increment(counts.intersectingViewport, kind);
        if (inRegion) increment(counts.inMountingRegion, kind);
        if (mounted) increment(counts.mounted, kind);
        if (mounted && !inRegion)
            increment(
                object.id === editingId
                    ? counts.pinnedOutsideRegion
                    : counts.retainedOutsideRegion,
                kind,
            );
        if (visible && !mounted) increment(counts.unmountedInViewport, kind);
    }
    const count = (selector: string) =>
        viewport.querySelectorAll(selector).length;
    return {
        sampledAt: performance.now(),
        viewport: {
            width,
            height,
            zoom: camera.zoom,
            devicePixelRatio: window.devicePixelRatio,
        },
        documentVisible: document.visibilityState === 'visible',
        countsByKind: counts,
        dom: {
            boardElements: count('*'),
            pageElements: document.getElementsByTagName('*').length,
            codeMirrorViews: count('.cm-editor'),
            tableSourceViews: count('.board-table .cm-editor'),
            editableNativeViews: count('.ProseMirror[contenteditable="true"]'),
            linkedDocumentEditors: count('.board-document-editor'),
            readyLinkedPreviews: count(
                '.board-document-preview[data-preview-ready="true"]',
            ),
            pdfReaders: count('.attachment-pdf-reader'),
            mermaidSurfaces: count('[data-mermaid-preview]'),
            mermaidSvgElements: count('[data-mermaid-preview] svg'),
            tables: count('table'),
            svgElements: count('svg'),
            canvases: count('canvas'),
            canvasPixels: Array.from(
                viewport.querySelectorAll('canvas'),
            ).reduce((sum, canvas) => sum + canvas.width * canvas.height, 0),
        },
    };
}

function increment(counts: Record<string, number>, kind: string) {
    counts[kind] = (counts[kind] ?? 0) + 1;
}
