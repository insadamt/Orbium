import { EditorView, WidgetType } from '@codemirror/view';
import type { RichBlock, RichContext, RichController } from './rich-model';
import { mountDiagram } from './diagram-widget';
import { mountMath } from './math-widget';
import { mountCode } from './code-widget';
import { mountMedia } from './media-widget';
import { mountTable } from './table-widget';
import { mountContainer } from './container-widget';

const presentationContainers = new WeakMap<HTMLElement, HTMLElement[]>();
const controllers = new WeakMap<HTMLElement, RichController>();
const observers = new WeakMap<HTMLElement, ResizeObserver>();

export class MarkdownRichWidget extends WidgetType {
    constructor(
        readonly block: RichBlock,
        readonly context: RichContext,
        readonly disabled: boolean,
    ) {
        super();
    }
    eq(other: MarkdownRichWidget) {
        return (
            this.context === other.context &&
            this.disabled === other.disabled &&
            this.block.kind === other.block.kind &&
            this.block.from === other.block.from &&
            this.block.to === other.block.to &&
            this.block.source === other.block.source &&
            this.block.diagnostic === other.block.diagnostic
        );
    }
    toDOM(view: EditorView) {
        const root = document.createElement(
            this.block.kind === 'inline-math' ? 'span' : 'div',
        );
        root.className =
            this.block.kind === 'inline-math'
                ? 'relative inline-block align-baseline'
                : `orbium-${this.block.kind === 'metadata' ? 'block-metadata' : this.block.kind === 'table' ? 'table-container' : this.block.kind} orbium-rich-block my-4 ${['metadata', 'empty'].includes(this.block.kind) ? '' : 'rounded-xl border border-border p-4'}`;
        root.contentEditable = 'false';
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
        const controller =
            this.block.kind === 'mermaid'
                ? mountDiagram(mount)
                : ['math', 'inline-math'].includes(this.block.kind)
                  ? mountMath(mount)
                  : this.block.kind === 'code'
                    ? mountCode(mount)
                    : ['image', 'file'].includes(this.block.kind)
                      ? mountMedia(mount)
                      : this.block.kind === 'table'
                        ? mountTable(mount)
                        : mountContainer(mount);
        const observer = new ResizeObserver(() => {
            if (view.dom.isConnected) view.requestMeasure();
        });
        observer.observe(root);
        observers.set(root, observer);
        controllers.set(root, controller);
        this.applyPresentation(root);
        return root;
    }
    updateDOM(root: HTMLElement) {
        const controller = controllers.get(root);
        if (
            !controller ||
            root.dataset.richKind !== this.block.kind ||
            (presentationContainers.get(root)?.length ?? 0) !==
                Math.max(0, (this.block.wrappers?.length ?? 1) - 1)
        )
            return false;
        this.applyPresentation(root);
        return controller.update(this.block);
    }
    private applyPresentation(root: HTMLElement) {
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
        presentationContainers.delete(root);
        observers.get(root)?.disconnect();
        observers.delete(root);
        controllers.get(root)?.destroy();
        controllers.delete(root);
    }
    ignoreEvent() {
        return true;
    }
}
