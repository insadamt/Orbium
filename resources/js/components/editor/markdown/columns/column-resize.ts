// Summary: Previews bounded column divider resizing and commits one accepted change; depends on mounted column state and the owner's edit permissions.
import { EditorView } from '@codemirror/view';

export function bindColumnDividers(options: {
    root: HTMLElement;
    grid: HTMLElement;
    owner: EditorView;
    widths: () => number[];
    composing: () => boolean;
    commit: (widths: number[]) => void;
}) {
    const disposals: (() => void)[] = [];
    let cancelActive: (() => void) | null = null;
    const paint = (widths: number[]) => {
        options.grid.style.gridTemplateColumns = widths
            .map((width) => `minmax(0, ${width}fr)`)
            .join(' 20px ');
        options.grid
            .querySelectorAll<HTMLElement>('.orbium-column-divider')
            .forEach((divider, index) => {
                const pair = widths[index] + widths[index + 1];
                divider.setAttribute(
                    'aria-valuenow',
                    String(Math.round((widths[index] / pair) * 100)),
                );
                divider.setAttribute(
                    'aria-valuemin',
                    String(Math.ceil((1500 / pair) * 100)),
                );
                divider.setAttribute(
                    'aria-valuemax',
                    String(Math.floor(((pair - 1500) / pair) * 100)),
                );
            });
    };
    const canResize = () =>
        options.owner.state.facet(EditorView.editable) &&
        !options.owner.state.readOnly &&
        !options.composing();
    options.grid
        .querySelectorAll<HTMLButtonElement>('.orbium-column-divider')
        .forEach((divider, index) => {
            const press = (event: PointerEvent) => {
                if (event.button !== 0 || !event.isPrimary || !canResize())
                    return;
                event.preventDefault();
                event.stopPropagation();
                cancelActive?.();
                const startDoc = options.owner.state.doc;
                const initial = [...options.widths()];
                const startX = event.clientX;
                const gutterWidth = [
                    ...options.grid.querySelectorAll<HTMLElement>(
                        '.orbium-column-divider',
                    ),
                ].reduce(
                    (sum, divider) =>
                        sum + divider.getBoundingClientRect().width,
                    0,
                );
                const contentWidth =
                    options.grid.getBoundingClientRect().width - gutterWidth;
                if (contentWidth <= 0) return;
                let preview = initial;
                divider.setPointerCapture(event.pointerId);
                options.root.dataset.resizing = 'true';
                const finish = (accept: boolean) => {
                    divider.removeEventListener('pointermove', move);
                    divider.removeEventListener('pointerup', release);
                    divider.removeEventListener('pointercancel', cancel);
                    divider.removeEventListener('lostpointercapture', cancel);
                    divider.ownerDocument.removeEventListener(
                        'keydown',
                        escape,
                        true,
                    );
                    window.removeEventListener('blur', cancel);
                    delete options.root.dataset.resizing;
                    cancelActive = null;
                    if (divider.hasPointerCapture(event.pointerId))
                        divider.releasePointerCapture(event.pointerId);
                    if (
                        accept &&
                        startDoc === options.owner.state.doc &&
                        canResize()
                    )
                        options.commit(preview);
                    paint(options.widths());
                };
                const move = (pointer: PointerEvent) => {
                    if (pointer.pointerId !== event.pointerId) return;
                    const pair = initial[index] + initial[index + 1];
                    const left = Math.max(
                        1500,
                        Math.min(
                            pair - 1500,
                            Math.round(
                                initial[index] +
                                    ((pointer.clientX - startX) /
                                        contentWidth) *
                                        10000,
                            ),
                        ),
                    );
                    preview = [...initial];
                    preview[index] = left;
                    preview[index + 1] = pair - left;
                    paint(preview);
                };
                const release = (pointer: PointerEvent) => {
                    if (pointer.pointerId !== event.pointerId) return;
                    move(pointer);
                    finish(true);
                };
                const cancel = () => finish(false);
                const escape = (key: KeyboardEvent) => {
                    if (key.key !== 'Escape') return;
                    key.preventDefault();
                    key.stopPropagation();
                    cancel();
                };
                cancelActive = cancel;
                divider.addEventListener('pointermove', move);
                divider.addEventListener('pointerup', release);
                divider.addEventListener('pointercancel', cancel);
                divider.addEventListener('lostpointercapture', cancel);
                divider.ownerDocument.addEventListener('keydown', escape, true);
                window.addEventListener('blur', cancel);
            };
            const keydown = (event: KeyboardEvent) => {
                if (
                    !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key) ||
                    !canResize()
                )
                    return;
                event.preventDefault();
                event.stopPropagation();
                const widths = [...options.widths()];
                const pair = widths[index] + widths[index + 1];
                widths[index] = Math.max(
                    1500,
                    Math.min(
                        pair - 1500,
                        event.key === 'Home'
                            ? Math.floor(pair / 2)
                            : widths[index] +
                                  (event.key === 'ArrowLeft' ? -1 : 1) *
                                      (event.shiftKey ? 500 : 100),
                    ),
                );
                widths[index + 1] = pair - widths[index];
                options.commit(widths);
            };
            divider.addEventListener('pointerdown', press);
            divider.addEventListener('keydown', keydown);
            disposals.push(() => {
                divider.removeEventListener('pointerdown', press);
                divider.removeEventListener('keydown', keydown);
            });
        });
    paint(options.widths());
    return {
        update: () => paint(options.widths()),
        destroy: () => {
            cancelActive?.();
            disposals.forEach((dispose) => dispose());
        },
    };
}
