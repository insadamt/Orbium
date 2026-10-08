import type { RichBlock, RichController, RichWidgetMount } from './rich-model';
import { renderRichBody } from './render-rich-body';
import { element, sourceControls } from './widget-controls';

export function mountContainer(mount: RichWidgetMount): RichController {
    const controls = sourceControls(
        mount,
        mount.block.kind === 'callout' ? 'Callout' : 'Block',
    );
    const body = element('div');
    if (mount.block.kind === 'callout') {
        const details = element('details');
        details.open = mount.block.metadata.folding !== '-';
        const summary = element(
            'summary',
            'mb-2 cursor-pointer font-medium',
            mount.block.label,
        );
        details.append(summary, body);
        controls.output.append(details);
        if (!mount.block.metadata.folding) {
            controls.output.replaceChildren(
                element('div', 'mb-2 font-medium', mount.block.label),
                body,
            );
        }
    } else controls.output.append(body);
    let previous = '';
    let dispose: (() => void) | undefined;
    function update(block: RichBlock) {
        controls.update(block);
        const key = block.source;
        if (previous === key) return true;
        previous = key;
        dispose?.();
        if (block.kind === 'empty') {
            body.replaceChildren(
                element(
                    'p',
                    'min-h-7 text-muted-foreground',
                    'Empty paragraph',
                ),
            );
            return true;
        }
        if (block.kind === 'callout') {
            const title =
                controls.output.querySelector('summary') ??
                controls.output.firstElementChild;
            if (title && title !== body)
                title.textContent = block.label ?? 'Callout';
        }
        dispose = renderRichBody(body, block.content, mount.context, () =>
            mount.view.requestMeasure(),
        );
        if (block.presentation.listType)
            body.querySelector('ol')?.setAttribute(
                'type',
                String(block.presentation.listType),
            );
        return true;
    }
    update(mount.block);
    return {
        update,
        destroy() {
            controls.destroy();
            dispose?.();
        },
    };
}
