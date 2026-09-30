import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowDownUp,
    ArrowLeft,
    Database,
    Filter,
    GalleryHorizontalEnd,
    Loader2,
    Orbit,
    Plus,
    Search,
    SlidersHorizontal,
    Table2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import DatabaseOrbit from './database-orbit';
import { useTabView } from '@/components/navigation/use-tab-view';
import { csrfToken, uploadAttachment } from '@/components/editor/editor-api';
import { visibleDocuments, valueFor } from './database-data';
import DatabaseGallery from './database-gallery';
import DatabasePropertyManager from './database-property-manager';
import DatabaseTable from './database-table';
import DatabaseViewSettings, {
    type SettingsSection,
} from './database-view-settings';
import PropertyInput from './property-input';
import type { DatabasePageProps, Property, ViewConfig } from './types';

const viewTypes = [
    { id: 'table', label: 'Table', icon: Table2 },
    { id: 'gallery', label: 'Gallery', icon: GalleryHorizontalEnd },
    { id: 'orbit', label: 'Orbit', icon: Orbit },
] as const;

export default function ShowDatabase() {
    const page = usePage<DatabasePageProps>().props;
    return <DatabasePage key={page.database.id} page={page} />;
}

function DatabasePage({ page }: { page: DatabasePageProps }) {
    const {
        workspace,
        database,
        properties,
        documents,
        values,
        views,
        candidates,
        fileReferences,
        errors,
    } = page;
    const focusId =
        Number(
            new URLSearchParams(usePage().url.split('?')[1] ?? '').get('focus'),
        ) || null;
    const [title, setTitle] = useState(database.title);
    const [view, setView] = useTabView<'table' | 'gallery' | 'orbit'>(
        `database.${database.id}.view`,
        new URLSearchParams(usePage().url.split('?')[1] ?? '').get('view') ===
            'orbit'
            ? 'orbit'
            : 'table',
    );
    const [query, setQuery] = useTabView<string>(
        `database.${database.id}.query`,
        '',
    );
    const [searchOpen, setSearchOpen] = useState(false);
    const [settingsSection, setSettingsSection] =
        useState<SettingsSection | null>(null);
    const [propertyEditor, setPropertyEditor] = useState<
        Property | 'new' | null
    >(null);
    const [creating, setCreating] = useState(false);
    const [savingView, setSavingView] = useState(false);
    const [viewError, setViewError] = useState('');
    const base = `/workspaces/${workspace.id}/databases/${database.id}`;
    const config: ViewConfig = views[view] ?? {};
    const visibleIds =
        config.visible_property_ids ??
        properties.map((property) => property.id);
    const visibleProperties = properties
        .filter((property) => visibleIds.includes(property.id))
        .sort(
            (left, right) =>
                visibleIds.indexOf(left.id) - visibleIds.indexOf(right.id),
        );
    const shownDocuments = useMemo(
        () =>
            visibleDocuments(
                documents,
                properties,
                values,
                config.filters ?? [],
                config.sorts ?? [],
            ).filter((document) =>
                document.title
                    .toLocaleLowerCase()
                    .includes(query.toLocaleLowerCase()),
            ),
        [documents, properties, values, config.filters, config.sorts, query],
    );
    const parentUrl = database.parent_id
        ? `/workspaces/${workspace.id}/nodes/${database.parent_id}`
        : `/workspaces/${workspace.id}`;

    function saveView(next: ViewConfig) {
        setViewError('');
        router.put(
            `${base}/views/${view}`,
            next as Parameters<typeof router.put>[1],
            {
                preserveScroll: true,
                onStart: () => setSavingView(true),
                onFinish: () => setSavingView(false),
                onSuccess: () => setSettingsSection(null),
                onError: (messages) =>
                    setViewError(Object.values(messages).join(' ')),
            },
        );
    }
    function editProperty(property?: Property) {
        setSettingsSection(null);
        setPropertyEditor(property ?? 'new');
    }
    function createDocument() {
        router.post(
            `${base}/documents`,
            { title: 'Untitled' },
            {
                onStart: () => setCreating(true),
                onFinish: () => setCreating(false),
            },
        );
    }
    async function saveValue(
        documentId: number,
        propertyId: number,
        value: unknown,
    ) {
        const response = await fetch(
            `${base}/documents/${documentId}/properties/${propertyId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ value }),
            },
        );
        if (!response.ok) {
            const failure = (await response.json().catch(() => null)) as {
                message?: string;
            } | null;
            throw new Error(
                failure?.message ??
                    'Could not save this value. Please try again.',
            );
        }
        router.reload({ only: ['values', 'fileReferences'] });
    }
    function propertyCell(documentId: number, property: Property) {
        return (
            <PropertyInput
                property={property}
                workspaceId={workspace.id}
                documentId={documentId}
                value={valueFor(values, documentId, property.id)}
                candidates={candidates}
                files={fileReferences}
                onSave={(value) => saveValue(documentId, property.id, value)}
                onUpload={
                    property.type === 'files'
                        ? async (file) =>
                              (
                                  await uploadAttachment(
                                      workspace.id,
                                      documentId,
                                      file,
                                  )
                              ).id
                        : undefined
                }
            />
        );
    }

    return (
        <>
            <Head title={database.title} />
            <div className="mx-auto min-h-[65vh] max-w-[1120px]">
                <Link
                    href={parentUrl}
                    className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={16} />
                    Back to {workspace.name}
                </Link>
                <header className="mb-9 px-1">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-muted/35">
                            <Database
                                size={25}
                                strokeWidth={1.4}
                                className="text-foreground/75"
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Database
                        </span>
                    </div>
                    <input
                        aria-label="Database title"
                        value={title}
                        maxLength={255}
                        onChange={(event) => setTitle(event.target.value)}
                        onBlur={() => {
                            const next = title.trim();
                            if (!next) {
                                setTitle(database.title);
                                return;
                            }
                            if (next !== database.title)
                                router.patch(
                                    `/workspaces/${workspace.id}/nodes/${database.id}`,
                                    { title: next },
                                    { preserveScroll: true },
                                );
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter')
                                event.currentTarget.blur();
                        }}
                        className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground md:text-5xl"
                        placeholder="Untitled database"
                    />
                    <p className="mt-3 text-sm text-muted-foreground/75">
                        {documents.length}{' '}
                        {documents.length === 1 ? 'document' : 'documents'}
                        <span className="mx-2 text-border">·</span>
                        {properties.length}{' '}
                        {properties.length === 1 ? 'property' : 'properties'}
                    </p>
                </header>
                {Object.keys(errors).length > 0 &&
                    !propertyEditor &&
                    !settingsSection && (
                        <p
                            role="alert"
                            className="mb-4 text-sm text-destructive"
                        >
                            {Object.values(errors).join(' ')}
                        </p>
                    )}
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border/70">
                    <nav
                        aria-label="Database views"
                        className="flex shrink-0 gap-1"
                    >
                        {viewTypes.map(({ id, label, icon: Icon }) => (
                            <button
                                type="button"
                                key={id}
                                aria-pressed={view === id}
                                onClick={() => {
                                    setView(id);
                                    setSettingsSection(null);
                                }}
                                className={`relative flex items-center gap-2 border-b-2 px-3 pt-3 pb-3 text-[13px] transition-colors ${view === id ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <Icon size={15} strokeWidth={1.6} />
                                {label}
                            </button>
                        ))}
                    </nav>
                    <div className="flex flex-wrap items-center gap-0.5 pb-2">
                        <button
                            type="button"
                            onClick={() => setSettingsSection('filters')}
                            data-active={!!config.filters?.length}
                            className="db-toolbar-button"
                        >
                            <Filter size={14} />
                            Filter
                            {!!config.filters?.length && (
                                <span className="text-[10px]">
                                    {config.filters.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSettingsSection('sorts')}
                            data-active={!!config.sorts?.length}
                            className="db-toolbar-button"
                        >
                            <ArrowDownUp size={14} />
                            Sort
                            {!!config.sorts?.length && (
                                <span className="text-[10px]">
                                    {config.sorts.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            aria-label="Search database"
                            aria-expanded={searchOpen}
                            onClick={() => {
                                setSearchOpen(!searchOpen);
                                if (searchOpen) setQuery('');
                            }}
                            className="db-icon-button"
                        >
                            <Search size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label="View settings"
                            title="View settings"
                            onClick={() => setSettingsSection('properties')}
                            className="db-icon-button"
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                        <span className="mx-2 h-4 w-px bg-border/60" />
                        <button
                            type="button"
                            disabled={creating}
                            onClick={createDocument}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:opacity-85 disabled:opacity-40"
                        >
                            {creating ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : (
                                <Plus size={14} />
                            )}
                            New
                        </button>
                    </div>
                </div>
                {searchOpen && (
                    <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                        <Search size={14} className="text-muted-foreground" />
                        <input
                            autoFocus
                            aria-label="Search document titles"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    setSearchOpen(false);
                                    setQuery('');
                                }
                            }}
                            placeholder="Search documents…"
                            className="h-7 min-w-0 flex-1 bg-transparent text-sm outline-none"
                        />
                        <button
                            type="button"
                            aria-label="Close search"
                            className="db-icon-button"
                            onClick={() => {
                                setSearchOpen(false);
                                setQuery('');
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                {view === 'table' && (
                    <DatabaseTable
                        workspaceId={workspace.id}
                        documents={shownDocuments}
                        properties={visibleProperties}
                        config={config}
                        renderCell={propertyCell}
                        onEditProperty={editProperty}
                        onSaveView={saveView}
                        onCreate={createDocument}
                        creating={creating}
                    />
                )}
                {view === 'gallery' && shownDocuments.length > 0 && (
                    <DatabaseGallery
                        workspaceId={workspace.id}
                        documents={shownDocuments}
                        properties={visibleProperties}
                        values={values}
                        candidates={candidates}
                        files={fileReferences}
                        config={config}
                        onCreate={createDocument}
                        creating={creating}
                    />
                )}
                {view !== 'orbit' && !shownDocuments.length && (
                    <div className="flex flex-col items-center py-20 text-center">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted/50">
                            <Database
                                size={22}
                                strokeWidth={1.3}
                                className="text-muted-foreground"
                            />
                        </div>
                        <h2 className="text-base font-medium">
                            {documents.length
                                ? 'No matching documents'
                                : 'Your database starts here'}
                        </h2>
                        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                            {documents.length
                                ? 'Try another search or adjust your filters.'
                                : 'Add a document, then bring it into focus with properties.'}
                        </p>
                        <button
                            type="button"
                            disabled={creating}
                            onClick={() => {
                                if (documents.length) {
                                    setQuery('');
                                    saveView({ ...config, filters: [] });
                                } else createDocument();
                            }}
                            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                        >
                            <Plus size={14} />
                            {documents.length
                                ? 'Clear filters and search'
                                : 'Create a document'}
                        </button>
                    </div>
                )}
                {view === 'orbit' && (
                    <DatabaseOrbit
                        workspaceId={workspace.id}
                        database={database}
                        documents={shownDocuments}
                        allDocuments={documents}
                        focusId={focusId}
                        properties={visibleProperties.slice(0, 2)}
                        values={values}
                        candidates={candidates}
                        files={fileReferences}
                    />
                )}
                {view !== 'orbit' && shownDocuments.length > 0 && (
                    <p className="mt-4 px-3 text-[11px] text-muted-foreground/65">
                        {shownDocuments.length}{' '}
                        {shownDocuments.length === 1 ? 'document' : 'documents'}
                        {shownDocuments.length !== documents.length
                            ? ` of ${documents.length}`
                            : ''}
                    </p>
                )}
            </div>
            {settingsSection && (
                <DatabaseViewSettings
                    key={`${view}:${settingsSection}`}
                    properties={properties}
                    config={config}
                    view={view}
                    initialSection={settingsSection}
                    onSave={saveView}
                    onClose={() => setSettingsSection(null)}
                    onEditProperty={editProperty}
                    saving={savingView}
                    error={viewError}
                />
            )}
            {propertyEditor && (
                <DatabasePropertyManager
                    key={propertyEditor === 'new' ? 'new' : propertyEditor.id}
                    property={
                        propertyEditor === 'new' ? undefined : propertyEditor
                    }
                    base={base}
                    onClose={() => setPropertyEditor(null)}
                />
            )}
        </>
    );
}
