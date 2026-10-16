import { styleRichSourceControls } from './rich-block-heading';
import {
    displayMathPreview,
    findPreparedMathPreview,
    renderMath,
} from './math-preview';
import { mountInlineMathInput } from './inline-math-input';
import { createRichSourceInput } from './rich-source-input';
import { scheduleEditorIdleWork } from '../../schedule-editor-idle-work';
import { serializeOrbiumBlock } from '../dialect/metadata';
import type { RichBlock, RichController, RichWidgetMount } from './rich-model';
import {
    applyRichSource,
    element,
    preservePresentation,
    sourceControls,
} from './widget-controls';

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
        const request = {
            context: mount.context,
            latex: next.content,
            displayMode: !inline,
        };
        const prepared = findPreparedMathPreview(request);
        // Reorders may remount widgets; an unchanged equation must not return to its loading state.
        if (prepared) {
            displayMathPreview(output, prepared);
            return true;
        }
        output.textContent = 'Rendering equation…';
        cancel = scheduleEditorIdleWork(() => {
            if (!mount.view.dom.isConnected || !mount.context.isVisible())
                return;
            renderMath(output, request);
            mount.view.requestMeasure();
        });
        return true;
    }
    if (controls) {
        const input = createRichSourceInput('Math source', block.content);
        equationInput = input;
        controls.useContentEditor(input);
        styleRichSourceControls(mount, controls, {
            title: 'Math',
            description: 'Equation',
            icon: 'math',
        });
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
