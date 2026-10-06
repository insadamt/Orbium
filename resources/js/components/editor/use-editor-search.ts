import type { Editor } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import { usePageSearch } from '@/components/navigation/page-search';
import { adjustEditorPerformanceCounter } from '@/lib/editor-performance';
import type { EditorActivityController } from './editor-activity-controller';
import { useEditorActivity } from './use-editor-activity';
import { countDocumentMatches, selectNextMatch } from './editor-controls';

export function useEditorSearch({
    editor,
    activityController,
    url,
}: {
    editor: Editor | null;
    activityController: EditorActivityController;
    url: string;
}) {
    const pageSearch = usePageSearch();
    const { active } = useEditorActivity(activityController);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [matchCount, setMatchCount] = useState(0);
    const appliedSearchTerm = useRef('');
    const appliedSearchStep = useRef(0);
    const searchTerm =
        new URLSearchParams(url.split('?')[1] ?? '').get('find') ?? '';

    useEffect(() => {
        let previousActive = activityController.getSnapshot().active;
        return activityController.subscribe(() => {
            const nextActive = activityController.getSnapshot().active;
            if (previousActive && !nextActive)
                adjustEditorPerformanceCounter('editor-search.pauses', 1);
            previousActive = nextActive;
        });
    }, [activityController]);

    useEffect(() => {
        if (!searchTerm) appliedSearchTerm.current = '';
        if (
            !active ||
            !editor ||
            !searchTerm ||
            appliedSearchTerm.current === searchTerm
        )
            return;
        return scheduleSearchWork(activityController, () => {
            appliedSearchTerm.current = searchTerm;
            setSearchQuery(searchTerm);
            setSearchOpen(true);
            setMatchCount(selectNextMatch(editor, searchTerm));
        });
    }, [editor, active, searchTerm, activityController]);

    useEffect(() => {
        if (!active || !editor || !searchOpen || !searchQuery.trim()) {
            if (active && !searchQuery.trim()) setMatchCount(0);
            return;
        }
        let cancel: (() => void) | undefined;
        const schedule = () => {
            cancel?.();
            cancel = scheduleSearchWork(activityController, () =>
                setMatchCount(countDocumentMatches(editor, searchQuery)),
            );
        };
        schedule();
        editor.on('update', schedule);
        return () => {
            cancel?.();
            editor.off('update', schedule);
        };
    }, [editor, active, searchOpen, searchQuery, activityController]);

    useEffect(() => {
        if (!active) return;
        if (!editor || !pageSearch.query.trim()) {
            pageSearch.setResultCount(null);
            return;
        }
        let cancel: (() => void) | undefined;
        const schedule = () => {
            cancel?.();
            cancel = scheduleSearchWork(activityController, () =>
                pageSearch.setResultCount(
                    countDocumentMatches(editor, pageSearch.query),
                ),
            );
        };
        pageSearch.setResultCount(null);
        schedule();
        editor.on('update', schedule);
        return () => {
            cancel?.();
            editor.off('update', schedule);
        };
    }, [
        editor,
        active,
        pageSearch.query,
        pageSearch.setResultCount,
        activityController,
    ]);

    useEffect(() => {
        const step = pageSearch.searchStep;
        if (step.id === 0) appliedSearchStep.current = 0;
        if (
            !active ||
            !editor ||
            !step.query ||
            step.query !== pageSearch.query ||
            step.id === 0 ||
            appliedSearchStep.current === step.id
        )
            return;
        return scheduleSearchWork(activityController, () => {
            appliedSearchStep.current = step.id;
            pageSearch.setResultCount(
                selectNextMatch(editor, step.query, step.previous),
            );
        });
    }, [
        editor,
        active,
        pageSearch.searchStep,
        pageSearch.query,
        pageSearch.setResultCount,
        activityController,
    ]);

    return {
        searchOpen,
        setSearchOpen,
        searchQuery,
        setSearchQuery,
        matchCount,
        setMatchCount,
    };
}

function scheduleSearchWork(
    activityController: EditorActivityController,
    work: () => void,
) {
    if (!activityController.getSnapshot().active) return () => {};
    let pending = true;
    adjustEditorPerformanceCounter('editor-search.pending-jobs', 1);
    const finish = () => {
        if (!pending) return;
        pending = false;
        adjustEditorPerformanceCounter('editor-search.pending-jobs', -1);
    };
    let unsubscribe: () => void = () => {};
    const timer = window.setTimeout(() => {
        unsubscribe();
        finish();
        if (activityController.getSnapshot().active) work();
    }, 150);
    unsubscribe = activityController.subscribe(() => {
        if (!activityController.getSnapshot().active) {
            clearTimeout(timer);
            finish();
            unsubscribe();
        }
    });
    return () => {
        clearTimeout(timer);
        finish();
        unsubscribe();
    };
}
