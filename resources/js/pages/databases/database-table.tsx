import { Link, router } from '@inertiajs/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    ArrowUpRight,
    Ellipsis,
    FileText,
    Pencil,
    Plus,
    Text,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import DatabaseColumnHeader from './database-column-header';
import type { DatabaseDocument, Property, ViewConfig } from './types';

type Props = {
    workspaceId: number;
    documents: DatabaseDocument[];
    properties: Property[];
    config: ViewConfig;
    renderCell: (documentId: number, property: Property) => ReactNode;
    onEditProperty: (property?: Property) => void;
    onSaveView: (config: ViewConfig) => void;
    onCreate: () => void;
    creating: boolean;
};

export default function DatabaseTable({
    workspaceId,
    documents,
    properties,
    config,
    renderCell,
    onEditProperty,
    onSaveView,
    onCreate,
    creating,
}: Props) {
    const [widths, setWidths] = useState(config.widths ?? {});
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [draftTitle, setDraftTitle] = useState('');
    const cancelRename = useRef(false);
    useEffect(() => setWidths(config.widths ?? {}), [config.widths]);
    const visibleIds = properties.map((property) => property.id);

    function rename(document: DatabaseDocument) {
        if (cancelRename.current) {
            cancelRename.current = false;
            return;
        }
        const title = draftTitle.trim();
        setRenamingId(null);
        if (title && title !== document.title)
            router.patch(
                `/workspaces/${workspaceId}/nodes/${document.id}`,
                { title },
                { preserveScroll: true },
            );
    }

    return (
        <div className="overflow-x-auto overscroll-x-contain border-b border-border/60">
            <table className="db-table">
                <thead>
                    <tr>
                        <th style={{ width: 280 }}>
                            <span className="flex items-center gap-2 px-4">
                                <Text size={15} className="opacity-70" />
                                Name
                            </span>
                        </th>
                        {properties.map((property, index) => (
                            <DatabaseColumnHeader
                                key={property.id}
                                property={property}
                                index={index}
                                visibleIds={visibleIds}
                                width={widths[property.id] ?? 190}
                                config={config}
                                onEdit={() => onEditProperty(property)}
                                onSaveView={onSaveView}
                                onResize={(width) =>
                                    setWidths((current) => ({
                                        ...current,
                                        [property.id]: width,
                                    }))
                                }
                                onCommitWidth={(width) =>
                                    onSaveView({
                                        ...config,
                                        widths: {
                                            ...widths,
                                            [property.id]: width,
                                        },
                                    })
                                }
                            />
                        ))}
                        <th style={{ width: 48 }}>
                            <button
                                type="button"
                                title="Add property"
                                aria-label="Add property"
                                onClick={() => onEditProperty()}
                                className="db-icon-button mx-2"
                            >
                                <Plus size={16} />
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map((document) => (
                        <tr key={document.id} className="group/row">
                            <td>
                                <div className="flex h-[43px] items-center gap-2 px-3">
                                    <FileText
                                        size={15}
                                        className="shrink-0 text-muted-foreground/60"
                                    />
                                    {renamingId === document.id ? (
                                        <input
                                            autoFocus
                                            aria-label="Document title"
                                            value={draftTitle}
                                            maxLength={255}
                                            onChange={(event) =>
                                                setDraftTitle(
                                                    event.target.value,
                                                )
                                            }
                                            onBlur={() => rename(document)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter')
                                                    event.currentTarget.blur();
                                                if (event.key === 'Escape') {
                                                    cancelRename.current = true;
                                                    setRenamingId(null);
                                                }
                                            }}
                                            className="min-w-0 flex-1 rounded bg-background px-1 py-1 outline-1 outline-ring"
                                        />
                                    ) : (
                                        <Link
                                            href={`/workspaces/${workspaceId}/documents/${document.id}`}
                                            className="min-w-0 flex-1 truncate font-medium hover:underline"
                                        >
                                            {document.title}
                                        </Link>
                                    )}
                                    <DropdownMenu.Root modal={false}>
                                        <DropdownMenu.Trigger asChild>
                                            <button
                                                type="button"
                                                aria-label={`Options for ${document.title}`}
                                                className="db-icon-button !size-6 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                                            >
                                                <Ellipsis size={15} />
                                            </button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Portal>
                                            <DropdownMenu.Content
                                                onCloseAutoFocus={(event) => {
                                                    if (
                                                        renamingId ===
                                                        document.id
                                                    )
                                                        event.preventDefault();
                                                }}
                                                className="db-menu"
                                                align="end"
                                                sideOffset={4}
                                            >
                                                <DropdownMenu.Item
                                                    asChild
                                                    className="db-menu-item"
                                                >
                                                    <Link
                                                        href={`/workspaces/${workspaceId}/documents/${document.id}`}
                                                    >
                                                        <ArrowUpRight
                                                            size={14}
                                                        />
                                                        Open document
                                                    </Link>
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item
                                                    className="db-menu-item"
                                                    onSelect={() => {
                                                        setDraftTitle(
                                                            document.title,
                                                        );
                                                        setRenamingId(
                                                            document.id,
                                                        );
                                                    }}
                                                >
                                                    <Pencil size={14} />
                                                    Rename
                                                </DropdownMenu.Item>
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Portal>
                                    </DropdownMenu.Root>
                                </div>
                            </td>
                            {properties.map((property) => (
                                <td key={property.id}>
                                    {renderCell(document.id, property)}
                                </td>
                            ))}
                            <td />
                        </tr>
                    ))}
                </tbody>
            </table>
            <button
                type="button"
                disabled={creating}
                onClick={onCreate}
                className="flex h-11 w-full items-center gap-2 px-4 text-left text-[13px] text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
            >
                <Plus size={15} />
                New document
            </button>
        </div>
    );
}
