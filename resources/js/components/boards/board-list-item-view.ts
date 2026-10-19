import type { NodeViewRenderer } from '@tiptap/core';

export const createBoardListItemView: NodeViewRenderer = ({
    node,
    getPos,
    editor,
}) => {
    let current = node;
    const row = document.createElement('div');
    row.className = 'board-list-item';
    row.dataset.nativeListItem = '';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.contentEditable = 'false';
    checkbox.dataset.boardInteractive = '';
    checkbox.setAttribute('aria-label', 'Complete list item');
    const marker = document.createElement('span');
    marker.className = 'board-list-marker';
    marker.contentEditable = 'false';
    marker.setAttribute('aria-hidden', 'true');
    const content = document.createElement('div');
    content.className = 'board-list-content';
    row.append(checkbox, marker, content);
    const paint = () => {
        row.style.paddingInlineStart = `${current.attrs.indent * 20}px`;
        checkbox.checked = Boolean(current.attrs.checked);
        checkbox.disabled = !editor.isEditable;
    };
    //
    // A native change listener also catches Space-key activation; mouse-only ProseMirror click handlers miss keyboard checkbox changes.
    //
    const toggle = () => {
        const position = getPos();
        if (!editor.isEditable || position === undefined) {
            paint();
            return;
        }
        editor.view.dispatch(
            editor.state.tr
                .setNodeMarkup(position, undefined, {
                    ...current.attrs,
                    checked: checkbox.checked,
                })
                .setMeta('boardAction', true),
        );
    };
    checkbox.addEventListener('change', toggle);
    paint();
    return {
        dom: row,
        contentDOM: content,
        update: (next) => {
            if (next.type !== current.type) return false;
            current = next;
            paint();
            return true;
        },
        stopEvent: (event) => event.target === checkbox,
        ignoreMutation: (mutation) =>
            mutation.type !== 'selection' && !content.contains(mutation.target),
        destroy: () => {
            checkbox.removeEventListener('change', toggle);
        },
    };
};
