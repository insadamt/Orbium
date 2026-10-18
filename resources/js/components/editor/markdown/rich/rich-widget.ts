import {
    canUpdateRetainedRichWidget,
    claimRetainedRichWidget,
    deferRichWidgetDisposal,
    registerMountedRichWidget,
    findRetainedRichWidget,
    unregisterMountedRichWidget,
    updateMountedRichWidget,
} from './rich-widget-move';
import { EditorView, WidgetType } from '@codemirror/view';
import type {
    RichBlock,
    RichContext,
    RichController,
    RichWidgetMount,
} from './rich-model';
import { mountDiagram } from './diagram-widget';
import { mountMath } from './math-widget';
import { mountCode } from './code-widget';
import { mountFileMedia } from './file-media-widget';
import { mountMedia } from './media-widget';
import { mountTable } from './table-widget';
import { mountContainer } from './container-widget';
import { mountEmptyParagraph } from './empty-widget';
import { mountCallout } from './callout-widget';
import { bindRichBlockHistory } from './widget-controls';
import { bindRichBlockSelection } from './rich-block-selection';

const richBlockMounts: Partial<
    Record<RichBlock['kind'], (mount: RichWidgetMount) => RichController>
> = {
    empty: mountEmptyParagraph,
    mermaid: mountDiagram,
    math: mountMath,
    'inline-math': mountMath,
    code: mountCode,
    file: mountFileMedia,
    image: mountMedia,
    table: mountTable,
    callout: mountCallout,
};

const presentationContainers = new WeakMap<HTMLElement, HTMLElement[]>();
const controllers = new WeakMap<HTMLElement, RichController>();
const observers = new WeakMap<HTMLElement, ResizeObserver>();
const widgetOwners = new WeakMap<HTMLElement, MarkdownRichWidget>();

const currentBlocks = new WeakMap<HTMLElement, RichBlock>();

function richBlockClassName(kind: RichBlock['kind']) {
    const classes: Partial<Record<RichBlock['kind'], string>> = {
        mermaid: 'orbium-mermaid rounded-xl border border-border p-4',
        code: 'orbium-code my-5 overflow-hidden rounded-xl border border-border bg-muted',
        image: 'orbium-image editor-image my-5',
        file: 'orbium-file my-4 rounded-xl border border-border p-4',
        table: 'orbium-table-container relative my-4',
        callout: 'orbium-callout editor-callout my-4',
        empty: 'orbium-paragraph',
    };
    return `orbium-rich-block ${classes[kind] ?? `orbium-${kind} my-4 rounded-xl border border-border p-4`}`;
}

function estimateDiagramWidgetHeight(block: RichBlock, context: RichContext) {
    if (block.kind !== 'mermaid') return -1;
    const dimensions = context.mermaid.previews.get(block.content)?.dimensions;
    if (!dimensions || !context.diagramWidth) return -1;
    const frameHorizontalPaddingAndBorders = 54;
    const frameAndToolbarHeight = 112;
    const outputWidth = Math.min(
        Math.max(1, context.diagramWidth - frameHorizontalPaddingAndBorders),
        dimensions.maxWidth ?? Infinity,
    );
    const outputHeight = Math.max(
        100,
        (outputWidth * dimensions.height) / dimensions.width,
    );
    return frameAndToolbarHeight + outputHeight;
}

