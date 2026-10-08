import { EditorView } from '@codemirror/view';
import { serializeOrbiumBlock } from '../dialect/metadata';
import type { RichBlock, RichWidgetMount } from './rich-model';
import { renderRichBody } from './render-rich-body';
import { mountRichTextInput } from './rich-text-input';
import {
    applyRichSource,
    element,
    preservePresentation,
} from './widget-controls';

export function mountCallout(mount: RichWidgetMount) {
    let block = mount.block;
    const header = mount.view.state.doc.lineAt(block.contentFrom).text;
    const preview = element('div', 'cursor-text');
    preview.tabIndex = 0;
    preview.dataset.richWriting = '';
    preview.setAttribute('aria-label', 'Edit callout');
    const input = element('div');
    input.hidden = true;
    const error = element('p', 'text-sm text-destructive');
    error.hidden = true;
    error.setAttribute('role', 'alert');
    const title = element(
        'summary',
        'mb-2 cursor-pointer font-medium',
        block.label,
    );
    if (block.metadata.folding) {
        const details = element('details');
        details.open = block.metadata.folding !== '-';
        details.append(title, error, preview, input);
        mount.root.append(details);
    } else {
        if (block.label !== 'NOTE') mount.root.append(title);
        mount.root.append(error, preview, input);
    }
    let editor: ReturnType<typeof mountRichTextInput> | null = null;
    let disposePreview: (() => void) | undefined;
    let previous = '';
    function open() {
        if (!mount.view.state.facet(EditorView.editable) || editor) return;
        preview.hidden = true;
        input.hidden = false;
        editor = mountRichTextInput({
            host: input,
            source: block.content,
            context: mount.context,
            label: 'Callout text',
            onNotice: (message) => {
                error.textContent = message;
                error.hidden = !message;
            },
            onChange: (body) => {
                const source = preservePresentation(
                    block,
                    `${header}\n${body
                        .split('\n')
                        .map((line) => `> ${line}`)
                        .join('\n')}`,
                    serializeOrbiumBlock,
                );
                applyRichSource(mount.view, block, source);
            },
        });
        editor.focus();
    }
    function close() {
        editor?.destroy();
        editor = null;
        input.replaceChildren();
        input.hidden = true;
        preview.hidden = false;
        mount.view.requestMeasure();
    }
    const dismiss = (event: PointerEvent) => {
        if (!mount.root.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', dismiss);
    preview.addEventListener('click', open);
    preview.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            open();
        }
    });
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) {
            event.preventDefault();
            close();
            preview.focus();
        }
    });
    mount.root.addEventListener('orbium-edit-rich', open);
    function update(next: RichBlock) {
        block = next;
        title.textContent = block.label ?? '';
        editor?.update(
            block.content,
            !mount.view.state.facet(EditorView.editable),
        );
        if (previous !== block.content) {
            previous = block.content;
            disposePreview?.();
            disposePreview = renderRichBody(
                preview,
                block.content,
                mount.context,
                () => mount.view.requestMeasure(),
            );
        }
        return true;
    }
    update(block);
    return {
        update,
        destroy() {
            editor?.destroy();
            disposePreview?.();
            document.removeEventListener('pointerdown', dismiss);
        },
    };
}
