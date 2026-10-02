import { usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigation } from './navigation-store';
import { stepHistory } from './tab-navigation';

export function NavigationBackButton({ className }: { className: string }) {
    const pagePath = usePage().url.split('?')[0];
    const isWorkspaceRoot =
        pagePath === '/dashboard' || /^\/workspaces\/\d+$/.test(pagePath);
    const canGoBack = useNavigation((state) => {
        const activeTab = state.tabs.find((tab) => tab.id === state.activeId);
        return Boolean(activeTab && activeTab.index > 0);
    });
    const shouldShowBackButton = canGoBack && !isWorkspaceRoot;
    const [isRevealed, setIsRevealed] = useState(shouldShowBackButton);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setIsRevealed(shouldShowBackButton);
            return;
        }
        // Inertia may update the route and tab history before the browser paints either state.
        let revealFrame = 0;
        const paintFrame = requestAnimationFrame(() => {
            revealFrame = requestAnimationFrame(() => {
                setIsRevealed(shouldShowBackButton);
            });
        });
        return () => {
            cancelAnimationFrame(paintFrame);
            cancelAnimationFrame(revealFrame);
        };
    }, [shouldShowBackButton]);

    return (
        <button
            type="button"
            className={`navigation-back-button ${className}`}
            data-visible={isRevealed}
            aria-hidden={!shouldShowBackButton}
            aria-label="Go back"
            title="Go back (Alt + Left)"
            disabled={!shouldShowBackButton}
            onClick={() => stepHistory(-1)}
        >
            <ArrowLeft size={18} />
        </button>
    );
}
