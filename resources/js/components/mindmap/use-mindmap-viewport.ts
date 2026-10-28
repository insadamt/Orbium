import { useMindMapZoomInput } from './use-mindmap-zoom-input';
import { useLayoutEffect, useRef, useState } from 'react';
import { type layoutMindMap } from './mindmap-layout';

type ViewportOptions = {
    layout: ReturnType<typeof layoutMindMap> | null;
    selectedId: string | undefined;
    editable: boolean;
    fullscreen?: boolean;
    horizontalAnchor?: {
        id: string;
        anchorX: number;
        rightEdge: boolean;
    } | null;
};

export function useMindMapViewport({
    layout,
    selectedId,
    editable,
    fullscreen = false,
    horizontalAnchor,
}: ViewportOptions) {
    const viewport = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState<number | null>(null);
    const [width, setWidth] = useState(600);
    const [height, setHeight] = useState(300);
    const fit = layout
        ? Math.min(
              1,
              Math.max(
                  0.0001,
                  Math.min(
                      (width - 24) / layout.width,
                      (height - 16) / layout.height,
                  ),
              ),
          )
        : 1;
    //
    // Keep a readable initial scale; explicit Fit can show the entire tree at a smaller size.
    //
    const scale = zoom ?? (editable ? Math.max(0.65, fit) : fit);
    const panPadding = fullscreen ? Math.max(width, height) : 0;
    const previousPadding = useRef(0);
    const anchoredTopic = horizontalAnchor
        ? layout?.topics.find((item) => item.topic.id === horizontalAnchor.id)
        : null;
    //
    // Keep the topic's parent-facing edge under its starting position while the tree's normalized bounds change.
    //
    const sceneLeft =
        horizontalAnchor && anchoredTopic
            ? (viewport.current?.scrollLeft ?? 0) +
              horizontalAnchor.anchorX -
              (anchoredTopic.x +
                  (horizontalAnchor.rightEdge ? anchoredTopic.width : 0)) *
                  scale
            : panPadding +
              (layout ? Math.max(0, (width - layout.width * scale) / 2) : 0);
    const sceneTop =
        panPadding +
        (layout ? Math.max(0, (height - layout.height * scale) / 2) : 0);

    const skipZoomReveal = useMindMapZoomInput({
        viewport,
        scale,
        fit,
        panPadding,
        sceneLeft,
        sceneTop,
        setZoom,
    });

    useLayoutEffect(() => {
        const host = viewport.current;
        if (!host) return;
        //
        // Extra scroll space lets small maps pan freely, while resizing preserves the visible position.
        //
        host.scrollLeft += panPadding - previousPadding.current;
        host.scrollTop += panPadding - previousPadding.current;
        previousPadding.current = panPadding;
    }, [panPadding]);

    useLayoutEffect(() => {
        const host = viewport.current;
        if (!host) return;
        function updateViewportSize() {
            setWidth(host!.clientWidth || 600);
            setHeight(host!.clientHeight || 300);
        }
        const observer = new ResizeObserver(updateViewportSize);
        updateViewportSize();
        observer.observe(host);
        return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        const host = viewport.current;
        const topic = layout?.topics.find(
            (item) => item.topic.id === selectedId,
        );
        if (skipZoomReveal.current) {
            skipZoomReveal.current = false;
            return;
        }
        if (!editable || !host || !topic || horizontalAnchor) return;
        //
        // Reveal topics inside this canvas without scrolling the surrounding Document or Board.
        //
        const left = sceneLeft + topic.x * scale;
        const top = sceneTop + (topic.y - topic.iconSpace) * scale;
        const right = left + topic.width * scale;
        const bottom = top + topic.height * scale;
        const padding = 16;
        if (left < host.scrollLeft + padding) host.scrollLeft = left - padding;
        else if (right > host.scrollLeft + host.clientWidth - padding)
            host.scrollLeft = right - host.clientWidth + padding;
        if (top < host.scrollTop + padding) host.scrollTop = top - padding;
        else if (bottom > host.scrollTop + host.clientHeight - padding)
            host.scrollTop = bottom - host.clientHeight + padding;
    }, [
        layout,
        selectedId,
        editable,
        scale,
        sceneLeft,
        sceneTop,
        horizontalAnchor,
    ]);

    return {
        viewport,
        panPadding,
        width,
        height,
        fit,
        scale,
        sceneLeft,
        sceneTop,
        setZoom,
    };
}
