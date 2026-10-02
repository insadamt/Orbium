import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowDownUp,
    Database as DatabaseIcon,
    Filter,
    GalleryHorizontalEnd,
    Loader2,
    Plus,
    SlidersHorizontal,
    Table2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePageSearch } from '@/components/navigation/page-search';
import { useContainerView } from '@/components/navigation/use-container-view';
import { NodeMediaHeader } from '@/components/hierarchy/node-media-header';
import { csrfToken, uploadAttachment } from '@/components/editor/editor-api';
import {
    indexDatabaseValues,
    visibleDocuments,
    valueFor,
} from './database-data';
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
    const [storedView, setView] = useContainerView<'table' | 'gallery'>(
        `database.${database.id}.view`,
        'table',
    );
    const view = storedView === 'gallery' ? 'gallery' : 'table';
    const pageSearch = usePageSearch();
    const query = pageSearch.query;
    const setQuery = pageSearch.setQuery;
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
    const valueIndex = useMemo(() => indexDatabaseValues(values), [values]);
    const filteredDocuments = useMemo(
        () =>
            visibleDocuments(
                documents,
                properties,
                valueIndex,
                config.filters ?? [],
                config.sorts ?? [],
            ),
        [documents, properties, valueIndex, config.filters, config.sorts],
    );
    const shownDocuments = useMemo(() => {
        if (!query) return filteredDocuments;
        const normalizedQuery = query.toLocaleLowerCase();
        return filteredDocuments.filter((document) =>
            document.title.toLocaleLowerCase().includes(normalizedQuery),
        );
    }, [filteredDocuments, query]);
    useEffect(() => {
        pageSearch.setResultCount(query.trim() ? shownDocuments.length : null);
    }, [pageSearch.setResultCount, query, shownDocuments.length]);

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
                value={valueFor(valueIndex, documentId, property.id)}
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
            <div className="floating-body-island floating-database-island mx-auto min-h-[65vh] max-w-[1120px]">
                <NodeMediaHeader
                    workspaceId={workspace.id}
                    node={{ ...database, type: 'database' }}
                    detail={`${documents.length} ${documents.length === 1 ? 'document' : 'documents'} · ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
                    layout="document"
                />
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
                            aria-label="View settings"
                            title="View settings"
                            onClick={() =>
                                setSettingsSection(
                                    view === 'gallery'
                                        ? 'appearance'
                                        : 'properties',
                                )
                            }
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
                        values={valueIndex}
                        candidates={candidates}
                        files={fileReferences}
                        config={config}
                        onCreate={createDocument}
                        creating={creating}
                    />
                )}
                {!shownDocuments.length && (
                    <div className="flex flex-col items-center py-20 text-center">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted/50">
                            <DatabaseIcon
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
                {shownDocuments.length > 0 && (
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
