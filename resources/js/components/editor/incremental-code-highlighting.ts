import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import type { Fragment, Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { createLowlight } from 'lowlight';
import {
    findTransactionBlockRanges,
    type DocumentRange,
} from './document-change-range';
import { scheduleEditorIdleWork } from './schedule-editor-idle-work';

type Lowlight = ReturnType<typeof createLowlight>;
type HighlightNode = ReturnType<Lowlight['highlight']>['children'][number];
type HighlightSpan = { from: number; to: number; className: string };
type PendingBlock = { position: number; node: ProseMirrorNode };
type HighlightState = { decorations: DecorationSet; pending: PendingBlock[] };
type CompletedHighlights = {
    blocks: PendingBlock[];
    decorations: Decoration[];
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
            let cancelWork: (() => void) | null = null;
            let destroyed = false;
            function scheduleHighlight() {
                if (
                    destroyed ||
                    cancelWork ||
                    !key.getState(view.state)?.pending.length
                )
                    return;
                cancelWork = scheduleEditorIdleWork(() => {
                    cancelWork = null;
                    if (destroyed) return;
                    const pending = key.getState(view.state)?.pending;
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
                        if (
                            blocks.length >= 16 ||
                            performance.now() >= deadline
                        )
                            break;
                    }
                    view.dispatch(
                        view.state.tr
                            .setMeta(key, { blocks, decorations })
                            .setMeta('addToHistory', false),
                    );
                    scheduleHighlight();
                });
            }
            scheduleHighlight();
            return {
                update: scheduleHighlight,
                destroy: () => {
                    destroyed = true;
                    cancelWork?.();
                },
            };
        },
    });
}

export const IncrementalCodeBlockLowlight = CodeBlockLowlight.extend({
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
            ),
        ];
    },
});
