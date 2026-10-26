import { MindMapWidthHandle } from './mindmap-width-handle';
import { Minus } from 'lucide-react';
import { useLayoutEffect, useRef, type KeyboardEventHandler } from 'react';
import type { JSONContent } from '@tiptap/core';
import { MindMapTopicPreview } from './mindmap-topic-preview';
import { MindMapTopicEditor } from './mindmap-topic-editor';
import { type layoutMindMap } from './mindmap-layout';

type Props = {
    layout: ReturnType<typeof layoutMindMap>;
    rootId: string;
    selectedId: string;
    renamingId: string | null;
    editable: boolean;
    scale: number;
    left: number;
    top: number;
    onSelect: (id: string) => void;
    onRename: (id: string | null) => void;
    onKeyDown: KeyboardEventHandler;
    onToggle: (id: string) => void;
    onContentChange: (
        id: string,
        content: JSONContent,
        typing: boolean,
    ) => boolean;
    onTopicHeights: (updates: Map<string, number>) => void;
    onWidthPreview: (id: string, width: number | null) => void;
    onWidthCommit: (id: string, width: number) => boolean;
    onComposition: (active: boolean) => void;
};

export function MindMapScene({
    layout,
    rootId,
    selectedId,
    renamingId,
    editable,
    scale,
    left,
    top,
    onSelect,
    onRename,
    onKeyDown,
    onToggle,
    onContentChange,
    onTopicHeights,
    onWidthPreview,
    onWidthCommit,
    onComposition,
}: Props) {
    const scene = useRef<HTMLDivElement>(null);
    const measuredTopicIds = layout.topics
        .map((item) => item.topic.id)
        .join(',');
    useLayoutEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const heights = new Map<string, number>();
            for (const entry of entries) {
                const id = (entry.target as HTMLElement).closest<HTMLElement>(
                    '[data-topic-container-id]',
                )?.dataset.topicContainerId;
                if (id)
                    heights.set(
                        id,
                        Math.max(
                            56,
                            Math.ceil(
                                entry.borderBoxSize[0]?.blockSize ??
                                    (entry.target as HTMLElement).offsetHeight,
                            ),
                        ),
                    );
            }
            onTopicHeights(heights);
        });
        scene.current
            ?.querySelectorAll('[data-topic-measure]')
            .forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [measuredTopicIds, renamingId, onTopicHeights]);
    function finishRenaming(id: string) {
        onRename(null);
        requestAnimationFrame(() =>
            scene.current
                ?.querySelector<HTMLElement>(`[data-topic-id="${id}"]`)
                ?.focus({ preventScroll: true }),
        );
    }
    return (
        <div
            ref={scene}
            className="mindmap-scene"
            style={{
                width: layout.width,
                height: layout.height,
                transform: `scale(${scale})`,
                left,
                top,
            }}
        >
            <svg width={layout.width} height={layout.height} aria-hidden="true">
                <g transform={`translate(${layout.offsetX} ${layout.offsetY})`}>
                    {layout.paths.map((path, index) => (
                        <path key={index} d={path} />
                    ))}
                </g>
            </svg>
            <div role={editable ? 'tree' : 'list'} aria-label="Topics">
                {layout.topics.map((item) => (
                    <div
                        key={item.topic.id}
                        className="mindmap-topic"
                        data-topic-container-id={item.topic.id}
                        data-root={item.topic.id === rootId}
                        data-side={item.side}
                        data-selected={editable && item.topic.id === selectedId}
                        title={item.topic.text || 'Untitled topic'}
                        style={{
                            left: item.x,
                            top: item.y,
                            width: item.width,
                            height: item.height,
                        }}
                    >
                        {editable && renamingId === item.topic.id ? (
                            <MindMapTopicEditor
                                topic={item.topic}
                                onChange={(content, typing) =>
                                    onContentChange(
                                        item.topic.id,
                                        content,
                                        typing,
                                    )
                                }
                                onComposition={onComposition}
                                onFinish={() => finishRenaming(item.topic.id)}
                            />
                        ) : editable ? (
                            <div
                                className="mindmap-topic-content"
                                data-topic-measure
                                role="treeitem"
                                data-topic-id={item.topic.id}
                                aria-level={item.depth + 1}
                                aria-selected={item.topic.id === selectedId}
                                aria-expanded={
                                    item.children
                                        ? !item.topic.collapsed
                                        : undefined
                                }
                                tabIndex={item.topic.id === selectedId ? 0 : -1}
                                onFocus={() => onSelect(item.topic.id)}
                                onClick={() => onSelect(item.topic.id)}
                                onDoubleClick={() => {
                                    onSelect(item.topic.id);
                                    onRename(item.topic.id);
                                }}
                                onKeyDown={onKeyDown}
                            >
                                <MindMapTopicPreview
                                    topic={item.topic}
                                    linksInteractive={!editable}
                                />
                                {!item.topic.text && 'Untitled topic'}
                            </div>
                        ) : (
                            <div
                                className="mindmap-topic-content"
                                data-topic-measure
                                role="listitem"
                            >
                                <MindMapTopicPreview
                                    topic={item.topic}
                                    linksInteractive={!editable}
                                />
                                {!item.topic.text && 'Untitled topic'}
                            </div>
                        )}
                        {editable && item.topic.id === selectedId && (
                            <MindMapWidthHandle
                                width={item.width}
                                side={item.side}
                                scale={scale}
                                onPreview={(width) =>
                                    onWidthPreview(item.topic.id, width)
                                }
                                onCommit={(width) =>
                                    onWidthCommit(item.topic.id, width)
                                }
                            />
                        )}
                        {editable && item.children > 0 && (
                            <button
                                className="mindmap-collapse"
                                type="button"
                                aria-expanded={!item.topic.collapsed}
                                aria-label={`${item.topic.collapsed ? 'Expand' : 'Collapse'} ${item.topic.text || 'topic'}`}
                                onClick={() => onToggle(item.topic.id)}
                            >
                                {item.topic.collapsed ? (
                                    item.children
                                ) : (
                                    <Minus size={12} />
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
