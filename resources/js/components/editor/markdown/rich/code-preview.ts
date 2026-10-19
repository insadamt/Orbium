import { codeLanguageLabel, normalizeCodeLanguage } from '../../code-languages';
import { mountCodeCopyButton } from '../../mount-code-copy-button';
import { scheduleEditorIdleWork } from '../../schedule-editor-idle-work';
import { element } from './widget-controls';
import type { RichBlock } from './rich-model';

type HighlightNode = {
    type: string;
    value?: string;
    properties?: Record<string, unknown>;
    children?: HighlightNode[];
};
let highlighter:
    | ReturnType<
          (typeof import('../../code-highlighter'))['createCodeHighlighter']
      >
    | undefined;

function appendHighlightedCode(parent: HTMLElement, node: HighlightNode) {
    if (node.type === 'text') {
        parent.append(document.createTextNode(node.value ?? ''));
        return;
    }
    const span = element('span');
    const classes = node.properties?.className;
    if (Array.isArray(classes)) span.className = classes.map(String).join(' ');
    for (const child of node.children ?? []) appendHighlightedCode(span, child);
    parent.append(span);
}

export function mountCodePreview(target: HTMLElement, block: RichBlock) {
    const language =
        normalizeCodeLanguage(block.language ?? 'plaintext') || 'plaintext';
    const header = element(
        'div',
        'flex items-center justify-between gap-2 rounded-t-lg bg-muted/40 px-3 py-1 text-xs text-muted-foreground',
    );
    header.append(element('span', '', codeLanguageLabel(language)));
    const copy = mountCodeCopyButton(header, () => block.content);
    const pre = element('pre', 'rounded-b-lg bg-muted/20 p-3');
    const code = element('code', '', block.content);
    pre.append(code);
    target.append(header, pre);
    let destroyed = false;
    const cancel = scheduleEditorIdleWork(() => {
        void import('../../code-highlighter')
            .then((module) => {
                if (destroyed || !code.isConnected) return;
                highlighter ??= module.createCodeHighlighter();
                if (!highlighter.registered(language)) return;
                try {
                    const highlighted = highlighter.highlight(
                        language,
                        block.content,
                    );
                    code.replaceChildren();
                    appendHighlightedCode(code, highlighted as HighlightNode);
                } catch {
                    code.textContent = block.content;
                }
            })
            .catch(() => {
                // A failed highlight chunk must leave the authored source readable.
            });
    });
    return () => {
        destroyed = true;
        cancel();
        copy.destroy();
    };
}
