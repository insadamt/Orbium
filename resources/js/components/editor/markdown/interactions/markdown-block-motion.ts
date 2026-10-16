import { gsap } from 'gsap';
import type { ChangeSet } from '@codemirror/state';
import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import type { MarkdownBlockRange } from './markdown-block-actions';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import { refreshRichBlocks } from '../rich/rich-effects';
import {
    createMarkdownMotionSnapshot,
    renderedMarkdownMotionRows,
} from './markdown-motion-snapshot';

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

let motionSequence = 0;

class MarkdownBlockMotion {
    private context: gsap.Context | null = null;
    private ghost: HTMLElement | null = null;
    private outgoingSnapshot: HTMLElement | null = null;
    private frame: number | null = null;
    private layoutSnapshots: HTMLElement[] = [];
    private liveRowMask: HTMLStyleElement | null = null;
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
        const rows = renderedMarkdownMotionRows(this.view);
        const outgoing = rows.filter(
            (row) => row.position >= block.from && row.position <= block.to,
        );
        const ghost = createMarkdownMotionSnapshot(this.view, outgoing);
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
        // Finish parsing before staging motion so the scheduled rich refresh reuses the same widgets.
        const from = Math.max(0, this.view.viewport.from - 2000);
        const to = Math.min(
            this.view.state.doc.length,
            this.view.viewport.to + 2000,
        );
        this.view.dispatch({
            effects: refreshRichBlocks.of({
                from,
                to,
                tree:
                    ensureSyntaxTree(this.view.state, to, 50) ??
                    syntaxTree(this.view.state),
            }),
        });
        this.ghost = snapshot.ghost?.popElement ?? null;
        this.outgoingSnapshot = snapshot.ghost?.element ?? null;
        const rows = renderedMarkdownMotionRows(this.view);
        const hiddenRows: HTMLElement[] = [];
        if (this.ghost) this.ghost.style.visibility = 'visible';
        this.context = gsap.context(() => {
            const timeline = gsap.timeline();
            if (this.ghost) {
                gsap.set(this.ghost, {
                    x: 0,
                    y: 0,
                    scaleX: 1,
                    scaleY: 1,
                    opacity: 1,
                });
                timeline.to(
                    this.ghost,
                    {
                        scale: 0.9,
                        opacity: 0,
                        duration: 0.08,
                        ease: 'power2.in',
                    },
                    0,
                );
            }
            const enteringRows = rows.filter(
                (row) =>
                    movedBlock &&
                    row.position >= movedBlock.from &&
                    row.position <= movedBlock.to,
            );
            const incoming = createMarkdownMotionSnapshot(
                this.view,
                enteringRows,
            );
            if (incoming) {
                this.layoutSnapshots.push(incoming.element);
                hiddenRows.push(...enteringRows.map((row) => row.element));
                gsap.set(incoming.popElement, {
                    x: 0,
                    y: 0,
                    scale: 0.9,
                    opacity: 0,
                });
                timeline.to(
                    incoming.popElement,
                    {
                        scale: 1,
                        opacity: 1,
                        duration: 0.1,
                        ease: 'power2.out',
                    },
                    0.22,
                );
            }
            for (const row of rows) {
                if (enteringRows.includes(row)) continue;
                const previous = snapshot.rows.find(
                    (old) =>
                        !snapshot.outgoing.includes(old) &&
                        changes.mapPos(old.position, 1) === row.position,
                );
                if (!previous) continue;
                const distance =
                    (previous.bounds.top - row.bounds.top) / this.view.scaleY;
                if (Math.abs(distance) < 0.5) continue;
                const moving = createMarkdownMotionSnapshot(this.view, [row]);
                if (!moving) continue;
                this.layoutSnapshots.push(moving.element);
                hiddenRows.push(row.element);
                gsap.set(moving.popElement, { y: distance });
                timeline.to(
                    moving.popElement,
                    {
                        y: 0,
                        duration: 0.14,
                        ease: 'power2.inOut',
                    },
                    0.08,
                );
            }
            timeline.call(this.interrupt, [], movedBlock ? 0.32 : 0.22);
        });
        this.maskLiveRows(hiddenRows);
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

    private maskLiveRows(elements: HTMLElement[]) {
        if (!elements.length) return;
        const owner = `block-motion-${++motionSequence}`;
        const mask = document.createElement('style');
        const children = Array.from(this.view.contentDOM.children);
        mask.textContent =
            elements
                .map(
                    (element) =>
                        `[data-block-motion-owner="${owner}"] > .cm-scroller > .cm-content > :nth-child(${children.indexOf(element) + 1})`,
                )
                .join(',') + ' { opacity: 0 !important; }';
        // CodeMirror observes row attributes and can reset inline styles while redrawing.
        this.view.dom.setAttribute('data-block-motion-owner', owner);
        this.view.dom.ownerDocument.head.append(mask);
        this.liveRowMask = mask;
    }

    update(update: ViewUpdate) {
        const selectionChanged =
            update.selectionSet &&
            !update.startState.selection.eq(update.state.selection);
        if (update.docChanged || selectionChanged) this.finish();
    }

    finish() {
        const hadAnimation = this.context !== null;
        this.revision++;
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.liveRowMask?.remove();
        this.liveRowMask = null;
        this.view.dom.removeAttribute('data-block-motion-owner');
        this.context?.revert();
        this.context = null;
        this.ghost = null;
        this.outgoingSnapshot?.remove();
        this.outgoingSnapshot = null;
        for (const element of this.layoutSnapshots) element.remove();
        this.layoutSnapshots = [];
        this.scrollPositions = null;
        if (hadAnimation && this.view.dom.isConnected)
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
