import {
    markdownCompletionMenu,
    completionMenuIcon,
} from './interactions/markdown-completion-menu';
import { markdownMentionSource } from './interactions/markdown-mentions';
import { replacePresentedMarkdown } from './interactions/markdown-presentation-edits';
import type { OrbiumMetadata } from './dialect/metadata';
import {
    autocompletion,
    completionKeymap,
    acceptCompletion,
    closeCompletion,
    selectedCompletion,
    CompletionContext,
} from '@codemirror/autocomplete';
import { Prec } from '@codemirror/state';
import { isolateHistory } from '@codemirror/commands';
import { EditorView, keymap } from '@codemirror/view';
import {
    isMarkdownLiteralPosition,
    isMarkdownSourceOnlyLine,
} from './markdown-syntax';

export type MarkdownUploadKind = 'image' | 'file';
export type MarkdownUploadRequest = {
    imageMetadata?: OrbiumMetadata;
    presentation?: OrbiumMetadata;
    wrappers?: OrbiumMetadata[];
    view: EditorView;
    from: number;
    to: number;
    kind: MarkdownUploadKind;
};
export type MarkdownBlockTemplate = {
    label: string;
    search: string;
    source: string;
    caret: number;
};

export const markdownBlockTemplates: MarkdownBlockTemplate[] = [
    { label: 'Text', search: 'paragraph plain', source: '', caret: 0 },
    { label: 'Heading 1', search: 'h1 title', source: '# ', caret: 2 },
    { label: 'Heading 2', search: 'h2 subtitle', source: '## ', caret: 3 },
    { label: 'Heading 3', search: 'h3', source: '### ', caret: 4 },
    {
        label: 'Bullet list',
        search: 'unordered bullet',
        source: '- ',
        caret: 2,
    },
    {
        label: 'Numbered list',
        search: 'ordered number',
        source: '1. ',
        caret: 3,
    },
    {
        label: 'Checklist',
        search: 'task todo checkbox',
        source: '- [ ] ',
        caret: 6,
    },
    { label: 'Quote', search: 'blockquote', source: '> ', caret: 2 },
    {
        label: 'Callout',
        search: 'note aside',
        source: '> [!NOTE]\n> ',
        caret: 12,
    },
    {
        label: 'Code',
        search: 'code block programming',
        source: '```text\n\n```',
        caret: 8,
    },
    {
        label: 'Table',
        search: 'grid',
        source: '| Column 1 | Column 2 |\n| --- | --- |\n|  |  |\n|  |  |',
        caret: 2,
    },
    {
        label: 'Mermaid',
        search: 'diagram flowchart',
        source: '```mermaid\ngraph TD\n  A --> B\n```',
        caret: 11,
    },
    {
        label: 'Math block',
        search: 'equation latex display',
        source: '$$\nE = mc^2\n$$',
        caret: 3,
    },
    {
        label: 'Inline math',
        search: 'equation latex',
        source: '$E = mc^2$',
        caret: 1,
    },
    {
        label: 'Divider',
        search: 'line horizontal rule',
        source: '---\n\n',
        caret: 5,
    },
];

export function insertBlockTemplate(
    view: EditorView,
    template: MarkdownBlockTemplate,
    from: number,
    to: number,
) {
    const line = view.state.doc.lineAt(from);
    const prefix = view.state.sliceDoc(line.from, from);
    const replaceFrom = prefix.trim() ? from : line.from;
    const before = prefix.trim() ? '\n\n' : '';
    const suffix =
        view.state.sliceDoc(to, line.to).trim() ||
        (template.source.includes('\n') && line.to < view.state.doc.length)
            ? '\n\n'
            : '';
    const source = `${before}${template.source}${suffix}`;
    if (
        replacePresentedMarkdown(view, {
            from: replaceFrom,
            to,
            source,
            caret: before.length + template.caret,
        })
    )
        return;
    view.dispatch({
        changes: {
            from: replaceFrom,
            to,
            insert: source,
        },
        selection: { anchor: replaceFrom + before.length + template.caret },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.slash',
    });
    view.focus();
}

export function markdownSlashCommands(
    onUpload: (request: MarkdownUploadRequest) => void,
    workspaceId: number,
) {
    const slashSource = (context: CompletionContext) => {
        if (
            !context.state.facet(EditorView.editable) ||
            context.view?.compositionStarted
        )
            return null;
        const match = context.matchBefore(/\/[\w -]*/);
        if (
            !match ||
            isMarkdownLiteralPosition(context.state, match.from) ||
            isMarkdownSourceOnlyLine(context.state.doc.lineAt(match.from).text)
        )
            return null;
        const previous = context.state.sliceDoc(
            Math.max(0, match.from - 1),
            match.from,
        );
        if (previous && !/\s/.test(previous)) return null;
        const query = match.text.slice(1).trim().toLowerCase();
        const options = markdownBlockTemplates
            .filter((template) =>
                `${template.label} ${template.search}`
                    .toLowerCase()
                    .includes(query),
            )
            .map((template) => ({
                label: template.label,
                apply: (
                    view: EditorView,
                    _completion: unknown,
                    from: number,
                    to: number,
                ) => insertBlockTemplate(view, template, from, to),
            }));
        for (const kind of ['image', 'file'] as const) {
            const label = kind === 'image' ? 'Image' : 'File';
            if (!label.toLowerCase().includes(query)) continue;
            options.push({
                label,
                apply: (
                    view: EditorView,
                    _completion: unknown,
                    from: number,
                    to: number,
                ) => onUpload({ view, from, to, kind }),
            });
        }
        return { from: match.from, options, filter: false };
    };
    function acceptCurrentSlashCommand(view: EditorView) {
        const context = new CompletionContext(
            view.state,
            view.state.selection.main.head,
            false,
            view,
        );
        const result = view.state.selection.main.empty && slashSource(context);
        if (!result || !result.options.length) return acceptCompletion(view);
        const selected = selectedCompletion(view.state);
        const option =
            result.options.find((option) => option.label === selected?.label) ??
            result.options[0];
        closeCompletion(view);
        option.apply(view, option, result.from, context.pos);
        return true;
    }
    return [
        markdownCompletionMenu,
        autocompletion({
            override: [slashSource, markdownMentionSource(workspaceId)],
            defaultKeymap: false,
            activateOnTypingDelay: 0,
            interactionDelay: 0,
            icons: false,
            tooltipClass: () =>
                'orbium-slash-menu app-menu-content glass-surface shadow-xl',
            optionClass: () => 'app-menu-option',
            addToOptions: [{ position: 10, render: completionMenuIcon }],
            maxRenderedOptions: 18,
        }),
        // Ctrl+Space belongs to Search Master, including while the slash picker is open.
        Prec.highest(
            keymap.of([
                { key: 'Enter', run: acceptCurrentSlashCommand },
                { key: 'Tab', run: acceptCurrentSlashCommand },
                ...completionKeymap.filter(
                    (binding) =>
                        !['Ctrl-Space', 'Enter'].includes(binding.key ?? ''),
                ),
            ]),
        ),
    ];
}
