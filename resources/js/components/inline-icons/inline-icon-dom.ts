import { inlineIconColorStyle } from './inline-icon-color';
import {
    contentOwnerUrl,
    type ContentOwnerKind,
} from '@/components/editor/editor-api';
import { createBuiltinIcon, type InlineIconChoice } from './icon-catalog';

export function createInlineIconElement(
    choice: Exclude<InlineIconChoice, { kind: 'emoji' }>,
    context: {
        workspaceId: number;
        nodeId: number;
        ownerKind?: ContentOwnerKind;
    },
): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'orbium-inline-icon';
    span.draggable = false;
    span.contentEditable = 'false';
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', choice.label);
    span.title = choice.label;
    const text = document.createElement('span');
    text.className = 'orbium-inline-icon-text';
    text.textContent = '\ufffc';
    text.setAttribute('aria-hidden', 'true');
    span.append(text);
    if (choice.kind === 'builtin') {
        span.style.color = inlineIconColorStyle(choice.color) ?? '';
        const svg = createBuiltinIcon(choice.name);
        if (svg) span.append(svg);
    } else {
        const image = document.createElement('img');
        image.src = `${contentOwnerUrl(context.workspaceId, context.nodeId, context.ownerKind)}/attachments/${choice.attachmentId}`;
        image.alt = '';
        image.draggable = false;
        image.loading = 'lazy';
        image.addEventListener(
            'error',
            () => {
                const fallback = document.createElement('span');
                fallback.className = 'orbium-inline-icon-fallback';
                fallback.textContent = '?';
                image.replaceWith(fallback);
                span.title = `${choice.label} (image unavailable)`;
            },
            { once: true },
        );
        span.append(image);
    }
    return span;
}
