import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import DatabaseFilterEditor from './database-filter-editor';
import DatabaseSortEditor from './database-sort-editor';
import type { Property, ViewConfig } from './types';

type Props = {
    control: 'filters' | 'sorts';
    properties: Property[];
    config: ViewConfig;
    saving: boolean;
    error: string;
    onSave: (config: ViewConfig) => void;
    onClose: () => void;
};

export default function DatabaseQueryPanel({
    control,
    properties,
    config,
    saving,
    error,
    onSave,
    onClose,
}: Props) {
    const [draft, setDraft] = useState<ViewConfig>(() => ({
        [control]: config[control] ?? [],
    }));
    const isFilter = control === 'filters';
    return (
        <>
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 p-4">
                <div>
                    <h2 className="text-sm font-semibold">
                        {isFilter ? 'Filter documents' : 'Sort documents'}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Changes apply to this view when you save.
                    </p>
                </div>
                <button
                    type="button"
                    className="db-icon-button"
                    aria-label="Close panel"
                    disabled={saving}
                    onClick={onClose}
                >
                    <X size={15} />
                </button>
            </div>
            <fieldset
                disabled={saving}
                className="max-h-[min(55dvh,480px)] min-h-0 min-w-0 overflow-y-auto p-4 disabled:opacity-60"
            >
                {isFilter ? (
                    <DatabaseFilterEditor
                        properties={properties}
                        filters={draft.filters ?? []}
                        onChange={(filters) => setDraft({ filters })}
                    />
                ) : (
                    <DatabaseSortEditor
                        properties={properties}
                        sorts={draft.sorts ?? []}
                        onChange={(sorts) => setDraft({ sorts })}
                    />
                )}
            </fieldset>
            {error && (
                <p role="alert" className="px-4 pb-3 text-sm text-destructive">
                    {error}
                </p>
            )}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/20 p-3">
                <button
                    type="button"
                    className="db-toolbar-button"
                    disabled={saving || !draft[control]?.length}
                    onClick={() => setDraft({ [control]: [] })}
                >
                    Clear all
                </button>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="db-toolbar-button"
                        disabled={saving}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => onSave({ ...config, ...draft })}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground disabled:opacity-40"
                    >
                        {saving && (
                            <Loader2 size={13} className="animate-spin" />
                        )}
                        Apply {isFilter ? 'filters' : 'sorts'}
                    </button>
                </div>
            </div>
        </>
    );
}
