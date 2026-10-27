import './mindmap-branch-features.css';
import { MindMapMapTools } from './mindmap-map-tools';
import { useMindMapSearch } from './use-mindmap-search';
import { useMindMapBranchDrag } from './use-mindmap-branch-drag';
import {
    moveMindMapBranch,
    setMindMapVisibleLevels,
    mindMapLevelCount,
} from './mindmap-branch-actions';
import { withMindMapBranchStyle } from './mindmap-branch-style';
import { withMindMapLayout } from './mindmap-templates';
import { withMindMapTopicWidth } from './mindmap-topic-width';
import {
    useEffect,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useMindMapViewport } from './use-mindmap-viewport';
import { MindMapTopicControls } from './mindmap-topic-controls';
import { MindMapScene } from './mindmap-scene';
import { visibleMindMapTopic } from './mindmap-navigation';
import { useMindMapTopicActions } from './use-mindmap-topic-actions';
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
    const search = useMindMapSearch(data, setSelectedId, renamingId);
    const valid = useMemo(() => validMindMap(data), [data]);
    const levelCount = useMemo(
        () => (valid ? mindMapLevelCount(data) : 1),
        [data, valid],
    );
    const layout = useMemo(() => {
        if (!valid) return null;
        const preview = topicResize
            ? {
                  ...search.displayData,
                  topics: search.displayData.topics.map((topic) =>
                      topic.id === topicResize.id
                          ? { ...topic, width: topicResize.width }
                          : topic,
                  ),
              }
            : search.displayData;
        return layoutMindMap(preview, topicHeights);
    }, [data, search.displayData, valid, topicHeights, topicResize]);
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
        () => visibleMindMapTopic(search.displayData, selectedId),
        [search.displayData, selectedId],
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
        editable: editable || Boolean(search.query.trim()),
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
        if (JSON.stringify(next) === JSON.stringify(data)) {
            setError('');
            return true;
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
    const { addTopic, removeTopic, toggleTopic, shortcut } =
        useMindMapTopicActions({
            data,
            selected,
            descendants,
            editable,
            layout,
            commit,
            setSelectedId,
            setRenamingId,
            viewport,
        });
    const branchDrag = useMindMapBranchDrag({
        data,
        viewport,
        composing,
        onStart: (id) => {
            setSelectedId(id);
            setRenamingId(null);
        },
        onDrop: (drop, original) => {
            if (JSON.stringify(original) !== JSON.stringify(data)) {
                setError(
                    'The map changed during the drag. Try moving the branch again.',
                );
                return;
            }
            const next = moveMindMapBranch(data, drop);
            if (next && commit(next)) setSelectedId(drop.sourceId);
        },
    });
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
            {branchDrag.draggedId && (
                <p className="mindmap-drag-announcement" role="status">
                    {branchDrag.dropTarget
                        ? `${branchDrag.dropTarget.position === 'inside' ? 'Move inside' : `Place ${branchDrag.dropTarget.position}`} ${data.topics.find((topic) => topic.id === branchDrag.dropTarget?.targetId)?.text.slice(0, 60) || 'topic'}`
                        : 'Drag onto a topic to change parent, or to its edge to reorder.'}
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
                        searchMatches={search.matchIds}
                        activeMatchId={search.activeMatchId}
                        branchDrag={editable ? branchDrag : undefined}
                        onTopicHeights={updateTopicHeights}
                        onRename={setRenamingId}
                        onKeyDown={shortcut}
                        onToggle={(id) => {
                            const collapsed = !search.displayData.topics.find(
                                (topic) => topic.id === id,
                            )?.collapsed;
                            search.setQuery('');
                            toggleTopic(id, collapsed);
                        }}
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
            {fullscreen && (
                <MindMapMapTools
                    onSearchStart={() => setRenamingId(null)}
                    search={search}
                    editable={editable}
                    layout={data.layout}
                    levelCount={levelCount}
                    onLayout={(layout) => {
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
                    onLevels={(levels) => {
                        if (composing.current) return;
                        search.setQuery('');
                        const next = setMindMapVisibleLevels(data, levels);
                        if (commit(next)) setRenamingId(null);
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
                    onStyleChange={(style) => {
                        if (
                            !composing.current &&
                            Object.entries(style).some(
                                ([key, value]) =>
                                    selected[key as keyof typeof selected] !==
                                    value,
                            )
                        )
                            commit(
                                withMindMapBranchStyle(
                                    data,
                                    selected.id,
                                    style,
                                ),
                            );
                    }}
                    onRename={() => setRenamingId(selected.id)}
                    onAdd={addTopic}
                    onRemove={removeTopic}
                    onToggle={() => {
                        search.setQuery('');
                        toggleTopic(selected.id, !selected.collapsed);
                    }}
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
