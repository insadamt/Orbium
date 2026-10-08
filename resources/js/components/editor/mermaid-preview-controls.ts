import { widgetIcon } from './markdown/rich/widget-icons';
import type { CachedPreview } from './mermaid-preview-renderer';
import { openMermaidFullPreview } from './mermaid-full-preview';

export function createMermaidPreviewControls() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mermaid-expand-button';
    button.append(widgetIcon('maximize', 15));
    button.title = 'Full preview';
    button.setAttribute('aria-label', 'Open diagram in full preview');
    button.disabled = true;
    let preview: CachedPreview | undefined;
    let closePreview: (() => void) | undefined;
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!preview) return;
        closePreview?.();
        closePreview = openMermaidFullPreview(preview, button);
    });
    return {
        button,
        update(next?: CachedPreview) {
            closePreview?.();
            closePreview = undefined;
            preview = next;
            button.disabled = !next;
        },
        destroy() {
            closePreview?.();
            button.remove();
        },
    };
}
