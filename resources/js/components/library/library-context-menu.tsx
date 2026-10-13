import { Download, Pencil, ScanEye, Trash2 } from 'lucide-react';
import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { LibraryFile } from './library-api';

export type LibraryMenuPosition = {
    file: LibraryFile;
    x: number;
    y: number;
    returnFocusTo: HTMLElement | null;
};

export function LibraryContextMenu({
    position,
    onClose,
    onOpen,
    onRename,
    onDelete,
}: {
    position: LibraryMenuPosition;
    onClose: () => void;
    onOpen: () => void;
    onRename: () => void;
    onDelete: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const bounds = menu.getBoundingClientRect();
        menu.style.left = `${Math.max(8, Math.min(position.x, window.innerWidth - bounds.width - 8))}px`;
        menu.style.top = `${Math.max(8, Math.min(position.y, window.innerHeight - bounds.height - 8))}px`;
        menu.querySelector<HTMLButtonElement>('button')?.focus();
        function closeOnOutsidePointer(event: PointerEvent) {
            if (!menu?.contains(event.target as Node)) onClose();
        }
        document.addEventListener('pointerdown', closeOnOutsidePointer);
        window.addEventListener('scroll', onClose, true);
        window.addEventListener('resize', onClose);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePointer);
            window.removeEventListener('scroll', onClose, true);
            window.removeEventListener('resize', onClose);
        };
    }, [position, onClose]);

    function closeAndRestoreFocus() {
        onClose();
        position.returnFocusTo?.focus();
    }

    function closeAndRun(action: () => void) {
        closeAndRestoreFocus();
        action();
    }

    function navigateMenu(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Escape' || event.key === 'Tab') {
            if (event.key === 'Escape') event.preventDefault();
            closeAndRestoreFocus();
            return;
        }
        if (event.key === ' ') {
            event.preventDefault();
            (event.target as HTMLElement).click();
            return;
        }
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
            return;
        event.preventDefault();
        const items = Array.from(
            menuRef.current?.querySelectorAll<HTMLElement>(
                '[role="menuitem"]:not([disabled]):not([aria-disabled="true"])',
            ) ?? [],
        );
        const index = items.indexOf(document.activeElement as HTMLElement);
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? items.length - 1
                  : (index +
                        (event.key === 'ArrowDown' ? 1 : -1) +
                        items.length) %
                    items.length;
        items[next]?.focus();
    }

    return createPortal(
        <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${position.file.name}`}
            className="library-menu library-context-menu"
            style={{ left: position.x, top: position.y }}
            onKeyDown={navigateMenu}
            onContextMenu={(event) => event.preventDefault()}
        >
            <button
                type="button"
                role="menuitem"
                className="library-menu-item"
                onClick={() => closeAndRun(onOpen)}
            >
                <ScanEye size={15} /> View details
            </button>
            <a
                role="menuitem"
                className="library-menu-item"
                href={
                    position.file.available
                        ? `${position.file.url}?download=1`
                        : undefined
                }
                aria-disabled={!position.file.available}
                tabIndex={position.file.available ? 0 : -1}
                onClick={(event) => {
                    if (!position.file.available) event.preventDefault();
                    else closeAndRestoreFocus();
                }}
            >
                <Download size={15} /> Download
            </a>
            <button
                type="button"
                role="menuitem"
                className="library-menu-item"
                onClick={() => closeAndRun(onRename)}
            >
                <Pencil size={15} /> Rename
            </button>
            <div className="my-1 border-t border-border/50" role="separator" />
            <button
                type="button"
                role="menuitem"
                className="library-menu-item text-destructive"
                onClick={() => closeAndRun(onDelete)}
            >
                <Trash2 size={15} /> Delete…
            </button>
        </div>,
        document.body,
    );
}
