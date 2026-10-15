import { Check, Palette, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ColorSpectrum } from './color-spectrum';
import * as Menu from '@/components/ui/dropdown-menu';

const PRESET_COLORS = [
    { name: 'Red', value: 'preset:red' },
    { name: 'Blue', value: 'preset:blue' },
    { name: 'Green', value: 'preset:green' },
    { name: 'Cyan', value: 'preset:teal' },
    { name: 'Magenta', value: 'preset:pink' },
    {
        name: 'Violet',
        value: 'preset:purple',
    },
    { name: 'Orange', value: 'preset:orange' },
];

function displayedTextColor(color: string | undefined): string {
    return color?.startsWith('preset:')
        ? `var(--editor-text-color-${color.slice(7)})`
        : (color ?? 'currentColor');
}

export function TextColorMenu({
    active,
    currentColor,
    onOpen,
    onChoose,
}: {
    active: boolean;
    currentColor?: string;
    onOpen: () => void;
    onChoose: (color: string | null, keepOpen: boolean) => void;
}) {
    const [open, setOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active) setOpen(false);
    }, [active]);

    function chooseColor(color: string | null, keepPickerOpen = false) {
        onChoose(color, keepPickerOpen);
        if (!keepPickerOpen) setOpen(false);
    }

    return (
        <div ref={pickerRef} className="relative">
            <Menu.Root
                modal={false}
                open={active && open}
                onOpenChange={(nextOpen) => {
                    if (nextOpen) onOpen();
                    setOpen(nextOpen);
                }}
            >
                <Menu.Trigger asChild>
                    <button
                        type="button"
                        aria-label="Text color"
                        title="Text color"
                        aria-expanded={open}
                        aria-haspopup="true"
                        onMouseDown={(event) => event.preventDefault()}
                        className={`editor-toolbar-button flex items-center gap-1 rounded p-2 ${open ? 'bg-accent' : 'hover:bg-accent'}`}
                    >
                        <Palette size={16} />
                        <span
                            aria-hidden="true"
                            className="h-1 w-3 rounded-full"
                            style={{
                                backgroundColor:
                                    displayedTextColor(currentColor),
                            }}
                        />
                    </button>
                </Menu.Trigger>
                <Menu.Content
                    container={pickerRef.current}
                    align="end"
                    sideOffset={8}
                    aria-label="Text colors"
                    className="editor-color-picker"
                    onCloseAutoFocus={(event) => event.preventDefault()}
                >
                    <div className="editor-color-picker-heading">
                        Text color
                    </div>
                    <ColorSpectrum
                        currentColor={currentColor}
                        onChoose={(hex) => chooseColor(hex, true)}
                    />
                    <div
                        className="editor-color-picker-presets"
                        aria-label="Preset colors"
                    >
                        {PRESET_COLORS.map(({ name, value }) => (
                            <Menu.Item
                                key={value}
                                asChild
                                textValue={name}
                                onSelect={() => chooseColor(value)}
                            >
                                <button
                                    type="button"
                                    data-menu-swatch
                                    className="editor-color-swatch"
                                    aria-label={name}
                                    aria-pressed={currentColor === value}
                                    title={
                                        value === 'preset:purple'
                                            ? 'Violet in light mode, yellow in dark mode'
                                            : name
                                    }
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                >
                                    <span
                                        className="editor-color-swatch-fill"
                                        aria-hidden="true"
                                        style={{
                                            backgroundColor:
                                                displayedTextColor(value),
                                        }}
                                    />
                                    {currentColor === value && (
                                        <Check
                                            size={12}
                                            className="editor-color-swatch-check"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            </Menu.Item>
                        ))}
                    </div>
                    <Menu.Item
                        asChild
                        textValue="Default text color"
                        onSelect={() => chooseColor(null)}
                    >
                        <button
                            type="button"
                            className="editor-color-reset"
                            onMouseDown={(event) => event.preventDefault()}
                        >
                            <RotateCcw size={14} aria-hidden="true" />
                            <span>Default text color</span>
                            {!currentColor && (
                                <Check
                                    size={12}
                                    className="ms-auto"
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                    </Menu.Item>
                </Menu.Content>
            </Menu.Root>
        </div>
    );
}
