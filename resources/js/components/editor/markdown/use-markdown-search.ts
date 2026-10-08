import {
    SearchQuery,
    findNext,
    findPrevious,
    setSearchQuery,
} from '@codemirror/search';
import type { EditorView } from '@codemirror/view';
import { useCallback, useEffect, useRef } from 'react';
import { usePageSearch } from '@/components/navigation/page-search';
import { useDocumentTab } from '@/components/navigation/document-tab-context';

export function useMarkdownSearch(view: EditorView | null) {
    const { active, url } = useDocumentTab();
    const { query, setQuery, setResultCount, searchStep, openSearch } =
        usePageSearch();
    const appliedStep = useRef(0);
    const appliedUrlTerm = useRef('');
    const timer = useRef<number | undefined>(undefined);
    const urlTerm =
        new URLSearchParams(url.split('?')[1] ?? '').get('find') ?? '';

    const scheduleCount = useCallback(() => {
        clearTimeout(timer.current);
        if (!active || !view) return;
        timer.current = window.setTimeout(() => {
            if (!query) {
                setResultCount(null);
                return;
            }
            const cursor = new SearchQuery({
                search: query,
                literal: true,
            }).getCursor(view.state);
            let count = 0;
            while (!cursor.next().done) count++;
            setResultCount(count);
        }, 150);
    }, [active, view, query, setResultCount]);

    useEffect(() => {
        if (!active || !view) return;
        view.dispatch({
            effects: setSearchQuery.of(
                new SearchQuery({ search: query, literal: true }),
            ),
        });
        scheduleCount();
        return () => clearTimeout(timer.current);
    }, [view, active, query, scheduleCount]);

    useEffect(() => {
        if (!urlTerm) appliedUrlTerm.current = '';
        if (!active || !view || !urlTerm || appliedUrlTerm.current === urlTerm)
            return;
        appliedUrlTerm.current = urlTerm;
        setQuery(urlTerm);
        openSearch();
        view.dispatch({
            effects: setSearchQuery.of(
                new SearchQuery({ search: urlTerm, literal: true }),
            ),
        });
        findNext(view);
    }, [active, view, urlTerm, setQuery, openSearch]);

    useEffect(() => {
        if (searchStep.id === 0) appliedStep.current = 0;
        if (
            !active ||
            !view ||
            searchStep.id === 0 ||
            searchStep.id === appliedStep.current ||
            !query ||
            searchStep.query !== query
        )
            return;
        appliedStep.current = searchStep.id;
        if (searchStep.previous) findPrevious(view);
        else findNext(view);
    }, [active, view, query, searchStep]);

    return { scheduleCount, openSearch };
}
