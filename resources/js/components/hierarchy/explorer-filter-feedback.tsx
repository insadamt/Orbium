// Shows recovery actions where explorer results begin; depends on filter state
// supplied by WorkspaceContents so genuine empty containers stay visually empty.
export function ExplorerFilterFeedback({
    revealedOutsideFilters,
    noMatches,
    onDismissReveal,
    onClearFilters,
}: {
    revealedOutsideFilters: boolean;
    noMatches: boolean;
    onDismissReveal: () => void;
    onClearFilters: () => void;
}) {
    if (!revealedOutsideFilters && !noMatches) return null;
    return (
        <div className="explorer-filter-feedback">
            <p>
                {revealedOutsideFilters
                    ? 'Showing the revealed item outside your current filters.'
                    : 'No items match your search and filters.'}
            </p>
            <button
                type="button"
                onClick={
                    revealedOutsideFilters ? onDismissReveal : onClearFilters
                }
            >
                {revealedOutsideFilters
                    ? 'Return to filters'
                    : 'Clear search and filters'}
            </button>
        </div>
    );
}
