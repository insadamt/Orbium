import {
    ChevronDown,
    ChevronUp,
    Search,
    X,
    FoldVertical,
    UnfoldVertical,
} from 'lucide-react';
import type { useMindMapSearch } from './use-mindmap-search';
import { MindMapTemplatePicker } from './mindmap-template-picker';
import type { MindMapLayoutId } from './mindmap-templates';
export function MindMapMapTools({
    search,
    editable,
    layout,
    onLayout,
    onLevels,
    levelCount,
    onSearchStart,
}: {
    search: ReturnType<typeof useMindMapSearch>;
    editable: boolean;
    levelCount: number;
    onSearchStart: () => void;
    layout?: MindMapLayoutId;
    onLayout: (layout: MindMapLayoutId) => boolean;
    onLevels: (levels: number | null) => void;
}) {
    return (
        <div className="mindmap-map-actions">
            <div
                className="mindmap-search"
                role="search"
                aria-label="Search Mind Map"
            >
                <Search size={15} aria-hidden="true" />
                <input
                    onFocus={onSearchStart}
                    data-mindmap-search-input
                    aria-label="Search map topics"
                    maxLength={500}
                    placeholder="Search topics…"
                    value={search.query}
                    onChange={(event) => search.setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.nativeEvent.isComposing) return;
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            event.stopPropagation();
                            search.setQuery('');
                        }
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            search.next(event.shiftKey ? -1 : 1);
                        }
                        if (event.ctrlKey || event.metaKey)
                            event.stopPropagation();
                    }}
                />
                {search.query && (
                    <>
                        <output aria-live="polite">
                            {search.matches.length
                                ? `${search.matches.indexOf(search.activeMatchId!) + 1}/${search.matches.length}`
                                : 'No matches'}
                        </output>
                        <button
                            type="button"
                            aria-label="Previous search result"
                            disabled={!search.matches.length}
                            onClick={() => {
                                onSearchStart();
                                search.next(-1);
                            }}
                        >
                            <ChevronUp size={14} />
                        </button>
                        <button
                            type="button"
                            aria-label="Next search result"
                            disabled={!search.matches.length}
                            onClick={() => {
                                onSearchStart();
                                search.next(1);
                            }}
                        >
                            <ChevronDown size={14} />
                        </button>
                        <button
                            type="button"
                            aria-label="Clear map search"
                            onClick={() => {
                                onSearchStart();
                                search.setQuery('');
                            }}
                        >
                            <X size={14} />
                        </button>
                    </>
                )}
            </div>
            {editable && (
                <>
                    <div
                        className="mindmap-collapse-tools"
                        role="group"
                        aria-label="Map detail level"
                    >
                        <button
                            type="button"
                            aria-label="Expand all branches"
                            title="Expand all"
                            onClick={() => onLevels(null)}
                        >
                            <UnfoldVertical size={17} />
                        </button>
                        <button
                            type="button"
                            aria-label="Collapse all branches"
                            title="Collapse all"
                            onClick={() => onLevels(1)}
                        >
                            <FoldVertical size={17} />
                        </button>
                        <select
                            aria-label="Show map levels"
                            value=""
                            onChange={(event) => {
                                if (event.target.value)
                                    onLevels(Number(event.target.value));
                            }}
                        >
                            <option value="" disabled>
                                Levels
                            </option>
                            {Array.from({ length: levelCount }, (_, index) => (
                                <option key={index + 1} value={index + 1}>
                                    {index + 1} {index ? 'levels' : 'level'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <MindMapTemplatePicker
                        layout={layout}
                        onChoose={onLayout}
                    />
                </>
            )}
        </div>
    );
}
