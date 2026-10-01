import {
    Component,
    lazy,
    Suspense,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import type { BackgroundDraft } from './background-preferences';
import { previewStyle } from './wallpaper-palette';
import { findReactBitsEffect } from './react-bits-catalog';
import { ReactBitsBackground } from './react-bits-background';

const GhostFibers = lazy(() => import('@/components/GhostFibers'));
const MoltenMetal = lazy(() => import('@/components/MoltenMetal'));

class PreviewBoundary extends Component<
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

function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(
        () =>
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(query.matches);
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return reduced;
}

export function WallpaperPreview({
    draft,
    imageUrl,
    active,
}: {
    draft: BackgroundDraft;
    imageUrl: string | null;
    active: boolean;
}) {
    return (
        <div
            className="wallpaper-preview"
            style={
                draft.kind === 'image' && imageUrl
                    ? {
                          backgroundImage: `url(${imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                      }
                    : previewStyle(draft.kind)
            }
            aria-hidden="true"
        >
            {active && <AnimatedWallpaperPreview draft={draft} />}
        </div>
    );
}

function AnimatedWallpaperPreview({ draft }: { draft: BackgroundDraft }) {
    const reducedMotion = useReducedMotion();
    const effect = findReactBitsEffect(draft.kind);
    if (reducedMotion) return null;
    return (
        <PreviewBoundary key={draft.kind}>
            <Suspense fallback={null}>
                {draft.kind === 'ghost' && (
                    <GhostFibers {...draft.ghost} paused={false} />
                )}
                {draft.kind === 'molten' && (
                    <MoltenMetal {...draft.molten} paused={false} />
                )}
                {effect && (
                    <ReactBitsBackground
                        kind={effect.kind}
                        settings={draft.effect ?? effect.defaults}
                        reducedMotion={false}
                    />
                )}
            </Suspense>
        </PreviewBoundary>
    );
}
