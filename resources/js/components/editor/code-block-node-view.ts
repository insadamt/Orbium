import type { NodeViewRendererProps } from '@tiptap/core';
import type { NodeView } from '@tiptap/pm/view';
import { codeLanguages, normalizeCodeLanguage } from './code-languages';
import { codeLanguageIconPath } from './code-language-icons';

const svgNamespace = 'http://www.w3.org/2000/svg';
const fallbackIconPath = 'm18 16 4-4-4-4M6 8l-4 4 4 4m8.5-12-5 16';

function makeLanguageIcon(language: string): SVGSVGElement {
    const icon = document.createElementNS(svgNamespace, 'svg');
    icon.setAttribute('width', '15');
    icon.setAttribute('height', '15');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'currentColor');
    icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svgNamespace, 'path');
    const languagePath = codeLanguageIconPath(language);
    path.setAttribute('d', languagePath ?? fallbackIconPath);
    if (!languagePath) {
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '2');
        icon.setAttribute('stroke-linecap', 'round');
        icon.setAttribute('stroke-linejoin', 'round');
    }
    icon.append(path);
    return icon;
}

function fillLanguageOptions(select: HTMLSelectElement, language: string) {
    const languages = codeLanguages.includes(language)
        ? codeLanguages
        : [...codeLanguages, language];
    select.replaceChildren(
        ...languages.map((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name.toUpperCase();
            return option;
        }),
    );
    select.value = language;
}

export function createCodeBlockNodeView({
    node,
    editor,
    getPos,
}: NodeViewRendererProps): NodeView {
    let currentNode = node;
    let copyStatusTimeout: number | null = null;
    const dom = document.createElement('div');
    dom.className =
        'my-5 overflow-hidden rounded-xl border border-border bg-muted';
    dom.setAttribute('data-node-view-wrapper', '');
    dom.dir = node.attrs.dir;

    const toolbar = document.createElement('div');
    toolbar.contentEditable = 'false';
    toolbar.className =
        'flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground';
    const languageGroup = document.createElement('div');
    languageGroup.className = 'flex items-center gap-2';
    let languageIcon = makeLanguageIcon(String(node.attrs.language ?? ''));
    languageGroup.append(languageIcon);
    const selectContainer = document.createElement('div');
    selectContainer.className = 'relative flex items-center';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Code language');
    select.className =
        'min-h-7 cursor-pointer appearance-none rounded border-0 bg-transparent py-1 pr-6 pl-2 text-xs text-foreground uppercase outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring';
    fillLanguageOptions(
        select,
        normalizeCodeLanguage(String(node.attrs.language || 'plaintext')),
    );
    select.addEventListener('change', () => {
        const position = getPos();
        if (typeof position !== 'number') return;
        editor
            .chain()
            .focus()
            .setTextSelection(position + 1)
            .updateAttributes('codeBlock', { language: select.value })
            .run();
    });
    selectContainer.append(select);
    const chevron = document.createElementNS(svgNamespace, 'svg');
    chevron.setAttribute('width', '14');
    chevron.setAttribute('height', '14');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '2');
    chevron.setAttribute('stroke-linecap', 'round');
    chevron.setAttribute('stroke-linejoin', 'round');
    chevron.setAttribute('aria-hidden', 'true');
    chevron.classList.add('pointer-events-none', 'absolute', 'right-1');
    const chevronPath = document.createElementNS(svgNamespace, 'path');
    chevronPath.setAttribute('d', 'm6 9 6 6 6-6');
    chevron.append(chevronPath);
    selectContainer.append(chevron);
    languageGroup.append(selectContainer);
    toolbar.append(languageGroup);

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'rounded px-2 py-1 hover:bg-accent';
    copyButton.setAttribute('aria-live', 'polite');
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(currentNode.textContent);
            copyButton.textContent = 'Copied';
        } catch {
            copyButton.textContent = 'Failed';
        }
        if (copyStatusTimeout !== null) window.clearTimeout(copyStatusTimeout);
        copyStatusTimeout = window.setTimeout(() => {
            copyButton.textContent = 'Copy';
            copyStatusTimeout = null;
        }, 1500);
    });
    toolbar.append(copyButton);
    dom.append(toolbar);

    const pre = document.createElement('pre');
    pre.className = '!m-0 !rounded-none !border-0';
    pre.dir = 'ltr';
    const contentDOM = document.createElement('code');
    pre.append(contentDOM);
    dom.append(pre);

    return {
        dom,
        contentDOM,
        update(updatedNode) {
            if (updatedNode.type !== currentNode.type) return false;
            currentNode = updatedNode;
            dom.dir = updatedNode.attrs.dir;
            const language = normalizeCodeLanguage(
                String(updatedNode.attrs.language || 'plaintext'),
            );
            if (select.value !== language) {
                fillLanguageOptions(select, language);
                const nextIcon = makeLanguageIcon(language);
                languageIcon.replaceWith(nextIcon);
                languageIcon = nextIcon;
            }
            return true;
        },
        stopEvent(event) {
            return toolbar.contains(event.target as globalThis.Node);
        },
        ignoreMutation(mutation) {
            return toolbar.contains(mutation.target);
        },
        destroy() {
            if (copyStatusTimeout !== null)
                window.clearTimeout(copyStatusTimeout);
        },
    };
}
