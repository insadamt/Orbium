import { Link } from '@inertiajs/react';
import { FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import { valueFor } from './database-data';
import { propertyTypes } from './property-presentation';
import PropertyValue from './property-value';
import type {
    Candidate,
    DatabaseDocument,
    FileReference,
    Property,
    Value,
    ViewConfig,
} from './types';

type Props = {
    workspaceId: number;
    documents: DatabaseDocument[];
    properties: Property[];
    values: Value[];
    candidates: Candidate[];
    files: FileReference[];
    config: ViewConfig;
    onCreate: () => void;
    creating: boolean;
};

export default function DatabaseGallery({
    workspaceId,
    documents,
    properties,
    values,
    candidates,
    files,
    config,
    onCreate,
    creating,
}: Props) {
    const preview = config.preview ?? 'cover';
    const [unavailableCovers, setUnavailableCovers] = useState<number[]>([]);
    return (
        <div className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => (
                <Link
                    key={document.id}
                    href={`/workspaces/${workspaceId}/documents/${document.id}`}
                    className="db-gallery-card group"
                >
                    {preview !== 'none' && (
                        <div className="db-gallery-preview">
                            {preview === 'cover' &&
                            document.cover_attachment_id &&
                            !unavailableCovers.includes(
                                document.cover_attachment_id,
                            ) ? (
                                <img
                                    src={`/workspaces/${workspaceId}/documents/${document.id}/attachments/${document.cover_attachment_id}`}
                                    className="h-full w-full object-cover"
                                    alt=""
                                    onError={() => {
                                        if (
                                            document.cover_attachment_id !==
                                            null
                                        ) {
                                            const attachmentId =
                                                document.cover_attachment_id;
                                            setUnavailableCovers((current) => [
                                                ...current,
                                                attachmentId,
                                            ]);
                                        }
                                    }}
                                />
                            ) : document.plain_text ? (
                                <div className="p-5">
                                    <p className="line-clamp-5 text-xs leading-6 whitespace-pre-line text-muted-foreground/75">
                                        {document.plain_text}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <FileText
                                        size={32}
                                        strokeWidth={1}
                                        className="text-muted-foreground/20"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex-1 p-4">
                        <h2 className="flex items-center gap-2 text-sm font-medium">
                            <FileText
                                size={15}
                                className="shrink-0 text-muted-foreground/60"
                            />
                            <span className="truncate">{document.title}</span>
                        </h2>
                        {properties.length > 0 && (
                            <div className="mt-4 space-y-2.5">
                                {properties.map((property) => {
                                    const Icon =
                                        propertyTypes[property.type].icon;
                                    return (
                                        <div
                                            key={property.id}
                                            className="flex min-w-0 items-center gap-3 text-xs"
                                        >
                                            <span className="flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground">
                                                <Icon
                                                    size={12}
                                                    className="shrink-0 opacity-70"
                                                />
                                                <span className="truncate">
                                                    {property.name}
                                                </span>
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <PropertyValue
                                                    property={property}
                                                    value={valueFor(
                                                        values,
                                                        document.id,
                                                        property.id,
                                                    )}
                                                    candidates={candidates}
                                                    files={files}
                                                    emptyLabel="—"
                                                />
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Link>
            ))}
            <button
                type="button"
                disabled={creating}
                onClick={onCreate}
                className="flex min-h-40 items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground hover:border-ring hover:bg-muted/20 hover:text-foreground disabled:opacity-40"
            >
                <Plus size={17} />
                New document
            </button>
        </div>
    );
}
