// Summary: Mounts an editable Markdown column with the Document's existing writing, rich-block and gutter controls; depends on the owner for history, persistence and upload permissions.
import {
    Compartment,
    EditorState,
    Transaction,
    type StateEffect,
} from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { mountMarkdownInlineIcons } from '@/components/inline-icons/markdown-inline-icon-input';
import {
    orbiumSelectionAppearance,
    markdownSelectAll,
} from '../markdown-selection';
import { orbiumMarkdownDialect } from '../dialect/markdown-dialect';
import { markdownLivePreview } from '../preview/markdown-live-preview';
import { markdownLinkNavigation } from '../preview/markdown-link-preview';
import {
    markdownPreviewTheme,
    markdownSlashMenuTheme,
} from '../preview/markdown-preview-theme';
import { markdownWritingCommands } from '../preview/markdown-writing-commands';
import { markdownTypingShortcuts } from '../markdown-typing-commands';
import {
    pendingInlineFormatting,
    insertPendingInlineFormatting,
} from '../markdown-pending-formatting';
import { markdownSlashCommands } from '../markdown-slash-commands';
import { markdownRichBlocks } from '../rich/rich-blocks';
import { markdownBlockWrappers } from '../interactions/markdown-block-wrappers';
import { markdownPresentationCommands } from '../interactions/markdown-presentation-commands';
import { markdownTrailingParagraph } from '../interactions/markdown-trailing-paragraph';
import { markdownBlockGutter } from '../interactions/markdown-block-gutter';
import { markdownSelectionToolbar } from '../interactions/markdown-selection-toolbar';
import { markdownDividerToolbar } from '../interactions/markdown-divider-toolbar';
import { markdownUploadAnchor } from '../markdown-upload-anchor';
import {
    markdownFindHighlights,
    setLogicalMarkdownMatches,
} from '../interactions/markdown-find-highlights';
import { findLogicalMarkdownMatches } from '../interactions/markdown-logical-text';
import { search, setSearchQuery, getSearchQuery } from '@codemirror/search';
import type { RichContext } from '../rich/rich-model';
import { containsColumnLayout } from './column-source';

export function mountColumnEditor(options: {
    host: HTMLElement;
    source: string;
    context: RichContext;
    owner: EditorView;
    index: number;
    onChange: (source: string, userEvent: string) => void;
    onNotice: (message: string) => void;
}) {
    let synchronizing = false;
    let destroyed = false;
    let scheduled = false;
    const editing = new Compartment();
    const enabled = () =>
        options.owner.state.facet(EditorView.editable) &&
        !options.owner.state.readOnly;
    const view = new EditorView({
        parent: options.host,
        state: EditorState.create({
            doc: options.source,
            extensions: [
                orbiumSelectionAppearance,
                markdownSelectAll,
                markdown({
                    base: markdownLanguage,
                    extensions: [orbiumMarkdownDialect],
                    completeHTMLTags: false,
                    pasteURLAsLink: false,
                }),
                markdownLivePreview(options.context),
                markdownRichBlocks(options.context),
                markdownPreviewTheme,
                markdownSlashMenuTheme,
                markdownLinkNavigation,
                markdownWritingCommands,
                markdownTypingShortcuts,
                pendingInlineFormatting,
                insertPendingInlineFormatting,
                markdownBlockWrappers,
                markdownPresentationCommands,
                markdownTrailingParagraph,
                markdownUploadAnchor,
                markdownSlashCommands(options.context.onUpload, {
                    workspaceId: options.context.workspaceId,
                    sourceId: options.context.nodeId,
                    allowColumns: false,
                }),
                markdownSelectionToolbar(options.onNotice),
                markdownDividerToolbar(options.onNotice),
                search(),
                markdownFindHighlights,
                markdownBlockGutter(options.onNotice),
                EditorView.lineWrapping,
                editing.of(EditorView.editable.of(enabled())),
                EditorView.editorAttributes.of({
                    class: 'orbium-column-editor',
                    'data-live-preview': 'true',
                }),
                EditorView.contentAttributes.of({
                    'aria-label': `Column ${options.index + 1}`,
                    spellcheck: 'true',
                }),
                placeholder('Write, or press /…'),
                keymap.of(defaultKeymap),
                //
                // A pasted layout must not create unsupported nesting or an endlessly recursive editor tree.
                //
                EditorState.transactionFilter.of((transaction) => {
                    if (
                        !synchronizing &&
                        transaction.docChanged &&
                        containsColumnLayout(transaction.newDoc.toString())
                    ) {
                        queueMicrotask(() =>
                            options.onNotice(
                                'Move this layout outside the columns first. Nested columns are not supported.',
                            ),
                        );
                        return [];
                    }
                    return transaction;
                }),
                EditorView.updateListener.of((update) => {
                    if (!update.docChanged || synchronizing) return;
                    const event = update.transactions
                        .find((transaction) => transaction.docChanged)
                        ?.annotation(Transaction.userEvent);
                    options.onChange(
                        update.state.doc.toString(),
                        event ?? 'input.column',
                    );
                }),
            ],
        }),
    });
    const disposeIcons = mountMarkdownInlineIcons(
        options.host,
        view,
        options.context,
    );
    let pendingSource = options.source;
    function synchronize() {
        if (destroyed || scheduled) return;
        scheduled = true;
        //
        // The owner updates while this nested editor may still be notifying its own transaction listeners.
        //
        queueMicrotask(() => {
            scheduled = false;
            if (destroyed) return;
            if (view.compositionStarted) return;
            synchronizing = true;
            try {
                const nextQuery = getSearchQuery(options.owner.state);
                const effects: StateEffect<unknown>[] = [
                    editing.reconfigure(EditorView.editable.of(enabled())),
                ];
                if (!nextQuery.eq(getSearchQuery(view.state)))
                    effects.push(setSearchQuery.of(nextQuery));
                const changes = view.state.changes(
                    view.state.doc.toString() === pendingSource
                        ? []
                        : {
                              from: 0,
                              to: view.state.doc.length,
                              insert: pendingSource,
                          },
                );
                const nextDocument = changes.apply(view.state.doc);
                effects.push(
                    setLogicalMarkdownMatches.of(
                        nextQuery.search
                            ? findLogicalMarkdownMatches(
                                  nextDocument,
                                  nextQuery.search,
                              )
                            : [],
                    ),
                );
                view.dispatch({ changes, effects });
            } finally {
                synchronizing = false;
            }
        });
    }
    view.contentDOM.addEventListener('compositionend', synchronize);
    return {
        view,
        refreshSearch: synchronize,
        update(source: string) {
            pendingSource = source;
            synchronize();
        },
        destroy() {
            destroyed = true;
            view.contentDOM.removeEventListener('compositionend', synchronize);
            //
            // Nested React-backed controls must finish their owner's commit before disposal.
            //
            queueMicrotask(() => {
                disposeIcons();
                view.destroy();
            });
        },
    };
}
