import { useState } from 'react';
import { formatShare } from './statistics-charts';

export type CompositionItem = {
    label: string;
    value: number;
    formattedValue: string;
};

export function StatisticsCompositionChart({
    label,
    items,
    totalValue,
    totalLabel,
}: {
    label: string;
    items: CompositionItem[];
    totalValue: string;
    totalLabel: string;
}) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const activeIndex = hoveredIndex ?? selectedIndex;
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const active = activeIndex === null ? null : items[activeIndex];
    const colors = [
        'var(--foreground)',
        'color-mix(in srgb, var(--foreground) 35%, var(--background))',
    ];
    let offset = 0;

    return (
        <figure className="statistics-composition" aria-label={label}>
            <figcaption className="statistics-insight-label">
                {label}
            </figcaption>
            <span className="sr-only">
                {totalValue} {totalLabel}
            </span>
            <div className="statistics-composition-layout">
                <div className="statistics-composition-ring" aria-hidden="true">
                    <svg viewBox="0 0 200 200">
                        <circle
                            cx="100"
                            cy="100"
                            r="78"
                            fill="none"
                            stroke="var(--muted)"
                            strokeWidth="16"
                        />
                        {items.map((item, index) => {
                            const share =
                                total > 0 ? (item.value / total) * 100 : 0;
                            const start = offset;
                            offset += share;
                            if (share === 0) return null;
                            return (
                                <circle
                                    key={item.label}
                                    cx="100"
                                    cy="100"
                                    r="78"
                                    fill="none"
                                    pathLength="100"
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={
                                        activeIndex === index ? 20 : 16
                                    }
                                    strokeDasharray={`${share} ${100 - share}`}
                                    strokeDashoffset={-start}
                                    transform="rotate(-90 100 100)"
                                    onPointerEnter={() =>
                                        setHoveredIndex(index)
                                    }
                                    onPointerLeave={() => setHoveredIndex(null)}
                                />
                            );
                        })}
                    </svg>
                    <div className="statistics-composition-center">
                        <span className="max-w-full text-xl font-semibold break-words tabular-nums">
                            {active?.formattedValue ?? totalValue}
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">
                            {active?.label ?? totalLabel}
                        </span>
                    </div>
                </div>
                <div className="statistics-composition-legend">
                    {items.map((item, index) => (
                        <button
                            key={item.label}
                            type="button"
                            className="statistics-composition-item"
                            aria-pressed={selectedIndex === index}
                            onPointerEnter={() => setHoveredIndex(index)}
                            onPointerLeave={() => setHoveredIndex(null)}
                            onFocus={() => setSelectedIndex(index)}
                            onClick={() => setSelectedIndex(index)}
                        >
                            <span className="flex items-center gap-2 text-sm">
                                <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{
                                        background:
                                            colors[index % colors.length],
                                    }}
                                />
                                {item.label}
                            </span>
                            <span className="flex items-baseline justify-between gap-3 pl-4 tabular-nums">
                                <span className="font-medium">
                                    {item.formattedValue}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatShare(item.value, total)}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </figure>
    );
}
