import { RefreshCw, Search, Upload, X } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import type { LibraryFilters } from './library-api';

export function LibraryToolbar({
    filters,
    onChange,
    onUpload,
    onRefresh,
    busy,
    imagesOnly,
    filesOnly,
    picker,
}: {
    filters: LibraryFilters;
    onChange: (filters: LibraryFilters) => void;
    onUpload: () => void;
    onRefresh: () => void;
    busy: boolean;
    imagesOnly: boolean;
    filesOnly: boolean;
    picker: boolean;
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
            {!imagesOnly && !filesOnly && (
                <div className="library-type-tabs" aria-label="File type">
                    {(
                        [
                            'all',
                            'images',
                            'videos',
                            'audios',
                            'pdfs',
                            'files',
                        ] as const
                    ).map((type) => (
                        <button
                            type="button"
                            key={type}
                            aria-pressed={filters.type === type}
                            data-active={filters.type === type}
                            onClick={() => onChange({ ...filters, type })}
                        >
                            {type === 'pdfs'
                                ? 'PDFs'
                                : type === 'audios'
                                  ? 'Audio'
                                  : type[0].toUpperCase() + type.slice(1)}
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
                <button
                    type="button"
                    className="library-button library-button-upload"
                    onClick={onUpload}
                    disabled={busy}
                >
                    <Upload size={16} />
                    Upload
                </button>
            )}
        </div>
    );
}
