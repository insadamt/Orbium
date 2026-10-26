import { Clock3, Globe2, ImagePlus, Shapes, Smile, Star } from 'lucide-react';
import type { IconFamily } from './icon-catalog';

export type IconSource = IconFamily | 'custom';
export type BrowseScope = 'catalog' | 'recent' | 'favorites';
const sources = [
    { id: 'emoji', label: 'Emoji', glyph: Smile },
    { id: 'lucide', label: 'Icons', glyph: Shapes },
    { id: 'brands', label: 'Brands', glyph: Globe2 },
    { id: 'custom', label: 'Custom', glyph: ImagePlus },
] as const;
const tones = [
    ['0', 'Default tone'],
    ['1', 'Light'],
    ['2', 'Medium-light'],
    ['3', 'Medium'],
    ['4', 'Medium-dark'],
    ['5', 'Dark'],
    ['all', 'All tones'],
];
const shortNames: Record<string, string> = {
    'Smileys & Emotion': 'Smileys',
    'Travel & Places': 'Travel',
    'Food & Drink': 'Food',
    'Animals & Nature': 'Nature',
};

export function IconPickerNavigation({
    id,
    source,
    scope,
    category,
    tone,
    groups,
    disabled,
    onSource,
    onScope,
    onCategory,
    onTone,
}: {
    id: string;
    source: IconSource;
    scope: BrowseScope;
    category: string;
    tone: string;
    groups: string[];
    disabled: boolean;
    onSource: (source: IconSource) => void;
    onScope: (scope: BrowseScope) => void;
    onCategory: (category: string) => void;
    onTone: (tone: string) => void;
}) {
    const custom = source === 'custom' && scope === 'catalog';
    return (
        <>
            <div
                className="icon-source-tabs"
                role="tablist"
                aria-label="Icon source"
                onKeyDown={(event) => {
                    const index = sources.findIndex(
                        (item) => item.id === source,
                    );
                    const next =
                        event.key === 'ArrowRight'
                            ? (index + 1) % sources.length
                            : event.key === 'ArrowLeft'
                              ? (index + sources.length - 1) % sources.length
                              : event.key === 'Home'
                                ? 0
                                : event.key === 'End'
                                  ? sources.length - 1
                                  : null;
                    if (next === null || disabled) return;
                    event.preventDefault();
                    onSource(sources[next].id);
                    event.currentTarget
                        .querySelectorAll<HTMLButtonElement>('[role="tab"]')
                        [next]?.focus();
                }}
            >
                {sources.map(({ id: sourceId, label, glyph: Glyph }) => (
                    <button
                        key={sourceId}
                        id={`${id}-${sourceId}`}
                        type="button"
                        role="tab"
                        aria-selected={
                            source === sourceId && scope === 'catalog'
                        }
                        aria-controls={`${id}-panel`}
                        tabIndex={source === sourceId ? 0 : -1}
                        disabled={disabled}
                        onClick={() => onSource(sourceId)}
                    >
                        <Glyph size={16} aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </div>
            <div className="icon-picker-filters">
                <button
                    type="button"
                    className="icon-quick-filter"
                    aria-pressed={scope === 'recent'}
                    disabled={disabled}
                    onClick={() => onScope('recent')}
                >
                    <Clock3 size={14} />
                    Recent
                </button>
                <button
                    type="button"
                    className="icon-quick-filter"
                    aria-pressed={scope === 'favorites'}
                    disabled={disabled}
                    onClick={() => onScope('favorites')}
                >
                    <Star size={14} />
                    Saved
                </button>
                {source === 'emoji' && scope === 'catalog' && (
                    <select
                        aria-label="Emoji skin tone"
                        value={tone}
                        disabled={disabled}
                        onChange={(event) => onTone(event.target.value)}
                    >
                        {tones.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            {!custom && scope === 'catalog' && (
                <div className="icon-category-rail" aria-label="Categories">
                    {['All', ...groups].map((group) => (
                        <button
                            key={group}
                            type="button"
                            aria-pressed={category === group}
                            disabled={disabled}
                            onClick={(event) => {
                                onCategory(group);
                                event.currentTarget.scrollIntoView({
                                    block: 'nearest',
                                    inline: 'nearest',
                                });
                            }}
                        >
                            {shortNames[group] ?? group}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
