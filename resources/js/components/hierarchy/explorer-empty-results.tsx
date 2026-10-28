// Gives an empty filtered explorer a clear visual center and recovery action.
// Depends on shared floating surfaces and the existing search/filter reset callback.
import { RotateCcw, SearchX } from 'lucide-react';

export function ExplorerEmptyResults({
    onClearFilters,
    disabled,
}: {
    onClearFilters: () => void;
    disabled: boolean;
}) {
    return (
        <div className="explorer-empty-results">
            <div className="explorer-empty-symbol floating-surface">
                <SearchX size={36} strokeWidth={1.3} aria-hidden="true" />
            </div>
            <h2>No matching pages</h2>
            <p>
                Try a different search or clear your filters to see all pages
                here.
            </p>
            <button
                type="button"
                className="explorer-empty-action floating-surface"
                disabled={disabled}
                onClick={onClearFilters}
            >
                <RotateCcw size={16} aria-hidden="true" />
                Clear search and filters
            </button>
        </div>
    );
}
