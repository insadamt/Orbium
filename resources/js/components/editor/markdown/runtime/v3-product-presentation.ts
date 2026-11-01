// Summary: Assembles the active V3 live surface using existing rich previews and controls; depends on one owner history, identified column projections and the shared Markdown UI.
import { v3EmptyParagraphs } from './v3-empty-paragraphs';
import { v3ColumnFocus } from './v3-column-focus';
import { v3ColumnIcons } from './v3-column-icons';
import { v3ColumnSearch } from './v3-column-search';
import { search } from '@codemirror/search';
import { markdownFindHighlights } from '../interactions/markdown-find-highlights';
import { v3TypingShortcuts } from './v3-typing-shortcuts';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { v3LiveEditingExtensions } from '../editing/v3-live-editing';
import { v3ColumnWidgets } from '../columns/v3/v3-column-widgets';
import { v3StructureField } from '../structure/v3-structure-state';
import { v3MarkdownDialect } from './v3-markdown-dialect';
import { orbiumMarkdownDialect } from '../dialect/markdown-dialect';
import { markdownLivePreview } from '../preview/markdown-live-preview';
import { markdownRichBlocks } from '../rich/rich-blocks';
import type { RichContext } from '../rich/rich-model';
import {
    markdownPreviewTheme,
    markdownSlashMenuTheme,
} from '../preview/markdown-preview-theme';
import { markdownBlockGutter } from '../interactions/markdown-block-gutter';
import { markdownBlockWrappers } from '../interactions/markdown-block-wrappers';
import { markdownSelectionToolbar } from '../interactions/markdown-selection-toolbar';
import { markdownDividerToolbar } from '../interactions/markdown-divider-toolbar';
import {
    markdownSlashCommands,
    type MarkdownUploadRequest,
} from '../markdown-slash-commands';
import { markdownUploadAnchor } from '../markdown-upload-anchor';
import { markdownTypingShortcuts } from '../markdown-typing-commands';
import {
    pendingInlineFormatting,
    insertPendingInlineFormatting,
} from '../markdown-pending-formatting';
import { executeV3Operation } from '../transactions/v3-transaction-dispatch';
import { v3SpacerBlocks } from './v3-spacer-blocks';
import { v3EmptyLineCleanup } from './v3-empty-line-cleanup';
import { v3RichBlockFocus } from './v3-rich-block-focus';
import { v3WritingBottomScroll } from './v3-writing-bottom-scroll';

export const v3ProductLanguage = () =>
    markdown({
        base: markdownLanguage,
        extensions: [orbiumMarkdownDialect, v3MarkdownDialect],
        completeHTMLTags: false,
        pasteURLAsLink: false,
        addKeymap: false,
    });

export function v3ProductPresentation(options: {
    context: RichContext;
    clipboardScope: string;
    isAvailable: () => boolean;
    onNotice: (notice: string) => void;
    onUpload: (request: MarkdownUploadRequest) => void;
}) {
    const onError = (error: Error) => options.onNotice(error.message);
    const shared = (column = false, context = options.context) => [
        markdownLivePreview(context),
        markdownRichBlocks(context),
        markdownPreviewTheme,
        v3TypingShortcuts(options.onNotice),
        v3EmptyParagraphs,
        v3SpacerBlocks,
        v3EmptyLineCleanup,
        v3RichBlockFocus,
        markdownBlockWrappers,
        markdownSelectionToolbar(options.onNotice),
        markdownDividerToolbar(options.onNotice),
        markdownBlockGutter(options.onNotice, column ? 'column' : 'document'),
    ];
    return [
        v3WritingBottomScroll,
        v3ColumnSearch,
        v3ColumnFocus,
        v3LiveEditingExtensions({
            isAvailable: options.isAvailable,
            clipboardScope: options.clipboardScope,
            onError,
            renderColumnLayouts: true,
            renderRichBodies: true,
            resolveEmbeddedBlock(target) {
                if (!(target instanceof Element)) return null;
                const widget = target.closest<HTMLElement>('[data-rich-from]');
                //
                // Ordinary column text has only the outer layout widget as an ancestor; let the registered projection resolve its actual child instead of selecting the whole layout.
                //
                if (
                    widget?.dataset.v3BlockId &&
                    target.closest('[data-v3-column-id]')
                )
                    return null;
                const host = widget?.closest<HTMLElement>('.cm-editor');
                const view = host && EditorView.findFromDOM(host);
                return (
                    view?.state
                        .field(v3StructureField, false)
                        ?.current.blockAt(Number(widget?.dataset.richFrom))
                        ?.id ?? null
                );
            },
        }),
        v3ColumnWidgets({
            ...options,
            renderRichBodies: true,
            onError,
            extensionsForColumn: () => {
                const context = { ...options.context, diagramWidth: undefined };
                return [
                    v3ProductLanguage(),
                    search(),
                    markdownFindHighlights,
                    ...shared(true, context),
                    v3ColumnIcons(context),
                    markdownSlashMenuTheme,
                    markdownSlashCommands(options.onUpload, {
                        workspaceId: options.context.workspaceId,
                        sourceId: options.context.nodeId,
                        allowColumns: false,
                    }),
                    markdownTypingShortcuts,
                    markdownUploadAnchor,
                    pendingInlineFormatting,
                    insertPendingInlineFormatting,
                ];
            },
        }),
        ...shared(),
        EditorView.inputHandler.of((view, _from, _to, text) => {
            const index = view.state.field(v3StructureField).current;
            if (!index.valid || index.structure.blocks.length) return false;
            try {
                executeV3Operation({
                    view,
                    operation: {
                        kind: 'insert',
                        target: { parentId: null },
                        type: 'paragraph',
                        body: text,
                        caret: text.length,
                    },
                    isAvailable: options.isAvailable,
                });
            } catch (error) {
                onError(
                    error instanceof Error
                        ? error
                        : new Error('Could not create a paragraph.'),
                );
            }
            return true;
        }),
    ];
}
