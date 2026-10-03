import type { Editor } from '@tiptap/core';
import { Check, Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const PRESET_COLORS = [
    { name: 'Red', value: 'preset:red' },
    { name: 'Blue', value: 'preset:blue' },
    { name: 'Green', value: 'preset:green' },
    { name: 'Cyan', value: 'preset:teal' },
    { name: 'Magenta', value: 'preset:pink' },
    {
        name: 'Yellow in dark mode, violet in light mode',
        value: 'preset:purple',
    },
    { name: 'Orange', value: 'preset:orange' },
];

function displayedTextColor(color: string | undefined): string {
    return color?.startsWith('preset:')
        ? `var(--editor-text-color-${color.slice(7)})`
        : (color ?? 'currentColor');
}

export function TextColorPicker({ editor }: { editor: Editor }) {
    const [open, setOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const selectedRange = useRef<{ from: number; to: number } | null>(null);
    const currentColor = editor.getAttributes('textColor').color as
        | string
        | undefined;

    useEffect(() => {
        if (!open) return;
        const dismiss = (event: PointerEvent) => {
            if (!pickerRef.current?.contains(event.target as Node))
                setOpen(false);
        };
        const dismissOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', dismiss);
        document.addEventListener('keydown', dismissOnEscape);
        return () => {
            document.removeEventListener('pointerdown', dismiss);
            document.removeEventListener('keydown', dismissOnEscape);
        };
    }, [open]);

    function chooseColor(color: string | null, keepPickerOpen = false) {
        const range = selectedRange.current;
        if (!range || range.to > editor.state.doc.content.size) return;
        const command = editor.chain();
        if (!keepPickerOpen) command.focus();
        command.setTextSelection(range);
        if (color) command.setMark('textColor', { color }).run();
        else command.unsetMark('textColor').run();
        if (!keepPickerOpen) setOpen(false);
    }

    return (
        <div ref={pickerRef} className="relative">
            <button
                type="button"
                aria-label="Text color"
                aria-expanded={open}
                aria-haspopup="true"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                    selectedRange.current = {
                        from: editor.state.selection.from,
                        to: editor.state.selection.to,
                    };
                    setOpen((wasOpen) => !wasOpen);
                }}
                className={`flex items-center gap-1 rounded p-2 ${open ? 'bg-accent' : 'hover:bg-accent'}`}
            >
                <Palette size={16} />
                <span
                    aria-hidden="true"
                    className="h-1 w-3 rounded-full"
                    style={{
                        backgroundColor: displayedTextColor(currentColor),
                    }}
                />
            </button>
            {open && (
                <div
                    role="group"
                    aria-label="Text colors"
                    className="glass-surface absolute top-full right-0 z-50 mt-2 w-52 rounded-xl border border-border p-3 shadow-xl"
                >
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Text color
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {PRESET_COLORS.map(({ name, value }) => (
                            <button
                                key={value}
                                type="button"
                                aria-label={name}
                                aria-pressed={currentColor === value}
                                title={name}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => chooseColor(value)}
                                className="flex size-7 items-center justify-center rounded-full border border-border/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                style={{
                                    backgroundColor: displayedTextColor(value),
                                }}
                            >
                                {currentColor === value && (
                                    <Check
                                        size={14}
                                        className="text-background"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                    <label className="mt-3 flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 text-xs hover:bg-accent">
                        Custom color
                        <input
                            type="color"
                            aria-label="Choose any text color"
                            value={
                                currentColor &&
                                /^#[0-9a-fA-F]{6}$/.test(currentColor)
                                    ? currentColor
                                    : '#75a1ff'
                            }
                            onChange={(event) =>
                                chooseColor(event.currentTarget.value, true)
                            }
                            className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
                        />
                    </label>
                    <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => chooseColor(null)}
                        className="mt-1 w-full rounded-md px-1 py-1 text-left text-xs hover:bg-accent"
                    >
                        Default text color
                    </button>
                </div>
            )}
        </div>
    );
}
