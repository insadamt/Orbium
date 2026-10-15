import { Popover } from 'radix-ui';
import DatabaseQueryPanel from './database-query-panel';
import type { Property } from './types';
import {
    ArrowDownUp,
    Filter,
    GalleryHorizontalEnd,
    Loader2,
    Plus,
    SlidersHorizontal,
    Table2,
} from 'lucide-react';
import type { SettingsSection } from './database-view-settings';
import type { ViewConfig } from './types';

export type DatabaseControl = SettingsSection | 'filters' | 'sorts';

const viewTypes = [
    { id: 'table', label: 'Table', icon: Table2 },
    { id: 'gallery', label: 'Gallery', icon: GalleryHorizontalEnd },
] as const;

type Props = {
    view: 'table' | 'gallery';
    config: ViewConfig;
    creating: boolean;
    onChangeView: (view: 'table' | 'gallery') => void;
    onOpenSettings: (section: DatabaseControl | null) => void;
    openControl: DatabaseControl | null;
    properties: Property[];
    saving: boolean;
    error: string;
    onSave: (config: ViewConfig) => void;
    onCreate: () => void;
};

export default function DatabaseToolbar({
    view,
    config,
    creating,
    onChangeView,
    onOpenSettings,
    onCreate,
    openControl,
    properties,
    saving,
    error,
    onSave,
}: Props) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border/70">
            <nav aria-label="Database views" className="flex shrink-0 gap-1">
                {viewTypes.map(({ id, label, icon: Icon }) => (
                    <button
                        type="button"
                        key={id}
                        aria-pressed={view === id}
                        disabled={saving}
                        onClick={() => onChangeView(id)}
                        className={`relative flex items-center gap-2 border-b-2 px-3 pt-3 pb-3 text-[13px] transition-colors ${view === id ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <Icon size={15} strokeWidth={1.6} />
                        {label}
                    </button>
                ))}
            </nav>
            <div className="flex flex-wrap items-center gap-0.5 pb-2">
                {(['filters', 'sorts'] as const).map((control) => {
                    const Icon = control === 'filters' ? Filter : ArrowDownUp;
                    const label = control === 'filters' ? 'Filter' : 'Sort';
                    const count = config[control]?.length ?? 0;
                    return (
                        <Popover.Root
                            key={control}
                            open={openControl === control}
                            onOpenChange={(open) => {
                                if (!saving)
                                    onOpenSettings(open ? control : null);
                            }}
                        >
                            <Popover.Trigger asChild>
                                <button
                                    type="button"
                                    disabled={saving}
                                    data-active={count > 0}
                                    className="db-toolbar-button"
                                >
                                    <Icon size={14} />
                                    {label}
                                    {count > 0 && (
                                        <span className="px-1.5 text-[10px] tabular-nums">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    align="end"
                                    sideOffset={8}
                                    collisionPadding={16}
                                    aria-label={
                                        control === 'filters'
                                            ? 'Filter documents'
                                            : 'Sort documents'
                                    }
                                    className="db-query-popover z-50 flex w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl outline-none"
                                    onEscapeKeyDown={(event) => {
                                        if (saving) event.preventDefault();
                                    }}
                                    onInteractOutside={(event) => {
                                        if (saving) event.preventDefault();
                                    }}
                                >
                                    <DatabaseQueryPanel
                                        control={control}
                                        properties={properties}
                                        config={config}
                                        saving={saving}
                                        error={error}
                                        onSave={onSave}
                                        onClose={() => onOpenSettings(null)}
                                    />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    );
                })}
                <button
                    type="button"
                    aria-label="View settings"
                    title="View settings"
                    disabled={saving}
                    aria-expanded={
                        openControl === 'properties' ||
                        openControl === 'appearance'
                    }
                    onClick={() =>
                        onOpenSettings(
                            view === 'gallery' ? 'appearance' : 'properties',
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
                    onClick={onCreate}
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
    );
}