export class MarkdownRichWidget extends WidgetType {
    private readonly diagramHeightEstimate: number;
    constructor(
        readonly block: RichBlock,
        readonly context: RichContext,
        readonly disabled: boolean,
        readonly searchSelected = false,
    ) {
        super();
        this.diagramHeightEstimate = estimateDiagramWidgetHeight(
            block,
            context,
        );
    }
    override get estimatedHeight() {
        return this.diagramHeightEstimate;
    }
    eq(other: MarkdownRichWidget) {
        return (
            this.diagramHeightEstimate === other.estimatedHeight &&
            this.context === other.context &&
            this.disabled === other.disabled &&
            this.searchSelected === other.searchSelected &&
            this.block.kind === other.block.kind &&
            this.block.from === other.block.from &&
            this.block.to === other.block.to &&
            this.block.source === other.block.source &&
            this.block.diagnostic === other.block.diagnostic
        );
    }
    toDOM(view: EditorView) {
        const retained = findRetainedRichWidget(view, this.block, this.context);
        if (retained && this.updateDOM(retained)) return retained;
        const root = document.createElement(
            this.block.kind === 'inline-math' ? 'span' : 'div',
        );
        root.className =
            this.block.kind === 'inline-math'
                ? 'relative inline-block align-baseline'
                : richBlockClassName(this.block.kind);
        root.contentEditable = 'false';
        root.dataset.richFrom = String(this.block.from);
        let content = root;
        const nestedContainers: HTMLElement[] = [];
        for (const wrapper of (this.block.wrappers ?? []).slice(1)) {
            const container = document.createElement('div');
            container.dir = wrapper.dir ?? 'auto';
            container.style.textAlign = wrapper.align ?? '';
            content.append(container);
            content = container;
            nestedContainers.push(container);
        }
        presentationContainers.set(root, nestedContainers);
        const mount = {
            view,
            root: content,
            block: this.block,
            context: this.context,
        };
        bindRichBlockHistory(root, view);
        if (!['inline-math', 'metadata', 'empty'].includes(this.block.kind))
            bindRichBlockSelection(root, view, () => this.currentBlock(root));
        const controller = (richBlockMounts[this.block.kind] ?? mountContainer)(
            mount,
        );
        const observer = new ResizeObserver(() => {
            if (view.dom.isConnected) view.requestMeasure();
        });
        observer.observe(root);
        observers.set(root, observer);
        controllers.set(root, controller);
        this.applyPresentation(root);
        widgetOwners.set(root, this);
        registerMountedRichWidget({
            view,
            root,
            block: this.block,
            context: this.context,
            dispose: () => this.disposeRoot(root),
        });
        return root;
    }
    updateDOM(root: HTMLElement) {
        const controller = controllers.get(root);
        if (
            !controller ||
            !canUpdateRetainedRichWidget(root, this.block, this.context) ||
            root.dataset.richKind !== this.block.kind ||
            (presentationContainers.get(root)?.length ?? 0) !==
                Math.max(0, (this.block.wrappers?.length ?? 1) - 1)
        )
            return false;
        if (!controller.update(this.block)) return false;
        this.applyPresentation(root);
        widgetOwners.set(root, this);
        updateMountedRichWidget(root, this.block);
        claimRetainedRichWidget(root);
        return true;
    }
    private applyPresentation(root: HTMLElement) {
        currentBlocks.set(root, this.block);
        root.classList.toggle('cm-md-find-match', this.searchSelected);
        root.dataset.richKind = this.block.kind;
        root.dataset.richFrom = String(this.block.from);
        root.dir = String(this.block.presentation.dir ?? 'auto');
        root.style.textAlign = String(this.block.presentation.align ?? '');
        presentationContainers.get(root)?.forEach((container, index) => {
            const wrapper = this.block.wrappers![index + 1];
            container.dir = wrapper.dir ?? 'auto';
            container.style.textAlign = wrapper.align ?? '';
        });
    }
    destroy(root: HTMLElement) {
        if (!widgetOwners.get(root)?.eq(this) || deferRichWidgetDisposal(root))
            return;
        this.disposeRoot(root);
    }
    private disposeRoot(root: HTMLElement) {
        unregisterMountedRichWidget(root);
        widgetOwners.delete(root);
        currentBlocks.delete(root);
        presentationContainers.delete(root);
        observers.get(root)?.disconnect();
        observers.delete(root);
        controllers.get(root)?.destroy();
        controllers.delete(root);
    }
    ignoreEvent() {
        return true;
    }
    private currentBlock(root: HTMLElement) {
        return currentBlocks.get(root) ?? this.block;
    }
}
