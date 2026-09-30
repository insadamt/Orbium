import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    ArrowDownAZ,
    ArrowLeft,
    ArrowRight,
    ArrowUpAZ,
    ChevronDown,
    EyeOff,
    Settings2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { propertyTypes } from './property-presentation';
import type { Property, ViewConfig } from './types';

type Props = {
    property: Property;
    width: number;
    index: number;
    visibleIds: number[];
    config: ViewConfig;
    onEdit: () => void;
    onSaveView: (config: ViewConfig) => void;
    onResize: (width: number) => void;
    onCommitWidth: (width: number) => void;
};

export default function DatabaseColumnHeader({
    property,
    width,
    index,
    visibleIds,
    config,
    onEdit,
    onSaveView,
    onResize,
    onCommitWidth,
}: Props) {
    const Icon = propertyTypes[property.type].icon;
    const drag = useRef<{
        start: number;
        initial: number;
        width: number;
    } | null>(null);
    const [resizing, setResizing] = useState(false);
    function move(direction: number) {
        const next = [...visibleIds];
        [next[index], next[index + direction]] = [
            next[index + direction],
            next[index],
        ];
        onSaveView({ ...config, visible_property_ids: next });
    }
    function sort(direction: 'asc' | 'desc') {
        onSaveView({
            ...config,
            sorts: [
                { field: String(property.id), direction },
                ...(config.sorts ?? []).filter(
                    (item) => String(item.field) !== String(property.id),
                ),
            ].slice(0, 10),
        });
    }

    return (
        <th style={{ width }}>
            <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                    <button
                        type="button"
                        aria-label={`${property.name} column options`}
                        className="group flex h-full w-full items-center gap-2 px-3 text-left hover:bg-muted/50"
                    >
                        <Icon size={14} className="shrink-0 opacity-70" />
                        <span className="truncate">{property.name}</span>
                        <ChevronDown
                            size={12}
                            className="ml-auto shrink-0 opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60"
                        />
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="db-menu"
                        align="start"
                        sideOffset={4}
                    >
                        <DropdownMenu.Label className="px-2.5 py-2 text-xs text-muted-foreground">
                            {propertyTypes[property.type].label} property
                        </DropdownMenu.Label>
                        <DropdownMenu.Item
                            onSelect={onEdit}
                            className="db-menu-item"
                        >
                            <Settings2 size={14} />
                            Edit property
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1 h-px bg-border/60" />
                        <DropdownMenu.Item
                            onSelect={() => sort('asc')}
                            className="db-menu-item"
                        >
                            <ArrowUpAZ size={14} />
                            Sort ascending
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            onSelect={() => sort('desc')}
                            className="db-menu-item"
                        >
                            <ArrowDownAZ size={14} />
                            Sort descending
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1 h-px bg-border/60" />
                        <DropdownMenu.Item
                            disabled={index === 0}
                            onSelect={() => move(-1)}
                            className="db-menu-item"
                        >
                            <ArrowLeft size={14} />
                            Move left
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            disabled={index === visibleIds.length - 1}
                            onSelect={() => move(1)}
                            className="db-menu-item"
                        >
                            <ArrowRight size={14} />
                            Move right
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            onSelect={() =>
                                onSaveView({
                                    ...config,
                                    visible_property_ids: visibleIds.filter(
                                        (id) => id !== property.id,
                                    ),
                                })
                            }
                            className="db-menu-item"
                        >
                            <EyeOff size={14} />
                            Hide in this view
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <div
                role="separator"
                tabIndex={0}
                aria-label={`Resize ${property.name}`}
                aria-orientation="vertical"
                aria-valuemin={120}
                aria-valuemax={480}
                aria-valuenow={Math.round(width)}
                className="db-resize-handle"
                data-resizing={resizing}
                onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    drag.current = {
                        start: event.clientX,
                        initial: width,
                        width,
                    };
                    setResizing(true);
                }}
                onPointerMove={(event) => {
                    if (!drag.current) return;
                    drag.current.width = Math.min(
                        480,
                        Math.max(
                            120,
                            drag.current.initial +
                                event.clientX -
                                drag.current.start,
                        ),
                    );
                    onResize(drag.current.width);
                }}
                onPointerUp={(event) => {
                    if (!drag.current) return;
                    const next = drag.current.width;
                    drag.current = null;
                    setResizing(false);
                    event.currentTarget.releasePointerCapture(event.pointerId);
                    onCommitWidth(Math.round(next));
                }}
                onPointerCancel={() => {
                    if (drag.current) onResize(drag.current.initial);
                    drag.current = null;
                    setResizing(false);
                }}
                onKeyDown={(event) => {
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
                        return;
                    event.preventDefault();
                    const next = Math.min(
                        480,
                        Math.max(
                            120,
                            width + (event.key === 'ArrowLeft' ? -16 : 16),
                        ),
                    );
                    onResize(next);
                    onCommitWidth(next);
                }}
            />
        </th>
    );
}
