// Reuses Orbium's tab strip with an overlay or reserved pinned rail.
import { useEffect, useRef, useState } from 'react';
import { PanelLeftOpen, Pin, PinOff, Plus } from 'lucide-react';
import { NavigationTabStrip } from './navigation-tab-strip';
import { NavigationBackButton } from './navigation-back-button';
import { openLocation } from './tab-navigation';
import {
    updateWorkspaceNavigationPreferences,
    useWorkspaceNavigationPreferences,
} from './workspace-navigation-preferences';

export function WorkspaceAdaptiveTabs({
    workspaceId,
}: {
    workspaceId?: number;
}) {
    const { tabsPinned, sidebarOpen } = useWorkspaceNavigationPreferences();
    const [revealed, setRevealed] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dragging = useRef(false);
    const visible = tabsPinned || revealed;

    function cancelHide() {
        if (hideTimer.current !== null) clearTimeout(hideTimer.current);
        hideTimer.current = null;
    }

    function scheduleHide() {
        if (tabsPinned || dragging.current) return;
        cancelHide();
        hideTimer.current = setTimeout(() => {
            // Portalled dropdowns must remain usable while their trigger is open.
            if (
                document.querySelector(
                    '[data-app-menu-content][data-state="open"]',
                )
            ) {
                scheduleHide();
                return;
            }
            setRevealed(false);
        }, 350);
    }

    useEffect(() => () => cancelHide(), []);

    useEffect(() => {
        function releasePointer() {
            if (!dragging.current) return;
            dragging.current = false;
            if (!document.querySelector('.workspace-tab-surface:hover'))
                scheduleHide();
        }
        window.addEventListener('pointerup', releasePointer);
        window.addEventListener('pointercancel', releasePointer);
        return () => {
            window.removeEventListener('pointerup', releasePointer);
            window.removeEventListener('pointercancel', releasePointer);
        };
    }, [tabsPinned]);

    useEffect(() => {
        if (tabsPinned) setRevealed(false);
    }, [tabsPinned]);

    useEffect(() => {
        const showTabs = (event: KeyboardEvent) => {
            if (
                event.altKey &&
                event.shiftKey &&
                event.key.toLowerCase() === 't'
            ) {
                event.preventDefault();
                cancelHide();
                setRevealed(true);
            }
            if (event.key === 'Escape' && !tabsPinned) scheduleHide();
        };
        window.addEventListener('keydown', showTabs);
        return () => window.removeEventListener('keydown', showTabs);
    }, [tabsPinned]);

    return (
        <div
            className={`workspace-adaptive-tabs ${tabsPinned ? 'is-pinned' : 'is-floating'}`}
            data-visible={visible}
            onPointerEnter={cancelHide}
            onPointerLeave={scheduleHide}
            onPointerDownCapture={() => {
                dragging.current = true;
                cancelHide();
            }}
            onPointerUpCapture={() => {
                dragging.current = false;
            }}
            onPointerCancelCapture={() => {
                dragging.current = false;
                scheduleHide();
            }}
        >
            {!tabsPinned && (
                <button
                    type="button"
                    className="workspace-tab-reveal"
                    aria-label="Show tabs (Alt + Shift + T)"
                    onPointerEnter={() => {
                        cancelHide();
                        setRevealed(true);
                    }}
                    onFocus={() => {
                        cancelHide();
                        setRevealed(true);
                    }}
                >
                    <span aria-hidden="true" />
                </button>
            )}
            <div
                className="workspace-tab-surface floating-surface"
                inert={!visible}
                onFocusCapture={() => {
                    cancelHide();
                    setRevealed(true);
                }}
            >
                {!sidebarOpen && (
                    <button
                        type="button"
                        className="workspace-tab-action"
                        aria-label="Show sidebar"
                        onClick={() =>
                            updateWorkspaceNavigationPreferences({
                                sidebarOpen: true,
                            })
                        }
                    >
                        <PanelLeftOpen size={17} />
                    </button>
                )}
                <NavigationBackButton className="workspace-tab-back workspace-tab-action" />
                <NavigationTabStrip floating />
                <button
                    type="button"
                    className="workspace-tab-action"
                    aria-label="Open workspace home in a new tab"
                    onClick={() =>
                        openLocation(
                            workspaceId
                                ? `/workspaces/${workspaceId}`
                                : '/dashboard',
                            true,
                        )
                    }
                >
                    <Plus size={17} />
                </button>
                <button
                    type="button"
                    className="workspace-tab-action workspace-tab-pin"
                    aria-label={tabsPinned ? 'Unpin tab bar' : 'Pin tab bar'}
                    aria-pressed={tabsPinned}
                    onClick={() =>
                        updateWorkspaceNavigationPreferences({
                            tabsPinned: !tabsPinned,
                        })
                    }
                >
                    {tabsPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
            </div>
        </div>
    );
}
