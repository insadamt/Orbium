import { Check } from 'lucide-react';
import type { BackgroundDraft, BackgroundKind } from './background-preferences';
import { WallpaperPreview } from './wallpaper-preview';

export type BackgroundOption = {
    kind: BackgroundKind;
    title: string;
    description: string;
};

export function BackgroundChoice({
    option,
    selected,
    live,
    draft,
    imageUrl,
    onSelect,
    onLiveChange,
}: {
    option: BackgroundOption;
    selected: boolean;
    live: boolean;
    draft: BackgroundDraft;
    imageUrl: string | null;
    onSelect: () => void;
    onLiveChange: (active: boolean) => void;
}) {
    return (
        <button
            type="button"
            className="wallpaper-tile"
            aria-pressed={selected}
            onClick={onSelect}
            onMouseEnter={() => onLiveChange(true)}
            onMouseLeave={() => onLiveChange(false)}
            onFocus={() => onLiveChange(true)}
            onBlur={() => onLiveChange(false)}
        >
            <span className="wallpaper-tile-miniature">
                <WallpaperPreview
                    draft={draft}
                    imageUrl={imageUrl}
                    active={live}
                    compact
                />
                {selected && (
                    <span className="wallpaper-tile-selected">
                        <Check size={16} aria-hidden="true" />
                    </span>
                )}
                {live && <span className="wallpaper-tile-live">Live</span>}
            </span>
            <span className="wallpaper-tile-label">
                <strong>{option.title}</strong>
                <span>{option.description}</span>
            </span>
        </button>
    );
}
