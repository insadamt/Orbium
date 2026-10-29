// Groups container view, sort, filter, and recovery controls in one toolbar.
// Depends on shared menus/toggles and optional feedback supplied by the explorer.
import type { ReactNode } from 'react';
import * as Menu from '@/components/ui/dropdown-menu';
import { ControlTooltip } from '@/components/navigation/control-tooltip';
import { ExplorerActiveFilter } from './explorer-active-filter';
import {
    explorerSortOptions,
    explorerTypeOptions,
} from './use-explorer-filters';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import {
    ArrowDownAZ,
    Filter,
    Images,
    LayoutGrid,
    List,
    SlidersHorizontal,
    type LucideIcon,
} from 'lucide-react';

export type ExplorerView = 'grid' | 'list' | 'gallery';

const views = [
    { value: 'grid', label: 'Grid', Icon: LayoutGrid },
    { value: 'list', label: 'List', Icon: List },
    { value: 'gallery', label: 'Gallery', Icon: Images },
] as const;

export function ExplorerViewControls({
    view,
    sort,
    onSortChange,
    typeFilter,
    onTypeFilterChange,
    disabled,
    onChange,
    onGalleryAppearance,
    children,
}: {
    view: ExplorerView;
    sort: string;
    onSortChange: (sort: string) => void;
    typeFilter: string;
    onTypeFilterChange: (type: string) => void;
    disabled: boolean;
    onChange: (view: ExplorerView) => void;
    onGalleryAppearance: () => void;
    children?: ReactNode;
}) {
    return (
        <div className="explorer-view-controls">
            {children}
            <ExplorerActiveFilter
                value={typeFilter}
                disabled={disabled}
                onClear={() => onTypeFilterChange('all')}
            />
            <ExplorerOptionMenu
                Icon={Filter}
                active={typeFilter !== 'all'}
                label="Filter explorer by type"
                value={typeFilter}
                onValueChange={onTypeFilterChange}
                options={explorerTypeOptions}
                disabled={disabled}
            />
            <ExplorerOptionMenu
                Icon={ArrowDownAZ}
                active={sort !== 'manual'}
                label="Sort explorer"
                hint={
                    sort !== 'manual'
                        ? 'Choose Manual order to drag items.'
                        : undefined
                }
                value={sort}
                onValueChange={onSortChange}
                options={explorerSortOptions}
                disabled={disabled}
            />
            <ToggleGroup.Root
                disabled={disabled}
                type="single"
                value={view}
                onValueChange={(next) => {
                    const choice = views.find((item) => item.value === next);
                    if (choice) onChange(choice.value);
                }}
                aria-label="Explorer view"
                className="explorer-view-switcher floating-surface"
            >
                {views.map(({ value, label, Icon }) => (
                    <ControlTooltip key={value} label={`${label} view`}>
                        <ToggleGroup.Item
                            value={value}
                            aria-label={`${label} view`}
                        >
                            <Icon size={17} />
                        </ToggleGroup.Item>
                    </ControlTooltip>
                ))}
            </ToggleGroup.Root>
            <ControlTooltip label="Gallery appearance">
                <button
                    type="button"
                    className="explorer-gallery-settings floating-surface"
                    onClick={onGalleryAppearance}
                    disabled={disabled || view !== 'gallery'}
                    data-visible={view === 'gallery'}
                    aria-hidden={view !== 'gallery' || undefined}
                    tabIndex={view === 'gallery' ? undefined : -1}
                    aria-label="Gallery appearance"
                >
                    <SlidersHorizontal size={17} />
                </button>
            </ControlTooltip>
        </div>
    );
}

function ExplorerOptionMenu({
    Icon,
    active,
    label,
    value,
    onValueChange,
    options,
    disabled,
    hint,
}: {
    Icon: LucideIcon;
    active: boolean;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    disabled: boolean;
    hint?: string;
}) {
    const selectedLabel = options.find(
        (option) => option.value === value,
    )?.label;
    return (
        <Menu.Root>
            <ControlTooltip
                label={`${label}: ${selectedLabel ?? value}${hint ? `. ${hint}` : ''}`}
            >
                <Menu.Trigger
                    className="explorer-option-button floating-surface"
                    aria-label={`${label}: ${selectedLabel ?? value}`}
                    data-active={active}
                    disabled={disabled}
                >
                    <Icon size={17} aria-hidden="true" />
                </Menu.Trigger>
            </ControlTooltip>
            <Menu.Content sideOffset={5} collisionPadding={8}>
                <Menu.RadioGroup value={value} onValueChange={onValueChange}>
                    {options.map((option) => (
                        <Menu.RadioItem key={option.value} value={option.value}>
                            {option.label}
                        </Menu.RadioItem>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}
