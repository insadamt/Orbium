import { WidgetType, EditorView } from '@codemirror/view';
import { Facet } from '@codemirror/state';
import { createInlineIconElement } from './inline-icon-dom';
import type { InlineIconChoice } from './icon-catalog';
import type { MarkdownLinkContext } from '@/components/editor/markdown/preview/markdown-link-preview';

export type IconPickerRequest = { from: number; to: number; query?: string };
export const iconPickerEvent = 'orbium:insert-inline-icon';
export const inlineIconEditing = Facet.define<boolean, boolean>({
    combine: (values) => values.some(Boolean),
});

export function openMarkdownIconPicker(
    view: EditorView,
    request: IconPickerRequest,
) {
    if (!view.state.facet(EditorView.editable) || view.compositionStarted)
        return;
    view.dom.dispatchEvent(
        new CustomEvent(iconPickerEvent, { detail: request }),
    );
}

export class MarkdownIconWidget extends WidgetType {
    constructor(
        private choice: Exclude<InlineIconChoice, { kind: 'emoji' }>,
        private from: number,
        private to: number,
        private context: MarkdownLinkContext,
        private editable: boolean,
    ) {
        super();
    }
    eq(other: MarkdownIconWidget) {
        return (
            this.from === other.from &&
            this.to === other.to &&
            this.editable === other.editable &&
            JSON.stringify(this.choice) === JSON.stringify(other.choice)
        );
    }
    toDOM(view: EditorView) {
        const span = createInlineIconElement(this.choice, this.context);
        if (this.editable && view.state.facet(EditorView.editable)) {
            span.setAttribute('role', 'button');
            span.setAttribute(
                'aria-label',
                `Replace ${this.choice.label} icon`,
            );
            span.tabIndex = 0;
            span.title = `${this.choice.label} · Click to replace`;
            span.addEventListener('mousedown', (event) =>
                event.preventDefault(),
            );
            span.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                openMarkdownIconPicker(view, { from: this.from, to: this.to });
            });
            span.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    openMarkdownIconPicker(view, {
                        from: this.from,
                        to: this.to,
                    });
                }
                if (event.key === 'Backspace' || event.key === 'Delete') {
                    if (!view.state.facet(EditorView.editable)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    view.dispatch({
                        changes: { from: this.from, to: this.to, insert: '' },
                        selection: { anchor: this.from },
                        userEvent: 'delete.selection',
                    });
                    view.focus();
                }
            });
        }
        return span;
    }
    ignoreEvent() {
        return true;
    }
}
