import { Plus, X } from 'lucide-react';
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
                            <select
                                aria-label={`Filter ${index + 1} property`}
                                className="db-field flex-1"
                                value={filter.property_id}
                                onChange={(event) =>
                                    update(index, {
                                        property_id: Number(event.target.value),
                                        value: '',
                                    })
                                }
                            >
                                {properties.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
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
                            <select
                                aria-label={`Filter ${index + 1} condition`}
                                className="db-field !w-28 shrink-0"
                                value={filter.operator}
                                onChange={(event) =>
                                    update(index, {
                                        operator: event.target
                                            .value as Filter['operator'],
                                    })
                                }
                            >
                                <option value="is">is</option>
                                <option value="is_not">is not</option>
                                <option value="contains">contains</option>
                                <option value="is_empty">is empty</option>
                            </select>
                            {filter.operator !== 'is_empty' &&
                                (property?.type === 'select' ||
                                property?.type === 'multi_select' ? (
                                    <select
                                        aria-label={`Filter ${index + 1} value`}
                                        className="db-field"
                                        value={displayValue(filter.value)}
                                        onChange={(event) =>
                                            update(index, {
                                                value: event.target.value,
                                            })
                                        }
                                    >
                                        <option value="">
                                            Choose an option
                                        </option>
                                        {(property.config.options ?? []).map(
                                            (option) => (
                                                <option key={option}>
                                                    {option}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                ) : property?.type === 'checkbox' ? (
                                    <select
                                        aria-label={`Filter ${index + 1} value`}
                                        className="db-field"
                                        value={displayValue(filter.value)}
                                        onChange={(event) =>
                                            update(index, {
                                                value:
                                                    event.target.value ===
                                                    'true',
                                            })
                                        }
                                    >
                                        <option value="">Choose a value</option>
                                        <option value="true">Checked</option>
                                        <option value="false">Unchecked</option>
                                    </select>
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
