// Summary: Replaces V3 layout source with the existing column surface in the active owner Live Preview; depends on stable layout identity and deferred disposal so owner moves reuse mounted projections.
import { StateField, type Extension } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { v3StructureField } from '../../structure/v3-structure-state';
import { mountV3ColumnLayout, v3ColumnLayoutUpdates } from './v3-column-layout';

type V3ColumnWidgetOptions = {
    clipboardScope: string;
    renderRichBodies?: boolean;
    isAvailable: () => boolean;
    onError: (error: Error) => void;
    extensionsForColumn?: (columnId: string) => Extension;
};
type MountedV3Widget = {
    root: HTMLElement;
    controller: ReturnType<typeof mountV3ColumnLayout>;
    widget: V3ColumnWidget;
};
const widgets = new WeakMap<EditorView, Map<string, MountedV3Widget>>();

class V3ColumnWidget extends WidgetType {
    constructor(
        readonly id: string,
        readonly options: V3ColumnWidgetOptions,
    ) {
        super();
    }
    eq(other: V3ColumnWidget) {
        return this === other;
    }
    updateDOM(root: HTMLElement, owner: EditorView) {
        const mounted = widgets.get(owner)?.get(this.id);
        if (!mounted || mounted.root !== root) return false;
        //
        // Rebind disposal ownership when CodeMirror replaces the decoration value while retaining its DOM.
        //
        mounted.widget = this;
        mounted.controller.refresh();
        return true;
    }
    toDOM(owner: EditorView) {
        let mounted = widgets.get(owner);
        if (!mounted) {
            mounted = new Map();
            widgets.set(owner, mounted);
        }
        const retained = mounted.get(this.id);
        if (retained) {
            retained.widget = this;
            retained.controller.refresh();
            return retained.root;
        }
        const root = owner.dom.ownerDocument.createElement('div');
        rootOwners.set(root, owner);
        root.className = 'orbium-rich-block orbium-columns-block';
        const controller = mountV3ColumnLayout({
            ...this.options,
            root,
            owner,
            layoutId: this.id,
        });
        mounted.set(this.id, { root, controller, widget: this });
        return root;
    }
    ignoreEvent() {
        return true;
    }
    destroy(root: HTMLElement) {
        //
        // CodeMirror can remove and reclaim a keyed layout within one owner move; dispose only after that relocation has settled.
        //
        queueMicrotask(() => {
            const owner = rootOwners.get(root);
            const mounted = owner && widgets.get(owner)?.get(this.id);
            if (
                !owner ||
                !mounted ||
                mounted.widget !== this ||
                root.isConnected
            )
                return;
            mounted.controller.destroy();
            widgets.get(owner)?.delete(this.id);
            rootOwners.delete(root);
        });
    }
}
const rootOwners = new WeakMap<HTMLElement, EditorView>();

export function v3ColumnWidgets(options: V3ColumnWidgetOptions) {
    const decorations = StateField.define({
        create: (state) =>
            Decoration.set(
                state
                    .field(v3StructureField)
                    .current.blocksIn(null)
                    .filter((block) => block.type === 'columns')
                    .map((block) =>
                        Decoration.replace({
                            block: true,
                            inclusiveStart: true,
                            inclusiveEnd: false,
                            widget: new V3ColumnWidget(block.id, options),
                        }).range(block.from, block.to),
                    ),
            ),
        update(previous, transaction) {
            if (!transaction.docChanged) return previous;
            const index = transaction.state.field(v3StructureField).current;
            if (
                transaction.state.field(v3StructureField).updateKind ===
                'mapped-body'
            )
                return previous.map(transaction.changes);
            return Decoration.set(
                index
                    .blocksIn(null)
                    .filter((block) => block.type === 'columns')
                    .map((block) =>
                        Decoration.replace({
                            block: true,
                            inclusiveStart: true,
                            inclusiveEnd: false,
                            widget: new V3ColumnWidget(block.id, options),
                        }).range(block.from, block.to),
                    ),
            );
        },
        provide: (field) => [
            EditorView.decorations.from(field),
            EditorView.atomicRanges.of((view) => view.state.field(field)),
        ],
    });
    return [decorations, v3ColumnLayoutUpdates];
}
