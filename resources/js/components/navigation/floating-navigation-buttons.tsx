// Keeps page search focused and clearly labeled while its field expands/collapses.
// Depends on page-search context, shared tooltips and shell search-slot styling.
import { Search, X } from 'lucide-react';
import { ControlTooltip } from './control-tooltip';
import { useEffect, useRef } from 'react';
import { usePageSearch } from './page-search';

export function FloatingPageSearch({
    pageType,
}: {
    pageType:
        | 'explorer'
        | 'document'
        | 'database'
        | 'settings'
        | 'trash'
        | 'library';
}) {
    const search = usePageSearch();
    const input = useRef<HTMLInputElement>(null);
    const searchTrigger = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (search.open) input.current?.focus();
    }, [search.open]);

    const placeholders = {
        explorer: 'Filter pages here…',
        document: 'Find in document…',
        database: 'Filter documents…',
        settings: 'Find settings…',
        trash: 'Search Trash…',
        library: 'Search Library…',
    };

    function closePageSearch() {
        search.closeSearch();
        searchTrigger.current?.focus({ preventScroll: true });
    }

    return (
        <div className="floating-page-search-slot" data-page-type={pageType}>
            <div
                className="floating-page-search floating-surface"
                data-open={search.open}
                role="search"
            >
                <ControlTooltip
                    label={
                        pageType === 'explorer'
                            ? 'Filter pages here'
                            : 'Search this page'
                    }
                >
                    <button
                        ref={searchTrigger}
                        type="button"
                        className="floating-search-trigger"
                        aria-label={
                            search.open
                                ? 'Focus page search'
                                : 'Search this page'
                        }
                        aria-expanded={search.open}
                        onClick={() =>
                            search.open
                                ? input.current?.focus()
                                : search.openSearch()
                        }
                    >
                        <Search size={18} />
                    </button>
                </ControlTooltip>
                <div className="floating-search-body" inert={!search.open}>
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
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                closePageSearch();
                            }
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
                    <ControlTooltip label="Close page search">
                        <button
                            type="button"
                            className="floating-search-close"
                            aria-label="Close page search"
                            onClick={closePageSearch}
                        >
                            <X size={15} />
                        </button>
                    </ControlTooltip>
                </div>
            </div>
        </div>
    );
}
