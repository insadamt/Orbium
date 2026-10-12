import { button, element } from './widget-controls';
import { widgetIcon } from './widget-icons';
import { openContentFullPreview } from '../../content-full-preview';

type TableFullscreenOptions = {
    edges: HTMLElement;
    grid: HTMLTableElement;
    beforeOpen: () => void;
};

export function mountTableFullscreenView({
    edges,
    grid,
    beforeOpen,
}: TableFullscreenOptions) {
    let closePreview: (() => void) | undefined;

    function open() {
        beforeOpen();
        closePreview?.();
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
        const content = element(
            'div',
            'orbium-editor orbium-markdown-content orbium-table-full-preview',
        );
        const width = Math.max(1, grid.scrollWidth);
        const height = Math.max(1, grid.scrollHeight);
        preview.style.width = `${width}px`;
        content.append(preview);
        closePreview = openContentFullPreview({
            content,
            dimensions: { width: width + 2, height: height + 2 },
            title: 'Table preview',
            canvasLabel:
                'Table canvas. Use plus and minus to zoom, arrow keys to pan, and zero to fit.',
            fitLabel: 'Fit table to view',
            trigger,
        });
    }

    const trigger = button('', open);
    trigger.className = 'table-edge-control orbium-table-fullscreen-trigger';
    trigger.title = 'Open fullscreen table view';
    trigger.setAttribute('aria-label', trigger.title);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.append(widgetIcon('maximize', 14));
    edges.append(trigger);
    return {
        destroy() {
            closePreview?.();
            trigger.remove();
        },
    };
}
