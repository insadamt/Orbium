import { router } from '@inertiajs/react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import DatabaseDialog from './database-dialog';
import { propertyTypes } from './property-presentation';
import { AppSelect } from '@/components/ui/app-select';
import type { Property, PropertyType } from './types';

type Props = { property?: Property; base: string; onClose: () => void };

export default function DatabasePropertyManager({
    property,
    base,
    onClose,
}: Props) {
    const [name, setName] = useState(property?.name ?? '');
    const [type, setType] = useState<PropertyType>(property?.type ?? 'text');
    const [options, setOptions] = useState(property?.config.options ?? []);
    const [newOption, setNewOption] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const hasOptions = type === 'select' || type === 'multi_select';
    const TypeIcon = propertyTypes[type].icon;

    function addOption() {
        const option = newOption.trim();
        if (option && !options.includes(option))
            setOptions([...options, option]);
        setNewOption('');
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        const allOptions = [
            ...new Set([
                ...options,
                ...(newOption.trim() ? [newOption.trim()] : []),
            ]),
        ];
        const payload = {
            name: name.trim(),
            type,
            config: hasOptions
                ? { ...property?.config, options: allOptions }
                : property?.type === type
                  ? property.config
                  : {},
        };
        const callbacks = {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: onClose,
            onError: (errors: Record<string, string>) =>
                setError(Object.values(errors).join(' ')),
        };
        if (property)
            router.patch(
                `${base}/properties/${property.id}`,
                payload as Parameters<typeof router.patch>[1],
                callbacks,
            );
        else
            router.post(
                `${base}/properties`,
                payload as Parameters<typeof router.post>[1],
                callbacks,
            );
    }
    function deleteProperty() {
        if (!property) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        router.delete(`${base}/properties/${property.id}`, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: onClose,
            onError: (errors) => setError(Object.values(errors).join(' ')),
        });
    }

    return (
        <DatabaseDialog
            open
            onClose={() => {
                if (!busy) onClose();
            }}
            title={property ? 'Edit property' : 'New property'}
            description="Give your documents a little more structure."
        >
            <form onSubmit={submit} className="flex min-h-0 flex-col">
                <div className="space-y-5 overflow-y-auto px-6 pt-2 pb-6">
                    <label className="block space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            Name
                        </span>
                        <input
                            autoFocus
                            aria-label="Property name"
                            className="db-field"
                            value={name}
                            maxLength={255}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Status, Deadline, Priority"
                            required
                        />
                    </label>
                    <label className="block space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            Type
                        </span>
                        <span className="relative block">
                            <TypeIcon
                                size={16}
                                className="pointer-events-none absolute top-3 left-3 text-muted-foreground"
                            />
                            <AppSelect
                                label="Property type"
                                className="db-field !pl-10"
                                value={type}
                                onValueChange={(value) =>
                                    setType(value as PropertyType)
                                }
                                options={(
                                    Object.keys(propertyTypes) as PropertyType[]
                                ).map((item) => ({
                                    value: item,
                                    label: propertyTypes[item].label,
                                }))}
                            />
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            {propertyTypes[type].description}
                        </span>
                    </label>
                    {hasOptions && (
                        <div>
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Options
                            </p>
                            <div className="mb-3 flex flex-wrap gap-2">
                                {options.map((option) => (
                                    <span
                                        key={option}
                                        className="db-chip !py-1"
                                    >
                                        <span>{option}</span>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${option}`}
                                            onClick={() =>
                                                setOptions(
                                                    options.filter(
                                                        (item) =>
                                                            item !== option,
                                                    ),
                                                )
                                            }
                                            className="rounded p-0.5 hover:bg-background"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    aria-label="New option"
                                    value={newOption}
                                    maxLength={100}
                                    onChange={(event) =>
                                        setNewOption(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            addOption();
                                        }
                                    }}
                                    placeholder="Add an option…"
                                    className="db-field"
                                />
                                <button
                                    type="button"
                                    aria-label="Add option"
                                    disabled={!newOption.trim()}
                                    onClick={addOption}
                                    className="db-icon-button !h-10 !w-10 border border-border"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    {confirmDelete && (
                        <p
                            role="alert"
                            className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
                        >
                            Delete “{property?.name}” and all its saved values?
                            This cannot be undone.
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
                    {property && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={deleteProperty}
                            className="mr-auto flex items-center gap-2 rounded-md px-2 py-2 text-xs text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 size={14} />
                            {confirmDelete
                                ? 'Confirm delete'
                                : 'Delete property'}
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="db-toolbar-button ml-auto"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={busy || !name.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
                    >
                        {busy && <Loader2 size={14} className="animate-spin" />}
                        {property ? 'Save changes' : 'Create property'}
                    </button>
                </div>
            </form>
        </DatabaseDialog>
    );
}
