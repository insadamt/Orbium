import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type TabMenuPosition = {
    tabId: string;
    title: string;
    pinned: boolean;
    x: number;
    y: number;
};

export function NavigationTabContextMenu({
    position,
    onClose,
    onTogglePin,
}: {
    position: TabMenuPosition | null;
    onClose: () => void;
    onTogglePin: (tabId: string, pinned: boolean) => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!position) return;
        menuRef.current?.querySelector('button')?.focus();
        function closeOnOutsidePointer(event: PointerEvent) {
            if (!menuRef.current?.contains(event.target as Node)) onClose();
        }
        function closeOnScroll() {
            onClose();
        }
        document.addEventListener('pointerdown', closeOnOutsidePointer);
        window.addEventListener('scroll', closeOnScroll, true);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePointer);
            window.removeEventListener('scroll', closeOnScroll, true);
        };
    }, [position, onClose]);

    if (!position) return null;
    const top = Math.max(8, Math.min(position.y, window.innerHeight - 52));
    const left = Math.max(8, Math.min(position.x, window.innerWidth - 228));

    return createPortal(
        <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${position.title} tab`}
            className="floating-context-menu"
            style={{ top, left }}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    onClose();
                    document.getElementById(`tab-${position.tabId}`)?.focus();
                }
            }}
        >
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onTogglePin(position.tabId, !position.pinned);
                    onClose();
                    requestAnimationFrame(() =>
                        document
                            .getElementById(`tab-${position.tabId}`)
                            ?.focus(),
                    );
                }}
            >
                {position.pinned ? 'Unpin tab' : 'Pin tab'}
            </button>
        </div>,
        document.body,
    );
}
