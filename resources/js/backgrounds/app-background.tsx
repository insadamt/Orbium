import {
    Component,
    lazy,
    Suspense,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { useBackgroundImage } from './background-image';
import { revealAppearanceFromCenter } from './appearance-reveal';
import { useBackgroundPreferences } from './background-preferences';
import { findReactBitsEffect } from './react-bits-catalog';
import { ReactBitsBackground } from './react-bits-background';

const GhostFibers = lazy(() => import('@/components/GhostFibers'));
const MoltenMetal = lazy(() => import('@/components/MoltenMetal'));

class BackgroundErrorBoundary extends Component<
    { children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(
        () =>
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return reduced;
}

export function AppBackground() {
    const { preferences } = useBackgroundPreferences();
    const { imageUrl } = useBackgroundImage();
    const reducedMotion = useReducedMotion();
    const [wallpaperEditorOpen, setWallpaperEditorOpen] = useState(false);
    const pauseAnimations =
        reducedMotion || preferences.pauseAnimations || wallpaperEditorOpen;
    useEffect(() => {
        const updateEditorState = (event: Event) =>
            setWallpaperEditorOpen((event as CustomEvent<boolean>).detail);
        window.addEventListener('orbium:wallpaper-editor', updateEditorState);
        return () =>
            window.removeEventListener(
                'orbium:wallpaper-editor',
                updateEditorState,
            );
    }, []);
    const [displayedBackground, setDisplayedBackground] = useState(() => ({
        kind: preferences.kind,
        imageUrl: null as string | null,
    }));
    const initialImageLoaded = useRef(preferences.kind !== 'image');
    const activeEffect = findReactBitsEffect(displayedBackground.kind);

    useEffect(() => {
        if (preferences.kind === 'image' && !imageUrl) return;
        const nextBackground = { kind: preferences.kind, imageUrl };
        if (
            nextBackground.kind === displayedBackground.kind &&
            (nextBackground.kind !== 'image' ||
                nextBackground.imageUrl === displayedBackground.imageUrl)
        )
            return;
        if (!initialImageLoaded.current) {
            initialImageLoaded.current = true;
            setDisplayedBackground(nextBackground);
            return;
        }
        let active = true;
        queueMicrotask(() => {
            if (active)
                revealAppearanceFromCenter(() =>
                    setDisplayedBackground(nextBackground),
                );
        });
        return () => {
            active = false;
        };
    }, [preferences.kind, imageUrl, displayedBackground]);

    if (displayedBackground.kind === 'default') return null;

    return (
        <div
            className="orbium-background"
            aria-hidden="true"
            style={
                activeEffect
                    ? {
                          backgroundColor: String(
                              preferences.effects[activeEffect.kind]
                                  ?.backgroundColor ?? '#0d1012',
                          ),
                      }
                    : displayedBackground.kind === 'ghost'
                      ? { backgroundColor: '#101019' }
                      : displayedBackground.kind === 'molten'
                        ? {
                              backgroundColor:
                                  preferences.molten.backgroundColor,
                          }
                        : undefined
            }
        >
            {displayedBackground.kind === 'image' &&
                displayedBackground.imageUrl && (
                    <div
                        className="orbium-background-image"
                        style={{
                            backgroundImage: `url(${displayedBackground.imageUrl})`,
                        }}
                    />
                )}
            <BackgroundErrorBoundary key={displayedBackground.kind}>
                <Suspense fallback={null}>
                    {!pauseAnimations &&
                        displayedBackground.kind === 'ghost' && (
                            <GhostFibers
                                {...preferences.ghost}
                                paused={reducedMotion}
                            />
                        )}
                    {!pauseAnimations &&
                        displayedBackground.kind === 'molten' && (
                            <MoltenMetal
                                {...preferences.molten}
                                paused={reducedMotion}
                            />
                        )}
                    {!pauseAnimations && activeEffect && (
                        <ReactBitsBackground
                            kind={activeEffect.kind}
                            settings={preferences.effects[activeEffect.kind]}
                            reducedMotion={reducedMotion}
                        />
                    )}
                </Suspense>
            </BackgroundErrorBoundary>
        </div>
    );
}
