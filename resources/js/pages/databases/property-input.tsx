import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    ArrowUpRight,
    Check,
    Loader2,
    Paperclip,
    Search,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { displayValue } from './database-data';
import { selectedValues } from './property-presentation';
import PropertyValue from './property-value';
import type { Candidate, FileReference, Property } from './types';
import './database.css';

type Props = {
    property: Property;
    value: unknown;
    candidates: Candidate[];
    files?: FileReference[];
    workspaceId: number;
    documentId: number;
    onSave: (value: unknown) => Promise<void>;
    onUpload?: (file: File) => Promise<number>;
};

export default function PropertyInput({
    property,
    value,
    candidates,
    files = [],
    workspaceId,
    documentId,
    onSave,
    onUpload,
}: Props) {
    const [draft, setDraft] = useState(value);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<FileReference[]>([]);
    const fileInput = useRef<HTMLInputElement>(null);
    const cancelBlur = useRef(false);
    useEffect(() => setDraft(value), [value]);
    const selected = selectedValues(draft);
    const knownFiles = [...files, ...uploadedFiles];

    async function save(next: unknown) {
        setDraft(next);
        setError('');
        setBusy(true);
        try {
            await onSave(next);
        } catch (failure) {
            setDraft(value);
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not save this value.',
            );
        } finally {
            setBusy(false);
        }
    }

    async function upload(file: File) {
        if (!onUpload) return;
        setBusy(true);
        setError('');
        try {
            const id = await onUpload(file);
            setUploadedFiles((current) => [
                ...current,
                { id, original_name: file.name },
            ]);
            await save([...selected, id]);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not upload this file. Please try again.',
            );
        } finally {
            setBusy(false);
        }
    }

    function commitText() {
        if (cancelBlur.current) {
            cancelBlur.current = false;
            return;
        }
        const text = displayValue(draft);
        const next =
            text === ''
                ? null
                : property.type === 'number'
                  ? Number(text)
                  : text;
        if (next !== (value ?? null)) void save(next);
    }

    const isPicker = [
        'select',
        'multi_select',
        'mention',
        'files',
        'date',
    ].includes(property.type);
    const choices =
        property.type === 'mention'
            ? candidates.map((candidate) => ({
                  id: candidate.id,
                  label: candidate.title,
                  kind: candidate.type,
              }))
            : (property.config.options ?? []).map((option) => ({
                  id: option,
                  label: option,
                  kind: '',
              }));
    const filteredChoices = choices.filter((choice) =>
        choice.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    );

    return (
        <div className="relative min-w-0 text-[13px]" aria-busy={busy}>
            {property.type === 'checkbox' ? (
                <div className="flex h-[43px] items-center px-3">
                    <input
                        type="checkbox"
                        aria-label={property.name}
                        checked={draft === true}
                        disabled={busy}
                        onChange={(event) => void save(event.target.checked)}
                        className="size-4 cursor-pointer rounded border-border accent-foreground disabled:opacity-50"
                    />
                </div>
            ) : isPicker ? (
                <DropdownMenu.Root
                    open={open}
                    onOpenChange={(next) => {
                        setOpen(next);
                        if (next) setQuery('');
                    }}
                    modal={false}
                >
                    <DropdownMenu.Trigger asChild>
                        <button
                            type="button"
                            aria-label={`Edit ${property.name}`}
                            disabled={busy}
                            className="flex min-h-[43px] w-full items-center overflow-hidden px-3 text-left outline-none hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset disabled:opacity-60"
                        >
                            <PropertyValue
                                property={property}
                                value={draft}
                                candidates={candidates}
                                files={knownFiles}
                            />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            className="db-menu w-64"
                            align="start"
                            sideOffset={4}
                        >
                            <DropdownMenu.Label className="px-2.5 py-2 text-xs text-muted-foreground">
                                {property.name}
                            </DropdownMenu.Label>
                            {property.type === 'date' ? (
                                <div className="px-2 pb-2">
                                    <input
                                        aria-label={property.name}
                                        type="date"
                                        className="db-field"
                                        value={displayValue(draft)}
                                        onChange={(event) =>
                                            void save(
                                                event.target.value || null,
                                            )
                                        }
                                    />
                                </div>
                            ) : property.type === 'files' ? (
                                <>
                                    {selected.map((id) => (
                                        <div
                                            key={id}
                                            className="flex items-center gap-1"
                                        >
                                            <DropdownMenu.Item
                                                asChild
                                                className="db-menu-item min-w-0 flex-1"
                                            >
                                                <a
                                                    href={`/workspaces/${workspaceId}/documents/${documentId}/attachments/${id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Paperclip
                                                        size={14}
                                                        className="shrink-0"
                                                    />
                                                    <span className="truncate">
                                                        {knownFiles.find(
                                                            (file) =>
                                                                file.id === id,
                                                        )?.original_name ??
                                                            'Attachment'}
                                                    </span>
                                                    <ArrowUpRight
                                                        size={13}
                                                        className="ml-auto shrink-0"
                                                    />
                                                </a>
                                            </DropdownMenu.Item>
                                            <button
                                                type="button"
                                                aria-label={`Remove ${knownFiles.find((file) => file.id === id)?.original_name ?? 'attachment'}`}
                                                className="db-icon-button"
                                                disabled={busy}
                                                onClick={() =>
                                                    void save(
                                                        selected.filter(
                                                            (item) =>
                                                                item !== id,
                                                        ),
                                                    )
                                                }
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <DropdownMenu.Item
                                        disabled={busy || !onUpload}
                                        className="db-menu-item"
                                        onSelect={() =>
                                            fileInput.current?.click()
                                        }
                                    >
                                        <Upload size={15} />
                                        Upload a file
                                    </DropdownMenu.Item>
                                </>
                            ) : (
                                <>
                                    <div className="mx-1 mb-1 flex items-center gap-2 rounded-md border border-border px-2">
                                        <Search
                                            size={14}
                                            className="text-muted-foreground"
                                        />
                                        <input
                                            aria-label={`Search ${property.name}`}
                                            value={query}
                                            onChange={(event) =>
                                                setQuery(event.target.value)
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key.length === 1 ||
                                                    event.key === ' '
                                                )
                                                    event.stopPropagation();
                                            }}
                                            placeholder={
                                                property.type === 'mention'
                                                    ? 'Find a page…'
                                                    : 'Find an option…'
                                            }
                                            className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none"
                                        />
                                    </div>
                                    <div className="max-h-56 overflow-y-auto">
                                        {filteredChoices.map((choice) => {
                                            const checked =
                                                property.type === 'select'
                                                    ? draft === choice.id
                                                    : selected.includes(
                                                          choice.id,
                                                      );
                                            return (
                                                <DropdownMenu.Item
                                                    key={choice.id}
                                                    className="db-menu-item"
                                                    disabled={busy}
                                                    onSelect={(event) => {
                                                        if (
                                                            property.type !==
                                                            'select'
                                                        )
                                                            event.preventDefault();
                                                        void save(
                                                            property.type ===
                                                                'select'
                                                                ? choice.id
                                                                : checked
                                                                  ? selected.filter(
                                                                        (id) =>
                                                                            id !==
                                                                            choice.id,
                                                                    )
                                                                  : [
                                                                        ...selected,
                                                                        choice.id,
                                                                    ],
                                                        );
                                                    }}
                                                >
                                                    <span className="min-w-0 flex-1 truncate">
                                                        {choice.label}
                                                    </span>
                                                    {choice.kind && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {choice.kind}
                                                        </span>
                                                    )}
                                                    {checked && (
                                                        <Check size={14} />
                                                    )}
                                                </DropdownMenu.Item>
                                            );
                                        })}
                                        {!filteredChoices.length && (
                                            <p className="px-3 py-5 text-center text-xs text-muted-foreground">
                                                {choices.length
                                                    ? 'No matches.'
                                                    : 'No options yet. Add options in the property settings.'}
                                            </p>
                                        )}
                                    </div>
                                    {property.type === 'mention' &&
                                        selected.length > 0 && (
                                            <>
                                                <DropdownMenu.Separator className="my-1 h-px bg-border/60" />
                                                {selected.map((id) => (
                                                    <DropdownMenu.Item
                                                        key={id}
                                                        asChild
                                                        className="db-menu-item"
                                                    >
                                                        <a
                                                            href={`/workspaces/${workspaceId}/nodes/${id}`}
                                                        >
                                                            <ArrowUpRight
                                                                size={14}
                                                            />
                                                            <span className="truncate">
                                                                Open{' '}
                                                                {candidates.find(
                                                                    (
                                                                        candidate,
                                                                    ) =>
                                                                        candidate.id ===
                                                                        id,
                                                                )?.title ??
                                                                    'reference'}
                                                            </span>
                                                        </a>
                                                    </DropdownMenu.Item>
                                                ))}
                                            </>
                                        )}
                                </>
                            )}
                            {draft !== null &&
                                draft !== undefined &&
                                draft !== '' &&
                                (!Array.isArray(draft) ||
                                    selected.length > 0) && (
                                    <>
                                        <DropdownMenu.Separator className="my-1 h-px bg-border/60" />
                                        <DropdownMenu.Item
                                            disabled={busy}
                                            className="db-menu-item text-muted-foreground"
                                            onSelect={() => void save(null)}
                                        >
                                            <X size={14} />
                                            Clear value
                                        </DropdownMenu.Item>
                                    </>
                                )}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            ) : (
                <input
                    aria-label={property.name}
                    type={
                        property.type === 'number'
                            ? 'number'
                            : property.type === 'url'
                              ? 'url'
                              : property.type === 'email'
                                ? 'email'
                                : 'text'
                    }
                    step={property.type === 'number' ? 'any' : undefined}
                    className="db-cell-input"
                    placeholder="Empty"
                    value={displayValue(draft)}
                    disabled={busy}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commitText}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') event.currentTarget.blur();
                        if (event.key === 'Escape') {
                            cancelBlur.current = true;
                            setDraft(value);
                            event.currentTarget.blur();
                        }
                    }}
                />
            )}
            {property.type === 'files' && (
                <input
                    ref={fileInput}
                    type="file"
                    className="hidden"
                    aria-label={`Upload ${property.name}`}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) void upload(file);
                    }}
                />
            )}
            {busy && (
                <Loader2
                    size={12}
                    aria-label="Saving"
                    className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 animate-spin text-muted-foreground"
                />
            )}
            {error && (
                <p role="alert" className="px-3 pb-2 text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
