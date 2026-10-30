// Summary: Forwards Document search changes into mounted column editors without changing canonical content; depends on the column registry and CodeMirror search state.
import { ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { getSearchQuery } from '@codemirror/search';
import { mountedDocumentColumns } from './column-registry';

export const columnSearchSynchronization = ViewPlugin.fromClass(
    class {
        update(update: ViewUpdate) {
            if (
                getSearchQuery(update.startState).eq(
                    getSearchQuery(update.state),
                )
            )
                return;
            for (const columns of mountedDocumentColumns(update.view))
                columns.refreshSearch();
        }
    },
);
