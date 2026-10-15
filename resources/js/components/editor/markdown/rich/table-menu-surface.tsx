import { mountMenuHighlight } from '@/lib/menu-highlight';
import { element } from './widget-controls';
import { widgetIcon } from './widget-icons';

export type TableMenuAction = {
    label: string;
    icon: Parameters<typeof widgetIcon>[0];
    run: () => void;
    disabled: boolean;
};

export function createTableMenuSurface(host: HTMLElement) {
    const ownerWindow = host.ownerDocument.defaultView!;
    let disposeHighlight: (() => void) | undefined;
    let dismiss: (() => void) | undefined;
    let items: HTMLButtonElement[] = [];
    let scrollPositions: { element: HTMLElement; left: number; top: number }[] =
        [];
    let windowScroll = { left: 0, top: 0 };

    function close() {
        ownerWindow.removeEventListener('scroll', closeAfterScroll, true);
        ownerWindow.removeEventListener('resize', closeAfterResize);
        disposeHighlight?.();
        disposeHighlight = undefined;
        dismiss = undefined;
        items = [];
        scrollPositions = [];
        host.hidden = true;
        host.replaceChildren();
    }
    function closeAfterResize() {
        dismiss?.();
    }
    function closeAfterScroll() {
        if (
            ownerWindow.scrollX !== windowScroll.left ||
            ownerWindow.scrollY !== windowScroll.top ||
            scrollPositions.some(
                ({ element, left, top }) =>
                    element.scrollLeft !== left || element.scrollTop !== top,
            )
        )
            dismiss?.();
    }
    function focusItem(item: HTMLButtonElement) {
        items.forEach((candidate) => {
            candidate.tabIndex = candidate === item ? 0 : -1;
            candidate.toggleAttribute('data-highlighted', candidate === item);
        });
        item.focus({ preventScroll: true });
    }
    function navigate(event: KeyboardEvent) {
        const enabledItems = items.filter((item) => !item.disabled);
        const index = enabledItems.indexOf(
            host.ownerDocument.activeElement as HTMLButtonElement,
        );
        let next: HTMLButtonElement | undefined;
        if (event.key === 'ArrowDown')
            next = enabledItems[(index + 1) % enabledItems.length];
        else if (event.key === 'ArrowUp')
            next =
                enabledItems[
                    (index < 0
                        ? enabledItems.length - 1
                        : index - 1 + enabledItems.length) % enabledItems.length
                ];
        else if (event.key === 'Home') next = enabledItems[0];
        else if (event.key === 'End') next = enabledItems.at(-1);
        else if (event.key === 'Escape' || event.key === 'Tab') {
            if (event.key === 'Escape') event.preventDefault();
            dismiss?.();
        } else return;
        event.stopPropagation();
        if (next) {
            event.preventDefault();
            focusItem(next);
        }
    }
    function createActionItem(action: TableMenuAction) {
        const item = element('button', 'orbium-table-column-action');
        item.type = 'button';
        item.tabIndex = -1;
        item.disabled = action.disabled;
        item.setAttribute('role', 'menuitem');
        if (action.disabled) item.setAttribute('data-disabled', '');
        if (action.label.startsWith('Delete')) {
            item.dataset.variant = 'destructive';
            item.classList.add('text-destructive');
        }
        item.append(widgetIcon(action.icon, 16), action.label);
        item.addEventListener('click', action.run);
        item.addEventListener('focus', () => {
            items.forEach((candidate) =>
                candidate.toggleAttribute(
                    'data-highlighted',
                    candidate === item,
                ),
            );
        });
        return item;
    }
    function positionMenu(anchor: HTMLButtonElement) {
        const bounds = anchor.getBoundingClientRect();
        const width = host.offsetWidth;
        const height = host.offsetHeight;
        const left = Math.max(
            8,
            Math.min(bounds.left, ownerWindow.innerWidth - width - 8),
        );
        const top =
            bounds.bottom + height + 8 <= ownerWindow.innerHeight
                ? bounds.bottom + 2
                : Math.max(8, bounds.top - height - 2);
        host.style.left = `${left}px`;
        host.style.top = `${top}px`;
    }
    host.addEventListener('keydown', navigate);

    return {
        open(
            anchor: HTMLButtonElement,
            label: string,
            actions: TableMenuAction[],
            onClose: () => void,
        ) {
            close();
            dismiss = onClose;
            host.className =
                'orbium-table-action-menu app-menu-content glass-surface app-menu-enter';
            host.setAttribute('role', 'menu');
            host.setAttribute('aria-label', label);
            host.tabIndex = -1;
            Object.assign(host.style, {
                position: 'fixed',
                left: '0px',
                top: '0px',
                maxHeight: `${Math.max(0, ownerWindow.innerHeight - 16)}px`,
            });
            items = actions.map(createActionItem);
            host.replaceChildren(...items);
            host.hidden = false;
            positionMenu(anchor);
            disposeHighlight = mountMenuHighlight(host);
            const firstItem = items.find((item) => !item.disabled);
            if (firstItem) focusItem(firstItem);
            else host.focus({ preventScroll: true });
            windowScroll = {
                left: ownerWindow.scrollX,
                top: ownerWindow.scrollY,
            };
            for (
                let parent = anchor.parentElement;
                parent;
                parent = parent.parentElement
            )
                scrollPositions.push({
                    element: parent,
                    left: parent.scrollLeft,
                    top: parent.scrollTop,
                });
            ownerWindow.addEventListener('scroll', closeAfterScroll, true);
            ownerWindow.addEventListener('resize', closeAfterResize);
        },
        close,
        destroy() {
            close();
            host.removeEventListener('keydown', navigate);
        },
    };
}
