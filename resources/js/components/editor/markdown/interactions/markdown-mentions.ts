import type { CompletionSource } from '@codemirror/autocomplete';
import { isolateHistory } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import {
    escapeMarkdownLabel,
    isMarkdownLiteralPosition,
} from '../markdown-syntax';

type MentionCandidate = { id: number; title: string; type: string };

export function markdownMentionSource(workspaceId: number): CompletionSource {
    return async (context) => {
        const match = context.matchBefore(/@[^@\n]{0,100}/);
        if (
            !match ||
            !context.state.facet(EditorView.editable) ||
            context.view?.compositionStarted ||
            isMarkdownLiteralPosition(context.state, match.from)
        )
            return null;
        const preceding = context.state.sliceDoc(
            Math.max(0, match.from - 1),
            match.from,
        );
        if (preceding && !/\s/.test(preceding)) return null;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        let finishDelay: (() => void) | undefined;
        context.addEventListener(
            'abort',
            () => {
                controller.abort();
                clearTimeout(timer);
                finishDelay?.();
            },
            { onDocChange: true },
        );
        await new Promise<void>((resolve) => {
            finishDelay = resolve;
            timer = setTimeout(resolve, 180);
        });
        if (controller.signal.aborted) return null;
        try {
            const response = await fetch(
                `/workspaces/${workspaceId}/mentions?q=${encodeURIComponent(match.text.slice(1))}`,
                {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                },
            );
            if (!response.ok || context.aborted) return null;
            const candidates = (await response.json()) as MentionCandidate[];
            return {
                from: match.from,
                filter: false,
                options: candidates.map((candidate) => ({
                    label: candidate.title,
                    detail: `· ${candidate.type}`,
                    apply(
                        view: EditorView,
                        _completion: unknown,
                        from: number,
                        to: number,
                    ) {
                        if (!view.state.facet(EditorView.editable)) return;
                        const source = `[@${escapeMarkdownLabel(candidate.title)}](orbium:node/${candidate.id}) `;
                        view.dispatch({
                            changes: { from, to, insert: source },
                            selection: { anchor: from + source.length },
                            annotations: isolateHistory.of('full'),
                            userEvent: 'input.mention',
                        });
                        view.focus();
                    },
                })),
            };
        } catch {
            return null;
        }
    };
}
