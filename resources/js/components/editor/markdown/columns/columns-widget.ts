// Summary: Presents saved Markdown columns as independently editable block stacks with quiet layout controls; depends on owner history, the shared rich context and focused column editor/resize helpers.
import { EditorView } from '@codemirror/view';
import { isolateHistory } from '@codemirror/commands';
import type { RichBlock, RichWidgetMount } from '../rich/rich-model';
import { element, button } from '../rich/widget-controls';
import {
    readColumns,
    equalColumnWidths,
    type ColumnLayout,
} from './column-source';
import { replaceColumnLayout } from './column-commands';
import { mountContainer } from '../rich/container-widget';
import { mountColumnEditor } from './column-editor';
import { bindColumnDividers } from './column-resize';
import {
    registerMountedColumns,
    registerColumnEditor,
    type MountedColumns,
} from './column-registry';

export function mountColumns(mount: RichWidgetMount) {
    let block = mount.block;
    const initialLayout = block.columns ?? readColumns(block.source);
    if (!initialLayout || block.diagnostic) return mountContainer(mount);
    let layout: ColumnLayout = initialLayout;
    let destroyed = false;
    let scheduled = false;
    const editors: ReturnType<typeof mountColumnEditor>[] = [];
    let unregisterEditors: (() => void)[] = [];
    let resize: ReturnType<typeof bindColumnDividers> | null = null;
    const toolbar = element('div', 'orbium-columns-toolbar');
    toolbar.setAttribute('aria-label', 'Column layout');
    toolbar.setAttribute('role', 'group');
    const grid = element('div', 'orbium-columns-grid');
    grid.dir = 'ltr';
    const notice = element(
        'p',
        'orbium-column-notice text-sm text-destructive',
    );
    notice.hidden = true;
    notice.setAttribute('role', 'status');
    const showNotice = (message: string) => {
        notice.textContent = message;
        notice.hidden = !message;
    };
    const columns: MountedColumns = {
        owner: mount.view,
        root: mount.root,
        current: () => ({ block, layout }),
        editors: () => editors.map((editor) => editor.view),
        refreshSearch: () =>
            editors.forEach((editor) => editor.refreshSearch()),
        composing: () =>
            editors.some(
                (editor) =>
                    editor.view.compositionStarted ||
                    editor.view.dom.querySelector(
                        '[data-mindmap-composing="true"]',
                    ),
            ),
        focus(index, position = 0) {
            queueMicrotask(() => {
                const view = editors[index]?.view;
                if (destroyed || !view) return;
                view.dispatch({
                    selection: {
                        anchor: Math.min(position, view.state.doc.length),
                    },
                });
                view.focus();
            });
        },
    };
    const canEdit = () =>
        mount.view.state.facet(EditorView.editable) &&
        !mount.view.state.readOnly &&
        !columns.composing();
    function commit(next: ColumnLayout) {
        if (!canEdit()) return;
        replaceColumnLayout({ owner: mount.view, block, layout: next });
    }
    const add = button('Add column', () => {
        if (layout.bodies.length === 2)
            commit({
                widths: equalColumnWidths(3),
                bodies: [...layout.bodies, ''],
            });
    });
    const equal = button('Equal widths', () =>
        commit({ ...layout, widths: equalColumnWidths(layout.bodies.length) }),
    );
    const stack = button('Stack blocks', () => {
        if (
            !canEdit() ||
            mount.view.state.sliceDoc(block.from, block.to) !== block.source
        )
            return;
        //
        // Removing a layout preserves every block in column reading order, including intentional blank text.
        //
        mount.view.dispatch({
            changes: {
                from: block.from,
                to: block.to,
                insert: layout.bodies
                    .filter((body) => body.trim())
                    .join('\n\n'),
            },
            selection: { anchor: block.from },
            annotations: isolateHistory.of('full'),
            userEvent: 'input.columns.stack',
        });
        mount.view.focus();
    });
    for (const control of [add, equal, stack]) {
        control.className = 'orbium-columns-action';
        control.title = control.textContent ?? '';
    }
    toolbar.append(add, equal, stack);
    mount.root.append(toolbar, notice, grid);
    const unregister = registerMountedColumns(columns);
    function rebuildEditors() {
        resize?.destroy();
        unregisterEditors.forEach((dispose) => dispose());
        unregisterEditors = [];
        editors.splice(0).forEach((editor) => editor.destroy());
        grid.replaceChildren();
        layout.bodies.forEach((source, index) => {
            if (index) {
                const divider = element('button', 'orbium-column-divider');
                divider.type = 'button';
                divider.setAttribute('role', 'separator');
                divider.setAttribute('aria-orientation', 'vertical');
                divider.setAttribute(
                    'aria-label',
                    `Resize columns ${index} and ${index + 1}`,
                );
                divider.title =
                    'Drag to resize · Arrow keys to adjust · Home to balance';
                grid.append(divider);
            }
            const host = element('div', 'orbium-column');
            host.dir = 'auto';
            host.dataset.columnIndex = String(index);
            grid.append(host);
            const editor = mountColumnEditor({
                host,
                source,
                index,
                context: mount.context,
                owner: mount.view,
                onNotice: showNotice,
                onChange(body, userEvent) {
                    const bodies = [...layout.bodies];
                    bodies[index] = body;
                    if (
                        !replaceColumnLayout({
                            owner: mount.view,
                            block,
                            layout: { ...layout, bodies },
                            userEvent,
                        })
                    ) {
                        showNotice(
                            'The document changed. Finish composing or reopen the layout before editing.',
                        );
                        editors[index]?.update(layout.bodies[index]);
                    }
                },
            });
            editors.push(editor);
            unregisterEditors.push(
                registerColumnEditor(editor.view, columns, index),
            );
        });
        resize = bindColumnDividers({
            root: mount.root,
            grid,
            owner: mount.view,
            widths: () => layout.widths,
            composing: columns.composing,
            commit: (widths) => commit({ ...layout, widths }),
        });
    }
    function update(next: RichBlock) {
        const parsed = next.columns ?? readColumns(next.source);
        if (!parsed || next.diagnostic) return false;
        block = next;
        layout = parsed;
        grid.dataset.columnCount = String(layout.bodies.length);
        for (const control of [add, equal, stack])
            control.disabled = !canEdit();
        add.hidden = layout.bodies.length === 3;
        grid.querySelectorAll<HTMLButtonElement>(
            '.orbium-column-divider',
        ).forEach((divider) => {
            divider.disabled = !canEdit();
        });
        if (editors.length !== layout.bodies.length) {
            if (!scheduled) {
                scheduled = true;
                queueMicrotask(() => {
                    scheduled = false;
                    if (!destroyed) {
                        rebuildEditors();
                        mount.view.requestMeasure();
                    }
                });
            }
        } else {
            editors.forEach((editor, index) =>
                editor.update(layout.bodies[index]),
            );
            resize?.update();
        }
        return true;
    }
    // The first mount has no transaction listeners to re-enter; render its columns immediately.
    rebuildEditors();
    update(block);
    mount.root.addEventListener('orbium-edit-rich', () => columns.focus(0));
    const refreshAfterComposition = () =>
        queueMicrotask(() => {
            if (!destroyed) update(block);
        });
    mount.root.addEventListener(
        'compositionend',
        refreshAfterComposition,
        true,
    );
    return {
        update,
        destroy() {
            destroyed = true;
            mount.root.removeEventListener(
                'compositionend',
                refreshAfterComposition,
                true,
            );
            unregister();
            resize?.destroy();
            unregisterEditors.forEach((dispose) => dispose());
            editors.forEach((editor) => editor.destroy());
        },
    };
}
