import {
    ArrowDown,
    ArrowUp,
    Check,
    Eye,
    EyeOff,
    Loader2,
    Plus,
    X,
} from 'lucide-react';
import { useState } from 'react';
import DatabaseDialog from './database-dialog';
import DatabaseFilterEditor from './database-filter-editor';
import { propertyTypes } from './property-presentation';
import type { Property, ViewConfig } from './types';

export type SettingsSection = 'properties' | 'filters' | 'sorts';
type Props = {
    properties: Property[];
    config: ViewConfig;
    view: string;
    initialSection: SettingsSection;
    onSave: (next: ViewConfig) => void;
    onClose: () => void;
    onEditProperty: (property?: Property) => void;
    saving: boolean;
    error: string;
};

export default function DatabaseViewSettings({
    properties,
    config,
    view,
    initialSection,
    onSave,
    onClose,
    onEditProperty,
    saving,
    error,
}: Props) {
    const [section, setSection] = useState(initialSection);
    const [draft, setDraft] = useState<ViewConfig>(() => ({
        ...config,
        visible_property_ids: (
            config.visible_property_ids ??
            properties.map((property) => property.id)
        ).filter((id) => properties.some((property) => property.id === id)),
        filters: (config.filters ?? []).filter((filter) =>
            properties.some((property) => property.id === filter.property_id),
        ),
        sorts: (config.sorts ?? []).filter(
            (sort) =>
                sort.field === 'title' ||
                properties.some(
                    (property) => String(property.id) === String(sort.field),
                ),
        ),
    }));
    const visibleIds = draft.visible_property_ids ?? [];
    const orderedProperties = [...properties].sort((left, right) => {
        const leftIndex = visibleIds.indexOf(left.id),
            rightIndex = visibleIds.indexOf(right.id);
        return (
            (leftIndex < 0 ? properties.length + left.position : leftIndex) -
            (rightIndex < 0 ? properties.length + right.position : rightIndex)
        );
    });
    function moveProperty(id: number, direction: number) {
        const next = [...visibleIds],
            index = next.indexOf(id),
            target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setDraft({ ...draft, visible_property_ids: next });
    }

    return (
        <DatabaseDialog
            open
            onClose={() => {
                if (!saving) onClose();
            }}
            title="View settings"
            description={`Customize how your ${view} view displays documents.`}
        >
            <div className="flex gap-1 border-b border-border/60 px-6">
                {(['properties', 'filters', 'sorts'] as const).map((item) => (
                    <button
                        type="button"
                        key={item}
                        aria-pressed={section === item}
                        onClick={() => setSection(item)}
                        className={`border-b-2 px-3 py-3 text-sm capitalize ${section === item ? 'border-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        {item}
                    </button>
                ))}
            </div>
            <div className="min-h-52 overflow-y-auto px-6 py-5">
                {section === 'properties' && (
                    <div className="space-y-4">
                        {view === 'orbit' && (
                            <p className="text-xs text-muted-foreground">
                                Orbit shows the first two visible properties on
                                selected nodes.
                            </p>
                        )}
                        {view === 'gallery' && (
                            <div className="border-b border-border/60 pb-4">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    Card preview
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['cover', 'body', 'none'] as const).map(
                                        (mode) => (
                                            <button
                                                type="button"
                                                key={mode}
                                                onClick={() =>
                                                    setDraft({
                                                        ...draft,
                                                        preview: mode,
                                                    })
                                                }
                                                aria-pressed={
                                                    (draft.preview ??
                                                        'cover') === mode
                                                }
                                                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${(draft.preview ?? 'cover') === mode ? 'border-ring bg-muted' : 'border-border/60'}`}
                                            >
                                                {mode === 'body'
                                                    ? 'Content'
                                                    : mode === 'cover'
                                                      ? 'Cover'
                                                      : 'None'}
                                                {(draft.preview ?? 'cover') ===
                                                    mode && <Check size={13} />}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Choose the properties to show and their order.
                        </p>
                        {!properties.length && (
                            <p className="py-4 text-sm text-muted-foreground">
                                Add your first property to organize these
                                documents.
                            </p>
                        )}
                        <div>
                            {orderedProperties.map((property) => {
                                const Icon = propertyTypes[property.type].icon;
                                const visible = visibleIds.includes(
                                    property.id,
                                );
                                return (
                                    <div
                                        key={property.id}
                                        className="group flex items-center gap-2 rounded-lg py-1 hover:bg-muted/30"
                                    >
                                        <Icon
                                            size={15}
                                            className="ml-2 shrink-0 text-muted-foreground"
                                        />
                                        <button
                                            type="button"
                                            className="min-w-0 flex-1 truncate py-2 text-left text-sm"
                                            onClick={() =>
                                                onEditProperty(property)
                                            }
                                        >
                                            {property.name}
                                        </button>
                                        {visible && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="db-icon-button"
                                                    aria-label={`Move ${property.name} up`}
                                                    disabled={
                                                        visibleIds.indexOf(
                                                            property.id,
                                                        ) === 0
                                                    }
                                                    onClick={() =>
                                                        moveProperty(
                                                            property.id,
                                                            -1,
                                                        )
                                                    }
                                                >
                                                    <ArrowUp size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="db-icon-button"
                                                    aria-label={`Move ${property.name} down`}
                                                    disabled={
                                                        visibleIds.indexOf(
                                                            property.id,
                                                        ) ===
                                                        visibleIds.length - 1
                                                    }
                                                    onClick={() =>
                                                        moveProperty(
                                                            property.id,
                                                            1,
                                                        )
                                                    }
                                                >
                                                    <ArrowDown size={13} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            className="db-icon-button"
                                            aria-label={`${visible ? 'Hide' : 'Show'} ${property.name}`}
                                            aria-pressed={visible}
                                            onClick={() =>
                                                setDraft({
                                                    ...draft,
                                                    visible_property_ids:
                                                        visible
                                                            ? visibleIds.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      property.id,
                                                              )
                                                            : [
                                                                  ...visibleIds,
                                                                  property.id,
                                                              ],
                                                })
                                            }
                                        >
                                            {visible ? (
                                                <Eye size={15} />
                                            ) : (
                                                <EyeOff size={15} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            className="db-toolbar-button"
                            onClick={() => onEditProperty()}
                        >
                            <Plus size={14} />
                            Add property
                        </button>
                    </div>
                )}
                {section === 'filters' && (
                    <DatabaseFilterEditor
                        properties={properties}
                        filters={draft.filters ?? []}
                        onChange={(filters) => setDraft({ ...draft, filters })}
                    />
                )}
                {section === 'sorts' && (
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                            Sort documents in this priority order.
                        </p>
                        {!(draft.sorts ?? []).length && (
                            <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                                Documents appear in their original order.
                            </p>
                        )}
                        {(draft.sorts ?? []).map((sort, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2"
                            >
                                <span className="w-4 text-xs text-muted-foreground">
                                    {index + 1}
                                </span>
                                <select
                                    aria-label={`Sort ${index + 1} property`}
                                    className="db-field flex-1"
                                    value={sort.field}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            sorts: draft.sorts?.map(
                                                (item, position) =>
                                                    position === index
                                                        ? {
                                                              ...item,
                                                              field: event
                                                                  .target.value,
                                                          }
                                                        : item,
                                            ),
                                        })
                                    }
                                >
                                    <option value="title">Title</option>
                                    {properties.map((property) => (
                                        <option
                                            key={property.id}
                                            value={property.id}
                                        >
                                            {property.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    aria-label={`Sort ${index + 1} direction`}
                                    className="db-field !w-28"
                                    value={sort.direction}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            sorts: draft.sorts?.map(
                                                (item, position) =>
                                                    position === index
                                                        ? {
                                                              ...item,
                                                              direction: event
                                                                  .target
                                                                  .value as
                                                                  | 'asc'
                                                                  | 'desc',
                                                          }
                                                        : item,
                                            ),
                                        })
                                    }
                                >
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </select>
                                <button
                                    type="button"
                                    aria-label={`Remove sort ${index + 1}`}
                                    className="db-icon-button"
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            sorts: draft.sorts?.filter(
                                                (_, position) =>
                                                    position !== index,
                                            ),
                                        })
                                    }
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="db-toolbar-button"
                            disabled={(draft.sorts?.length ?? 0) >= 10}
                            onClick={() =>
                                setDraft({
                                    ...draft,
                                    sorts: [
                                        ...(draft.sorts ?? []),
                                        { field: 'title', direction: 'asc' },
                                    ],
                                })
                            }
                        >
                            <Plus size={14} />
                            Add sort
                        </button>
                    </div>
                )}
                {error && (
                    <p role="alert" className="mt-4 text-sm text-destructive">
                        {error}
                    </p>
                )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
                <button
                    type="button"
                    className="db-toolbar-button"
                    onClick={onClose}
                    disabled={saving}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => onSave(draft)}
                    className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
                >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Apply changes
                </button>
            </div>
        </DatabaseDialog>
    );
}
