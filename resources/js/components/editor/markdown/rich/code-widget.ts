import { common, createLowlight } from 'lowlight';
import { EditorView } from '@codemirror/view';
import { codeLanguages, normalizeCodeLanguage } from '../../code-languages';
import { codeLanguageIconPath } from '../../code-language-icons';
import { scheduleEditorIdleWork } from '../../schedule-editor-idle-work';
import { serializeOrbiumBlock } from '../dialect/metadata';
import type { RichBlock, RichController, RichWidgetMount } from './rich-model';
import {
    applyRichSource,
    button,
    element,
    preservePresentation,
    sourceControls,
} from './widget-controls';

const lowlight = createLowlight(common);
type HighlightNode = {
    type: string;
    value?: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: HighlightNode[];
};
function appendHighlight(parent: HTMLElement, node: HighlightNode) {
    if (node.type === 'text') {
        parent.append(document.createTextNode(node.value ?? ''));
        return;
    }
    const child = element('span');
    const classes = node.properties?.className;
    if (Array.isArray(classes)) child.className = classes.map(String).join(' ');
    for (const content of node.children ?? []) appendHighlight(child, content);
    parent.append(child);
}

export function fencedCodeSource(content: string, language: string): string {
    let length = 3;
    for (const run of content.matchAll(/`+/g))
        length = Math.max(length, run[0].length + 1);
    const fence = '`'.repeat(length);
    return `${fence}${language}\n${content}\n${fence}`;
}

export function mountCode(mount: RichWidgetMount): RichController {
    let block = mount.block;
    const controls = sourceControls(mount, 'Code');
    const language = element('select', 'rounded-md bg-muted px-2 py-1 text-xs');
    language.setAttribute('aria-label', 'Code language');
    for (const name of codeLanguages) {
        const option = element('option', '', name);
        option.value = name;
        language.append(option);
    }
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('fill', 'currentColor');
    icon.setAttribute('aria-hidden', 'true');
    const identity = element('span', 'inline-flex items-center gap-2');
    identity.append(icon, language);
    controls.toolbar.prepend(identity);
    const copy = button('Copy', () => {
        void navigator.clipboard.writeText(block.content).then(
            () => {
                copy.textContent = 'Copied';
            },
            () => {
                copy.textContent = 'Copy failed';
            },
        );
    });
    controls.toolbar.append(copy);
    const pre = element('pre', 'orbium-code-preview');
    pre.dir = 'ltr';
    const code = element('code');
    const numbers = element('span', 'orbium-code-line-numbers');
    numbers.setAttribute('aria-hidden', 'true');
    numbers.hidden = true;
    pre.append(numbers, code);
    const input = element(
        'textarea',
        'orbium-code-input w-full rounded-md bg-muted p-3 font-mono text-sm',
    );
    input.setAttribute('aria-label', 'Code source');
    input.dir = 'ltr';
    input.spellcheck = false;
    controls.output.append(pre);
    controls.useContentEditor(input);
    const lines = element(
        'label',
        'mb-2 inline-flex items-center gap-2 text-xs text-muted-foreground',
    );
    const lineToggle = element('input');
    lineToggle.type = 'checkbox';
    lines.append(lineToggle, document.createTextNode('Line numbers'));
    controls.output.prepend(lines);
    lineToggle.addEventListener('change', () => {
        numbers.hidden = !lineToggle.checked;
        mount.view.requestMeasure();
    });
    function write(content: string, name: string) {
        if (!mount.view.state.facet(EditorView.editable)) return;
        let source = fencedCodeSource(
            content,
            name === block.language ? (block.languageInfo ?? name) : name,
        );
        if (block.metadata.kind === 'code')
            source = serializeOrbiumBlock({ kind: 'code' }, source);
        source = preservePresentation(block, source, serializeOrbiumBlock);
        if (applyRichSource(mount.view, block, source))
            block = {
                ...block,
                content,
                language: name,
                source,
                to: block.from + source.length,
            };
    }
    input.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey)) event.stopPropagation();
        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            const start = input.selectionStart;
            input.setRangeText('    ', start, input.selectionEnd, 'end');
            write(input.value, block.language ?? 'text');
        }
    });
    input.addEventListener('input', () =>
        write(input.value, block.language ?? 'text'),
    );
    language.addEventListener('change', () =>
        write(block.content, language.value),
    );
    let cancel: (() => void) | undefined;
    let previous = '';
    function update(next: RichBlock) {
        block = next;
        controls.update(next);
        const name =
            normalizeCodeLanguage(next.language ?? 'plaintext') || 'plaintext';
        if (
            !codeLanguages.includes(name) &&
            !language.querySelector(`option[value="unknown"]`)
        ) {
            const option = element('option', '', next.language ?? 'Unknown');
            option.value = 'unknown';
            language.append(option);
        }
        language.value = codeLanguages.includes(name) ? name : 'unknown';
        language.disabled = input.readOnly = !mount.view.state.facet(
            EditorView.editable,
        );
        icon.replaceChildren();
        const path = codeLanguageIconPath(name);
        if (path) {
            const shape = document.createElementNS(icon.namespaceURI, 'path');
            shape.setAttribute('d', path);
            icon.append(shape);
        } else {
            const text = document.createElementNS(icon.namespaceURI, 'text');
            text.setAttribute('x', '0');
            text.setAttribute('y', '18');
            text.textContent = '</>';
            icon.append(text);
        }
        if (input.value !== next.content) {
            const caret = input.selectionStart;
            input.value = next.content;
            input.setSelectionRange(
                Math.min(caret, input.value.length),
                Math.min(caret, input.value.length),
            );
        }
        numbers.textContent = next.content
            .split('\n')
            .map((_, index) => index + 1)
            .join('\n');
        input.rows = Math.min(20, Math.max(3, next.content.split('\n').length));
        const key = `${name}\0${next.content}`;
        if (key === previous) return true;
        previous = key;
        cancel?.();
        code.textContent = next.content;
        cancel = scheduleEditorIdleWork(() => {
            if (!mount.view.dom.isConnected || !mount.context.isVisible())
                return;
            try {
                const highlighted = lowlight.registered(name)
                    ? lowlight.highlight(name, next.content)
                    : null;
                code.replaceChildren();
                const textLines = element('span');
                if (highlighted)
                    for (const child of highlighted.children)
                        appendHighlight(textLines, child as HighlightNode);
                else textLines.textContent = next.content;
                code.append(textLines);
                mount.view.requestMeasure();
            } catch {
                code.textContent = next.content;
            }
        });
        return true;
    }
    update(block);
    return { update, destroy: () => cancel?.() };
}
