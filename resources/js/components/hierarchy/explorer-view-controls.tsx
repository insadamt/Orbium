import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Images, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

export type ExplorerView = 'grid' | 'list' | 'gallery';

const views = [
    { value: 'grid', label: 'Grid', Icon: LayoutGrid },
    { value: 'list', label: 'List', Icon: List },
    { value: 'gallery', label: 'Gallery', Icon: Images },
] as const;

export function ExplorerViewControls({
    view,
    onChange,
    onGalleryAppearance,
}: {
    view: ExplorerView;
    onChange: (view: ExplorerView) => void;
    onGalleryAppearance: () => void;
}) {
    return (
        <div className="explorer-view-controls">
            <ToggleGroup.Root
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
                    aria-label="Gallery appearance"
                    title="Gallery appearance"
                >
                    <SlidersHorizontal size={17} />
                </button>
            )}
        </div>
    );
}
