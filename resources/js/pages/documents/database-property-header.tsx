import { router } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { csrfToken, uploadAttachment } from '@/components/editor/editor-api';
import PropertyInput from '../databases/property-input';
import type { Candidate, FileReference, Property } from '../databases/types';
import { propertyTypes } from '../databases/property-presentation';

type Props = {
    workspaceId: number;
    databaseId: number;
    documentId: number;
    properties: Property[];
    values: { property_id: number; value: unknown }[];
    candidates: Candidate[];
    files: FileReference[];
};

export default function DatabasePropertyHeader({
    workspaceId,
    databaseId,
    documentId,
    properties,
    values,
    candidates,
    files,
}: Props) {
    const [open, setOpen] = useState(true);
    async function save(propertyId: number, value: unknown) {
        const response = await fetch(
            `/workspaces/${workspaceId}/databases/${databaseId}/documents/${documentId}/properties/${propertyId}`,
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
        if (!response.ok)
            throw new Error(
                'Could not save this value. Please check it and try again.',
            );
        router.reload({ only: ['databaseValues', 'databaseFiles'] });
    }
    return (
        <section className="mb-9 border-b border-border/60 pb-6">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="mb-2 flex items-center gap-1.5 rounded py-1 text-xs text-muted-foreground hover:text-foreground"
            >
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}{' '}
                Properties
            </button>
            {open && (
                <div className="max-w-xl">
                    {properties.map((property) => {
                        const Icon = propertyTypes[property.type].icon;
                        return (
                            <div
                                key={property.id}
                                className="grid grid-cols-[140px_minmax(0,1fr)] items-center rounded-md hover:bg-muted/20"
                            >
                                <p className="flex items-center gap-2 pr-4 text-[13px] text-muted-foreground">
                                    <Icon
                                        size={14}
                                        className="shrink-0 opacity-70"
                                    />
                                    <span className="truncate">
                                        {property.name}
                                    </span>
                                </p>
                                <PropertyInput
                                    property={property}
                                    workspaceId={workspaceId}
                                    documentId={documentId}
                                    value={
                                        values.find(
                                            (item) =>
                                                item.property_id ===
                                                property.id,
                                        )?.value
                                    }
                                    candidates={candidates}
                                    files={files}
                                    onSave={(value) => save(property.id, value)}
                                    onUpload={
                                        property.type === 'files'
                                            ? async (file) =>
                                                  (
                                                      await uploadAttachment(
                                                          workspaceId,
                                                          documentId,
                                                          file,
                                                      )
                                                  ).id
                                            : undefined
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
