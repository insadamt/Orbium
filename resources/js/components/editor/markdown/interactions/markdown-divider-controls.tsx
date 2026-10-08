import { RotateCcw, X } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { FormatButton } from '../../ui/format-button';
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
    const style = metadata.dividerStyle ?? 'solid';

    return (
        <div className="flex max-w-[calc(100vw-24px)] flex-wrap items-center gap-1 p-1">
            <input
                type="color"
                aria-label="Divider color"
                title="Divider color"
                className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1 hover:bg-accent"
                value={color || '#808080'}
                onChange={(event) =>
                    onChange({ dividerColor: event.target.value.toLowerCase() })
                }
            />
            <button
                type="button"
                aria-label="Use theme default divider color"
                title="Theme default color"
                className="rounded p-2 hover:bg-accent"
                onClick={() => onChange({ dividerColor: undefined })}
            >
                <span
                    className="flex h-4 w-4 items-center justify-center rounded-sm border border-border text-[10px]"
                    aria-hidden="true"
                >
                    ↺
                </span>
            </button>
            <AppSelect
                label="Divider thickness"
                contentClassName="divider-toolbar-select-content"
                className="h-8 min-h-8 w-auto gap-1 rounded border-0 bg-transparent px-2 py-1 text-xs shadow-none"
                value={thickness}
                placeholder="1 px"
                clearLabel="Default (1 px)"
                onValueChange={(value) =>
                    onChange({
                        dividerThickness: value ? Number(value) : undefined,
                    })
                }
                options={Array.from({ length: 12 }, (_, index) => ({
                    value: String(index + 1),
                    label: `${index + 1} px`,
                }))}
            />
            <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
            {dividerStyles.map((value) => (
                <FormatButton
                    key={value}
                    label={`${value[0].toUpperCase() + value.slice(1)} divider`}
                    active={style === value}
                    onClick={() => onChange({ dividerStyle: value })}
                >
                    <span
                        className="flex h-4 w-4 items-center"
                        title={
                            value === 'double'
                                ? 'Double divider (use 3 px or more to show both lines)'
                                : `${value[0].toUpperCase() + value.slice(1)} divider`
                        }
                        aria-hidden="true"
                    >
                        <span
                            className="w-full"
                            style={{ borderTop: `3px ${value} currentColor` }}
                        />
                    </span>
                </FormatButton>
            ))}
            <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
            <button
                type="button"
                aria-label="Reset divider appearance"
                title="Reset divider appearance"
                className="rounded p-2 hover:bg-accent"
                onClick={() =>
                    onChange({
                        dividerColor: undefined,
                        dividerThickness: undefined,
                        dividerStyle: undefined,
                    })
                }
            >
                <RotateCcw size={16} />
            </button>
            <button
                type="button"
                aria-label="Close divider toolbar"
                title="Close"
                className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={onClose}
            >
                <X size={16} />
            </button>
        </div>
    );
}
