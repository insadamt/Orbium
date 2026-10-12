import { button, element } from './widget-controls';
import { widgetIcon } from './widget-icons';

type TableFullscreenOptions = {
    root: HTMLElement;
    edges: HTMLElement;
    grid: HTMLTableElement;
    beforeOpen: () => void;
};

export function mountTableFullscreenView({
    root,
    edges,
    grid,
    beforeOpen,
}: TableFullscreenOptions) {
    const dialog = element('dialog', 'orbium-table-fullscreen-view');
    dialog.setAttribute('aria-label', 'Fullscreen table view');
    const heading = element('div', 'orbium-table-fullscreen-heading');
    const title = element('span', '', 'Table');
    const close = button('Close', () => dialog.close());
    close.prepend(widgetIcon('close', 15));
    heading.append(title, close);
    const scroller = element(
        'div',
        'tableWrapper orbium-table-fullscreen-scroller',
    );
    dialog.append(heading, scroller);
    root.append(dialog);

    function open() {
        beforeOpen();
        const preview = grid.cloneNode(true) as HTMLTableElement;
        for (const control of preview.querySelectorAll(
            'button, .orbium-rich-text-input',
        ))
            control.remove();
        for (const cell of preview.querySelectorAll(
            '.orbium-table-cell-content',
        )) {
            const output = cell.firstElementChild as HTMLElement | null;
            if (!output) continue;
            cell.replaceChildren(output);
            output.hidden = false;
            output.removeAttribute('tabindex');
            output.removeAttribute('role');
            output.removeAttribute('aria-label');
            output.classList.remove('cursor-text');
        }
        scroller.replaceChildren(preview);
        dialog.showModal();
        close.focus({ preventScroll: true });
    }

    const trigger = button('', open);
    trigger.className = 'table-edge-control orbium-table-fullscreen-trigger';
    trigger.title = 'Open fullscreen table view';
    trigger.setAttribute('aria-label', trigger.title);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.append(widgetIcon('maximize', 14));
    edges.append(trigger);
    dialog.addEventListener('close', () => {
        scroller.replaceChildren();
        if (trigger.isConnected) trigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', (event) => event.stopPropagation());
    return {
        destroy() {
            if (dialog.open) dialog.close();
            dialog.remove();
            trigger.remove();
        },
    };
}
