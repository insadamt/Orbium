import { EditorView } from '@codemirror/view';
import { codeLanguages, normalizeCodeLanguage } from '../../code-languages';
import { codeLanguageIconPath } from '../../code-language-icons';
import { mountCodeInput } from './code-input';
import { serializeOrbiumBlock } from '../dialect/metadata';
import type { RichBlock, RichController, RichWidgetMount } from './rich-model';
import {
    applyRichSource,
    button,
    element,
    preservePresentation,
} from './widget-controls';

export function fencedCodeSource(content: string, language: string): string {
    let length = 3;
    for (const run of content.matchAll(/`+/g))
        length = Math.max(length, run[0].length + 1);
    const fence = '`'.repeat(length);
    return `${fence}${language}\n${content}\n${fence}`;
}

export function mountCode(mount: RichWidgetMount): RichController {
    let block = mount.block;
    let destroyed = false;
    let copyStatusTimer: ReturnType<typeof setTimeout> | undefined;
    const toolbar = element(
        'div',
        'orbium-code-toolbar flex items-center justify-between border-b border-border bg-background/30 px-4 py-2 text-xs text-muted-foreground',
    );
    toolbar.dataset.blockGutterAnchor = '';
    const error = element('p', 'px-3 py-2 text-sm text-destructive');
    error.hidden = true;
    error.setAttribute('role', 'alert');
    const codeHost = element('div');
    mount.root.append(toolbar, error, codeHost);
    const language = element(
        'select',
        'min-h-7 cursor-pointer rounded border-0 bg-transparent px-2 py-1 text-xs text-foreground uppercase outline-none hover:bg-accent',
    );
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
    toolbar.prepend(identity);
    const copy = button('Copy', () => {
        function showCopyStatus(label: string) {
            if (destroyed) return;
            copy.textContent = label;
            clearTimeout(copyStatusTimer);
            copyStatusTimer = setTimeout(() => {
                copy.textContent = 'Copy';
            }, 1500);
        }
        void navigator.clipboard.writeText(block.content).then(
            () => showCopyStatus('Copied'),
            () => showCopyStatus('Failed'),
        );
    });
    toolbar.append(copy);
    copy.className = 'rounded-md px-2.5 py-1.5 text-xs hover:bg-accent';
    copy.setAttribute('aria-live', 'polite');
    const input = mountCodeInput({
        host: codeHost,
        source: block.content,
        language:
            normalizeCodeLanguage(block.language ?? 'plaintext') || 'plaintext',
        isVisible: mount.context.isVisible,
        onChange: (content) => write(content, block.language ?? 'text'),
    });
    mount.root.addEventListener('orbium-edit-rich', () => input.focus());
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
        else {
            error.textContent =
                'The code changed elsewhere. Reopen this block before editing.';
            error.hidden = false;
        }
    }
    language.addEventListener('change', () =>
        write(block.content, language.value),
    );
    function update(next: RichBlock) {
        block = next;
        error.textContent = next.diagnostic ?? '';
        error.hidden = !next.diagnostic;
        const name =
            normalizeCodeLanguage(next.language ?? 'plaintext') || 'plaintext';
        if (
            !codeLanguages.includes(name) &&
            ![...language.options].some((option) => option.value === name)
        ) {
            const option = element('option', '', next.language ?? 'Unknown');
            option.value = name;
            language.append(option);
        }
        language.value = name;
        language.disabled = !mount.view.state.facet(EditorView.editable);
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
        input.update(next.content, name, language.disabled);
        return true;
    }
    update(block);
    return {
        update,
        destroy() {
            destroyed = true;
            clearTimeout(copyStatusTimer);
            input.destroy();
        },
    };
}
