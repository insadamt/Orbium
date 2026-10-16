import type { EditorView } from '@codemirror/view';
import { markdownDragViewport } from './markdown-drag-scroll';
import { markdownBlockPopOrigin } from './markdown-block-pop-origin';

export type RenderedRow = {
    element: HTMLElement;
    position: number;
    bounds: DOMRect;
};

let snapshotSequence = 0;

function cloneSnapshotRow(element: HTMLElement) {
    const clone = element.cloneNode(true) as HTMLElement;
    const elements = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
    const identifiers = new Map<string, string>();
    const prefix = `orbium-motion-${++snapshotSequence}-`;
    for (const child of elements) {
        if (child.id) {
            identifiers.set(child.id, `${prefix}${child.id}`);
            child.id = `${prefix}${child.id}`;
        }
        // Snapshot widgets must never participate in live editor position queries.
        child.removeAttribute('data-rich-from');
    }
    for (const child of elements) {
        for (const attribute of Array.from(child.attributes)) {
            let value = attribute.value.replace(
                /url\(#([^)]*)\)/g,
                (reference, id: string) =>
                    identifiers.has(id)
                        ? `url(#${identifiers.get(id)})`
                        : reference,
            );
            if (attribute.name === 'href' || attribute.name === 'xlink:href') {
                const mapped = identifiers.get(value.slice(1));
                if (value.startsWith('#') && mapped) value = `#${mapped}`;
            }
            if (value !== attribute.value)
                child.setAttribute(attribute.name, value);
        }
    }
    return clone;
}

export function renderedMarkdownMotionRows(view: EditorView): RenderedRow[] {
    const rows: RenderedRow[] = [];
    for (const child of view.contentDOM.children) {
        if (!(child instanceof HTMLElement)) continue;
        const bounds = child.getBoundingClientRect();
        if (
            !bounds.height ||
            bounds.bottom < 0 ||
            bounds.top > window.innerHeight
        )
            continue;
        // Inline widgets belong to their containing row, not to a separate moving block.
        const position = view.posAtDOM(child, 0);
        if (Number.isFinite(position))
            rows.push({ element: child, position, bounds });
    }
    return rows;
}

export function createMarkdownMotionSnapshot(
    view: EditorView,
    rows: RenderedRow[],
) {
    if (!rows.length) return null;
    const top = Math.min(...rows.map((row) => row.bounds.top));
    const bottom = Math.max(...rows.map((row) => row.bounds.bottom));
    const content = view.contentDOM.getBoundingClientRect();
    const contentStyle = getComputedStyle(view.contentDOM);
    const viewport = markdownDragViewport(view);
    const layer = document.createElement('div');
    layer.className = view.dom.className;
    layer.inert = true;
    layer.setAttribute('aria-hidden', 'true');
    if (view.dom.closest('[data-document-styles]'))
        layer.setAttribute('data-document-styles', '');
    Object.assign(layer.style, {
        position: 'fixed',
        left: `${content.left}px`,
        top: `${viewport.top}px`,
        width: `${content.width}px`,
        height: `${Math.max(0, viewport.bottom - viewport.top)}px`,
        minHeight: '0',
        padding: '0',
        border: '0',
        outline: 'none',
        background: 'transparent',
        pointerEvents: 'none',
        zIndex: '45',
        overflow: 'hidden',
    });
    // CodeMirror's copied base-theme class forces relative positioning with !important.
    layer.style.setProperty('position', 'fixed', 'important');
    for (const property of contentStyle) {
        if (property.startsWith('--'))
            layer.style.setProperty(
                property,
                contentStyle.getPropertyValue(property),
            );
    }
    const scroller = document.createElement('div');
    scroller.className = view.scrollDOM.className;
    Object.assign(scroller.style, {
        position: 'absolute',
        left: '0',
        top: `${top - viewport.top}px`,
        overflow: 'visible',
        width: `${content.width / view.scaleX}px`,
        height: `${(bottom - top) / view.scaleY}px`,
        transform: `scale(${view.scaleX}, ${view.scaleY})`,
        transformOrigin: 'top left',
    });
    const ghost = document.createElement('div');
    ghost.className = view.contentDOM.className;
    ghost.inert = true;
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: `${content.width / view.scaleX}px`,
        height: `${(bottom - top) / view.scaleY}px`,
        margin: '0',
        padding: '0',
        pointerEvents: 'none',
        zIndex: '5',
        transformOrigin: markdownBlockPopOrigin({
            view,
            elements: rows.map((row) => row.element),
            origin: { left: content.left, top },
        }),
        font: contentStyle.font,
        lineHeight: contentStyle.lineHeight,
        letterSpacing: contentStyle.letterSpacing,
        color: contentStyle.color,
        direction: contentStyle.direction,
        textAlign: contentStyle.textAlign,
        whiteSpace: contentStyle.whiteSpace,
    });
    for (const row of rows) {
        const clone = cloneSnapshotRow(row.element);
        Object.assign(clone.style, {
            position: 'absolute',
            left: `${(row.bounds.left - content.left) / view.scaleX}px`,
            top: `${(row.bounds.top - top) / view.scaleY}px`,
            width: `${row.bounds.width / view.scaleX}px`,
            margin: '0',
        });
        ghost.append(clone);
    }
    scroller.append(ghost);
    layer.append(scroller);
    // Viewport anchoring can move the editor immediately; the exit must stay at its captured screen position.
    document.body.append(layer);
    return { element: layer, popElement: ghost };
}
