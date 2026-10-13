import { CheckSquare, RefreshCw, Search, Upload, X } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import type { LibraryFilters } from './library-api';

export function LibraryToolbar({
    filters,
    onChange,
    selecting,
    onSelectMode,
    onUpload,
    onRefresh,
    busy,
    imagesOnly,
    picker,
    total,
}: {
    filters: LibraryFilters;
    onChange: (filters: LibraryFilters) => void;
    selecting: boolean;
    onSelectMode: () => void;
    onUpload: () => void;
    onRefresh: () => void;
    busy: boolean;
    imagesOnly: boolean;
    picker: boolean;
    total: number;
}) {
    return (
        <div className="library-toolbar">
            <label className="library-search">
                <Search size={17} aria-hidden="true" />
                <input
                    type="search"
                    maxLength={255}
                    aria-label="Search Library"
                    placeholder="Search your files…"
                    value={filters.q}
                    onChange={(event) =>
                        onChange({ ...filters, q: event.target.value })
                    }
                />
                {filters.q && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => onChange({ ...filters, q: '' })}
                    >
                        <X size={15} />
                    </button>
                )}
            </label>
            {!imagesOnly && (
                <div className="library-type-tabs" aria-label="File type">
                    {(['all', 'images', 'files'] as const).map((type) => (
                        <button
                            type="button"
                            key={type}
                            aria-pressed={filters.type === type}
                            data-active={filters.type === type}
                            onClick={() => onChange({ ...filters, type })}
                        >
                            {type === 'all'
                                ? 'All'
                                : type === 'images'
                                  ? 'Images'
                                  : 'Files'}
                        </button>
                    ))}
                </div>
            )}
            <AppSelect
                label="Sort Library"
                contentClassName="z-[120]"
                value={filters.sort}
                onValueChange={(sort) =>
                    onChange({
                        ...filters,
                        sort: sort as LibraryFilters['sort'],
                    })
                }
                options={[
                    { value: 'newest', label: 'Newest first' },
                    { value: 'name', label: 'Name' },
                    { value: 'size', label: 'Largest first' },
                ]}
                className="library-sort"
            />
            <button
                type="button"
                className="library-icon-button"
                aria-label="Refresh Library"
                onClick={onRefresh}
                disabled={busy}
            >
                <RefreshCw size={16} />
            </button>
            {!picker && (
                <>
                    <button
                        type="button"
                        className="library-button"
                        aria-pressed={selecting}
                        onClick={onSelectMode}
                        disabled={busy || !total}
                    >
                        <CheckSquare size={16} />
                        {selecting ? 'Done' : 'Select'}
                    </button>
                    <button
                        type="button"
                        className="library-button library-button-primary"
                        onClick={onUpload}
                        disabled={busy}
                    >
                        <Upload size={16} />
                        Upload
                    </button>
                </>
            )}
        </div>
    );
}
