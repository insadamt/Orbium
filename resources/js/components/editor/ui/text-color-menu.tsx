import { Check, Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as Menu from '@/components/ui/dropdown-menu';

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
                        aria-expanded={open}
                        aria-haspopup="true"
                        onMouseDown={(event) => event.preventDefault()}
                        className={`flex items-center gap-1 rounded p-2 ${open ? 'bg-accent' : 'hover:bg-accent'}`}
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
                    className="orbium-editor-toolbar w-52 p-3"
                    onCloseAutoFocus={(event) => event.preventDefault()}
                >
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Text color
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {PRESET_COLORS.map(({ name, value }) => (
                            <Menu.Item key={value} asChild textValue={name}>
                                <button
                                    type="button"
                                    data-menu-swatch
                                    aria-label={name}
                                    aria-pressed={currentColor === value}
                                    title={name}
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => chooseColor(value)}
                                    className="flex size-7 items-center justify-center rounded-full border border-border/60"
                                    style={{
                                        backgroundColor:
                                            displayedTextColor(value),
                                    }}
                                >
                                    {currentColor === value && (
                                        <Check
                                            size={14}
                                            className="text-background"
                                        />
                                    )}
                                </button>
                            </Menu.Item>
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
                    <Menu.Item asChild>
                        <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => chooseColor(null)}
                            className="mt-1 w-full rounded-md px-1 py-1 text-left text-xs hover:bg-accent"
                        >
                            Default text color
                        </button>
                    </Menu.Item>
                </Menu.Content>
            </Menu.Root>
        </div>
    );
}
