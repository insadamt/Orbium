// Summary: Reveals the page bottom while typing on its final writing row; depends on the V3 owner index, focused embedded inputs and CodeMirror's post-layout measurement.
import { EditorView, ViewPlugin } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';

function isWritingOnFinalRow(view: EditorView) {
    const active = view.root.activeElement;
    if (!(active instanceof HTMLElement) || !view.dom.contains(active))
        return false;
    const index = view.state.field(v3StructureField).current;
    let block = index.blockAt(view.state.selection.main.head);
    if (!block) return false;
    if (block.parentId) {
        if (index.blocksIn(block.parentId).at(-1)?.id !== block.id)
            return false;
        const column = index.columnById(block.parentId);
        block = column && index.blockById(column.layoutId);
    }
    if (!block || index.blocksIn(null).at(-1)?.id !== block.id) return false;

    if (active instanceof HTMLTextAreaElement)
        return (
            active.selectionStart === active.selectionEnd &&
            !active.value.slice(active.selectionEnd).includes('\n')
        );
    if (active instanceof HTMLInputElement) return true;
    const editor = active.closest<HTMLElement>('.cm-editor');
    const writingView = editor && EditorView.findFromDOM(editor);
    if (writingView && writingView.dom === editor) {
        const { state } = writingView;
        const selection = state.selection.main;
        const end =
            writingView === view
                ? Math.max(block.bodyFrom, block.bodyTo - 1)
                : state.doc.length;
        return (
            selection.empty &&
            state.doc.lineAt(selection.head).number >=
                state.doc.lineAt(end).number
        );
    }
    return false;
}

function findWritingScrollContainer(view: EditorView): HTMLElement | null {
    let element: HTMLElement | null = view.scrollDOM;
    while (element) {
        const ownerWindow: Window | null = element.ownerDocument.defaultView;
        if (!ownerWindow) return null;
        if (
            element.scrollHeight > element.clientHeight &&
            (/(auto|scroll)/.test(
                ownerWindow.getComputedStyle(element).overflowY,
            ) ||
                element === element.ownerDocument.scrollingElement)
        )
            return element;
        //
        // Split documents can grow inside an iframe whose visible scrollbar belongs to the host pane.
        //
        element =
            element.parentElement ??
            (ownerWindow.frameElement as HTMLElement | null)?.parentElement ??
            null;
    }
    return null;
}

export const v3WritingBottomScroll = ViewPlugin.define((view) => {
    let destroyed = false;
    let pending = false;
    const cancel = () => {
        pending = false;
    };
    const reveal = () => {
        if (pending || !isWritingOnFinalRow(view)) return;
        pending = true;
        //
        // Rich widgets and wrapped rows change height after input; read the final scroll extent in the editor's measurement cycle.
        //
        view.requestMeasure({
            read: () => {
                if (destroyed || !pending || !isWritingOnFinalRow(view))
                    return null;
                const container = findWritingScrollContainer(view);
                return (
                    container && { container, bottom: container.scrollHeight }
                );
            },
            write: (measurement) => {
                if (!destroyed && pending && measurement)
                    measurement.container.scrollTo({
                        top: measurement.bottom,
                        behavior: 'instant',
                    });
                pending = false;
            },
        });
    };
    view.dom.addEventListener('input', reveal);
    view.dom.addEventListener('wheel', cancel, { passive: true });
    view.dom.addEventListener('pointerdown', cancel);
    return {
        update(update) {
            if (
                update.docChanged &&
                update.transactions.some((transaction) =>
                    transaction.isUserEvent('input'),
                )
            )
                reveal();
        },
        destroy() {
            destroyed = true;
            view.dom.removeEventListener('input', reveal);
            view.dom.removeEventListener('wheel', cancel);
            view.dom.removeEventListener('pointerdown', cancel);
        },
    };
});
