import OrbitView from '@/components/orbit/orbit-view';
import { displayValue, valueFor } from './database-data';
import type {
    Candidate,
    DatabaseDocument,
    FileReference,
    Property,
    Value,
} from './types';

type Props = {
    workspaceId: number;
    database: { id: number; title: string };
    documents: DatabaseDocument[];
    allDocuments: DatabaseDocument[];
    focusId: number | null;
    properties: Property[];
    values: Value[];
    candidates: Candidate[];
    files: FileReference[];
};

function propertyLabel(
    property: Property,
    value: unknown,
    candidates: Candidate[],
    files: FileReference[],
) {
    const ids = Array.isArray(value) ? value : [value];
    if (property.type === 'mention')
        return ids
            .map(
                (id) =>
                    candidates.find((node) => node.id === Number(id))?.title ??
                    'Unavailable item',
            )
            .join(', ');
    if (property.type === 'files')
        return ids
            .map(
                (id) =>
                    files.find((file) => file.id === Number(id))
                        ?.original_name ?? 'Unavailable file',
            )
            .join(', ');
    if (property.type === 'checkbox') return value ? 'Checked' : 'Unchecked';
    return displayValue(value);
}

export default function DatabaseOrbit({
    workspaceId,
    database,
    documents,
    allDocuments,
    focusId,
    properties,
    values,
    candidates,
    files,
}: Props) {
    const revealedDocument =
        focusId && !documents.some((document) => document.id === focusId)
            ? allDocuments.find((document) => document.id === focusId)
            : undefined;
    const visibleDocuments = revealedDocument
        ? [...documents, revealedDocument]
        : documents;
    return (
        <>
            {revealedDocument && (
                <p role="status" className="mt-3 text-xs text-muted-foreground">
                    Showing the revealed document outside this view’s filters.
                </p>
            )}
            <OrbitView
                workspaceId={workspaceId}
                center={{ ...database, type: 'database' }}
                nodes={visibleDocuments.map((document) => ({
                    id: document.id,
                    title: document.title,
                    type: 'document',
                    metadata: properties.map((property) => {
                        const value = valueFor(
                            values,
                            document.id,
                            property.id,
                        );
                        return `${property.name}: ${value === undefined || value === null ? '—' : propertyLabel(property, value, candidates, files)}`;
                    }),
                }))}
                emptyMessage="No documents in this view. Create a document or adjust the filters."
            />
        </>
    );
}
