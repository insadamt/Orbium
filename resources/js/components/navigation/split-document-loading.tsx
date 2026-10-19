import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { Tab } from './navigation-store';
import { prepareTabForSplit } from './split-tab-preparation';
import { useTabPageCache } from './tab-page-cache';

export function SplitDocumentLoading({
    tab,
    side,
}: {
    tab: Tab;
    side: 'left' | 'right';
}) {
    const { version } = usePage();
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const url = tab.entries[tab.index].url;
    const documentReady = useTabPageCache((state) => {
        const page = state.pages[tab.id]?.page;
        return page?.component === 'documents/show' && page.url === url;
    });

    // Restored documents must mount the normal editor instead of creating another scrolling viewport.

    useEffect(() => {
        if (documentReady) return;
        let cancelled = false;
        setFailed(false);
        void prepareTabForSplit(tab, version).then((prepared) => {
            if (!cancelled) setFailed(!prepared);
        });
        return () => {
            cancelled = true;
        };
    }, [tab, url, version, attempt, documentReady]);

    // Cache readiness must remove this surface even if its parent reused a memoized child tree.

    if (documentReady) return null;

    return (
        <section
            className={`split-pane split-pane-position split-pane-position-${side}`}
            aria-label={`${tab.entries[tab.index].title} pane`}
        >
            <div className="floating-body-island" role="status">
                {failed ? (
                    <>
                        <p>Could not load this document.</p>
                        <button
                            type="button"
                            className="mt-3 underline"
                            onClick={() => setAttempt((value) => value + 1)}
                        >
                            Retry
                        </button>
                    </>
                ) : (
                    <p>Opening {tab.entries[tab.index].title}…</p>
                )}
            </div>
        </section>
    );
}
