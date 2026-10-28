import { iconPickerSearchQuery } from './icon-catalog';
import { WidgetType, EditorView } from '@codemirror/view';
import { createInlineIconElement } from './inline-icon-dom';
import type { InlineIconChoice } from './icon-catalog';
import type { MarkdownLinkContext } from '@/components/editor/markdown/preview/markdown-link-preview';

export type IconPickerRequest = { from: number; to: number; query?: string };
export const iconPickerEvent = 'orbium:insert-inline-icon';

export function openMarkdownIconPicker(
    view: EditorView,
    request: IconPickerRequest,
) {
    if (!view.state.facet(EditorView.editable) || view.compositionStarted)
        return;
    view.dom.dispatchEvent(
        new CustomEvent(iconPickerEvent, {
            detail: {
                ...request,
                query: iconPickerSearchQuery(request.query ?? ''),
            },
        }),
    );
}

export class MarkdownIconWidget extends WidgetType {
    constructor(
        private choice: Exclude<InlineIconChoice, { kind: 'emoji' }>,
        private context: MarkdownLinkContext,
    ) {
        super();
    }
    eq(other: MarkdownIconWidget) {
        return (
            this.context.workspaceId === other.context.workspaceId &&
            this.context.nodeId === other.context.nodeId &&
            this.context.ownerKind === other.context.ownerKind &&
            JSON.stringify(this.choice) === JSON.stringify(other.choice)
        );
    }
    toDOM() {
        return createInlineIconElement(this.choice, this.context);
    }
    ignoreEvent() {
        return false;
    }
}
