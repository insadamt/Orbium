import { MindMapTemplatePicker } from './mindmap-template-picker';
import { withMindMapLayout } from './mindmap-templates';
import { withMindMapTopicWidth } from './mindmap-topic-width';
import {
    useEffect,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import { useMindMapViewport } from './use-mindmap-viewport';
import { MindMapTopicControls } from './mindmap-topic-controls';
import { MindMapScene } from './mindmap-scene';
import {
    mindMapExpandKey,
    mindMapNavigation,
    visibleMindMapTopic,
} from './mindmap-navigation';
import {
    validMindMap,
    mindMapDescendants,
    moveMindMapTopic,
    type MindMapData,
} from './mindmap-data';
import { layoutMindMap } from './mindmap-layout';
import { replaceMindMapTopicDocument } from './mindmap-topic-document';
import { MindMapViewControls } from './mindmap-view-controls';

type Props = {
    data: MindMapData;
    editable?: boolean;
    fullscreen?: boolean;
    onChange?: (map: MindMapData, typing?: boolean) => boolean;
    onComposition?: (active: boolean) => void;
    onLayoutHeight?: (height: number) => void;
};
export function MindMapCanvas({
    data: incoming,
    editable = false,
    fullscreen = false,
    onChange,
    onComposition,
    onLayoutHeight,
}: Props) {
    //
    // Keep the controlled input current while CodeMirror queues its widget refresh.
    //
    const [data, setData] = useState(incoming);
    useLayoutEffect(() => setData(incoming), [incoming]);
    const [selectedId, setSelectedId] = useState(data.root_id);
    const [topicHeights, setTopicHeights] = useState<
        ReadonlyMap<string, number>
    >(new Map());
    const [error, setError] = useState('');
    const [topicResize, setTopicResize] = useState<{
        id: string;
        width: number;
        anchorX: number;
        rightEdge: boolean;
    } | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const composing = useRef(false);
    const compositionCallback = useRef(onComposition);
    useLayoutEffect(() => {
        compositionCallback.current = onComposition;
    }, [onComposition]);
    useEffect(
        () => () => {
            if (composing.current) compositionCallback.current?.(false);
        },
        [],
    );
    const valid = useMemo(() => validMindMap(data), [data]);
    const layout = useMemo(() => {
        if (!valid) return null;
        const preview = topicResize
            ? {
                  ...data,
                  topics: data.topics.map((topic) =>
                      topic.id === topicResize.id
                          ? { ...topic, width: topicResize.width }
                          : topic,
                  ),
              }
            : data;
        return layoutMindMap(preview, topicHeights);
    }, [data, valid, topicHeights, topicResize]);
    useLayoutEffect(() => {
        if (layout) onLayoutHeight?.(layout.height);
    }, [layout, onLayoutHeight]);
    const currentTopicIds = useRef(new Set<string>());
    currentTopicIds.current = new Set(data.topics.map((topic) => topic.id));
    const updateTopicHeights = useCallback((updates: Map<string, number>) => {
        setTopicHeights((previous) => {
            const next = new Map(
                [...previous].filter(([id]) => currentTopicIds.current.has(id)),
            );
            for (const [id, height] of updates)
                if (currentTopicIds.current.has(id)) next.set(id, height);
            if (
                next.size === previous.size &&
                [...next].every(([id, height]) => previous.get(id) === height)
            )
                return previous;
            return next;
        });
    }, []);
    const selected = useMemo(
        () => visibleMindMapTopic(data, selectedId),
        [data, selectedId],
    );
    const descendants = useMemo(
        () => mindMapDescendants(data, selected?.id ?? data.root_id),
        [data, selected],
    );
    const {
        viewport,
        panPadding,
        width,
        height,
        fit,
        scale,
        sceneLeft,
        sceneTop,
        setZoom,
    } = useMindMapViewport({
        layout,
        selectedId: selected?.id,
        editable,
        fullscreen,
        horizontalAnchor: topicResize,
    });
    function commit(next: MindMapData, typing = false) {
        if (!editable || !onChange) return false;
        if (!validMindMap(next)) {
            setError(
                'This change exceeds the Mind Map limits: 64 KiB, 64 levels, or 500 characters per topic.',
            );
            return false;
        }
        const accepted = onChange(next, typing);
        if (accepted) {
            setData(next);
            setZoom(scale);
        }
        setError(
            accepted
                ? ''
                : 'The block changed or is read-only. Your saved map was kept.',
        );
        return accepted;
    }
    function addTopic(sibling = false) {
        if (!selected) return;
        const parent =
            sibling && selected.parent_id !== null
                ? selected.parent_id
                : selected.id;
        const id = crypto.randomUUID();
        const next = {
            ...data,
            topics: [
                ...data.topics.map((topic) =>
                    topic.id === parent
                        ? { ...topic, collapsed: false }
                        : topic,
                ),
                { id, parent_id: parent, text: 'New topic', collapsed: false },
            ],
        };
        if (commit(next)) {
            setSelectedId(id);
            setRenamingId(id);
        }
    }
    function removeTopic() {
        if (!selected || selected.id === data.root_id) return;
        const restoreTopicFocus = viewport.current?.contains(
            document.activeElement,
        );
        if (
            commit({
                ...data,
                topics: data.topics.filter(
                    (topic) => !descendants.has(topic.id),
                ),
            })
        ) {
            setSelectedId(selected.parent_id!);
            if (restoreTopicFocus) focusTopic(selected.parent_id!);
        }
    }
    function focusTopic(id: string) {
        requestAnimationFrame(() =>
            viewport.current
                ?.querySelector<HTMLElement>(`[data-topic-id="${id}"]`)
                ?.focus({ preventScroll: true }),
        );
    }
    function toggleTopic(id: string) {
        const next = {
            ...data,
            topics: data.topics.map((topic) =>
                topic.id === id
                    ? { ...topic, collapsed: !topic.collapsed }
                    : topic,
            ),
        };
        if (
            commit(next) &&
            next.topics.find((topic) => topic.id === id)?.collapsed &&
            mindMapDescendants(data, id).has(selected?.id ?? data.root_id)
        )
            setSelectedId(id);
    }
    function shortcut(event: KeyboardEvent) {
        if (
            !editable ||
            !selected ||
            event.nativeEvent.isComposing ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
        )
            return;
        if (event.currentTarget.getAttribute('role') === 'treeitem') {
            if (event.key === 'F2' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                setRenamingId(selected.id);
                return;
            }
            const next = mindMapNavigation(
                data,
                selected,
                event.key,
                layout?.topics.find((item) => item.topic.id === selected.id)
                    ?.direction,
            );
            if (next) {
                event.preventDefault();
                event.stopPropagation();
                if (
                    selected.collapsed &&
                    next === selected.id &&
                    event.key ===
                        mindMapExpandKey(
                            data,
                            layout?.topics.find(
                                (item) => item.topic.id === selected.id,
                            )?.direction,
                        )
                )
                    toggleTopic(selected.id);
                setSelectedId(next);
                focusTopic(next);
                return;
            }
            if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault();
                event.stopPropagation();
                removeTopic();
                return;
            }
        }
        if (event.key === 'Enter' && event.shiftKey) return;
        if ((event.key === 'Tab' && !event.shiftKey) || event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            addTopic(event.key === 'Enter');
        }
    }
    const drag = useRef<{
        pointerId: number;
        x: number;
        y: number;
        left: number;
        top: number;
    } | null>(null);
    if (!valid || !layout || !selected)
        return (
            <p role="alert">
                Unsupported Mind Map. Original block data is kept.
            </p>
        );
    return (
        <div
            className="mindmap-canvas"
            data-fullscreen={fullscreen}
            data-rich-writing
            data-mindmap-composing="false"
        >
            {error && (
                <p role="alert" className="mindmap-error">
                    {error}
                </p>
            )}
            <div
                ref={viewport}
                className="mindmap-viewport"
                tabIndex={0}
                aria-label="Mind Map canvas; scroll or drag empty space to pan"
                onPointerDown={(event) => {
                    if (
                        !fullscreen ||
                        !event.currentTarget.contains(event.target as Node) ||
                        event.button !== 0 ||
                        event.pointerType === 'touch' ||
                        (event.target as Element).closest(
                            'button, a, textarea, input, [role="treeitem"], [contenteditable], [data-mindmap-topic-editor]',
                        )
                    )
                        return;
                    const host = event.currentTarget;
                    drag.current = {
                        pointerId: event.pointerId,
                        x: event.clientX,
                        y: event.clientY,
                        left: host.scrollLeft,
                        top: host.scrollTop,
                    };
                    host.setPointerCapture(event.pointerId);
                    host.dataset.panning = 'true';
                    host.focus({ preventScroll: true });
                }}
                onPointerMove={(event) => {
                    const origin = drag.current;
                    if (!origin || origin.pointerId !== event.pointerId) return;
                    event.currentTarget.scrollLeft =
                        origin.left - (event.clientX - origin.x);
                    event.currentTarget.scrollTop =
                        origin.top - (event.clientY - origin.y);
                }}
                onLostPointerCapture={(event) => {
                    drag.current = null;
                    delete event.currentTarget.dataset.panning;
                }}
                onPointerUp={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId))
                        event.currentTarget.releasePointerCapture(
                            event.pointerId,
                        );
                    drag.current = null;
                    delete event.currentTarget.dataset.panning;
                }}
                onPointerCancel={(event) => {
                    drag.current = null;
                    delete event.currentTarget.dataset.panning;
                }}
            >
                <div
                    style={{
                        width:
                            Math.max(width - 2, layout.width * scale) +
                            panPadding * 2,
                        height:
                            Math.max(height, layout.height * scale) +
                            panPadding * 2,
                    }}
                >
                    <MindMapScene
                        layout={layout}
                        rootId={data.root_id}
                        selectedId={selected.id}
                        renamingId={renamingId}
                        editable={editable}
                        scale={scale}
                        left={sceneLeft}
                        top={sceneTop}
                        onSelect={(id) => {
                            setSelectedId(id);
                            if (id !== renamingId) setRenamingId(null);
                        }}
                        onWidthPreview={(id, width) => {
                            if (width === null) {
                                setTopicResize(null);
                                return;
                            }
                            const topic = layout.topics.find(
                                (item) => item.topic.id === id,
                            );
                            if (!topic) return;
                            setZoom(scale);
                            setTopicResize((previous) =>
                                previous?.id === id
                                    ? { ...previous, width }
                                    : {
                                          id,
                                          width,
                                          rightEdge: topic.side < 0,
                                          anchorX:
                                              sceneLeft +
                                              (topic.x +
                                                  (topic.side < 0
                                                      ? topic.width
                                                      : 0)) *
                                                  scale -
                                              (viewport.current?.scrollLeft ??
                                                  0),
                                      },
                            );
                        }}
                        onWidthCommit={(id, width) =>
                            commit(withMindMapTopicWidth(data, id, width))
                        }
                        onTopicHeights={updateTopicHeights}
                        onRename={setRenamingId}
                        onKeyDown={shortcut}
                        onToggle={toggleTopic}
                        onContentChange={(id, content, typing) =>
                            commit(
                                replaceMindMapTopicDocument(data, id, content),
                                typing,
                            )
                        }
                        onComposition={(active) => {
                            composing.current = active;
                            onComposition?.(active);
                        }}
                    />
                </div>
            </div>
            {editable && fullscreen && (
                <MindMapTemplatePicker
                    layout={data.layout}
                    onChoose={(layout) => {
                        if (composing.current) {
                            setError(
                                'Finish composing the topic text before changing its layout.',
                            );
                            return false;
                        }
                        if (commit(withMindMapLayout(data, layout))) {
                            setTopicResize(null);
                            setZoom(null);
                            return true;
                        }
                        return false;
                    }}
                />
            )}
            {fullscreen && (
                <MindMapViewControls
                    scale={scale}
                    onZoom={setZoom}
                    onFit={() => {
                        setZoom(fit);
                        viewport.current?.scrollTo(panPadding, panPadding);
                    }}
                />
            )}
            {editable && (
                <MindMapTopicControls
                    selected={selected}
                    data={data}
                    descendants={descendants}
                    onRename={() => setRenamingId(selected.id)}
                    onAdd={addTopic}
                    onRemove={removeTopic}
                    onToggle={() => toggleTopic(selected.id)}
                    onWidthCommit={(width) =>
                        commit(withMindMapTopicWidth(data, selected.id, width))
                    }
                    onMove={(parentId) =>
                        commit(moveMindMapTopic(data, selected.id, parentId))
                    }
                />
            )}
        </div>
    );
}
