import type { ContentOwnerKind } from '@/components/editor/editor-api';
import {
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
    type Ref,
} from 'react';
import { InlineIconGlyph } from './inline-icon-glyph';
import { iconChoiceKey, type InlineIconChoice } from './icon-catalog';

export type IconGridHandle = { focusFirst: () => void };
const rowHeight = 44;

export function IconResultsGrid({
    choices,
    workspaceId,
    nodeId,
    onChoose,
    onPreview,
    disabled = false,
    imageUrls,
    ownerKind,
    gridRef,
}: {
    choices: InlineIconChoice[];
    workspaceId: number;
    nodeId: number;
    onChoose: (choice: InlineIconChoice) => void;
    onPreview: (choice: InlineIconChoice) => void;
    disabled?: boolean;
    imageUrls?: Map<number, string>;
    ownerKind?: ContentOwnerKind;
    gridRef?: Ref<IconGridHandle>;
}) {
    const viewport = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 396, height: 308 });
    const [scrollTop, setScrollTop] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const focusRequested = useRef(false);
    const columns = Math.max(1, Math.floor(size.width / rowHeight));
    const rowCount = Math.ceil(choices.length / columns);
    const firstRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 3);
    const lastRow = Math.min(
        rowCount,
        Math.ceil((scrollTop + size.height) / rowHeight) + 3,
    );
    const tabStop =
        activeIndex >= firstRow * columns && activeIndex < lastRow * columns
            ? activeIndex
            : firstRow * columns;

    useEffect(() => {
        const host = viewport.current;
        if (!host) return;
        const measure = () =>
            setSize({ width: host.clientWidth, height: host.clientHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(host);
        return () => observer.disconnect();
    }, []);

    function navigate(index: number) {
        if (disabled || !choices.length) return;
        const next = Math.max(0, Math.min(choices.length - 1, index));
        const host = viewport.current;
        if (!host) return;
        const top = Math.floor(next / columns) * rowHeight;
        if (top < host.scrollTop) host.scrollTop = top;
        else if (top + rowHeight > host.scrollTop + host.clientHeight)
            host.scrollTop = top + rowHeight - host.clientHeight;
        setScrollTop(host.scrollTop);
        focusRequested.current = true;
        setActiveIndex(next);
        onPreview(choices[next]);
        requestAnimationFrame(() =>
            host
                .querySelector<HTMLButtonElement>(`[data-icon-index="${next}"]`)
                ?.focus({ preventScroll: true }),
        );
    }
    useImperativeHandle(gridRef, () => ({
        focusFirst() {
            navigate(0);
        },
    }));
    useLayoutEffect(() => {
        if (!focusRequested.current) return;
        const button = viewport.current?.querySelector<HTMLButtonElement>(
            `[data-icon-index="${activeIndex}"]`,
        );
        if (button) {
            button.focus({ preventScroll: true });
            focusRequested.current = false;
        }
    }, [activeIndex, firstRow, lastRow]);

    return (
        <div
            ref={viewport}
            className="icon-results-viewport"
            role="grid"
            aria-label="Available emoji and icons"
            aria-rowcount={rowCount}
            aria-colcount={columns}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            onKeyDown={(event) => {
                const index = Number(
                    (event.target as HTMLElement).closest<HTMLElement>(
                        '[data-icon-index]',
                    )?.dataset.iconIndex ?? activeIndex,
                );
                const next =
                    event.key === 'ArrowRight'
                        ? index + 1
                        : event.key === 'ArrowLeft'
                          ? index - 1
                          : event.key === 'ArrowDown'
                            ? index + columns
                            : event.key === 'ArrowUp'
                              ? index - columns
                              : event.key === 'Home'
                                ? event.ctrlKey
                                    ? 0
                                    : Math.floor(index / columns) * columns
                                : event.key === 'End'
                                  ? event.ctrlKey
                                      ? choices.length - 1
                                      : (Math.floor(index / columns) + 1) *
                                            columns -
                                        1
                                  : event.key === 'PageDown'
                                    ? index +
                                      columns *
                                          Math.max(
                                              1,
                                              Math.floor(
                                                  size.height / rowHeight,
                                              ),
                                          )
                                    : event.key === 'PageUp'
                                      ? index -
                                        columns *
                                            Math.max(
                                                1,
                                                Math.floor(
                                                    size.height / rowHeight,
                                                ),
                                            )
                                      : null;
                if (next === null) return;
                event.preventDefault();
                navigate(next);
            }}
        >
            <div
                className="icon-results-spacer"
                style={{ height: rowCount * rowHeight }}
            >
                {Array.from(
                    { length: Math.max(0, lastRow - firstRow) },
                    (_, offset) => {
                        const row = firstRow + offset;
                        return (
                            <div
                                key={row}
                                role="row"
                                aria-rowindex={row + 1}
                                className="icon-results-row"
                                style={{
                                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                    transform: `translateY(${row * rowHeight}px)`,
                                }}
                            >
                                {choices
                                    .slice(row * columns, (row + 1) * columns)
                                    .map((choice, column) => {
                                        const index = row * columns + column;
                                        return (
                                            <button
                                                key={iconChoiceKey(choice)}
                                                type="button"
                                                role="gridcell"
                                                aria-colindex={column + 1}
                                                className="icon-results-cell"
                                                data-icon-index={index}
                                                data-emoji={
                                                    choice.kind === 'emoji'
                                                }
                                                aria-label={`Insert ${choice.label}`}
                                                title={choice.label}
                                                tabIndex={
                                                    index === tabStop ? 0 : -1
                                                }
                                                disabled={disabled}
                                                onFocus={() => {
                                                    setActiveIndex(index);
                                                    onPreview(choice);
                                                }}
                                                onPointerEnter={() =>
                                                    onPreview(choice)
                                                }
                                                onClick={() => onChoose(choice)}
                                            >
                                                <InlineIconGlyph
                                                    choice={choice}
                                                    ownerKind={ownerKind}
                                                    workspaceId={workspaceId}
                                                    nodeId={nodeId}
                                                    previewUrl={
                                                        choice.kind === 'custom'
                                                            ? imageUrls?.get(
                                                                  choice.attachmentId,
                                                              )
                                                            : undefined
                                                    }
                                                />
                                            </button>
                                        );
                                    })}
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}
