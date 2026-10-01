import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ImagePlus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { BackgroundChoice } from './background-choice';
import {
    saveBackgroundImage,
    useBackgroundImage,
    validateBackgroundImage,
} from './background-image';
import {
    useBackgroundPreferences,
    type BackgroundKind,
} from './background-preferences';
import { findReactBitsEffect } from './react-bits-catalog';
import { preloadReactBitsEffect } from './react-bits-background';
import { ReactBitsSettings } from './react-bits-settings';
import { WallpaperLegacyControls } from './wallpaper-legacy-controls';
import { createWallpaperDraft, wallpaperOptions } from './wallpaper-options';
import { WallpaperPreview } from './wallpaper-preview';
import { previewStyle } from './wallpaper-palette';

export function WallpaperDialog() {
    const { preferences, applyBackgroundDraft } = useBackgroundPreferences();
    const { imageUrl, loading: imageLoading, loadError } = useBackgroundImage();
    const [open, setOpen] = useState(false);
    const [stage, setStage] = useState<'gallery' | 'editor'>('gallery');
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState(() =>
        createWallpaperDraft(preferences.kind, preferences),
    );
    const [liveKind, setLiveKind] = useState<BackgroundKind | null>(null);
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInput = useRef<HTMLInputElement>(null);
    const uploadRequest = useRef(0);
    const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectedOption =
        wallpaperOptions.find(({ kind }) => kind === preferences.kind) ??
        wallpaperOptions[0];
    const draftOption =
        wallpaperOptions.find(({ kind }) => kind === draft.kind) ??
        wallpaperOptions[0];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const visibleOptions = wallpaperOptions.filter(({ title, description }) =>
        `${title} ${description}`.toLocaleLowerCase().includes(normalizedQuery),
    );

    useEffect(() => {
        if (!open) return;
        window.dispatchEvent(
            new CustomEvent('orbium:wallpaper-editor', { detail: true }),
        );
        return () => {
            window.dispatchEvent(
                new CustomEvent('orbium:wallpaper-editor', { detail: false }),
            );
        };
    }, [open]);

    useEffect(() => {
        return () => {
            if (liveTimer.current) clearTimeout(liveTimer.current);
            if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl);
        };
    }, [pendingImageUrl]);

    function changeOpen(nextOpen: boolean, afterApply = false) {
        if (!nextOpen && saving && !afterApply) return;
        if (liveTimer.current) clearTimeout(liveTimer.current);
        if (nextOpen) {
            setDraft(createWallpaperDraft(preferences.kind, preferences));
            setStage('gallery');
            setQuery('');
            setError('');
            setLiveKind(preferences.kind);
        } else {
            uploadRequest.current += 1;
            setPendingImage(null);
            setPendingImageUrl(null);
            setLiveKind(null);
        }
        setOpen(nextOpen);
    }

    function queueLivePreview(kind: BackgroundKind | null) {
        if (liveTimer.current) clearTimeout(liveTimer.current);
        if (!kind) {
            setLiveKind(null);
            return;
        }
        liveTimer.current = setTimeout(() => setLiveKind(kind), 180);
    }

    function chooseWallpaper(kind: BackgroundKind) {
        setDraft(createWallpaperDraft(kind, preferences));
        setLiveKind(null);
        setError('');
        setStage('editor');
    }

    async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        const request = ++uploadRequest.current;
        let previewUrl: string | null = null;
        try {
            validateBackgroundImage(file);
            previewUrl = URL.createObjectURL(file);
            const image = new Image();
            image.src = previewUrl;
            await image.decode();
            if (request !== uploadRequest.current) {
                URL.revokeObjectURL(previewUrl);
                return;
            }
            setPendingImage(file);
            setPendingImageUrl(previewUrl);
            chooseWallpaper('image');
        } catch (reason) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setError(
                reason instanceof Error
                    ? reason.message
                    : 'Could not use this image.',
            );
        }
    }

    async function applyWallpaper() {
        if (draft.kind === 'image' && !pendingImage && !imageUrl) {
            setError('Upload an image before applying this wallpaper.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (draft.kind === 'ghost')
                await import('@/components/GhostFibers');
            if (draft.kind === 'molten')
                await import('@/components/MoltenMetal');
            if (findReactBitsEffect(draft.kind))
                await preloadReactBitsEffect(draft.kind);
            if (draft.kind === 'image' && pendingImage)
                await saveBackgroundImage(pendingImage);
            applyBackgroundDraft(draft);
            changeOpen(false, true);
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : 'Could not apply the wallpaper.',
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section
            className="space-y-3 border-t border-border pt-6"
            aria-labelledby="wallpaper-heading"
        >
            <div>
                <h2 id="wallpaper-heading" className="text-lg font-medium">
                    Wallpaper
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Choose a background and tune it before applying.
                </p>
            </div>
            <Dialog.Root open={open} onOpenChange={changeOpen}>
                <Dialog.Trigger asChild>
                    <button
                        type="button"
                        className="appearance-choice flex w-full items-center gap-4 rounded-2xl p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <span
                            className="size-14 shrink-0 rounded-xl border border-border"
                            style={
                                preferences.kind === 'image' && imageUrl
                                    ? {
                                          backgroundImage: `url(${imageUrl})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                      }
                                    : previewStyle(preferences.kind)
                            }
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">
                                {selectedOption.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                Current wallpaper · Saved in this browser
                            </span>
                        </span>
                        <span className="appearance-disclosure rounded-lg px-3 py-2 text-sm font-medium">
                            Choose wallpaper
                        </span>
                    </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                    <Dialog.Overlay className="wallpaper-dialog-overlay" />
                    <Dialog.Content
                        className="wallpaper-dialog"
                        aria-describedby="wallpaper-dialog-description"
                    >
                        <div className="wallpaper-dialog-header">
                            <div className="flex min-w-0 items-center gap-3">
                                {stage === 'editor' && (
                                    <button
                                        type="button"
                                        onClick={() => setStage('gallery')}
                                        className="wallpaper-icon-button"
                                        aria-label="Back to wallpapers"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                                <div className="min-w-0">
                                    <Dialog.Title className="truncate text-lg font-semibold">
                                        {stage === 'gallery'
                                            ? 'Choose wallpaper'
                                            : draftOption.title}
                                    </Dialog.Title>
                                    <Dialog.Description
                                        id="wallpaper-dialog-description"
                                        className="text-sm text-muted-foreground"
                                    >
                                        {stage === 'gallery'
                                            ? 'Browse wallpapers, then customize and apply.'
                                            : 'Adjust controls and preview changes before applying.'}
                                    </Dialog.Description>
                                </div>
                            </div>
                            <Dialog.Close
                                className="wallpaper-icon-button"
                                aria-label="Close wallpaper dialog"
                                disabled={saving}
                            >
                                <X size={18} />
                            </Dialog.Close>
                        </div>
                        {stage === 'gallery' ? (
                            <div className="wallpaper-gallery">
                                <div className="wallpaper-gallery-toolbar">
                                    <label className="wallpaper-search">
                                        <Search size={17} aria-hidden="true" />
                                        <input
                                            autoFocus
                                            value={query}
                                            onChange={(event) =>
                                                setQuery(event.target.value)
                                            }
                                            placeholder="Search wallpapers"
                                            aria-label="Search wallpapers"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInput.current?.click()
                                        }
                                        className="wallpaper-button wallpaper-button-secondary"
                                    >
                                        <ImagePlus size={17} /> Upload image
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Hover or focus a miniature to see it move.
                                    Only one live preview runs at a time.
                                </p>
                                <div className="wallpaper-gallery-grid">
                                    {visibleOptions.map((option) => (
                                        <BackgroundChoice
                                            key={option.kind}
                                            option={option}
                                            selected={
                                                preferences.kind === option.kind
                                            }
                                            live={
                                                liveKind === option.kind &&
                                                !preferences.pauseAnimations
                                            }
                                            imageUrl={
                                                pendingImageUrl ?? imageUrl
                                            }
                                            draft={createWallpaperDraft(
                                                option.kind,
                                                preferences,
                                            )}
                                            onSelect={() =>
                                                chooseWallpaper(option.kind)
                                            }
                                            onLiveChange={(active) =>
                                                queueLivePreview(
                                                    active ? option.kind : null,
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                                {visibleOptions.length === 0 && (
                                    <p className="py-10 text-center text-sm text-muted-foreground">
                                        No wallpapers match “{query}”.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="wallpaper-editor">
                                <div className="wallpaper-editor-controls">
                                    {findReactBitsEffect(draft.kind) && (
                                        <ReactBitsSettings
                                            effect={findReactBitsEffect(
                                                draft.kind,
                                            )!}
                                            settings={
                                                draft.effect ??
                                                findReactBitsEffect(draft.kind)!
                                                    .defaults
                                            }
                                            onChange={(values) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    effect: {
                                                        ...current.effect,
                                                        ...values,
                                                    },
                                                }))
                                            }
                                            onReset={() =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    effect: {
                                                        ...findReactBitsEffect(
                                                            current.kind,
                                                        )!.defaults,
                                                    },
                                                }))
                                            }
                                        />
                                    )}
                                    {(draft.kind === 'ghost' ||
                                        draft.kind === 'molten') && (
                                        <WallpaperLegacyControls
                                            draft={draft}
                                            onChange={setDraft}
                                        />
                                    )}
                                    {draft.kind === 'image' && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold">
                                                Your image
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                PNG, JPEG, WebP, or GIF · 10 MB
                                                max. Stored in this browser.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInput.current?.click()
                                                }
                                                className="wallpaper-button wallpaper-button-secondary"
                                            >
                                                {pendingImage || imageUrl
                                                    ? 'Replace image'
                                                    : 'Upload image'}
                                            </button>
                                            {imageLoading && (
                                                <p className="text-sm text-muted-foreground">
                                                    Loading saved image…
                                                </p>
                                            )}
                                            {loadError && (
                                                <p
                                                    role="alert"
                                                    className="text-sm text-destructive"
                                                >
                                                    Could not load the saved
                                                    image. Upload it again.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {draft.kind === 'default' && (
                                        <p className="text-sm text-muted-foreground">
                                            Orbium’s original quiet background
                                            has no controls.
                                        </p>
                                    )}
                                </div>
                                <div className="wallpaper-editor-preview">
                                    <div className="wallpaper-preview-frame">
                                        <WallpaperPreview
                                            draft={draft}
                                            imageUrl={
                                                pendingImageUrl ?? imageUrl
                                            }
                                            active={
                                                !preferences.pauseAnimations
                                            }
                                        />
                                        <div className="wallpaper-preview-sample">
                                            <span>Orbium</span>
                                            <span>Live preview</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Preview changes stay here until you
                                        select Apply wallpaper.
                                    </p>
                                </div>
                            </div>
                        )}
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={uploadImage}
                            className="sr-only"
                            aria-label="Upload wallpaper image"
                        />
                        {error && (
                            <p role="alert" className="wallpaper-dialog-error">
                                {error}
                            </p>
                        )}
                        <div className="wallpaper-dialog-footer">
                            <span className="text-xs text-muted-foreground">
                                {stage === 'editor'
                                    ? 'Changes are not applied yet'
                                    : `${visibleOptions.length} wallpapers`}
                            </span>
                            <div className="flex gap-2">
                                <Dialog.Close
                                    className="wallpaper-button wallpaper-button-secondary"
                                    disabled={saving}
                                >
                                    Cancel
                                </Dialog.Close>
                                {stage === 'editor' && (
                                    <button
                                        type="button"
                                        onClick={() => void applyWallpaper()}
                                        disabled={
                                            saving ||
                                            (draft.kind === 'image' &&
                                                !pendingImage &&
                                                !imageUrl)
                                        }
                                        className="wallpaper-button wallpaper-button-primary"
                                    >
                                        {saving
                                            ? 'Applying…'
                                            : 'Apply wallpaper'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </section>
    );
}
