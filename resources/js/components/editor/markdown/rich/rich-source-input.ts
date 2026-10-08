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
    input.addEventListener('input', resize);
    resize();
    return input;
}
