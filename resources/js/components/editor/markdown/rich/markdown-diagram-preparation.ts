import { ensureSyntaxTree } from '@codemirror/language';
import { ViewPlugin, EditorView, type ViewUpdate } from '@codemirror/view';
import { scheduleEditorIdleWork } from '../../schedule-editor-idle-work';
import { discoverMermaidBlocks, refreshMermaidLayout } from './rich-effects';
import { readRichBlock } from './read-rich-block';
import type { RichBlock, RichContext } from './rich-model';

export function markdownDiagramPreparation(context: RichContext) {
    return ViewPlugin.fromClass(
        class {
            private scanFrom = 0;
            private sources = new Set<string>();
            private lastEdit = 0;
            private cancelScan?: () => void;
            private layoutFrame?: number;
            private destroyed = false;
            private unsubscribe: () => void;
            private resizeObserver: ResizeObserver;

            constructor(private view: EditorView) {
                this.unsubscribe = context.mermaid.previews.subscribePrepared(
                    () => this.refreshLayout(),
                );
                this.resizeObserver = new ResizeObserver(() =>
                    this.measureWidth(),
                );
                this.resizeObserver.observe(view.contentDOM);
                this.measureWidth();
                this.scheduleScan();
            }

            update(update: ViewUpdate) {
                if (update.docChanged) {
                    this.cancelScan?.();
                    this.cancelScan = undefined;
                    this.scanFrom = 0;
                    this.sources.clear();
                    this.lastEdit = performance.now();
                }
                this.scheduleScan();
                if (
                    update.startState.facet(EditorView.editable) !==
                    update.state.facet(EditorView.editable)
                )
                    this.refreshLayout();
            }

            private measureWidth() {
                this.view.requestMeasure({
                    key: this,
                    read: (view) => view.contentDOM.clientWidth,
                    write: (width) => {
                        if (
                            this.destroyed ||
                            width <= 0 ||
                            context.diagramWidth === width
                        )
                            return;
                        context.diagramWidth = width;
                        this.refreshLayout();
                        this.scheduleScan();
                    },
                });
            }

            private refreshLayout() {
                if (this.layoutFrame !== undefined || this.destroyed) return;
                this.layoutFrame = requestAnimationFrame(() => {
                    this.layoutFrame = undefined;
                    if (this.destroyed || !context.isVisible()) return;
                    this.view.dispatch({
                        effects: refreshMermaidLayout.of(null),
                    });
                    this.view.requestMeasure();
                });
            }

            private scheduleScan() {
                if (
                    this.cancelScan ||
                    this.destroyed ||
                    !this.view.state.facet(EditorView.editable) ||
                    this.scanFrom >= this.view.state.doc.length
                )
                    return;
                let cancelIdle: (() => void) | undefined;
                const timer = window.setTimeout(
                    () => {
                        cancelIdle = scheduleEditorIdleWork(() => {
                            this.cancelScan = undefined;
                            if (
                                this.destroyed ||
                                !context.isVisible() ||
                                !this.view.state.facet(EditorView.editable) ||
                                this.view.composing
                            )
                                return;
                            this.scanNextRange();
                        });
                    },
                    Math.max(0, 140 - (performance.now() - this.lastEdit)),
                );
                this.cancelScan = () => {
                    clearTimeout(timer);
                    cancelIdle?.();
                };
            }

            private scanNextRange() {
                const to = Math.min(
                    this.scanFrom + 8000,
                    this.view.state.doc.length,
                );
                const tree = ensureSyntaxTree(this.view.state, to, 8);
                if (!tree) {
                    this.scheduleScan();
                    return;
                }
                const diagrams: RichBlock[] = [];
                const sources = new Set<string>();
                tree.iterate({
                    from: this.scanFrom,
                    to,
                    enter: ({ node }) => {
                        if (
                            !['FencedCode', 'OrbiumDirective'].includes(
                                node.name,
                            )
                        )
                            return;
                        const block = readRichBlock(this.view.state, node);
                        if (block?.kind === 'code') return false;
                        if (block?.kind !== 'mermaid') return;
                        sources.add(block.content);
                        this.sources.add(block.content);
                        if (
                            node.parent?.name === 'Document' &&
                            node.parent.parent === null
                        )
                            diagrams.push(block);
                        return false;
                    },
                });
                this.scanFrom = to;
                context.mermaid.prepareSources(sources);
                if (diagrams.length)
                    this.view.dispatch({
                        effects: discoverMermaidBlocks.of(diagrams),
                    });
                if (to === this.view.state.doc.length)
                    context.mermaid.previews.releaseUnusedSources(this.sources);
                this.scheduleScan();
            }

            destroy() {
                this.destroyed = true;
                this.cancelScan?.();
                this.unsubscribe();
                this.resizeObserver.disconnect();
                if (this.layoutFrame !== undefined)
                    cancelAnimationFrame(this.layoutFrame);
            }
        },
    );
}
