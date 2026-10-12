import type { EditorView } from '@codemirror/view';
import { bindRichBlockHistory, button, element } from './widget-controls';
import { widgetIcon } from './widget-icons';

export function mountTableOptionsToolbar(root: HTMLElement, view: EditorView) {
    const toolbar = element(
        'div',
        'orbium-table-toolbar orbium-editor-toolbar glass-surface flex w-max flex-wrap items-center gap-1 rounded-xl border border-border p-1 shadow-lg',
    );
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Table formatting');
    toolbar.hidden = true;
    root.ownerDocument.body.append(toolbar);
    bindRichBlockHistory(toolbar, view);
    let destroyed = false;
    const options = button('', () => setOpen(toolbar.hidden));
    options.setAttribute('aria-label', 'Table options');
    options.setAttribute('aria-expanded', 'false');
    options.className =
        'glass-surface mb-1 ms-auto block rounded-md border border-border p-1 shadow-sm';
    options.append(widgetIcon('more', 16));
    options.hidden = true;
    root.append(options);

    function positionToolbar() {
        if (destroyed || toolbar.hidden) return;
        view.requestMeasure({
            key: toolbar,
            read: () => ({
                anchor: root.getBoundingClientRect(),
                toolbar: toolbar.getBoundingClientRect(),
            }),
            write: (bounds) => {
                if (destroyed || toolbar.hidden) return;
                const inset = 12;
                const above = bounds.anchor.top - bounds.toolbar.height - 8;
                const top = above >= inset ? above : bounds.anchor.bottom + 8;
                toolbar.style.left = `${Math.max(inset, Math.min(bounds.anchor.left, window.innerWidth - bounds.toolbar.width - inset))}px`;
                toolbar.style.top = `${Math.max(inset, Math.min(top, window.innerHeight - bounds.toolbar.height - inset))}px`;
            },
        });
    }
    const observer = new ResizeObserver(positionToolbar);
    function setOpen(open: boolean) {
        toolbar.hidden = !open;
        options.setAttribute('aria-expanded', String(open));
        root.toggleAttribute('data-table-options-open', open);
        observer.disconnect();
        window.removeEventListener('scroll', positionToolbar, true);
        window.removeEventListener('resize', positionToolbar);
        if (open) {
            observer.observe(root);
            observer.observe(toolbar);
            window.addEventListener('scroll', positionToolbar, true);
            window.addEventListener('resize', positionToolbar);
            positionToolbar();
        }
    }
    toolbar.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        options.focus({ preventScroll: true });
    });
    const close = button('', () => {
        setOpen(false);
        options.focus({ preventScroll: true });
    });
    close.className = 'rounded p-2 hover:bg-accent';
    close.setAttribute('aria-label', 'Close table toolbar');
    close.title = 'Close table toolbar';
    close.append(widgetIcon('close', 16));

    return {
        toolbar,
        options,
        closeButton: close,
        close: () => setOpen(false),
        destroy() {
            setOpen(false);
            destroyed = true;
            toolbar.remove();
        },
    };
}
