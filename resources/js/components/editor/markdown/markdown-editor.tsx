import { MermaidPreviewSession } from '../mermaid-preview-session';
import { orbiumMarkdownDialect } from './dialect/markdown-dialect';
import { markdownRichBlocks } from './rich/rich-blocks';
import type { RichContext } from './rich/rich-model';
import { Compartment, EditorState } from '@codemirror/state';
import {
    EditorView,
    drawSelection,
    highlightActiveLine,
    keymap,
    lineNumbers,
    placeholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { search } from '@codemirror/search';
import { closeCompletion } from '@codemirror/autocomplete';
import { Code2, FileUp, Search } from 'lucide-react';
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

export type MarkdownEditorProps = {
    workspaceId: number;
    nodeId: number;
    markdown: string;
    revision: number;
    limits: MarkdownLimits;
};

export default function MarkdownEditor(props: MarkdownEditorProps) {
    const host = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<EditorView | null>(null);
    const [livePreview, setLivePreview] = useState(true);
    const upload = useMarkdownUpload(props.workspaceId, props.nodeId);
    const { active, visible } = useDocumentTab();
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
    });
    callbacks.current = {
        queueSave: autosave.queueSave,
        count: finder.scheduleCount,
        chooseFile: upload.chooseFile,
    };
    const initial = useRef(props);
    const appearance = useRef(resolvedAppearance);
    const activity = useRef(active);
    const visibility = useRef(visible);
    visibility.current = visible;
    const theme = useRef(new Compartment());
    const editing = useRef(new Compartment());
    const presentation = useRef(new Compartment());
    const [richContext] = useState<RichContext>(() => ({
        workspaceId: props.workspaceId,
        nodeId: props.nodeId,
        mermaid: new MermaidPreviewSession(props.workspaceId, props.nodeId),
        metadata: new Map(),
        isVisible: () => visibility.current,
        onUpload: (request) => callbacks.current.chooseFile(request),
    }));
    const [richExtensions] = useState(() => markdownRichBlocks(richContext));

    useEffect(() => {
        if (!host.current) return;
        const editor = measureEditorWork(
            'codemirror.mount',
            () =>
                new EditorView({
                    parent: host.current!,
                    state: EditorState.create({
                        doc: initial.current.markdown,
                        extensions: [
                            history(),
                            drawSelection(),
                            presentation.current.of([
                                markdownLivePreview(initial.current),
                                richExtensions,
                                markdownPreviewTheme,
                                markdownWritingCommands,
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
                            markdownSlashCommands((request) =>
                                callbacks.current.chooseFile(request),
                            ),
                            markdownTypingShortcuts,
                            pendingInlineFormatting,
                            insertPendingInlineFormatting,
                            markdownUploadAnchor,
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
                                EditorView.editable.of(activity.current),
                            ),
                            EditorView.contentAttributes.of({
                                'aria-label': 'Document body',
                                spellcheck: 'true',
                            }),
                            EditorView.updateListener.of((update) => {
                                if (!update.docChanged) return;
                                callbacks.current.queueSave(update.state.doc);
                                callbacks.current.count();
                            }),
                        ],
                    }),
                }),
        );
        richContext.mermaid.start(editor.dom);
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
            editor.destroy();
            richContext.mermaid.destroy();
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

    useEffect(() => {
        if (!view) return;
        view.dispatch({
            effects: editing.current.reconfigure(
                EditorView.editable.of(active),
            ),
        });
        if (!active) {
            closeCompletion(view);
            view.contentDOM.blur();
        }
    }, [view, active]);

    useEffect(() => {
        if (!view) return;
        view.dispatch({
            effects: presentation.current.reconfigure(
                livePreview
                    ? [
                          markdownLivePreview(initial.current),
                          richExtensions,
                          markdownPreviewTheme,
                          markdownWritingCommands,
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
    }, [richContext, active, visible, livePreview]);

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
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span role="status">
                        {autosave.status === 'saved'
                            ? 'Saved'
                            : autosave.status === 'saving'
                              ? 'Saving…'
                              : autosave.status === 'error'
                                ? 'Save failed'
                                : 'Unsaved changes'}
                    </span>
                    {autosave.status === 'error' && (
                        <button
                            type="button"
                            className="underline"
                            onClick={() => void autosave.saveNow()}
                        >
                            Retry
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        aria-label={
                            livePreview
                                ? 'Switch to Markdown source'
                                : 'Switch to Live Preview'
                        }
                        aria-pressed={!livePreview}
                        className="flex items-center gap-1 rounded p-1 hover:bg-accent"
                        onClick={() => setLivePreview((current) => !current)}
                    >
                        <Code2 size={16} />
                        {livePreview ? 'Markdown source' : 'Live Preview'}
                    </button>
                    <button
                        type="button"
                        onClick={finder.openSearch}
                        aria-label="Find in document"
                        className="rounded p-1 hover:bg-accent"
                    >
                        <Search size={16} />
                    </button>
                    <button
                        type="button"
                        disabled={!active || !view || upload.uploading}
                        className="flex items-center gap-1 rounded p-1 hover:bg-accent disabled:opacity-50"
                        onClick={() => {
                            if (!view) return;
                            upload.chooseFile({
                                view,
                                from: view.state.selection.main.from,
                                to: view.state.selection.main.to,
                                kind: 'file',
                            });
                        }}
                    >
                        <FileUp size={16} /> Add file
                    </button>
                </div>
            </div>
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
            <input
                ref={upload.fileInput}
                type="file"
                className="hidden"
                aria-label="Upload document attachment"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload.uploadFile(file);
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
                    livePreview ? '' : 'overflow-hidden rounded-xl border'
                }
                data-live-preview={livePreview}
                data-orbium-markdown-editor={props.nodeId}
            />
            <p className="mt-10 text-xs text-muted-foreground">
                Type / for blocks, or use Markdown shortcuts.
            </p>
        </section>
    );
}
