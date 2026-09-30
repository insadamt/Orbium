import { Check, Paperclip } from 'lucide-react';
import { displayValue } from './database-data';
import { selectedValues } from './property-presentation';
import type { Candidate, FileReference, Property } from './types';

type Props = {
    property: Property;
    value: unknown;
    candidates: Candidate[];
    files: FileReference[];
    emptyLabel?: string;
};

export default function PropertyValue({
    property,
    value,
    candidates,
    files,
    emptyLabel = 'Empty',
}: Props) {
    const selected = selectedValues(value);
    if (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && !selected.length)
    )
        return (
            <span className="truncate text-muted-foreground/45">
                {emptyLabel}
            </span>
        );
    if (property.type === 'checkbox')
        return (
            <span
                className={`inline-flex size-4 items-center justify-center rounded border ${value ? 'border-foreground bg-foreground text-background' : 'border-border'}`}
            >
                {value === true && <Check size={12} />}
            </span>
        );
    if (property.type === 'select' || property.type === 'multi_select') {
        const labels =
            property.type === 'select'
                ? [displayValue(value)]
                : selected.map(String);
        return (
            <span className="flex min-w-0 items-center gap-1 overflow-hidden">
                {labels.slice(0, 2).map((label) => (
                    <span key={label} className="db-chip">
                        <span className="truncate">{label}</span>
                    </span>
                ))}
                {labels.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                        +{labels.length - 2}
                    </span>
                )}
            </span>
        );
    }
    if (property.type === 'mention' || property.type === 'files') {
        const labels = selected.map((id) =>
            property.type === 'mention'
                ? (candidates.find((candidate) => candidate.id === id)?.title ??
                  'Unavailable reference')
                : (files.find((file) => file.id === id)?.original_name ??
                  'Attachment'),
        );
        return (
            <span className="flex min-w-0 items-center gap-1.5">
                {property.type === 'files' && (
                    <Paperclip
                        size={13}
                        className="shrink-0 text-muted-foreground"
                    />
                )}
                <span
                    className={`truncate ${property.type === 'mention' ? 'underline decoration-border underline-offset-4' : ''}`}
                >
                    {labels[0]}
                </span>
                {labels.length > 1 && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                        +{labels.length - 1}
                    </span>
                )}
            </span>
        );
    }
    if (property.type === 'date' && typeof value === 'string') {
        const date = new Date(`${value}T12:00:00`);
        if (!Number.isNaN(date.getTime()))
            return (
                <span>
                    {date.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </span>
            );
    }
    return <span className="truncate">{displayValue(value)}</span>;
}
