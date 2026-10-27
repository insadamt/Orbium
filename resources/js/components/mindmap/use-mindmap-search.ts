import { useEffect, useMemo, useState } from 'react';
import type { MindMapData } from './mindmap-data';
function searchText(value: string) {
    return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}
export function useMindMapSearch(
    data: MindMapData,
    onSelect: (id: string) => void,
    editingId: string | null,
) {
    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const matches = useMemo(() => {
        const needle = searchText(query.trim());
        return needle
            ? data.topics
                  .filter((topic) => searchText(topic.text).includes(needle))
                  .map((topic) => topic.id)
            : [];
    }, [data, query]);
    const matchIds = useMemo(() => new Set(matches), [matches]);
    const activeMatchId =
        activeId && matchIds.has(activeId) ? activeId : (matches[0] ?? null);
    useEffect(() => {
        if (activeMatchId) {
            setActiveId(activeMatchId);
            if (!editingId) onSelect(activeMatchId);
        }
    }, [activeMatchId, onSelect, editingId]);
    const displayData = useMemo(() => {
        const revealedIds =
            query.trim() && editingId ? [...matches, editingId] : matches;
        if (!revealedIds.length) return data;
        const byId = new Map(data.topics.map((topic) => [topic.id, topic]));
        const expanded = new Set<string>();
        for (const id of revealedIds) {
            let parent = byId.get(id)?.parent_id;
            while (parent && !expanded.has(parent)) {
                expanded.add(parent);
                parent = byId.get(parent)?.parent_id;
            }
        }
        //
        // Revealing search results is a view override; clearing the query restores the saved collapsed state.
        //
        return {
            ...data,
            topics: data.topics.map((topic) =>
                expanded.has(topic.id) ? { ...topic, collapsed: false } : topic,
            ),
        };
    }, [data, matches, query, editingId]);
    function next(offset: number) {
        if (!matches.length) return;
        const index = matches.indexOf(activeMatchId!);
        const id = matches[(index + offset + matches.length) % matches.length];
        setActiveId(id);
        onSelect(id);
    }
    return {
        query,
        setQuery,
        matches,
        matchIds,
        activeMatchId,
        displayData,
        next,
    };
}
