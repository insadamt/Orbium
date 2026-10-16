import { RotateCcw, X } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { FormatButton } from '../../ui/format-button';
import { TextColorMenu } from '../../ui/text-color-menu';
import { ToolbarHighlight } from '../../ui/toolbar-motion';
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
        <>
            <ToolbarHighlight />
            <TextColorMenu
                active
                colorLabel="Divider color"
                presetColorFormat="hex"
                currentColor={color || undefined}
                onOpen={() => {}}
                onChoose={(selectedColor) =>
                    onChange({ dividerColor: selectedColor ?? undefined })
                }
            />
            <AppSelect
                label="Divider thickness"
                contentClassName="divider-toolbar-select-content"
                className="editor-toolbar-button h-8 min-h-8 w-auto gap-1 rounded border-0 bg-transparent px-2 py-1 text-xs shadow-none"
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
                className="editor-toolbar-button rounded p-2 hover:bg-accent"
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
                className="editor-toolbar-button rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={onClose}
            >
                <X size={16} />
            </button>
        </>
    );
}
