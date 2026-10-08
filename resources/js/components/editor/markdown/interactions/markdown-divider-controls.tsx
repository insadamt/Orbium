import { Minus, RotateCcw, X } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import type { OrbiumMetadata } from '../dialect/metadata';

type Props = {
    metadata: OrbiumMetadata;
    onChange: (patch: Partial<OrbiumMetadata>) => void;
    onClose: () => void;
};
const dividerStyles = ['solid', 'dashed', 'dotted', 'double'] as const;

export function MarkdownDividerControls({
    metadata,
    onChange,
    onClose,
}: Props) {
    const color = metadata.dividerColor ?? '';
    const thickness = String(metadata.dividerThickness ?? '');
    const style = metadata.dividerStyle ?? '';
    const previewThickness = Number(thickness || 1);
    return (
        <div className="w-80 max-w-[calc(100vw-24px)] space-y-3 p-3">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                    <Minus size={16} />
                    Divider
                </span>
                <button
                    type="button"
                    aria-label="Close divider toolbar"
                    title="Close"
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={onClose}
                >
                    <X size={16} />
                </button>
            </div>
            <div
                className="flex h-10 items-center rounded-lg border border-border/60 bg-muted/40 px-3"
                aria-label="Divider preview"
            >
                <span
                    className="w-full"
                    style={{
                        borderTop: `${previewThickness}px ${style || 'solid'} ${color || 'var(--border)'}`,
                    }}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs text-muted-foreground">
                        Color
                        <input
                            type="color"
                            aria-label="Divider color"
                            className="h-7 w-9 cursor-pointer rounded border border-border"
                            value={color || '#808080'}
                            onChange={(event) =>
                                onChange({
                                    dividerColor:
                                        event.target.value.toLowerCase(),
                                })
                            }
                        />
                    </label>
                    <button
                        type="button"
                        className="flex min-h-9 w-full items-center justify-between rounded-lg border border-border px-2 text-xs hover:bg-accent"
                        onClick={() => onChange({ dividerColor: undefined })}
                        title="Use theme default color"
                    >
                        <span>{color || 'Theme default'}</span>
                        <RotateCcw size={12} />
                    </button>
                </div>
                <div className="space-y-1.5">
                    <span className="flex h-7 items-center text-xs text-muted-foreground">
                        Thickness
                    </span>
                    <AppSelect
                        label="Divider thickness"
                        contentClassName="divider-toolbar-select-content"
                        value={thickness}
                        placeholder="Default (1 px)"
                        clearLabel="Default (1 px)"
                        onValueChange={(value) =>
                            onChange({
                                dividerThickness: value
                                    ? Number(value)
                                    : undefined,
                            })
                        }
                        options={Array.from({ length: 12 }, (_, index) => ({
                            value: String(index + 1),
                            label: `${index + 1} px`,
                        }))}
                    />
                </div>
            </div>
            <fieldset>
                <legend className="mb-1.5 text-xs text-muted-foreground">
                    Line style
                </legend>
                <div className="grid grid-cols-4 gap-1">
                    {dividerStyles.map((value) => (
                        <button
                            key={value}
                            type="button"
                            aria-label={`${value} divider`}
                            aria-pressed={(style || 'solid') === value}
                            className={`flex min-h-12 flex-col items-center justify-center gap-2 rounded-lg border px-1 text-[11px] hover:bg-accent ${(style || 'solid') === value ? 'border-foreground/40 bg-accent' : 'border-border'}`}
                            onClick={() => onChange({ dividerStyle: value })}
                        >
                            <span
                                className="w-8"
                                style={{
                                    borderTop: `3px ${value} currentColor`,
                                }}
                                aria-hidden="true"
                            />
                            {value[0].toUpperCase() + value.slice(1)}
                        </button>
                    ))}
                </div>
            </fieldset>
            {style === 'double' && previewThickness < 3 && (
                <p className="text-xs text-muted-foreground">
                    Use 3 px or more to show both lines.
                </p>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3">
                <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() =>
                        onChange({
                            dividerColor: undefined,
                            dividerThickness: undefined,
                            dividerStyle: undefined,
                        })
                    }
                >
                    <RotateCcw size={13} />
                    Reset
                </button>
                <span className="text-xs text-muted-foreground">
                    Changes apply instantly
                </span>
            </div>
        </div>
    );
}
