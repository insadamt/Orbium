import { EditorView } from '@codemirror/view';
import type { RichBlock, RichWidgetMount } from './rich-model';
import { applyRichSource, button, element } from './widget-controls';

export function mountInlineMathInput(
    mount: RichWidgetMount,
    output: HTMLElement,
) {
    let block = mount.block;
    const edit = button('', () => {
        if (!mount.view.state.facet(EditorView.editable)) return;
        panel.hidden = false;
        edit.setAttribute('aria-expanded', 'true');
        input.focus();
    });
    edit.className = 'rounded-sm px-0.5 hover:bg-accent';
    edit.setAttribute('aria-label', `Edit inline math: ${block.content}`);
    edit.setAttribute('aria-expanded', 'false');
    edit.append(output);
    const panel = element(
        'span',
        'absolute top-full left-0 z-50 mt-2 w-72 max-w-[80vw] rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-xl',
    );
    panel.hidden = true;
    const label = element(
        'label',
        'block text-xs font-medium',
        'Inline math source',
    );
    const input = element(
        'input',
        'mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-sm outline-none',
    );
    input.value = block.content;
    input.dir = 'ltr';
    label.append(input);
    panel.append(label);
    mount.root.append(edit, panel);
    function close() {
        panel.hidden = true;
        edit.setAttribute('aria-expanded', 'false');
    }
    const dismiss = (event: PointerEvent) => {
        if (!mount.root.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', dismiss);
    input.addEventListener('input', () => {
        const latex = input.value;
        const source =
            latex && !/[\r\n$]/.test(latex) && latex.trim() === latex
                ? `$${latex}$`
                : `:orbium-math${JSON.stringify({ latex })}`;
        applyRichSource(mount.view, block, source);
    });
    input.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey)) event.stopPropagation();
        if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            close();
            edit.focus();
        }
    });
    return {
        update(next: RichBlock) {
            block = next;
            edit.setAttribute(
                'aria-label',
                `Edit inline math: ${next.content}`,
            );
            if (input.value !== next.content) input.value = next.content;
            edit.disabled = input.readOnly = !mount.view.state.facet(
                EditorView.editable,
            );
            if (edit.disabled) close();
        },
        destroy() {
            document.removeEventListener('pointerdown', dismiss);
        },
    };
}
