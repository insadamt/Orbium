import { EditorView, WidgetType } from '@codemirror/view';

export class MarkdownDecodedText extends WidgetType {
    constructor(readonly text: string) {
        super();
    }
    eq(other: MarkdownDecodedText) {
        return this.text === other.text;
    }
    toDOM() {
        const span = document.createElement('span');
        span.textContent = this.text;
        return span;
    }
    ignoreEvent() {
        return false;
    }
}

export class MarkdownListMarker extends WidgetType {
    constructor(readonly marker: string) {
        super();
    }
    eq(other: MarkdownListMarker) {
        return this.marker === other.marker;
    }
    toDOM() {
        const marker = document.createElement('span');
        marker.className = 'cm-md-list-marker';
        marker.textContent = this.marker;
        marker.setAttribute('aria-hidden', 'true');
        return marker;
    }
    ignoreEvent() {
        return false;
    }
}

export class MarkdownTaskCheckbox extends WidgetType {
    constructor(
        readonly from: number,
        readonly checked: boolean,
        readonly disabled: boolean,
    ) {
        super();
    }
    eq(other: MarkdownTaskCheckbox) {
        return (
            this.from === other.from &&
            this.checked === other.checked &&
            this.disabled === other.disabled
        );
    }
    toDOM(view: EditorView) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'cm-md-task-checkbox';
        this.updateDOM(checkbox);
        checkbox.addEventListener('mousedown', (event) =>
            event.preventDefault(),
        );
        checkbox.addEventListener('change', () => {
            const from = Number(checkbox.dataset.markdownTaskFrom);
            const source = view.state.sliceDoc(from, from + 3);
            if (
                !view.state.facet(EditorView.editable) ||
                !/^\[[ xX]\]$/.test(source)
            )
                return;
            view.dispatch({
                changes: {
                    from: from + 1,
                    to: from + 2,
                    insert: checkbox.checked ? 'x' : ' ',
                },
                userEvent: 'input.task',
            });
        });
        return checkbox;
    }
    updateDOM(dom: HTMLElement) {
        if (!(dom instanceof HTMLInputElement)) return false;
        dom.checked = this.checked;
        dom.disabled = this.disabled;
        dom.dataset.markdownTaskFrom = String(this.from);
        dom.setAttribute(
            'aria-label',
            this.checked ? 'Mark task incomplete' : 'Mark task complete',
        );
        return true;
    }
    ignoreEvent() {
        return true;
    }
}

export class MarkdownDivider extends WidgetType {
    eq(other: WidgetType) {
        return other instanceof MarkdownDivider;
    }
    toDOM() {
        const divider = document.createElement('span');
        divider.className = 'cm-md-divider';
        divider.setAttribute('role', 'separator');
        return divider;
    }
    ignoreEvent() {
        return false;
    }
}
