import { supportsBoardContentHeight } from './board-content-sizing';
import { useEffect, useRef, useState } from 'react';
import { X, MoveHorizontal, MoveVertical } from 'lucide-react';
import { boardBlockLabels } from './board-block-data';
import { BoardTextStyleMenu } from './board-text-style-menu';
import { boardLimits, type BoardObject } from './board-types';
import { clamp } from './board-geometry';

function GeometryField({
    label,
    value,
    minimum,
    maximum,
    disabled,
    onCommit,
}: {
    label: string;
    value: number;
    minimum: number;
    maximum: number;
    disabled: boolean;
    onCommit: (value: number) => void;
}) {
    const [draft, setDraft] = useState(String(Math.round(value * 10) / 10));
    const focused = useRef(false);
    const cancelBlur = useRef(false);
    useEffect(() => {
        if (!focused.current) setDraft(String(Math.round(value * 10) / 10));
    }, [value]);
    return (
        <label className="board-property-field">
            <span>{label}</span>
            <input
                type="number"
                aria-label={label}
                value={draft}
                disabled={disabled}
                min={minimum}
                max={maximum}
                step={1}
                onFocus={() => {
                    focused.current = true;
                }}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        event.currentTarget.blur();
                    }
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        cancelBlur.current = true;
                        setDraft(String(value));
                        event.currentTarget.blur();
                        event.currentTarget
                            .closest('aside')
                            ?.querySelector<HTMLButtonElement>(
                                '[aria-label="Close properties"]',
                            )
                            ?.focus();
                    }
                }}
                onBlur={() => {
                    focused.current = false;
                    if (cancelBlur.current) {
                        cancelBlur.current = false;
                        setDraft(String(value));
                        return;
                    }
                    const next = draft.trim() === '' ? NaN : Number(draft);
                    if (Number.isFinite(next) && !disabled) {
                        const bounded = clamp(next, minimum, maximum);
                        setDraft(String(Math.round(bounded * 10) / 10));
                        onCommit(bounded);
                    } else setDraft(String(value));
                }}
            />
        </label>
    );
}

export function BoardPropertiesPanel({
    object,
    disabled,
    onChange,
    onClose,
}: {
    object: BoardObject;
    disabled: boolean;
    onChange: (object: BoardObject) => void;
    onClose: () => void;
}) {
    const closeButton = useRef<HTMLButtonElement>(null);
    useEffect(() => closeButton.current?.focus({ preventScroll: true }), []);
    const automaticHeight = supportsBoardContentHeight(object);
    const circle = object.block_type === 'shape' && object.data.shape?.kind === 'circle';
    const writing = ['text', 'heading', 'quote', 'callout'].includes(
        object.block_type,
    );
    return (
        <aside
            className="board-properties-panel glass-surface"
            data-board-properties
            aria-label="Object properties"
            onKeyDown={(event) => {
                if (
                    event.key === 'Escape' &&
                    !event.defaultPrevented &&
                    !(event.target as Element).closest('[role="menu"]')
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                }
            }}
        >
            <header>
                <span>Properties</span>
                <button
                    type="button"
                    ref={closeButton}
                    onClick={onClose}
                    aria-label="Close properties"
                >
                    <X size={16} />
                </button>
            </header>
            <div className="board-property-type">
                {boardBlockLabels[object.block_type]}
            </div>
            {writing && (
                <section>
                    <h3>Text style</h3>
                    <BoardTextStyleMenu
                        object={object}
                        disabled={disabled}
                        onChange={onChange}
                    />
                </section>
            )}
            <section>
                <h3>Position</h3>
                <div className="board-property-grid">
                    {(['x', 'y'] as const).map((field) => (
                        <GeometryField
                            key={field}
                            label={field.toUpperCase()}
                            value={object[field]}
                            minimum={-boardLimits.coordinate}
                            maximum={boardLimits.coordinate}
                            disabled={disabled}
                            onCommit={(value) => {
                                if (value !== object[field])
                                    onChange({ ...object, [field]: value });
                            }}
                        />
                    ))}
                </div>
            </section>
            <section>
                <h3>Size</h3>
                <div className="board-property-grid">
                    <GeometryField
                        label="Width"
                        value={object.width}
                        minimum={boardLimits.minWidth}
                        maximum={boardLimits.maxSize}
                        disabled={disabled}
                        onCommit={(width) => {
                            if (width !== object.width)
                                onChange({
                                    ...object,
                                    width,
                                    ...(circle ? { height: width } : {}),
                                });
                        }}
                    />
                    <GeometryField
                        label="Height"
                        value={object.height}
                        minimum={boardLimits.minHeight}
                        maximum={boardLimits.maxSize}
                        disabled={disabled || automaticHeight}
                        onCommit={(height) => {
                            if (!automaticHeight && height !== object.height)
                                onChange({
                                    ...object,
                                    height,
                                    ...(circle ? { width: height } : {}),
                                });
                        }}
                    />
                </div>
                {automaticHeight && (
                    <p>
                        Height follows content automatically. Side handles
                        change width; corners scale the whole block.
                    </p>
                )}
            </section>
            <footer>
                <MoveHorizontal size={14} />
                <MoveVertical size={14} />
                <span>Drag to arrange · Alt to bypass snapping</span>
            </footer>
        </aside>
    );
}
