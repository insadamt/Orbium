import { gsap } from 'gsap';
import type { ChangeSet } from '@codemirror/state';
import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import type { MarkdownBlockRange } from './markdown-block-actions';
import { markdownDragViewport } from './markdown-drag-scroll';
import { markdownBlockPopOrigin } from './markdown-block-pop-origin';

type RenderedRow = {
    element: HTMLElement;
    position: number;
    bounds: DOMRect;
};

type MotionScrollPosition = { element: HTMLElement; top: number; left: number };

function captureMotionScrollPositions(view: EditorView) {
    const positions: MotionScrollPosition[] = [];
    for (
        let element: HTMLElement | null = view.scrollDOM;
        element;
        element = element.parentElement
    )
        positions.push({
            element,
            top: element.scrollTop,
            left: element.scrollLeft,
        });
    return { positions, windowTop: window.scrollY, windowLeft: window.scrollX };
}

function motionScrollPositionChanged(
    snapshot: ReturnType<typeof captureMotionScrollPositions>,
) {
    return (
        window.scrollY !== snapshot.windowTop ||
        window.scrollX !== snapshot.windowLeft ||
        snapshot.positions.some(
            ({ element, top, left }) =>
                element.scrollTop !== top || element.scrollLeft !== left,
        )
    );
}

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

function renderedRows(view: EditorView): RenderedRow[] {
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
        const rich = child.matches('[data-rich-from]')
            ? child
            : child.querySelector<HTMLElement>('[data-rich-from]');
        const position = rich
            ? Number(rich.dataset.richFrom)
            : view.posAtDOM(child, 0);
        if (Number.isFinite(position))
            rows.push({ element: child, position, bounds });
    }
    return rows;
}

function createOutgoingBlockSnapshot(view: EditorView, rows: RenderedRow[]) {
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

class MarkdownBlockMotion {
    private context: gsap.Context | null = null;
    private ghost: HTMLElement | null = null;
    private outgoingSnapshot: HTMLElement | null = null;
    private frame: number | null = null;
    private revision = 0;
    private scrollPositions: ReturnType<
        typeof captureMotionScrollPositions
    > | null = null;
    private readonly reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    );

    constructor(private readonly view: EditorView) {
        view.dom.addEventListener('pointerdown', this.interrupt);
        window.addEventListener('resize', this.interrupt);
        document.addEventListener('scroll', this.interruptAfterScroll, true);
        this.reducedMotion.addEventListener('change', this.interrupt);
    }

    private interrupt = () => this.finish();

    private interruptAfterScroll = () => {
        // Scroll events can arrive after drop restoration; unchanged offsets must not cancel motion.
        if (
            this.context &&
            this.scrollPositions &&
            motionScrollPositionChanged(this.scrollPositions)
        )
            this.finish();
    };

    capture(block: MarkdownBlockRange) {
        this.finish();
        if (this.reducedMotion.matches) return null;
        const rows = renderedRows(this.view);
        const outgoing = rows.filter(
            (row) => row.position >= block.from && row.position <= block.to,
        );
        const ghost = createOutgoingBlockSnapshot(this.view, outgoing);
        if (ghost) ghost.popElement.style.visibility = 'hidden';
        // The transaction stays synchronous so drag viewport anchoring and undo remain atomic.
        return {
            rows,
            outgoing,
            ghost,
        };
    }

    play(
        snapshot: NonNullable<ReturnType<MarkdownBlockMotion['capture']>>,
        changes: ChangeSet,
        movedBlock?: { from: number; to: number },
    ) {
        this.ghost = snapshot.ghost?.popElement ?? null;
        this.outgoingSnapshot = snapshot.ghost?.element ?? null;
        const rows = renderedRows(this.view);
        if (this.ghost) this.ghost.style.visibility = 'visible';
        this.context = gsap.context(() => {
            const timeline = gsap.timeline();
            if (this.ghost)
                timeline.to(
                    this.ghost,
                    {
                        scale: 0.65,
                        opacity: 0,
                        duration: 0.08,
                        ease: 'power2.in',
                    },
                    0,
                );
            // Stage live rows before the next paint; the document never depends on a full-page overlay.
            for (const row of rows) {
                const entering =
                    movedBlock &&
                    row.position >= movedBlock.from &&
                    row.position <= movedBlock.to;
                if (entering) {
                    const transformOrigin = markdownBlockPopOrigin({
                        view: this.view,
                        elements: [row.element],
                        origin: row.bounds,
                    });
                    gsap.set(row.element, {
                        x: 0,
                        y: 0,
                        scale: 0.65,
                        opacity: 0,
                        transformOrigin,
                    });
                    timeline.to(
                        row.element,
                        {
                            scale: 1,
                            opacity: 1,
                            duration: 0.1,
                            ease: 'power2.out',
                        },
                        0.22,
                    );
                    continue;
                }
                const previous = snapshot.rows.find(
                    (old) =>
                        !snapshot.outgoing.includes(old) &&
                        changes.mapPos(old.position, 1) === row.position,
                );
                if (!previous) continue;
                const distance =
                    (previous.bounds.top - row.bounds.top) / this.view.scaleY;
                if (Math.abs(distance) < 0.5) continue;
                gsap.set(row.element, { y: distance });
                timeline.to(
                    row.element,
                    { y: 0, duration: 0.14, ease: 'power2.inOut' },
                    0.08,
                );
            }
            timeline.call(this.interrupt, [], movedBlock ? 0.32 : 0.22);
        });
        const revision = this.revision;
        this.frame = requestAnimationFrame(() => {
            this.frame = null;
            this.view.requestMeasure({
                key: this,
                read: () => captureMotionScrollPositions(this.view),
                write: (positions) => {
                    if (revision !== this.revision) return;
                    this.scrollPositions = positions;
                },
            });
        });
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) this.finish();
    }

    finish() {
        const animatedLiveRows = this.context !== null;
        this.revision++;
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.context?.revert();
        this.context = null;
        this.ghost = null;
        this.outgoingSnapshot?.remove();
        this.outgoingSnapshot = null;
        this.scrollPositions = null;
        if (animatedLiveRows && this.view.dom.isConnected)
            this.view.requestMeasure();
    }

    destroy() {
        this.finish();
        this.view.dom.removeEventListener('pointerdown', this.interrupt);
        window.removeEventListener('resize', this.interrupt);
        document.removeEventListener('scroll', this.interruptAfterScroll, true);
        this.reducedMotion.removeEventListener('change', this.interrupt);
    }
}

export const markdownBlockMotion = ViewPlugin.fromClass(MarkdownBlockMotion);
