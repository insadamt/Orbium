import CodeBlockLowlight, {
    type CodeBlockLowlightOptions,
} from '@tiptap/extension-code-block-lowlight';
import type { Fragment, Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';
import type { createLowlight } from 'lowlight';
import {
    adjustEditorPerformanceCounter,
    measureEditorWork,
} from '@/lib/editor-performance';
import {
    findTransactionBlockRanges,
    type DocumentRange,
} from './document-change-range';
import { scheduleEditorIdleWork } from './schedule-editor-idle-work';
import type { EditorActivityController } from './editor-activity-controller';

type Lowlight = ReturnType<typeof createLowlight>;
type HighlightNode = ReturnType<Lowlight['highlight']>['children'][number];
type HighlightSpan = { from: number; to: number; className: string };
type PendingBlock = { position: number; node: ProseMirrorNode };
type HighlightState = { decorations: DecorationSet; pending: PendingBlock[] };
type CompletedHighlights = {
    blocks: PendingBlock[];
    decorations: Decoration[];
};
type IncrementalHighlightingOptions = CodeBlockLowlightOptions & {
    activityController: EditorActivityController | null;
};

function collectHighlightSpans(nodes: HighlightNode[]): HighlightSpan[] {
    const spans: HighlightSpan[] = [];
    let position = 0;
    function visit(node: HighlightNode, classes: string[]) {
        if (node.type === 'text') {
            const end = position + node.value.length;
            if (classes.length && end > position)
                spans.push({
                    from: position,
                    to: end,
                    className: classes.join(' '),
                });
            position = end;
        } else if (node.type === 'element') {
            const classNames = node.properties.className;
            const inherited = Array.isArray(classNames)
                ? [...classes, ...classNames.map(String)]
                : classes;
            node.children.forEach((child) => visit(child, inherited));
        }
    }
    nodes.forEach((node) => visit(node, []));
    return spans;
}

function createHighlightingPlugin(
    lowlight: Lowlight,
    defaultLanguage: string | null | undefined,
    activityController: EditorActivityController | null,
) {
    const cache = new WeakMap<Fragment, Map<string, HighlightSpan[]>>();
    function highlightBlock(block: ProseMirrorNode): HighlightSpan[] {
        const language = String(block.attrs.language || defaultLanguage || '');
        let languages = cache.get(block.content);
        const cached = languages?.get(language);
        if (cached) return cached;
        const highlighted =
            language && lowlight.registered(language)
                ? lowlight.highlight(language, block.textContent)
                : lowlight.highlightAuto(block.textContent);
        const spans = collectHighlightSpans(highlighted.children);
        if (!languages) {
            languages = new Map();
            cache.set(block.content, languages);
        }
        languages.set(language, spans);
        return spans;
    }
    function collectCodeBlocks(
        document: ProseMirrorNode,
        range: DocumentRange,
    ): PendingBlock[] {
        const blocks: PendingBlock[] = [];
        if (range.from === range.to) return blocks;
        document.nodesBetween(range.from, range.to, (node, position) => {
            if (node.type.name === 'codeBlock') blocks.push({ node, position });
            return !node.isTextblock;
        });
        return blocks;
    }
    function decorateBlock({ node, position }: PendingBlock): Decoration[] {
        return highlightBlock(node).map((span) =>
            Decoration.inline(
                position + 1 + span.from,
                position + 1 + span.to,
                { class: span.className },
            ),
        );
    }
    const key = new PluginKey<HighlightState>('incrementalCodeHighlighting');
    return new Plugin<HighlightState>({
        key,
        state: {
            init: (_, state) => ({
                decorations: DecorationSet.empty,
                pending: collectCodeBlocks(state.doc, {
                    from: 0,
                    to: state.doc.content.size,
                }),
            }),
            apply: (transaction, state) => {
                const completed = transaction.getMeta(key) as
                    | CompletedHighlights
                    | undefined;
                if (!transaction.docChanged) {
                    if (
                        !completed ||
                        completed.blocks.some(
                            (block) =>
                                transaction.doc.nodeAt(block.position) !==
                                block.node,
                        )
                    )
                        return state;
                    const completedPositions = new Set(
                        completed.blocks.map((block) => block.position),
                    );
                    return {
                        decorations: state.decorations.add(
                            transaction.doc,
                            completed.decorations,
                        ),
                        pending: state.pending.filter(
                            (block) => !completedPositions.has(block.position),
                        ),
                    };
                }
                const ranges = findTransactionBlockRanges(transaction);
                if (!ranges) return state;
                const retained = state.decorations.remove(
                    state.decorations.find(
                        ranges.previous.from,
                        ranges.previous.to,
                    ),
                );
                const pending = state.pending
                    .filter(
                        (block) =>
                            block.position < ranges.previous.from ||
                            block.position >= ranges.previous.to,
                    )
                    .map((block) => ({
                        node: block.node,
                        position: transaction.mapping.map(block.position, 1),
                    }));
                return {
                    decorations: retained.map(
                        transaction.mapping,
                        transaction.doc,
                    ),
                    pending: [
                        ...collectCodeBlocks(transaction.doc, ranges.current),
                        ...pending,
                    ],
                };
            },
        },
        props: { decorations: (state) => key.getState(state)?.decorations },
        view: (view) => {
            let editorView: EditorView | null = view;
            let controller = activityController;
            let scheduledWork: { cancel: () => void } | null = null;
            let destroyed = false;
            let previousActive = isActive();

            function isActive() {
                return controller?.getSnapshot().active ?? true;
            }
            function cancelScheduledHighlight() {
                if (!scheduledWork) return;
                const work = scheduledWork;
                scheduledWork = null;
                work.cancel();
                adjustEditorPerformanceCounter(
                    'code-highlight.active-schedulers',
                    -1,
                );
            }
            function processHighlightBatch(currentView: EditorView) {
                const pending = key.getState(currentView.state)?.pending;
                if (!pending?.length) return;
                // Read the current queue at execution time so edits and navigation cannot publish stale highlights.
                const blocks: PendingBlock[] = [];
                const decorations: Decoration[] = [];
                const deadline = performance.now() + 6;
                for (const block of pending) {
                    blocks.push(block);
                    for (const decoration of decorateBlock(block)) {
                        decorations.push(decoration);
                    }
                    if (blocks.length >= 16 || performance.now() >= deadline)
                        break;
                }
                adjustEditorPerformanceCounter(
                    'code-highlight.processed-blocks',
                    blocks.length,
                );
                currentView.dispatch(
                    currentView.state.tr
                        .setMeta(key, { blocks, decorations })
                        .setMeta('addToHistory', false),
                );
            }
            function scheduleHighlight() {
                if (
                    destroyed ||
                    !editorView ||
                    !isActive() ||
                    scheduledWork ||
                    !key.getState(editorView.state)?.pending.length
                )
                    return;
                const work = {
                    cancel: scheduleEditorIdleWork(() => {
                        // A canceled callback must not consume a newer activation's scheduled work.
                        if (scheduledWork !== work) return;
                        scheduledWork = null;
                        adjustEditorPerformanceCounter(
                            'code-highlight.active-schedulers',
                            -1,
                        );
                        if (destroyed || !editorView || !isActive()) return;
                        measureEditorWork('code-highlight.batch', () => {
                            if (editorView) processHighlightBatch(editorView);
                        });
                        scheduleHighlight();
                    }),
                };
                scheduledWork = work;
                adjustEditorPerformanceCounter(
                    'code-highlight.active-schedulers',
                    1,
                );
            }
            function updateHighlightActivity() {
                const active = isActive();
                if (destroyed || active === previousActive) return;
                previousActive = active;
                adjustEditorPerformanceCounter(
                    active ? 'code-highlight.resumes' : 'code-highlight.pauses',
                    1,
                );
                if (active) {
                    scheduleHighlight();
                } else {
                    cancelScheduledHighlight();
                }
            }
            let unsubscribe = controller?.subscribe(updateHighlightActivity);
            adjustEditorPerformanceCounter(
                'code-highlight.activity-subscriptions',
                unsubscribe ? 1 : 0,
            );
            adjustEditorPerformanceCounter(
                'code-highlight.active-schedulers',
                0,
            );
            adjustEditorPerformanceCounter(
                'code-highlight.processed-blocks',
                0,
            );
            adjustEditorPerformanceCounter('code-highlight.pauses', 0);
            adjustEditorPerformanceCounter('code-highlight.resumes', 0);
            scheduleHighlight();
            return {
                update: scheduleHighlight,
                destroy: () => {
                    if (destroyed) return;
                    destroyed = true;
                    if (unsubscribe) {
                        unsubscribe();
                        unsubscribe = undefined;
                        adjustEditorPerformanceCounter(
                            'code-highlight.activity-subscriptions',
                            -1,
                        );
                    }
                    cancelScheduledHighlight();
                    editorView = null;
                    controller = null;
                },
            };
        },
    });
}

export const IncrementalCodeBlockLowlight =
    CodeBlockLowlight.extend<IncrementalHighlightingOptions>({
        addOptions() {
            return {
                ...this.parent!(),
                activityController: null,
            };
        },
        addProseMirrorPlugins() {
            // Keep the inherited VS Code paste handler, replacing only Lowlight's full-document plugin.
            const inherited = (this.parent?.() ?? []).filter((plugin) => {
                const key = plugin.spec.key as { key?: string } | undefined;
                return !key?.key?.startsWith('lowlight$');
            });
            return [
                ...inherited,
                createHighlightingPlugin(
                    this.options.lowlight as Lowlight,
                    this.options.defaultLanguage,
                    this.options.activityController,
                ),
            ];
        },
    });
