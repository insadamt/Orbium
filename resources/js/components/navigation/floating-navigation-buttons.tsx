import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { usePageSearch } from './page-search';

export function FloatingPageSearch({
    pageType,
}: {
    pageType: 'explorer' | 'document' | 'database' | 'settings' | 'trash';
}) {
    const search = usePageSearch();
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (search.open) input.current?.focus();
    }, [search.open]);

    const placeholders = {
        explorer: 'Filter this folder…',
        document: 'Find in document…',
        database: 'Filter documents…',
        settings: 'Find settings…',
        trash: 'Search Trash…',
    };

    return (
        <div
            className="floating-page-search floating-surface"
            data-open={search.open}
            role="search"
        >
            <button
                type="button"
                className="floating-search-trigger"
                aria-label={
                    search.open ? 'Focus page search' : 'Search this page'
                }
                aria-expanded={search.open}
                onClick={() =>
                    search.open ? input.current?.focus() : search.openSearch()
                }
            >
                <Search size={18} />
            </button>
            {search.open && (
                <>
                    <input
                        ref={input}
                        type="search"
                        aria-label="Search this page"
                        placeholder={placeholders[pageType]}
                        value={search.query}
                        onChange={(event) =>
                            search.setQuery(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') search.closeSearch();
                            if (
                                event.key === 'Enter' &&
                                pageType === 'document'
                            ) {
                                event.preventDefault();
                                search.stepToMatch(event.shiftKey);
                            }
                        }}
                    />
                    {search.query && search.resultCount !== null && (
                        <span className="floating-search-count" role="status">
                            {search.resultCount}
                        </span>
                    )}
                    <button
                        type="button"
                        className="floating-search-close"
                        aria-label="Close page search"
                        onClick={search.closeSearch}
                    >
                        <X size={15} />
                    </button>
                </>
            )}
        </div>
    );
}
