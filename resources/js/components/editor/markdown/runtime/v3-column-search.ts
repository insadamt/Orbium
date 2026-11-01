// Summary: Projects owner search queries/highlights into mounted V3 columns without writing content; depends on existing logical search, identified column views and debounced owner match effects.
import { ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { getSearchQuery, setSearchQuery } from '@codemirror/search';
import { mountedV3ColumnLayouts } from '../columns/v3/v3-column-layout';
import { findLogicalMarkdownMatches } from '../interactions/markdown-logical-text';
import { setLogicalMarkdownMatches } from '../interactions/markdown-find-highlights';

export const v3ColumnSearch = ViewPlugin.fromClass(
    class {
        destroyed = false;
        scheduled = false;
        constructor(readonly view: ViewUpdate['view']) {
            this.schedule();
        }
        update(update: ViewUpdate) {
            if (
                !getSearchQuery(update.startState).eq(
                    getSearchQuery(update.state),
                ) ||
                update.transactions.some((transaction) =>
                    transaction.effects.some((effect) =>
                        effect.is(setLogicalMarkdownMatches),
                    ),
                )
            )
                this.schedule();
        }
        schedule() {
            if (this.scheduled) return;
            this.scheduled = true;
            queueMicrotask(() => {
                this.scheduled = false;
                if (this.destroyed) return;
                const query = getSearchQuery(this.view.state);
                for (const layout of mountedV3ColumnLayouts(this.view))
                    for (const projection of layout.projections()) {
                        const view = projection.view;
                        view.dispatch({
                            effects: [
                                setSearchQuery.of(query),
                                setLogicalMarkdownMatches.of(
                                    query.search
                                        ? findLogicalMarkdownMatches(
                                              view.state.doc,
                                              query.search,
                                          )
                                        : [],
                                ),
                            ],
                        });
                    }
            });
        }
        destroy() {
            this.destroyed = true;
        }
    },
);
