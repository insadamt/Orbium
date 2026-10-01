import { Check, ChevronRight } from 'lucide-react';
import type { BackgroundKind } from './background-preferences';

export type BackgroundOption = {
    kind: BackgroundKind;
    title: string;
    description: string;
};

export function BackgroundChoice({
    option,
    selected,
    onSelect,
}: {
    option: BackgroundOption;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            className="wallpaper-tile"
            aria-pressed={selected}
            onClick={onSelect}
        >
            <span className="wallpaper-tile-label">
                <strong>{option.title}</strong>
                <span>{option.description}</span>
            </span>
            {selected ? (
                <span className="wallpaper-tile-current">
                    <Check size={14} aria-hidden="true" /> Current
                </span>
            ) : (
                <ChevronRight
                    className="wallpaper-tile-arrow"
                    size={18}
                    aria-hidden="true"
                />
            )}
        </button>
    );
}
