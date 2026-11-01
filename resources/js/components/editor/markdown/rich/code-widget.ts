// Summary: Edits code through the canonical rich-body owner while retaining rejected drafts for recovery; depends on the dedicated input, safe fences and shared rich controls.
import { createRichBlockHeading } from './rich-block-heading';
import { v3CodeDraftHandle } from '../runtime/v3-rich-draft';
import { mountCodeCopyButton } from '../../mount-code-copy-button';
import { mountCodeLanguageSelect } from '../../mount-code-language-select';
import { EditorView } from '@codemirror/view';
import {
    codeLanguageLabel,
    codeLanguages,
    normalizeCodeLanguage,
} from '../../code-languages';
import { createCodeLanguageIcon } from '../../code-language-icons';
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
    const draft = v3CodeDraftHandle(mount.view, block.from);
    let rejectedContent: string | null = draft.read()?.content ?? null;
    const toolbar = element('div');
    const heading = createRichBlockHeading(mount, toolbar, {
        title: 'Code',
        icon: 'code',
    });
    toolbar.dataset.blockGutterAnchor = '';
    const error = element('p', 'px-3 py-2 text-sm text-destructive');
    error.hidden = true;
    error.setAttribute('role', 'alert');
    const codeHost = element('div', 'orbium-rich-card-code');
    mount.root.append(toolbar, error, codeHost);
    const language = element(
        'select',
        'min-h-7 cursor-pointer rounded border-0 bg-transparent px-2 py-1 text-xs text-foreground outline-none hover:bg-accent',
    );
    language.setAttribute('aria-label', 'Code language');
    for (const name of codeLanguages) {
        const option = element('option', '', codeLanguageLabel(name));
        option.value = name;
        language.append(option);
    }
    heading.icon.style.color = 'var(--foreground)';
    const languageIcon = element('span', 'rich-code-language-icon');
    heading.title.classList.add('rich-code-language-title');
    heading.title.replaceChildren(languageIcon, language);
    const languageSelect = mountCodeLanguageSelect(language);
    const copyButton = mountCodeCopyButton(
        heading.actions,
        () => rejectedContent ?? block.content,
    );
    const input = mountCodeInput({
        host: codeHost,
        source: rejectedContent ?? block.content,
        language:
            normalizeCodeLanguage(block.language ?? 'plaintext') || 'plaintext',
        isVisible: mount.context.isVisible,
        onChange: (content) => write(content, language.value),
    });
    const discardDraft = button('Discard draft', () => {
        rejectedContent = null;
        draft.clear();
        delete mount.root.dataset.unsavedRichDraft;
        error.hidden = true;
        update(block);
    });
    function showRejectedDraft() {
        mount.root.dataset.unsavedRichDraft = 'true';
        error.replaceChildren(
            document.createTextNode(
                'These code changes are not saved. Copy your draft before discarding it, or retry editing after the document becomes available. ',
            ),
            discardDraft,
        );
        error.hidden = false;
    }
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
        rejectedContent = null;
        draft.clear();
        if (applyRichSource(mount.view, block, source)) {
            rejectedContent = null;
            delete mount.root.dataset.unsavedRichDraft;
            error.hidden = true;
            block = {
                ...block,
                content,
                language: name,
                source,
                to: block.from + source.length,
            };
        } else {
            rejectedContent = content;
            draft.write({ content, language: name });
            showRejectedDraft();
        }
    }
    language.addEventListener('change', () =>
        write(rejectedContent ?? block.content, language.value),
    );
    function update(next: RichBlock) {
        block = next;
        if (rejectedContent === null) {
            error.textContent = next.diagnostic ?? '';
            error.hidden = !next.diagnostic;
        }
        const name =
            normalizeCodeLanguage(
                draft.read()?.language ?? next.language ?? 'plaintext',
            ) || 'plaintext';
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
        languageSelect.update();
        languageIcon.replaceChildren(createCodeLanguageIcon(name));
        input.update(rejectedContent ?? next.content, name, language.disabled);
        return true;
    }
    update(block);
    if (rejectedContent !== null) showRejectedDraft();
    return {
        update,
        destroy() {
            copyButton.destroy();
            languageSelect.destroy();
            input.destroy();
        },
    };
}
