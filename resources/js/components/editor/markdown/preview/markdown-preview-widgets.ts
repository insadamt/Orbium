import { mountPlayfulTaskCheckbox } from '../../playful-task-checkbox';
import type { OrbiumMetadata } from '../dialect/metadata';
import { applyMarkdownDividerAppearance } from './markdown-divider-appearance';
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

const taskCheckboxMounts = new WeakMap<
    HTMLElement,
    ReturnType<typeof mountPlayfulTaskCheckbox>
>();

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
        const mount = mountPlayfulTaskCheckbox(checkbox);
        taskCheckboxMounts.set(mount.host, mount);
        return mount.host;
    }
    updateDOM(host: HTMLElement) {
        const dom =
            host instanceof HTMLInputElement
                ? host
                : host.querySelector('input');
        if (!dom) return false;
        dom.checked = this.checked;
        dom.disabled = this.disabled;
        dom.dataset.markdownTaskFrom = String(this.from);
        dom.setAttribute(
            'aria-label',
            this.checked ? 'Mark task incomplete' : 'Mark task complete',
        );
        taskCheckboxMounts.get(host)?.update();
        return true;
    }
    destroy(dom: HTMLElement) {
        taskCheckboxMounts.get(dom)?.destroy();
        taskCheckboxMounts.delete(dom);
    }
    ignoreEvent() {
        return true;
    }
}

export class MarkdownDivider extends WidgetType {
    constructor(readonly metadata: OrbiumMetadata = {}) {
        super();
    }
    eq(other: MarkdownDivider) {
        return (
            this.metadata.dividerColor === other.metadata.dividerColor &&
            this.metadata.dividerThickness ===
                other.metadata.dividerThickness &&
            this.metadata.dividerStyle === other.metadata.dividerStyle
        );
    }
    toDOM() {
        const divider = document.createElement('span');
        divider.className = 'cm-md-divider';
        divider.setAttribute('role', 'separator');
        applyMarkdownDividerAppearance(divider, this.metadata);
        return divider;
    }
    ignoreEvent() {
        return false;
    }
}
