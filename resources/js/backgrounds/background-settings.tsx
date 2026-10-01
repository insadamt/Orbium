import { useRef, useState, type ChangeEvent } from 'react';
import {
    ColorControl,
    ghostControls,
    moltenControls,
    NumberControls,
} from './background-controls';
import {
    removeBackgroundImage,
    saveBackgroundImage,
    useBackgroundImage,
} from './background-image';
import {
    useBackgroundPreferences,
    type BackgroundKind,
} from './background-preferences';
import { findReactBitsEffect, reactBitsEffects } from './react-bits-catalog';
import { preloadReactBitsEffect } from './react-bits-background';
import { ReactBitsSettings } from './react-bits-settings';

const options: { kind: BackgroundKind; title: string; description: string }[] =
    [
        {
            kind: 'default',
            title: 'Orbium default',
            description: 'Original calm background',
        },
        {
            kind: 'ghost',
            title: 'Ghost Fibers',
            description: 'Animated luminous fibers',
        },
        {
            kind: 'molten',
            title: 'Molten Metal',
            description: 'Animated liquid light',
        },
        {
            kind: 'image',
            title: 'Your image',
            description: 'An image from this browser',
        },
        ...reactBitsEffects.map(({ kind, title, description }) => ({
            kind,
            title,
            description,
        })),
    ];

export function BackgroundSettings() {
    const {
        preferences,
        selectBackground,
        updateGhost,
        updateMolten,
        resetGhost,
        resetMolten,
        updateEffect,
        resetEffect,
    } = useBackgroundPreferences();
    const { imageUrl, loading } = useBackgroundImage();
    const fileInput = useRef<HTMLInputElement>(null);
    const selectionRequest = useRef(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    async function chooseBackground(kind: BackgroundKind) {
        if (kind === preferences.kind) return;
        const request = ++selectionRequest.current;
        setError('');
        try {
            if (kind === 'ghost') await import('@/components/GhostFibers');
            if (kind === 'molten') await import('@/components/MoltenMetal');
            if (findReactBitsEffect(kind)) await preloadReactBitsEffect(kind);
            if (request === selectionRequest.current) selectBackground(kind);
        } catch {
            if (request === selectionRequest.current)
                setError('Could not load the selected background.');
        }
    }

    async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            await saveBackgroundImage(file);
            selectBackground('image');
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : 'Could not save the image.',
            );
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    }

    async function handleImageRemoval() {
        try {
            await removeBackgroundImage();
            if (preferences.kind === 'image') selectBackground('default');
        } catch {
            setError('Could not remove the image.');
        }
    }

    return (
        <section
            className="space-y-6 border-t border-border pt-6"
            aria-labelledby="backgrounds-heading"
        >
            <div>
                <h2 id="backgrounds-heading" className="text-lg font-medium">
                    Backgrounds
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Choose an animated background or use your own image. Changes
                    apply throughout this browser.
                </p>
            </div>

            <div
                className="grid gap-3 sm:grid-cols-2"
                role="group"
                aria-label="Choose a background"
            >
                {options.map(({ kind, title, description }) => (
                    <button
                        key={kind}
                        type="button"
                        aria-pressed={preferences.kind === kind}
                        disabled={kind === 'image' && !imageUrl}
                        onClick={() => void chooseBackground(kind)}
                        className="rounded-xl border border-border bg-background/75 p-4 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-foreground"
                    >
                        <span className="block font-medium">{title}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                            {description}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="sr-only"
                    aria-label="Upload background image"
                />
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                    className="rounded-lg border border-border bg-background/80 px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                >
                    {uploading
                        ? 'Saving image…'
                        : imageUrl
                          ? 'Replace image'
                          : 'Upload image'}
                </button>
                {imageUrl && (
                    <button
                        type="button"
                        onClick={handleImageRemoval}
                        className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        Remove image
                    </button>
                )}
                <span className="text-xs text-muted-foreground">
                    PNG, JPEG, WebP, or GIF · 10 MB max
                </span>
            </div>
            {loading && (
                <p className="text-sm text-muted-foreground">
                    Loading saved image…
                </p>
            )}
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}

            {preferences.kind === 'ghost' && (
                <div className="space-y-5 rounded-xl border border-border bg-background/75 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium">Ghost Fibers controls</h3>
                        <button
                            type="button"
                            onClick={resetGhost}
                            className="text-sm underline underline-offset-4"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <ColorControl
                            label="Line color"
                            value={preferences.ghost.lineColor}
                            onChange={(lineColor) => updateGhost({ lineColor })}
                        />
                        <ColorControl
                            label="Glow color"
                            value={preferences.ghost.glowColor}
                            onChange={(glowColor) => updateGhost({ glowColor })}
                        />
                    </div>
                    <NumberControls
                        controls={ghostControls}
                        values={preferences.ghost}
                        onChange={(key, value) => updateGhost({ [key]: value })}
                    />
                </div>
            )}

            {preferences.kind === 'molten' && (
                <div className="space-y-5 rounded-xl border border-border bg-background/75 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium">Molten Metal controls</h3>
                        <button
                            type="button"
                            onClick={resetMolten}
                            className="text-sm underline underline-offset-4"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <ColorControl
                            label="Shadow color"
                            value={preferences.molten.color1}
                            onChange={(color1) => updateMolten({ color1 })}
                        />
                        <ColorControl
                            label="Mid color"
                            value={preferences.molten.color2}
                            onChange={(color2) => updateMolten({ color2 })}
                        />
                        <ColorControl
                            label="Highlight color"
                            value={preferences.molten.color3}
                            onChange={(color3) => updateMolten({ color3 })}
                        />
                        <ColorControl
                            label="Background color"
                            value={preferences.molten.backgroundColor}
                            onChange={(backgroundColor) =>
                                updateMolten({ backgroundColor })
                            }
                        />
                    </div>
                    <label className="grid gap-1.5 text-sm">
                        Color mode
                        <select
                            value={preferences.molten.colorMode}
                            onChange={(event) =>
                                updateMolten({ colorMode: event.target.value })
                            }
                            className="rounded-lg border border-border bg-background p-2"
                        >
                            <option value="molten">Molten</option>
                            <option value="ember">Ember</option>
                            <option value="frost">Frost</option>
                        </select>
                    </label>
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={preferences.molten.grain}
                                onChange={(event) =>
                                    updateMolten({
                                        grain: event.target.checked,
                                    })
                                }
                            />{' '}
                            Grain
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={preferences.molten.mouseInteraction}
                                onChange={(event) =>
                                    updateMolten({
                                        mouseInteraction: event.target.checked,
                                    })
                                }
                            />{' '}
                            Pointer interaction
                        </label>
                    </div>
                    <NumberControls
                        controls={moltenControls}
                        values={preferences.molten}
                        onChange={(key, value) =>
                            updateMolten({ [key]: value })
                        }
                    />
                </div>
            )}
            {(preferences.kind === 'ghost' ||
                preferences.kind === 'molten') && (
                <p className="text-xs text-muted-foreground">
                    Animation pauses when your system requests reduced motion or
                    this tab is hidden. These effects require WebGL 2.
                </p>
            )}
            {findReactBitsEffect(preferences.kind) && (
                <ReactBitsSettings
                    effect={findReactBitsEffect(preferences.kind)!}
                    settings={preferences.effects[preferences.kind]}
                    onChange={(values) =>
                        updateEffect(preferences.kind, values)
                    }
                    onReset={() => resetEffect(preferences.kind)}
                />
            )}
        </section>
    );
}
