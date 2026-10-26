import { widgetIcon } from './markdown/rich/widget-icons';
import { mountCodeCopyButton } from './mount-code-copy-button';
import { mountCodeLanguageSelect } from './mount-code-language-select';
import type { NodeViewRendererProps } from '@tiptap/core';
import type { NodeView } from '@tiptap/pm/view';
import {
    codeLanguageLabel,
    codeLanguages,
    normalizeCodeLanguage,
} from './code-languages';
import { createCodeLanguageIcon } from './code-language-icons';

function fillLanguageOptions(select: HTMLSelectElement, language: string) {
    const languages = codeLanguages.includes(language)
        ? codeLanguages
        : [...codeLanguages, language];
    select.replaceChildren(
        ...languages.map((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = codeLanguageLabel(name);
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
    const eventController = new AbortController();
    const dom = document.createElement('div');
    dom.className = 'orbium-code attachment-player orbium-rich-card my-5';
    dom.setAttribute('data-node-view-wrapper', '');
    dom.dir = node.attrs.dir;

    const toolbar = document.createElement('div');
    toolbar.contentEditable = 'false';
    toolbar.className = 'attachment-heading orbium-rich-card-heading';
    const languageGroup = document.createElement('div');
    languageGroup.className = 'attachment-identity';
    let languageIcon = createCodeLanguageIcon(
        String(node.attrs.language ?? ''),
    );
    languageIcon.dataset.language = normalizeCodeLanguage(
        String(node.attrs.language || 'plaintext'),
    );
    const iconFrame = document.createElement('span');
    iconFrame.className = 'attachment-type-icon';
    iconFrame.append(widgetIcon('code', 20));
    const selectContainer = document.createElement('div');
    selectContainer.className = 'rich-code-language-title';
    const languageBadge = document.createElement('span');
    languageBadge.className = 'rich-code-language-icon';
    languageBadge.append(languageIcon);
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Code language');
    select.className =
        'min-h-7 cursor-pointer appearance-none rounded border-0 bg-transparent py-1 pr-6 pl-2 text-xs text-foreground outline-none hover:bg-accent';
    fillLanguageOptions(
        select,
        normalizeCodeLanguage(String(node.attrs.language || 'plaintext')),
    );
    select.addEventListener(
        'change',
        () => {
            const position = getPos();
            if (typeof position !== 'number') return;
            editor
                .chain()
                .focus()
                .setTextSelection(position + 1)
                .updateAttributes('codeBlock', { language: select.value })
                .run();
        },
        { signal: eventController.signal },
    );
    selectContainer.append(languageBadge, select);
    const languageSelect = mountCodeLanguageSelect(select);
    languageGroup.append(selectContainer);
    const actions = document.createElement('div');
    actions.className = 'attachment-actions';
    toolbar.append(iconFrame, languageGroup, actions);

    const copyButton = mountCodeCopyButton(
        actions,
        () => currentNode.textContent,
    );
    dom.append(toolbar);

    const pre = document.createElement('pre');
    pre.className = '!m-0 !rounded-none !border-0';
    pre.dir = 'ltr';
    const contentDOM = document.createElement('code');
    pre.append(contentDOM);
    pre.style.background = 'transparent';
    const surface = document.createElement('div');
    surface.className = 'orbium-rich-card-code';
    surface.append(pre);
    dom.append(surface);

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
            if (languageIcon.dataset.language !== language) {
                fillLanguageOptions(select, language);
                const nextIcon = createCodeLanguageIcon(language);
                nextIcon.dataset.language = language;
                languageIcon.replaceWith(nextIcon);
                languageIcon = nextIcon;
            }
            languageSelect.update();
            return true;
        },
        stopEvent(event) {
            return toolbar.contains(event.target as globalThis.Node);
        },
        ignoreMutation(mutation) {
            return toolbar.contains(mutation.target);
        },
        destroy() {
            copyButton.destroy();
            eventController.abort();
            languageSelect.destroy();
        },
    };
}
