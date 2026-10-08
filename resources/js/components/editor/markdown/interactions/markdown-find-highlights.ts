import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { LogicalMarkdownMatch } from './markdown-logical-text';

export const setLogicalMarkdownMatches =
    StateEffect.define<LogicalMarkdownMatch[]>();
export const markdownFindHighlights = StateField.define({
    create: () => Decoration.none,
    update(previous, transaction) {
        let decorations = previous.map(transaction.changes);
        for (const effect of transaction.effects)
            if (effect.is(setLogicalMarkdownMatches))
                decorations = Decoration.set(
                    effect.value
                        .filter((match) => match.to > match.from)
                        .map((match) =>
                            Decoration.mark({
                                class: 'cm-md-find-match',
                            }).range(match.from, match.to),
                        ),
                    true,
                );
        return decorations;
    },
    provide: (field) => EditorView.decorations.from(field),
});
