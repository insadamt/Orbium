import type { Dispatch, SetStateAction, RefObject, KeyboardEvent } from 'react';
import {
    mindMapDescendants,
    type MindMapData,
    type MindMapTopic,
} from './mindmap-data';
import { mindMapExpandKey, mindMapNavigation } from './mindmap-navigation';
import type { layoutMindMap } from './mindmap-layout';
import { reorderMindMapSibling } from './mindmap-branch-actions';

type Props = {
    data: MindMapData;
    selected: MindMapTopic | undefined;
    descendants: Set<string>;
    editable: boolean;
    layout: ReturnType<typeof layoutMindMap> | null;
    commit: (next: MindMapData, typing?: boolean) => boolean;
    setSelectedId: Dispatch<SetStateAction<string>>;
    setRenamingId: Dispatch<SetStateAction<string | null>>;
    viewport: RefObject<HTMLDivElement | null>;
};
export function useMindMapTopicActions({
    data,
    selected,
    descendants,
    editable,
    layout,
    commit,
    setSelectedId,
    setRenamingId,
    viewport,
}: Props) {
    function addTopic(sibling = false) {
        if (!selected) return;
        const parent =
            sibling && selected.parent_id !== null
                ? selected.parent_id
                : selected.id;
        const id = crypto.randomUUID();
        const ancestors = new Set<string>();
        let ancestor = data.topics.find((topic) => topic.id === parent);
        while (ancestor) {
            ancestors.add(ancestor.id);
            ancestor = data.topics.find(
                (topic) => topic.id === ancestor!.parent_id,
            );
        }
        const topics = data.topics.map((topic) =>
            ancestors.has(topic.id) ? { ...topic, collapsed: false } : topic,
        );
        const insertionIndex =
            sibling && selected.parent_id !== null
                ? topics.findIndex((topic) => topic.id === selected.id) + 1
                : topics.length;
        topics.splice(insertionIndex, 0, {
            id,
            parent_id: parent,
            text: 'New topic',
            collapsed: false,
        });
        const next = { ...data, topics };
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
    function toggleTopic(
        id: string,
        collapsed = !data.topics.find((topic) => topic.id === id)?.collapsed,
    ) {
        const next = {
            ...data,
            topics: data.topics.map((topic) =>
                topic.id === id ? { ...topic, collapsed } : topic,
            ),
        };
        if (
            commit(next) &&
            next.topics.find((topic) => topic.id === id)?.collapsed &&
            mindMapDescendants(data, id).has(selected?.id ?? data.root_id)
        ) {
            setSelectedId(id);
            setRenamingId(null);
        }
    }
    function shortcut(event: KeyboardEvent) {
        if (
            editable &&
            selected &&
            event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.nativeEvent.isComposing &&
            ['ArrowUp', 'ArrowDown'].includes(event.key)
        ) {
            event.preventDefault();
            event.stopPropagation();
            const next = reorderMindMapSibling(
                data,
                selected.id,
                event.key === 'ArrowUp' ? -1 : 1,
            );
            if (next && commit(next)) focusTopic(selected.id);
            return;
        }
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
    return { addTopic, removeTopic, toggleTopic, shortcut, focusTopic };
}
