import {
    ColorControl,
    ghostControls,
    moltenControls,
    NumberControls,
} from './background-controls';
import { AppSelect } from '@/components/ui/app-select';
import {
    ghostDefaults,
    moltenDefaults,
    type BackgroundDraft,
    type GhostSettings,
    type MoltenSettings,
} from './background-preferences';

export function WallpaperLegacyControls({
    draft,
    onChange,
}: {
    draft: BackgroundDraft;
    onChange: (draft: BackgroundDraft) => void;
}) {
    if (draft.kind === 'ghost') {
        const updateGhost = (values: Partial<GhostSettings>) =>
            onChange({ ...draft, ghost: { ...draft.ghost, ...values } });
        return (
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                        Ghost Fibers controls
                    </h3>
                    <button
                        type="button"
                        className="appearance-text-button"
                        onClick={() => updateGhost(ghostDefaults)}
                    >
                        Reset
                    </button>
                </div>
                <ColorControl
                    label="Line color"
                    value={draft.ghost.lineColor}
                    onChange={(lineColor) => updateGhost({ lineColor })}
                />
                <ColorControl
                    label="Glow color"
                    value={draft.ghost.glowColor}
                    onChange={(glowColor) => updateGhost({ glowColor })}
                />
                <NumberControls
                    controls={ghostControls}
                    values={draft.ghost}
                    onChange={(key, value) => updateGhost({ [key]: value })}
                />
            </div>
        );
    }
    if (draft.kind !== 'molten') return null;

    const updateMolten = (values: Partial<MoltenSettings>) =>
        onChange({ ...draft, molten: { ...draft.molten, ...values } });
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Molten Metal controls</h3>
                <button
                    type="button"
                    className="appearance-text-button"
                    onClick={() => updateMolten(moltenDefaults)}
                >
                    Reset
                </button>
            </div>
            <ColorControl
                label="Shadow color"
                value={draft.molten.color1}
                onChange={(color1) => updateMolten({ color1 })}
            />
            <ColorControl
                label="Mid color"
                value={draft.molten.color2}
                onChange={(color2) => updateMolten({ color2 })}
            />
            <ColorControl
                label="Highlight color"
                value={draft.molten.color3}
                onChange={(color3) => updateMolten({ color3 })}
            />
            <ColorControl
                label="Background color"
                value={draft.molten.backgroundColor}
                onChange={(backgroundColor) =>
                    updateMolten({ backgroundColor })
                }
            />
            <div className="grid gap-2 text-sm">
                <span>Color mode</span>
                <AppSelect
                    label="Color mode"
                    value={draft.molten.colorMode}
                    onValueChange={(colorMode) => updateMolten({ colorMode })}
                    className="appearance-select"
                    options={[
                        { value: 'molten', label: 'Molten' },
                        { value: 'ember', label: 'Ember' },
                        { value: 'frost', label: 'Frost' },
                    ]}
                />
            </div>
            <label className="flex items-center gap-2.5 text-sm">
                <input
                    type="checkbox"
                    checked={draft.molten.grain}
                    onChange={(event) =>
                        updateMolten({ grain: event.target.checked })
                    }
                    className="appearance-checkbox"
                />
                Grain
            </label>
            <label className="flex items-center gap-2.5 text-sm">
                <input
                    type="checkbox"
                    checked={draft.molten.mouseInteraction}
                    onChange={(event) =>
                        updateMolten({ mouseInteraction: event.target.checked })
                    }
                    className="appearance-checkbox"
                />
                Pointer interaction
            </label>
            <NumberControls
                controls={moltenControls}
                values={draft.molten}
                onChange={(key, value) => updateMolten({ [key]: value })}
            />
        </div>
    );
}
