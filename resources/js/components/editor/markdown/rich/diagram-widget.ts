import { serializeOrbiumBlock } from '../dialect/metadata';
import { fencedCodeSource } from './code-widget';
import { createRichSourceInput } from './rich-source-input';
import { instantiateMermaidSvg } from '../../mermaid-preview-renderer';
import {
    applyMermaidPreviewDimensions,
    clearMermaidPreviewDimensions,
} from '../../mermaid-preview-layout';
import type { RichBlock, RichController, RichWidgetMount } from './rich-model';
import {
    applyRichSource,
    preservePresentation,
    element,
    sourceControls,
} from './widget-controls';

export function mountDiagram(mount: RichWidgetMount): RichController {
    let current = mount.block;
    const controls = sourceControls(mount, 'Mermaid');
    const input = createRichSourceInput('Mermaid source', current.content);
    controls.useContentEditor(input);
    input.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey)) event.stopPropagation();
    });
    input.addEventListener('input', () => {
        const source = preservePresentation(
            current,
            fencedCodeSource(input.value, 'mermaid'),
            serializeOrbiumBlock,
        );
        if (applyRichSource(mount.view, current, source))
            current = {
                ...current,
                content: input.value,
                source,
                to: current.from + source.length,
            };
    });
    controls.output.className =
        'overflow-auto [&>svg]:block [&>svg]:h-auto [&>svg]:w-full';
    controls.output.dataset.mermaidPreview = '';
    controls.output.style.minHeight = '100px';
    let unsubscribe: (() => void) | undefined;
    let source: string | null = null;
    let destroyed = false;
    const status = element(
        'p',
        'text-sm text-muted-foreground',
        'Rendering diagram…',
    );
    function update(block: RichBlock) {
        current = block;
        controls.update(block);
        if (input.value !== block.content) input.value = block.content;
        if (block.content === source) return true;
        source = block.content;
        unsubscribe?.();
        controls.output.replaceChildren(status);
        controls.output.removeAttribute('role');
        unsubscribe = mount.context.mermaid.register(
            block.content,
            mount.root,
            ({ preview, dimensions, error }) => {
                if (destroyed) return;
                if (error) {
                    clearMermaidPreviewDimensions(controls.output);
                    controls.output.textContent = `Diagram could not be rendered. Edit the source to fix it. ${error}`;
                    controls.output.setAttribute('role', 'alert');
                } else if (dimensions)
                    applyMermaidPreviewDimensions(controls.output, dimensions);
                else if (preview) {
                    controls.output.removeAttribute('role');
                    controls.output.innerHTML = instantiateMermaidSvg(preview);
                }
                mount.view.requestMeasure();
            },
        );
        return true;
    }
    update(mount.block);
    return {
        update,
        destroy() {
            controls.destroy();
            destroyed = true;
            unsubscribe?.();
        },
    };
}
