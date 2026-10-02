import { Plus, X } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { displayValue } from './database-data';
import type { Filter, Property } from './types';

type Props = {
    properties: Property[];
    filters: Filter[];
    onChange: (filters: Filter[]) => void;
};

export default function DatabaseFilterEditor({
    properties,
    filters,
    onChange,
}: Props) {
    function update(index: number, changes: Partial<Filter>) {
        onChange(
            filters.map((filter, item) =>
                item === index ? { ...filter, ...changes } : filter,
            ),
        );
    }
    return (
        <div className="space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
                Show documents that match every condition.
            </p>
            {!filters.length && (
                <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                    All documents are visible.
                </p>
            )}
            {filters.map((filter, index) => {
                const property = properties.find(
                    (item) => item.id === filter.property_id,
                );
                return (
                    <div
                        key={index}
                        className="space-y-2 rounded-xl border border-border/70 p-3"
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-10 text-xs text-muted-foreground">
                                {index ? 'And' : 'Where'}
                            </span>
                            <AppSelect
                                label={`Filter ${index + 1} property`}
                                className="db-field flex-1"
                                value={String(filter.property_id)}
                                onValueChange={(value) =>
                                    update(index, {
                                        property_id: Number(value),
                                        value: '',
                                    })
                                }
                                options={properties.map((item) => ({
                                    value: String(item.id),
                                    label: item.name,
                                }))}
                            />
                            <button
                                type="button"
                                aria-label={`Remove filter ${index + 1}`}
                                className="db-icon-button"
                                onClick={() =>
                                    onChange(
                                        filters.filter(
                                            (_, item) => item !== index,
                                        ),
                                    )
                                }
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <div className="flex gap-2 pl-12">
                            <AppSelect
                                label={`Filter ${index + 1} condition`}
                                className="db-field !w-28 shrink-0"
                                value={filter.operator}
                                onValueChange={(value) =>
                                    update(index, {
                                        operator: value as Filter['operator'],
                                    })
                                }
                                options={[
                                    { value: 'is', label: 'is' },
                                    { value: 'is_not', label: 'is not' },
                                    { value: 'contains', label: 'contains' },
                                    { value: 'is_empty', label: 'is empty' },
                                ]}
                            />
                            {filter.operator !== 'is_empty' &&
                                (property?.type === 'select' ||
                                property?.type === 'multi_select' ? (
                                    <AppSelect
                                        label={`Filter ${index + 1} value`}
                                        className="db-field"
                                        value={displayValue(filter.value)}
                                        placeholder="Choose an option"
                                        clearLabel="Clear value"
                                        onValueChange={(value) =>
                                            update(index, {
                                                value,
                                            })
                                        }
                                        options={(property.config.options ?? [])
                                            .filter(Boolean)
                                            .map((option) => ({
                                                value: option,
                                                label: option,
                                            }))}
                                    />
                                ) : property?.type === 'checkbox' ? (
                                    <AppSelect
                                        label={`Filter ${index + 1} value`}
                                        className="db-field"
                                        value={displayValue(filter.value)}
                                        placeholder="Choose a value"
                                        clearLabel="Clear value"
                                        onValueChange={(value) =>
                                            update(index, {
                                                value:
                                                    value === ''
                                                        ? ''
                                                        : value === 'true',
                                            })
                                        }
                                        options={[
                                            { value: 'true', label: 'Checked' },
                                            {
                                                value: 'false',
                                                label: 'Unchecked',
                                            },
                                        ]}
                                    />
                                ) : (
                                    <input
                                        aria-label={`Filter ${index + 1} value`}
                                        className="db-field"
                                        type={
                                            property?.type === 'date'
                                                ? 'date'
                                                : property?.type === 'number'
                                                  ? 'number'
                                                  : 'text'
                                        }
                                        value={displayValue(filter.value)}
                                        onChange={(event) =>
                                            update(index, {
                                                value: event.target.value,
                                            })
                                        }
                                        placeholder="Value…"
                                    />
                                ))}
                        </div>
                    </div>
                );
            })}
            <button
                type="button"
                disabled={!properties.length || filters.length >= 10}
                onClick={() =>
                    onChange([
                        ...filters,
                        {
                            property_id: properties[0].id,
                            operator: 'is',
                            value: '',
                        },
                    ])
                }
                className="db-toolbar-button disabled:opacity-40"
            >
                <Plus size={14} />
                Add condition
            </button>
        </div>
    );
}
