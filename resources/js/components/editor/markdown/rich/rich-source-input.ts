import { EditorView } from '@codemirror/view';
import { selectDocumentContents } from '../markdown-selection';
import { element } from './widget-controls';

export function createRichSourceInput(label: string, source: string) {
    const input = element(
        'textarea',
        'orbium-rich-source-input w-full font-mono text-sm',
    );
    input.dir = 'ltr';
    input.spellcheck = false;
    input.setAttribute('aria-label', label);
    input.value = source;
    input.hidden = true;
    const resize = () => {
        input.rows = Math.min(14, Math.max(1, input.value.split('\n').length));
    };
    let selectedValue: string | null = null;
    input.addEventListener('pointerdown', () => {
        selectedValue = null;
    });
    input.addEventListener('blur', () => {
        selectedValue = null;
    });
    input.addEventListener('input', () => {
        selectedValue = null;
        resize();
    });
    input.addEventListener('keydown', (event) => {
        if (
            !(event.ctrlKey || event.metaKey) ||
            event.shiftKey ||
            event.key.toLowerCase() !== 'a'
        ) {
            selectedValue = null;
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const host = input.closest<HTMLElement>('.cm-editor');
        const parentView = host && EditorView.findFromDOM(host);
        if (
            selectedValue === input.value &&
            input.selectionStart === 0 &&
            input.selectionEnd === input.value.length &&
            parentView
        ) {
            selectDocumentContents(parentView);
        } else {
            input.select();
            selectedValue = input.value;
        }
    });
    resize();
    return input;
}
