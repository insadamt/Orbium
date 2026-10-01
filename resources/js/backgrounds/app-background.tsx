import {
    Component,
    lazy,
    Suspense,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { useBackgroundImage } from './background-image';
import { revealAppearanceFromCenter } from './appearance-reveal';
import { useBackgroundPreferences } from './background-preferences';

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
    const [reduced, setReduced] = useState(false);
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
    const { resolvedAppearance } = useAppearance();
    const { imageUrl } = useBackgroundImage();
    const reducedMotion = useReducedMotion();
    const lightMode = resolvedAppearance === 'light';
    const [displayedBackground, setDisplayedBackground] = useState(() => ({
        kind: preferences.kind,
        imageUrl: null as string | null,
    }));
    const initialImageLoaded = useRef(preferences.kind !== 'image');

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
        <div className="orbium-background" aria-hidden="true">
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
                    {displayedBackground.kind === 'ghost' && (
                        <GhostFibers
                            {...preferences.ghost}
                            lightMode={lightMode}
                            paused={reducedMotion}
                        />
                    )}
                    {displayedBackground.kind === 'molten' && (
                        <MoltenMetal
                            {...preferences.molten}
                            lightMode={lightMode}
                            paused={reducedMotion}
                        />
                    )}
                </Suspense>
            </BackgroundErrorBoundary>
        </div>
    );
}
