import {
    imageWidthTogglePresentation,
    nextImageToggleWidth,
} from '../../image-width-toggle';
import { widgetIcon } from './widget-icons';

export function mountMediaWidthToggle({
    control,
    container,
    readWidth,
    onResize,
}: {
    control: HTMLButtonElement;
    container: HTMLElement;
    readWidth: () => number;
    onResize: (width: number) => void;
}) {
    let previousWidth: number | undefined;
    function state() {
        return {
            width: readWidth(),
            availableWidth: container.clientWidth,
            previousWidth,
        };
    }
    function update() {
        const { expanded, label } = imageWidthTogglePresentation(state());
        control.title = label;
        control.setAttribute('aria-label', label);
        control.setAttribute('aria-pressed', String(expanded));
        if (control.dataset.expanded !== String(expanded)) {
            control.dataset.expanded = String(expanded);
            control.replaceChildren(
                widgetIcon(expanded ? 'minimize' : 'maximize', 16),
            );
        }
    }
    function toggle() {
        if (!container.clientWidth) return;
        const next = nextImageToggleWidth(state());
        previousWidth = next.previousWidth;
        onResize(next.width);
        update();
    }
    const observer = new ResizeObserver(update);
    observer.observe(container);
    control.addEventListener('click', toggle);
    update();
    return {
        update,
        destroy() {
            observer.disconnect();
            control.removeEventListener('click', toggle);
        },
    };
}
