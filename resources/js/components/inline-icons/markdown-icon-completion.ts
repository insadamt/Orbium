import type { Completion, CompletionContext } from '@codemirror/autocomplete';
import { closeCompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { findInlineIcons, type InlineIconChoice } from './icon-catalog';
import { announceInsertedIcon } from './icon-preferences';
import { serializeInlineIcon } from './markdown-icon-source';
import { openMarkdownIconPicker } from './markdown-icon-widget';
import {
    isMarkdownLiteralPosition,
    isMarkdownSourceOnlyLine,
} from '@/components/editor/markdown/markdown-syntax';

export function markdownIconCompletion(context: CompletionContext) {
    if (
        !context.state.facet(EditorView.editable) ||
        context.view?.compositionStarted
    )
        return null;
    const match = context.matchBefore(/:[a-zA-Z0-9_+-][a-zA-Z0-9_+-]*/);
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
    if (previous && !/[\s([]/.test(previous)) return null;
    const query = match.text.slice(1);
    const options: (Completion & { inlineIcon?: InlineIconChoice })[] =
        findInlineIcons(query)
            .slice(0, 24)
            .map((choice) => ({
                label: choice.label,
                detail:
                    choice.kind === 'emoji'
                        ? 'Emoji'
                        : choice.kind === 'builtin' &&
                            choice.name.startsWith('brand-')
                          ? 'Brand'
                          : 'Icon',
                inlineIcon: choice,
                apply(
                    view: EditorView,
                    _completion: unknown,
                    from: number,
                    to: number,
                ) {
                    closeCompletion(view);
                    const source = serializeInlineIcon(choice);
                    view.dispatch({
                        changes: { from, to, insert: source },
                        selection: { anchor: from + source.length },
                        userEvent: 'input.complete',
                    });
                    announceInsertedIcon(view.dom, choice);
                },
            }));
    options.push({
        label: 'Browse all icons…',
        apply(view, _completion, from, to) {
            closeCompletion(view);
            openMarkdownIconPicker(view, { from, to, query });
        },
    });
    return { from: match.from, options, filter: false };
}
