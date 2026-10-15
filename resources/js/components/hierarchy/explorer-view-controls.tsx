import * as Menu from '@/components/ui/dropdown-menu';
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
}: {
    view: ExplorerView;
    sort: string;
    onSortChange: (sort: string) => void;
    typeFilter: string;
    onTypeFilterChange: (type: string) => void;
    disabled: boolean;
    onChange: (view: ExplorerView) => void;
    onGalleryAppearance: () => void;
}) {
    return (
        <div className="explorer-view-controls">
            {sort !== 'manual' && (
                <span className="explorer-sort-hint">
                    Choose Manual order to drag items.
                </span>
            )}
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
                className="explorer-view-switcher"
            >
                {views.map(({ value, label, Icon }) => (
                    <ToggleGroup.Item
                        key={value}
                        value={value}
                        aria-label={`${label} view`}
                        title={`${label} view`}
                    >
                        <Icon size={17} />
                    </ToggleGroup.Item>
                ))}
            </ToggleGroup.Root>
            {view === 'gallery' && (
                <button
                    type="button"
                    className="explorer-gallery-settings"
                    onClick={onGalleryAppearance}
                    disabled={disabled}
                    aria-label="Gallery appearance"
                    title="Gallery appearance"
                >
                    <SlidersHorizontal size={17} />
                </button>
            )}
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
}: {
    Icon: LucideIcon;
    active: boolean;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    disabled: boolean;
}) {
    const selectedLabel = options.find(
        (option) => option.value === value,
    )?.label;
    return (
        <Menu.Root>
            <Menu.Trigger
                className="explorer-option-button"
                aria-label={`${label}: ${selectedLabel ?? value}`}
                data-active={active}
                disabled={disabled}
            >
                <Icon size={17} aria-hidden="true" />
            </Menu.Trigger>
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
