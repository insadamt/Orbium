import { useEffect, useRef, useState, type ReactNode } from 'react';

type MasonryItem = { id: number; estimatedHeight: (width: number) => number };

function MeasuredCard({
    children,
    onHeight,
}: {
    children: ReactNode;
    onHeight: (height: number) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver(([entry]) =>
            onHeight(
                entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height,
            ),
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [onHeight]);
    return <div ref={ref}>{children}</div>;
}

export function MasonryLayout<T extends MasonryItem>({
    items,
    render,
    minimumWidth = 240,
    gap = 20,
}: {
    items: T[];
    render: (item: T) => ReactNode;
    minimumWidth?: number;
    gap?: number;
}) {
    const container = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [heights, setHeights] = useState<Record<number, number>>({});
    useEffect(() => {
        if (!container.current) return;
        const observer = new ResizeObserver(([entry]) =>
            setWidth(entry.contentRect.width),
        );
        observer.observe(container.current);
        return () => observer.disconnect();
    }, []);

    const columns = Math.max(
        1,
        Math.floor((width + gap) / (minimumWidth + gap)),
    );
    const cardWidth = width
        ? (width - gap * (columns - 1)) / columns
        : minimumWidth;
    const columnHeights = Array(columns).fill(0) as number[];
    const positions = items.map((item) => {
        const column = columnHeights.indexOf(Math.min(...columnHeights));
        const position = {
            left: column * (cardWidth + gap),
            top: columnHeights[column],
        };
        columnHeights[column] +=
            (heights[item.id] ?? item.estimatedHeight(cardWidth)) + gap;
        return position;
    });
    const totalHeight =
        Math.max(0, ...columnHeights) - (items.length ? gap : 0);

    return (
        <div
            ref={container}
            className="relative w-full"
            style={{ height: Math.max(0, totalHeight) }}
        >
            {items.map((item, index) => (
                <div
                    key={item.id}
                    style={{
                        position: 'absolute',
                        width: cardWidth,
                        left: positions[index].left,
                        top: positions[index].top,
                    }}
                >
                    <MeasuredCard
                        onHeight={(height) =>
                            setHeights((current) =>
                                Math.abs((current[item.id] ?? 0) - height) < 1
                                    ? current
                                    : { ...current, [item.id]: height },
                            )
                        }
                    >
                        {render(item)}
                    </MeasuredCard>
                </div>
            ))}
        </div>
    );
}
