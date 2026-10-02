import { ArrowLeft } from 'lucide-react';
import { useNavigation } from './navigation-store';
import { stepHistory } from './tab-navigation';

export function NavigationBackButton({ className }: { className: string }) {
    const canGoBack = useNavigation((state) => {
        const activeTab = state.tabs.find((tab) => tab.id === state.activeId);
        return Boolean(activeTab && activeTab.index > 0);
    });

    return (
        <button
            type="button"
            className={className}
            aria-label="Go back"
            title="Go back (Alt + Left)"
            disabled={!canGoBack}
            onClick={() => stepHistory(-1)}
        >
            <ArrowLeft size={18} />
        </button>
    );
}
