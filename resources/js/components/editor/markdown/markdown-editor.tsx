import { useHostedMarkdownDocument } from '../use-hosted-document-activity';
import { dispatchMarkdownHistoryWithLayoutMotion } from './interactions/markdown-history-layout-motion';
import { markdownBlockHistoryMotion } from './interactions/markdown-block-history-motion';
import { LibraryPicker } from '@/components/library/library-picker';
import { ExportDialog } from '@/components/document-transfer/export-dialog';
import { ImportDialog } from '@/components/document-transfer/import-dialog';
import {
    markdownSelectAll,
    orbiumSelectionAppearance,
} from './markdown-selection';
import { MermaidPreviewSession } from '../mermaid-preview-session';
import { orbiumMarkdownDialect } from './dialect/markdown-dialect';
import { markdownRichBlocks } from './rich/rich-blocks';
import type { RichContext } from './rich/rich-model';
import { Compartment, EditorSelection, EditorState } from '@codemirror/state';
import { normalizeMentionSelection } from './preview/markdown-mention-selection';
import {
    EditorView,
    highlightActiveLine,
    keymap,
    lineNumbers,
    placeholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { search } from '@codemirror/search';
import { markdownBlockWrappers } from './interactions/markdown-block-wrappers';
import { markdownPresentationCommands } from './interactions/markdown-presentation-commands';
import { markdownFindHighlights } from './interactions/markdown-find-highlights';
import { markdownDividerToolbar } from './interactions/markdown-divider-toolbar';
import { markdownSelectionToolbar } from './interactions/markdown-selection-toolbar';
import { registerMarkdownSplitBlockTarget } from './interactions/markdown-split-block-targets';
import { markdownBlockGutter } from './interactions/markdown-block-gutter';
import { markdownTrailingParagraph } from './interactions/markdown-trailing-paragraph';
import { markdownMediaInput } from './interactions/markdown-media-input';
import { useMarkdownTransfer } from './interactions/use-markdown-transfer';
import { MarkdownEditorControls } from './interactions/markdown-editor-controls';
import { markdownSlashCommands } from './markdown-slash-commands';
import { markdownTypingShortcuts } from './markdown-typing-commands';
import {
    insertPendingInlineFormatting,
    pendingInlineFormatting,
} from './markdown-pending-formatting';
import { markdownUploadAnchor } from './markdown-upload-anchor';
import { useMarkdownUpload } from './use-markdown-upload';
import { markdownLivePreview } from './preview/markdown-live-preview';
import { markdownWritingCommands } from './preview/markdown-writing-commands';
import { markdownLinkNavigation } from './preview/markdown-link-preview';
import {
    markdownPreviewTheme,
    markdownSlashMenuTheme,
} from './preview/markdown-preview-theme';
import { useEffect, useRef, useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import {
    adjustEditorPerformanceCounter,
    markEditorPerformance,
    measureEditorWork,
    recordEditorDuration,
} from '@/lib/editor-performance';
import { type MarkdownLimits } from './markdown-api';
import { markdownSourceHighlighting, markdownTheme } from './markdown-theme';
import { useMarkdownAutosave } from './use-markdown-autosave';
import { useMarkdownSearch } from './use-markdown-search';
import { MarkdownTableOfContents } from './markdown-table-of-contents';
import { useMarkdownEditorActivity } from './use-markdown-editor-activity';

export type MarkdownEditorProps = {
    workspaceId: number;
    nodeId: number;
    title: string;
    markdown: string;
    revision: number;
    limits: MarkdownLimits;
};

export default function MarkdownEditor(props: MarkdownEditorProps) {
    const host = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<EditorView | null>(null);
    const [notice, setNotice] = useState('');
    const [transferDialog, setTransferDialog] = useState<
        'import' | 'export' | null
    >(null);
    const transferContext = useRef(props);
    const transfer = useMarkdownTransfer(view, transferContext.current);
    const [livePreview, setLivePreview] = useState(true);
    const upload = useMarkdownUpload(props.workspaceId, props.nodeId);
    const { active, visible } = useDocumentTab();
    const hosted = useHostedMarkdownDocument(
        view,
        upload.uploading,
        transfer.busy,
    );
    const { resolvedAppearance } = useAppearance();
    const editorView = useRef<EditorView | null>(null);
    const autosave = useMarkdownAutosave({
        ...props,
        isComposing: () => editorView.current?.compositionStarted ?? false,
    });
    const finder = useMarkdownSearch(view);
    const callbacks = useRef({
        queueSave: autosave.queueSave,
        count: finder.scheduleCount,
        chooseFile: upload.chooseFile,
        uploadDroppedFiles: upload.uploadDroppedFiles,
        importSource: transfer.importSource,
        updateEmpty: transfer.updateEmpty,
    });
    callbacks.current = {
        queueSave: autosave.queueSave,
        count: finder.scheduleCount,
        chooseFile: upload.chooseFile,
        uploadDroppedFiles: upload.uploadDroppedFiles,
        importSource: transfer.importSource,
        updateEmpty: transfer.updateEmpty,
    };
    const initial = useRef(props);
    const appearance = useRef(resolvedAppearance);
    const visibility = useRef(visible);
    visibility.current = visible;
    const theme = useRef(new Compartment());
    const editing = useRef(new Compartment());
    const presentation = useRef(new Compartment());
    const outlineUpdates = useRef(new Compartment());
    const [richContext] = useState<RichContext>(() => ({
        workspaceId: props.workspaceId,
        nodeId: props.nodeId,
        mermaid: new MermaidPreviewSession(props.workspaceId, props.nodeId),
        metadata: new Map(),
        isVisible: () => visibility.current,
        onUpload: (request) => callbacks.current.chooseFile(request),
    }));
    const [richExtensions] = useState(() => markdownRichBlocks(richContext));
    const [interactionExtensions] = useState(() => [
        markdownSelectionToolbar(setNotice),
        markdownDividerToolbar(setNotice),
        //
        // Hosted Documents need their own block controls; canvas selection only moves the outer card.
        //
        markdownBlockGutter(setNotice),
    ]);

    useEffect(() => {
        if (!host.current) return;
        // Strict Mode repeats setup after cleanup, which permanently destroys the session.
        const mermaidSession = new MermaidPreviewSession(
            initial.current.workspaceId,
            initial.current.nodeId,
        );
        richContext.mermaid = mermaidSession;
        const editor = measureEditorWork(
            'codemirror.mount',
            () =>
                new EditorView({
                    parent: host.current!,
                    dispatchTransactions:
                        dispatchMarkdownHistoryWithLayoutMotion,
                    state: EditorState.create({
                        doc: initial.current.markdown,
                        extensions: [
                            history(),
                            markdownBlockHistoryMotion,
                            outlineUpdates.current.of([]),
                            orbiumSelectionAppearance,
                            markdownSelectAll,
                            presentation.current.of([
                                markdownLivePreview(initial.current),
                                richExtensions,
                                markdownPreviewTheme,
                                markdownWritingCommands,
                                markdownBlockWrappers,
                                markdownPresentationCommands,
                                markdownTrailingParagraph,
                                interactionExtensions,
                            ]),
                            highlightActiveLine(),
                            EditorView.lineWrapping,
                            markdown({
                                base: markdownLanguage,
                                extensions: [orbiumMarkdownDialect],
                                completeHTMLTags: false,
                                pasteURLAsLink: false,
                            }),
                            search(),
                            markdownFindHighlights,
                            markdownSlashCommands(
                                (request) =>
                                    callbacks.current.chooseFile(request),
                                {
                                    workspaceId: initial.current.workspaceId,
                                    sourceId: initial.current.nodeId,
                                },
                            ),
                            markdownTypingShortcuts,
                            pendingInlineFormatting,
                            insertPendingInlineFormatting,
                            markdownUploadAnchor,
                            markdownMediaInput(
                                (files, request) =>
                                    callbacks.current.uploadDroppedFiles(
                                        files,
                                        request,
                                    ),
                                setNotice,
                            ),
                            EditorView.domEventHandlers({
                                paste(event, current) {
                                    if (
                                        !current.state.facet(
                                            EditorView.editable,
                                        ) ||
                                        current.state.doc.toString().trim() ||
                                        event.clipboardData?.files.length ||
                                        (event.target instanceof Element &&
                                            event.target.closest(
                                                'textarea, input',
                                            ))
                                    )
                                        return false;
                                    const text =
                                        event.clipboardData?.getData(
                                            'text/plain',
                                        ) ?? '';
                                    if (
                                        !/^(?:#{1,6} |[-*+] |\d+\. |> |`{3,}|:{3,}orbium |\$\$)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/m.test(
                                            text,
                                        )
                                    )
                                        return false;
                                    event.preventDefault();
                                    void callbacks.current.importSource(text);
                                    return true;
                                },
                            }),
                            markdownSlashMenuTheme,
                            markdownLinkNavigation,
                            keymap.of([...defaultKeymap, ...historyKeymap]),
                            placeholder(
                                'Write something, or press / for commands…',
                            ),
                            theme.current.of(
                                markdownTheme(appearance.current === 'dark'),
                            ),
                            editing.current.of(
                                EditorView.editable.of(visibility.current),
                            ),
                            EditorView.contentAttributes.of({
                                'aria-label': 'Document body',
                                spellcheck: 'true',
                            }),
                            EditorView.updateListener.of((update) => {
                                if (!update.docChanged) return;
                                callbacks.current.queueSave(update.state.doc);
                                callbacks.current.count();
                                callbacks.current.updateEmpty();
                            }),
                        ],
                    }),
                }),
        );
        const unregisterBlockTarget = registerMarkdownSplitBlockTarget({
            view: editor,
            localOnly: Boolean(hosted),
            richContext,
            onNotice: setNotice,
            workspaceId: initial.current.workspaceId,
            nodeId: initial.current.nodeId,
            limits: initial.current.limits,
            isVisible: () => visibility.current,
        });
        mermaidSession.start(editor.dom);
        editorView.current = editor;
        setView(editor);
        adjustEditorPerformanceCounter('codemirror.mounted-editors', 1);
        markEditorPerformance(`codemirror.${initial.current.nodeId}.mounted`);
        const frame = requestAnimationFrame(() =>
            markEditorPerformance(
                `codemirror.${initial.current.nodeId}.first-frame`,
            ),
        );
        return () => {
            cancelAnimationFrame(frame);
            editorView.current = null;
            unregisterBlockTarget();
            editor.destroy();
            mermaidSession.destroy();
            adjustEditorPerformanceCounter('codemirror.mounted-editors', -1);
        };
    }, [richContext, richExtensions]);

    useEffect(() => {
        if (!view) return;
        view.dispatch({
            effects: theme.current.reconfigure(
                markdownTheme(resolvedAppearance === 'dark'),
            ),
        });
    }, [view, resolvedAppearance]);

    useMarkdownEditorActivity({
        view,
        editing: editing.current,
        active,
        visible,
        readOnly: hosted?.readOnly ?? false,
    });

    useEffect(() => {
        if (!view) return;
        view.dispatch({
            selection: livePreview
                ? EditorSelection.create(
                      view.state.selection.ranges.map((range) =>
                          normalizeMentionSelection(
                              view.state,
                              range,
                              range.head,
                          ),
                      ),
                      view.state.selection.mainIndex,
                  )
                : undefined,
            effects: presentation.current.reconfigure(
                livePreview
                    ? [
                          markdownLivePreview(initial.current),
                          richExtensions,
                          markdownPreviewTheme,
                          markdownWritingCommands,
                          markdownBlockWrappers,
                          markdownPresentationCommands,
                          markdownTrailingParagraph,
                          interactionExtensions,
                      ]
                    : [
                          lineNumbers(),
                          markdownSourceHighlighting(
                              resolvedAppearance === 'dark',
                          ),
                      ],
            ),
        });
        view.requestMeasure();
    }, [view, livePreview, resolvedAppearance, richExtensions]);

    useEffect(() => {
        richContext.mermaid.setActive(active && visible && livePreview);
        if (!visible || !livePreview)
            view?.dom.dispatchEvent(new Event('orbium:pause-media'));
    }, [richContext, active, visible, livePreview, view]);

    useEffect(() => {
        if (autosave.status === 'saved') richContext.mermaid.notifySaved();
    }, [richContext, autosave.status]);

    useEffect(() => {
        if (!view || !visible) return;
        const started = performance.now();
        view.requestMeasure();
        const frame = requestAnimationFrame(() =>
            recordEditorDuration('codemirror.activation-frame', started),
        );
        return () => cancelAnimationFrame(frame);
    }, [view, visible]);

    useEffect(() => {
        if (!active || !view) return;
        const keyDown = (event: KeyboardEvent) => {
            if (
                !(event.ctrlKey || event.metaKey) ||
                event.altKey ||
                view.composing
            )
                return;
            if (event.key.toLowerCase() === 's') {
                event.preventDefault();
                void autosave.saveNow();
            }
            if (event.key.toLowerCase() === 'f') {
                event.preventDefault();
                finder.openSearch();
            }
        };
        window.addEventListener('keydown', keyDown);
        return () => window.removeEventListener('keydown', keyDown);
    }, [active, view, autosave.saveNow, finder.openSearch]);

    return (
        <section
            className="relative"
            aria-label="Document editor"
            data-document-styles
        >
            <MarkdownEditorControls
                tableOfContents={
                    hosted ? null : (
                        <MarkdownTableOfContents
                            view={view}
                            updates={outlineUpdates.current}
                        />
                    )
                }
                status={autosave.status}
                livePreview={livePreview}
                disabled={!active || !view || upload.uploading}
                importing={transfer.busy}
                onRetry={() => void autosave.saveNow()}
                onTogglePreview={() => setLivePreview((current) => !current)}
                onImport={() => setTransferDialog('import')}
                onExport={() => setTransferDialog('export')}
            />
            {notice && (
                <p role="status" className="mb-2 text-sm text-muted-foreground">
                    {notice}
                </p>
            )}
            {transfer.error && (
                <p role="alert" className="mb-2 text-sm text-destructive">
                    {transfer.error}
                </p>
            )}
            {transferDialog === 'export' && view && (
                <ExportDialog
                    workspaceId={props.workspaceId}
                    nodeId={props.nodeId}
                    source={view.state.doc.toString()}
                    onClose={() => setTransferDialog(null)}
                />
            )}
            {transferDialog === 'import' && view && (
                <ImportDialog
                    workspaceId={props.workspaceId}
                    replaceDocument={{
                        hasContent: () =>
                            Boolean(view.state.doc.toString().trim()),
                        validate: transfer.validateReplacement,
                        replace: transfer.replaceContent,
                    }}
                    onClose={() => setTransferDialog(null)}
                />
            )}
            {upload.uploading && (
                <p role="status" className="mb-2 text-sm text-muted-foreground">
                    Uploading {upload.kind}…
                </p>
            )}
            {upload.error && (
                <p role="alert" className="mb-2 text-sm text-destructive">
                    {upload.error}
                </p>
            )}
            {upload.libraryOpen && (
                <LibraryPicker
                    workspaceId={props.workspaceId}
                    imagesOnly={upload.kind === 'image'}
                    filesOnly={upload.kind === 'file'}
                    mediaKind={
                        ['video', 'audio', 'pdf'].includes(upload.kind)
                            ? (upload.kind as 'video' | 'audio' | 'pdf')
                            : undefined
                    }
                    onClose={upload.closeLibrary}
                    onChoose={upload.chooseLibraryFile}
                    onUpload={upload.uploadNewFile}
                />
            )}
            <input
                ref={upload.fileInput}
                type="file"
                className="hidden"
                aria-label="Upload document attachment"
                onChange={(event) => {
                    const files = [...(event.target.files ?? [])];
                    if (files.length) void upload.uploadSelectedFiles(files);
                    else upload.clearUploadRequest();
                }}
            />
            {autosave.error && (
                <p role="alert" className="mb-2 text-sm text-destructive">
                    {autosave.error}
                </p>
            )}
            {autosave.navigationNotice && (
                <p role="status" className="mb-2 text-sm text-muted-foreground">
                    {autosave.navigationNotice}
                </p>
            )}
            <div
                ref={host}
                className={
                    livePreview
                        ? 'pl-10 sm:pl-0'
                        : 'overflow-hidden rounded-xl border'
                }
                data-live-preview={livePreview}
                data-orbium-markdown-editor={props.nodeId}
            />
        </section>
    );
}
