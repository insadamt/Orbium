import { widgetIcon } from './widget-icons';
import { isolateHistory, undo, redo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { toggleRichSource } from './rich-effects';
import type { RichBlock, RichWidgetMount } from './rich-model';

export function element<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = '',
    text?: string,
): HTMLElementTagNameMap[K] {
    const result = document.createElement(tag);
    result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
}

export function button(label: string, action: () => void) {
    const result = element(
        'button',
        'rounded p-1.5 text-xs hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
        label,
    );
    result.type = 'button';
    result.addEventListener('click', action);
    return result;
}

export function applyRichSource(
    view: EditorView,
    block: RichBlock,
    source: string,
    selectionOffset?: number,
): boolean {
    if (
        !view.state.facet(EditorView.editable) ||
        !view.dom.isConnected ||
        view.state.sliceDoc(block.from, block.to) !== block.source
    )
        return false;
    view.dispatch({
        changes: { from: block.from, to: block.to, insert: source },
        selection:
            selectionOffset === undefined
                ? undefined
                : { anchor: block.from + selectionOffset },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.rich',
    });
    return true;
}

export function preservePresentation(
    block: RichBlock,
    source: string,
    wrap: (metadata: Record<string, unknown>, body: string) => string,
): string {
    const wrappers =
        block.wrappers ??
        (block.presentation.kind === 'block' ? [block.presentation] : []);
    return [...wrappers]
        .reverse()
        .reduce((body, metadata) => wrap(metadata, body), source);
}

export function sourceControls(
    mount: RichWidgetMount,
    label: string,
    activateOnInsertion = true,
) {
    let block = mount.block;
    let editing = false;
    let destroyed = false;
    const toolbar = element(
        'div',
        'mb-2 flex items-center justify-between text-xs text-muted-foreground',
    );
    toolbar.dataset.blockGutterAnchor = '';
    toolbar.append(element('span', '', label));
    const group = element(
        'div',
        'inline-flex rounded-lg border border-border bg-muted/60 p-0.5',
    );
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', `${label} mode`);
    let customEditor = false;
    let input = element(
        'textarea',
        'w-full rounded-md bg-muted p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
    );
    input.setAttribute('aria-label', `${label} Markdown source`);
    input.dir = 'ltr';
    input.rows = 6;
    input.hidden = true;
    const output = element('div');
    const error = element('p', 'mb-2 text-sm text-destructive');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    const edit = button('Edit source', () => setEditing(true));
    const preview = button('Preview', () => setEditing(false));
    const editLabel = element('span', '', 'Edit source');
    edit.replaceChildren(widgetIcon('edit', 13), editLabel);
    preview.prepend(widgetIcon('preview'));
    for (const control of [edit, preview])
        control.className =
            'orbium-rich-mode inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-ring hover:bg-accent hover:text-foreground';
    group.append(edit, preview);
    toolbar.append(group);
    mount.root.append(toolbar, error, input, output);
    input.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey)) event.stopPropagation();
    });
    input.addEventListener('input', () => {
        if (applyRichSource(mount.view, block, input.value))
            block = {
                ...block,
                source: input.value,
                to: block.from + input.value.length,
            };
        else {
            error.textContent =
                'The source changed elsewhere. Reopen this block before editing.';
            error.hidden = false;
        }
    });
    function setEditing(next: boolean) {
        if (destroyed || !mount.view.dom.isConnected) return;
        if (next && !mount.view.state.facet(EditorView.editable)) return;
        editing = next;
        mount.view.dispatch({
            effects: toggleRichSource.of({ from: block.from, open: next }),
        });
        input.hidden = !next;
        output.hidden = next;
        edit.setAttribute('aria-pressed', String(next));
        preview.setAttribute('aria-pressed', String(!next));
        editLabel.textContent = customEditor
            ? 'Edit'
            : next
              ? 'Editing source'
              : 'Edit source';
        if (next) {
            if (!customEditor) input.value = block.source;
            input.focus();
        } else
            (
                mount.root.closest<HTMLElement>('[data-rich-from]') ??
                mount.root
            ).focus({ preventScroll: true });
        mount.view.requestMeasure();
    }
    edit.setAttribute('aria-pressed', 'false');
    preview.setAttribute('aria-pressed', 'true');
    if (activateOnInsertion)
        mount.root.addEventListener('orbium-edit-rich', () => setEditing(true));
    return {
        toolbar,
        input,
        output,
        error,
        update(next: RichBlock) {
            block = next;
            input.readOnly = !mount.view.state.facet(EditorView.editable);
            edit.disabled = input.readOnly;
            if (!customEditor && input.value !== next.source)
                input.value = next.source;
            error.textContent = next.diagnostic ?? '';
            error.hidden = !next.diagnostic;
        },
        useContentEditor(editor: HTMLTextAreaElement) {
            input.remove();
            input = editor;
            input.hidden = true;
            customEditor = true;
            editLabel.textContent = 'Edit';
            mount.root.insertBefore(input, output);
        },
        isEditing: () => editing,
        setEditing,
        current: () => block,
        destroy() {
            destroyed = true;
        },
    };
}

export function bindRichBlockHistory(root: HTMLElement, view: EditorView) {
    root.addEventListener(
        'keydown',
        (event) => {
            if (
                !(event.ctrlKey || event.metaKey) ||
                event.altKey ||
                !['z', 'y'].includes(event.key.toLowerCase())
            )
                return;
            event.preventDefault();
            event.stopPropagation();
            if (event.key.toLowerCase() === 'y' || event.shiftKey) redo(view);
            else undo(view);
        },
        true,
    );
}
