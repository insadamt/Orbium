import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type ExplorerMenuPosition = {
    nodeId: number | null;
    x: number;
    y: number;
};

type MenuAction = { label: string; run: () => void; destructive?: boolean };

export function ExplorerContextMenu({
    position,
    nodeTitle,
    onClose,
    onCreate,
    onOpen,
    onRename,
    onDelete,
}: {
    position: ExplorerMenuPosition | null;
    nodeTitle?: string;
    onClose: () => void;
    onCreate: (type: 'document' | 'folder' | 'database') => void;
    onOpen: (newTab: boolean) => void;
    onRename: () => void;
    onDelete: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const previousFocus = useRef<HTMLElement | null>(null);
    useEffect(() => {
        if (!position) return;
        if (!menuRef.current?.contains(document.activeElement))
            previousFocus.current =
                document.activeElement as HTMLElement | null;
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
    const actions: MenuAction[] =
        position.nodeId === null
            ? [
                  { label: 'New document', run: () => onCreate('document') },
                  { label: 'New folder', run: () => onCreate('folder') },
                  { label: 'New database', run: () => onCreate('database') },
              ]
            : [
                  { label: 'Open', run: () => onOpen(false) },
                  { label: 'Open in new tab', run: () => onOpen(true) },
                  { label: 'Rename', run: onRename },
                  { label: 'Delete', run: onDelete, destructive: true },
              ];
    const top = Math.max(
        8,
        Math.min(position.y, window.innerHeight - actions.length * 40 - 24),
    );
    const left = Math.max(8, Math.min(position.x, window.innerWidth - 228));

    function moveFocus(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            previousFocus.current?.focus();
            return;
        }
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
            return;
        event.preventDefault();
        const buttons = Array.from(
            menuRef.current?.querySelectorAll('button') ?? [],
        );
        const index = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
        );
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? buttons.length - 1
                  : (index +
                        (event.key === 'ArrowDown' ? 1 : -1) +
                        buttons.length) %
                    buttons.length;
        buttons[next]?.focus();
    }

    return createPortal(
        <div
            ref={menuRef}
            className="floating-context-menu"
            role="menu"
            aria-label={
                nodeTitle ? `Actions for ${nodeTitle}` : 'Create in this folder'
            }
            style={{ top, left }}
            onKeyDown={moveFocus}
        >
            {actions.map((action) => (
                <button
                    key={action.label}
                    type="button"
                    role="menuitem"
                    className={action.destructive ? 'destructive' : undefined}
                    onClick={() => {
                        onClose();
                        action.run();
                    }}
                >
                    {action.label}
                </button>
            ))}
        </div>,
        document.body,
    );
}
