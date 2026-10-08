import { setLogicalMarkdownMatches } from './interactions/markdown-find-highlights';
import { SearchQuery, setSearchQuery } from '@codemirror/search';
import { EditorView } from '@codemirror/view';
import type { Text } from '@codemirror/state';
import { useCallback, useEffect, useRef } from 'react';
import { usePageSearch } from '@/components/navigation/page-search';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import {
    findLogicalMarkdownMatches,
    type LogicalMarkdownMatch,
} from './interactions/markdown-logical-text';

export function useMarkdownSearch(view: EditorView | null) {
    const { active, url } = useDocumentTab();
    const { query, setQuery, setResultCount, searchStep, openSearch } =
        usePageSearch();
    const appliedStep = useRef(0);
    const appliedUrlTerm = useRef('');
    const timer = useRef<number | undefined>(undefined);
    const cached = useRef<{
        source: Text;
        query: string;
        matches: LogicalMarkdownMatch[];
    } | null>(null);
    const urlTerm =
        new URLSearchParams(url.split('?')[1] ?? '').get('find') ?? '';
    const matchesFor = useCallback(
        (term: string) => {
            if (!view) return [];
            if (
                cached.current?.source === view.state.doc &&
                cached.current.query === term
            )
                return cached.current.matches;
            const matches = findLogicalMarkdownMatches(view.state.doc, term);
            cached.current = { source: view.state.doc, query: term, matches };
            return matches;
        },
        [view],
    );
    const navigateMatch = useCallback(
        (term: string, previous: boolean) => {
            if (!view) return;
            const matches = matchesFor(term);
            setResultCount(matches.length);
            const selection = view.state.selection.main;
            const match = previous
                ? ([...matches]
                      .reverse()
                      .find((item) => item.from < selection.from) ??
                  matches.at(-1))
                : (matches.find(
                      (item) =>
                          item.from >= selection.to &&
                          (selection.empty || item.from > selection.from),
                  ) ?? matches[0]);
            if (!match) return;
            view.dispatch({
                selection: { anchor: match.from, head: match.to },
                effects: [
                    setLogicalMarkdownMatches.of(matches),
                    setSearchQuery.of(
                        new SearchQuery({ search: term, literal: true }),
                    ),
                    EditorView.scrollIntoView(match.from, { y: 'center' }),
                ],
            });
        },
        [view, matchesFor, setResultCount],
    );
    const scheduleCount = useCallback(() => {
        clearTimeout(timer.current);
        if (!active || !view) return;
        timer.current = window.setTimeout(() => {
            const matches = query ? matchesFor(query) : [];
            setResultCount(query ? matches.length : null);
            view.dispatch({ effects: setLogicalMarkdownMatches.of(matches) });
        }, 150);
    }, [active, view, query, matchesFor, setResultCount]);
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
        navigateMatch(urlTerm, false);
    }, [active, view, urlTerm, setQuery, openSearch, navigateMatch]);
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
        navigateMatch(query, searchStep.previous);
    }, [active, view, query, searchStep, navigateMatch]);
    useEffect(() => () => clearTimeout(timer.current), []);
    return { scheduleCount, openSearch };
}
