import { createRoot } from 'react-dom/client';
import {
    autocompletion,
    completionKeymap,
    closeCompletion,
    type CompletionContext,
} from '@codemirror/autocomplete';
import { Prec } from '@codemirror/state';
import { keymap, type EditorView } from '@codemirror/view';
import { markdownIconCompletion } from './markdown-icon-completion';
import {
    completionMenuIcon,
    markdownCompletionMenu,
} from '@/components/editor/markdown/interactions/markdown-completion-menu';
import { markdownUploadAnchor } from '@/components/editor/markdown/markdown-upload-anchor';
import { isMarkdownLiteralPosition } from '@/components/editor/markdown/markdown-syntax';
import { openMarkdownIconPicker } from './markdown-icon-widget';
import { MarkdownInlineIcons } from './markdown-inline-icons';
import type { RichContext } from '@/components/editor/markdown/rich/rich-model';

function slashIconCompletion(context: CompletionContext) {
    const match = context.matchBefore(/\/(?:i(?:c(?:o(?:n)?)?)?)?/i);
    if (!match || isMarkdownLiteralPosition(context.state, match.from))
        return null;
    const before = context.state.sliceDoc(
        Math.max(0, match.from - 1),
        match.from,
    );
    if (before && !/\s/.test(before)) return null;
    return {
        from: match.from,
        options: [
            {
                label: 'Inline icon',
                detail: 'Emoji, icons and images',
                apply(
                    view: EditorView,
                    _completion: unknown,
                    from: number,
                    to: number,
                ) {
                    closeCompletion(view);
                    openMarkdownIconPicker(view, { from, to });
                },
            },
        ],
        filter: false,
    };
}

export const markdownInlineIconInput = [
    markdownUploadAnchor,
    markdownCompletionMenu,
    autocompletion({
        override: [slashIconCompletion, markdownIconCompletion],
        defaultKeymap: false,
        activateOnTypingDelay: 0,
        interactionDelay: 0,
        icons: false,
        tooltipClass: () =>
            'orbium-slash-menu app-menu-content glass-surface shadow-xl',
        optionClass: () => 'app-menu-option',
        addToOptions: [{ position: 10, render: completionMenuIcon }],
    }),
    Prec.highest(keymap.of(completionKeymap)),
];

export function mountMarkdownInlineIcons(
    host: HTMLElement,
    view: EditorView,
    context: RichContext,
) {
    const surface = document.createElement('div');
    host.append(surface);
    const root = createRoot(surface);
    root.render(
        <MarkdownInlineIcons
            view={view}
            workspaceId={context.workspaceId}
            nodeId={context.nodeId}
            ownerKind={context.ownerKind}
            preferenceScope={`orbium:inline-icons:v1:rich:${context.workspaceId}`}
            portalContainer={
                host.closest<HTMLElement>('[role="dialog"]') ?? undefined
            }
            onBusy={context.onIconBusy}
            onUpload={context.localIconUploads ? undefined : context.onUpload}
        />,
    );
    return () => {
        root.unmount();
        surface.remove();
    };
}
