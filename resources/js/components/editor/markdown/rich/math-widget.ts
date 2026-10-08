import katex from 'katex';
import 'katex/dist/katex.min.css';
import { mountInlineMathInput } from './inline-math-input';
import { scheduleEditorIdleWork } from '../../schedule-editor-idle-work';
import { serializeOrbiumBlock } from '../dialect/metadata';
import type { RichBlock, RichController, RichWidgetMount } from './rich-model';
import {
    applyRichSource,
    element,
    preservePresentation,
    sourceControls,
} from './widget-controls';

export function renderMath(
    output: HTMLElement,
    latex: string,
    displayMode: boolean,
) {
    try {
        output.innerHTML = katex.renderToString(latex, {
            displayMode,
            throwOnError: true,
            trust: false,
            maxExpand: 1000,
            maxSize: 20,
        });
        output.removeAttribute('role');
    } catch {
        output.textContent =
            'Equation could not be rendered. Edit the source to fix it.';
        output.setAttribute('role', 'alert');
    }
}

export function mountMath(mount: RichWidgetMount): RichController {
    let block = mount.block;
    const inline = block.kind === 'inline-math';
    const controls = inline ? null : sourceControls(mount, 'Math');
    const output = controls?.output ?? element('span');
    const inlineInput = inline ? mountInlineMathInput(mount, output) : null;
    if (!inline) output.className = 'overflow-auto py-2';
    let equationInput: HTMLTextAreaElement | null = null;
    let previous: string | null = null;
    let cancel: (() => void) | undefined;
    function update(next: RichBlock) {
        block = next;
        controls?.update(next);
        inlineInput?.update(next);
        if (equationInput && equationInput.value !== next.content)
            equationInput.value = next.content;
        if (previous === next.content) return true;
        previous = next.content;
        cancel?.();
        output.textContent = 'Rendering equation…';
        cancel = scheduleEditorIdleWork(() => {
            if (!mount.view.dom.isConnected || !mount.context.isVisible())
                return;
            renderMath(output, next.content, !inline);
            mount.view.requestMeasure();
        });
        return true;
    }
    if (controls) {
        const input = element(
            'textarea',
            'mb-3 w-full rounded-md bg-muted p-3 font-mono text-sm',
        );
        input.rows = 4;
        input.dir = 'ltr';
        input.setAttribute('aria-label', 'Math source');
        input.value = block.content;
        input.hidden = true;
        equationInput = input;
        controls.useContentEditor(input);
        input.addEventListener('keydown', (event) => {
            if (!(event.ctrlKey || event.metaKey)) event.stopPropagation();
        });
        input.addEventListener('input', () => {
            const atom =
                block.metadata.kind === 'math' ||
                /^\s*\$\$\s*$/m.test(input.value)
                    ? serializeOrbiumBlock({ kind: 'math', latex: input.value })
                    : `$$\n${input.value}\n$$`;
            const source = preservePresentation(
                block,
                atom,
                serializeOrbiumBlock,
            );
            if (applyRichSource(mount.view, block, source))
                block = {
                    ...block,
                    content: input.value,
                    source,
                    to: block.from + source.length,
                };
        });
    }
    update(block);
    return {
        update,
        destroy() {
            controls?.destroy();
            cancel?.();
            inlineInput?.destroy();
        },
    };
}
