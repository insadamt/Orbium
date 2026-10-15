import { X } from 'lucide-react';
import { displayValue } from './database-data';
import type { Filter, Property, ViewConfig } from './types';

type Props = {
    properties: Property[];
    config: ViewConfig;
    saving: boolean;
    onSave: (config: ViewConfig) => void;
};
const operatorLabels: Record<Filter['operator'], string> = {
    is: 'is',
    is_not: 'is not',
    contains: 'contains',
    is_empty: 'is empty',
};

export default function DatabaseFilterChips({
    properties,
    config,
    saving,
    onSave,
}: Props) {
    const filters = config.filters ?? [];
    if (!filters.length) return null;
    return (
        <div
            aria-label="Active filters"
            className="flex flex-wrap items-center gap-2 border-b border-border/50 py-3"
        >
            <span className="text-xs text-muted-foreground">Matching all:</span>
            {filters.map((filter, index) => {
                const property = properties.find(
                    (item) => item.id === filter.property_id,
                );
                const value =
                    property?.type === 'checkbox' &&
                    typeof filter.value === 'boolean'
                        ? filter.value
                            ? 'Checked'
                            : 'Unchecked'
                        : displayValue(filter.value);
                const label = `${property?.name ?? 'Property'} ${operatorLabels[filter.operator]}${filter.operator === 'is_empty' ? '' : ` ${value}`}`;
                return (
                    <button
                        key={index}
                        type="button"
                        disabled={saving}
                        aria-label={`Remove filter: ${label}`}
                        title={label}
                        onClick={() =>
                            onSave({
                                ...config,
                                filters: filters.filter(
                                    (_, position) => position !== index,
                                ),
                            })
                        }
                        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40"
                    >
                        <span className="truncate">{label}</span>
                        <X size={12} className="shrink-0" />
                    </button>
                );
            })}
            <button
                type="button"
                disabled={saving}
                className="db-toolbar-button"
                onClick={() => onSave({ ...config, filters: [] })}
            >
                Clear all
            </button>
        </div>
    );
}
