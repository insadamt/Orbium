import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import type { Property, Sort } from './types';

type Props = {
    properties: Property[];
    sorts: Sort[];
    onChange: (sorts: Sort[]) => void;
};

export default function DatabaseSortEditor({
    properties,
    sorts,
    onChange,
}: Props) {
    function updateSort(index: number, changes: Partial<Sort>) {
        onChange(
            sorts.map((sort, position) =>
                position === index ? { ...sort, ...changes } : sort,
            ),
        );
    }
    function moveSort(index: number, direction: -1 | 1) {
        const next = [...sorts];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    }
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                The first rule has the highest priority. Move rules to change
                their order.
            </p>
            {!sorts.length && (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    Documents appear in their original order.
                </p>
            )}
            {sorts.map((sort, index) => (
                <div
                    key={index}
                    className="space-y-2 rounded-xl border border-border/70 p-3"
                >
                    <div className="flex items-center gap-1">
                        <span className="flex-1 text-xs font-medium text-muted-foreground">
                            {index === 0 ? 'Sort by' : 'Then by'}
                        </span>
                        <button
                            type="button"
                            className="db-icon-button"
                            aria-label={`Move sort ${index + 1} up`}
                            disabled={index === 0}
                            onClick={() => moveSort(index, -1)}
                        >
                            <ArrowUp size={14} />
                        </button>
                        <button
                            type="button"
                            className="db-icon-button"
                            aria-label={`Move sort ${index + 1} down`}
                            disabled={index === sorts.length - 1}
                            onClick={() => moveSort(index, 1)}
                        >
                            <ArrowDown size={14} />
                        </button>
                        <button
                            type="button"
                            className="db-icon-button"
                            aria-label={`Remove sort ${index + 1}`}
                            onClick={() =>
                                onChange(
                                    sorts.filter(
                                        (_, position) => position !== index,
                                    ),
                                )
                            }
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <AppSelect
                            label={`Sort ${index + 1} property`}
                            className="db-field min-w-0 flex-1"
                            value={sort.field}
                            onValueChange={(field) =>
                                updateSort(index, { field })
                            }
                            options={[
                                { value: 'title', label: 'Title' },
                                ...properties.map((property) => ({
                                    value: String(property.id),
                                    label: property.name,
                                })),
                            ]}
                        />
                        <AppSelect
                            label={`Sort ${index + 1} direction`}
                            className="db-field !w-32"
                            value={sort.direction}
                            onValueChange={(value) =>
                                updateSort(index, {
                                    direction: value as Sort['direction'],
                                })
                            }
                            options={[
                                { value: 'asc', label: 'Ascending' },
                                { value: 'desc', label: 'Descending' },
                            ]}
                        />
                    </div>
                </div>
            ))}
            <button
                type="button"
                className="db-toolbar-button"
                disabled={sorts.length >= 10}
                onClick={() =>
                    onChange([...sorts, { field: 'title', direction: 'asc' }])
                }
            >
                <Plus size={14} />
                Add sort
            </button>
        </div>
    );
}
