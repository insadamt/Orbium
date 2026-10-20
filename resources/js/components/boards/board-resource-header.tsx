import {
    ArrowUpRight,
    FileText,
    Database,
    PanelsTopLeft,
    MoreHorizontal,
    Pencil,
    RotateCw,
    Check,
} from 'lucide-react';
import * as DropdownMenu from '@/components/ui/dropdown-menu';
import { openLocation } from '@/components/navigation/tab-navigation';
import type { BoardResource } from './board-resource-types';

export function BoardResourceHeader({
    resource,
    missing,
    editing,
    editorControlsReady,
    controlsHost,
    onEdit,
    onFinish,
    onRefresh,
}: {
    resource?: BoardResource;
    missing?: boolean;
    editing: boolean;
    editorControlsReady: boolean;
    controlsHost: (element: HTMLDivElement | null) => void;
    onEdit: () => void;
    onFinish: () => void;
    onRefresh: () => void;
}) {
    const Icon =
        resource?.type === 'database'
            ? Database
            : resource?.type === 'board'
              ? PanelsTopLeft
              : FileText;
    return (
        <div className="board-resource-header">
            <span className="board-resource-icon" aria-hidden="true">
                {resource?.icon_url ? (
                    <img src={resource.icon_url} alt="" draggable={false} />
                ) : (
                    resource?.icon || <Icon size={16} />
                )}
            </span>
            <div className="board-resource-identity">
                <strong title={resource?.title}>
                    {resource?.title ??
                        (missing ? 'Resource unavailable' : 'Linked page')}
                </strong>
            </div>
            <span className="sr-only">
                {editing
                    ? 'Editing original Document'
                    : `Linked ${resource?.type ?? 'page'}`}
            </span>
            {resource && (
                <button
                    type="button"
                    data-board-interactive
                    aria-label="Open original in Orbium tab"
                    title="Open original in Orbium tab"
                    onClick={() => openLocation(resource.url, true)}
                >
                    <ArrowUpRight size={16} />
                </button>
            )}
            <div
                ref={controlsHost}
                className="board-resource-editor-controls"
                data-board-interactive
            />
            {!editorControlsReady && (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button
                            type="button"
                            data-board-interactive
                            aria-label="Linked page actions"
                            title="Linked page actions"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" sideOffset={6}>
                        {resource?.type === 'document' && (
                            <DropdownMenu.Item
                                onSelect={editing ? onFinish : onEdit}
                            >
                                {editing ? (
                                    <Check size={16} />
                                ) : (
                                    <Pencil size={16} />
                                )}
                                {editing ? 'Finish editing' : 'Edit content'}
                            </DropdownMenu.Item>
                        )}
                        <DropdownMenu.Item onSelect={onRefresh}>
                            <RotateCw size={16} /> Refresh linked page
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            )}
        </div>
    );
}
