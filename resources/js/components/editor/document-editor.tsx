import type { Editor, JSONContent } from '@tiptap/core';
import { router, usePage } from '@inertiajs/react';
import { IncrementalCodeBlockLowlight } from './incremental-code-highlighting';
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { Download, FileInput, FileUp, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import 'katex/dist/katex.min.css';
import EditorBlockGutter from './editor-block-gutter';
import { AutomaticBlockDirection } from './automatic-block-direction';
import { BlockTextAlignment } from './block-formatting';
import type { EditorDocument } from './editor-api';
import { uploadAttachment } from './editor-api';
import { usePageSearch } from '@/components/navigation/page-search';
import {
    countDocumentMatches,
    DocumentSearch,
    selectNextMatch,
    SelectionToolbar,
    SuggestionMenu,
} from './editor-controls';
import { createMediaExtensions } from './media-nodes';
import { SelectBlockShortcut } from './select-block-shortcut';
import { TextColor } from './text-color';
import {
    createSuggestionExtensions,
    type EditorMenu,
} from './editor-suggestions';
import { useDocumentAutosave } from './use-document-autosave';
import {
    useMermaidCachePreparation,
    type SavedMermaidPreviews,
} from './use-mermaid-cache-preparation';
import { createCodeBlockNodeView } from './code-block-node-view';
import MathBlockView from './math-block-view';
import MathInlineView from './math-inline-view';
import { readMarkdownFile } from './markdown-import';
import { pasteMarkdownIntoEmptyDocument } from './markdown-paste';
import {
    downloadMarkdown,
    serializeDocumentAsMarkdown,
} from './markdown-export';

type Props = {
    workspaceId: number;
    nodeId: number;
    title: string;
    content: EditorDocument;
    revision: number;
    cachedMermaidPreviews: SavedMermaidPreviews;
};

const lowlight = createLowlight(common);

function insertAttachment(
    editor: Editor,
    attachment: {
        id: number;
        name: string;
        mime_type: string;
        size_bytes: number;
    },
) {
    if (
        ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
            attachment.mime_type,
        )
    ) {
        editor
            .chain()
            .focus()
            .insertContent({
                type: 'image',
                attrs: { attachmentId: attachment.id, alt: attachment.name },
            })
            .run();
    } else {
        editor
            .chain()
            .focus()
            .insertContent({
                type: 'file',
                attrs: {
                    attachmentId: attachment.id,
                    name: attachment.name,
                    sizeBytes: attachment.size_bytes,
                },
            })
            .run();
    }
}

export default function DocumentEditor({
    workspaceId,
    nodeId,
    title,
    content,
    revision,
    cachedMermaidPreviews,
}: Props) {
    const searchTerm =
        new URLSearchParams(usePage().url.split('?')[1] ?? '').get('find') ??
        '';
    const pageSearch = usePageSearch();
    const [menu, setMenu] = useState<EditorMenu | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [matchCount, setMatchCount] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [importError, setImportError] = useState('');
    const [exportError, setExportError] = useState('');
    const fileInput = useRef<HTMLInputElement>(null);
    const markdownInput = useRef<HTMLInputElement>(null);
    const { status, error, navigationNotice, queueSave, saveNow } =
        useDocumentAutosave(workspaceId, nodeId, revision);

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                codeBlock: false,
                dropcursor: false,
                link: { openOnClick: false, autolink: true },
            }),
            BlockTextAlignment,
            TextColor,
            AutomaticBlockDirection,
            SelectBlockShortcut,
            IncrementalCodeBlockLowlight.configure({ lowlight }).extend({
                addNodeView() {
                    return createCodeBlockNodeView;
                },
            }),
            TableKit,
            TaskList,
            TaskItem.configure({ nested: true }),
            BlockMath.configure({
                katexOptions: { throwOnError: false, trust: false },
            }).extend({
                addNodeView() {
                    return ReactNodeViewRenderer(MathBlockView);
                },
            }),
            InlineMath.configure({
                katexOptions: { throwOnError: false, trust: false },
            }).extend({
                addNodeView() {
                    return ReactNodeViewRenderer(MathInlineView);
                },
            }),
            Placeholder.configure({
                placeholder: 'Write something, or press / for commands…',
            }),
            ...createMediaExtensions({
                workspaceId,
                nodeId,
                cachedMermaidPreviews,
            }),
            ...createSuggestionExtensions({
                workspaceId,
                onMenuChange: setMenu,
                onUpload: () => fileInput.current?.click(),
            }),
        ],
        [workspaceId, nodeId, content.content?.length, cachedMermaidPreviews],
    );

    const editor = useEditor(
        {
            extensions,
            content: content as JSONContent,
            immediatelyRender: false,
            textDirection: 'auto',
            editorProps: {
                attributes: {
                    class: 'orbium-editor min-h-[45vh] outline-none',
                },
                handlePaste(view, event) {
                    return pasteMarkdownIntoEmptyDocument(
                        view,
                        event,
                        setImportError,
                    );
                },
            },
            onUpdate: ({ editor: updatedEditor }) =>
                queueSave(updatedEditor.state.doc),
        },
        [extensions],
    );
    const { beginImport, cancelImport, progress, cacheError } =
        useMermaidCachePreparation(
            editor,
            status,
            cachedMermaidPreviews,
            workspaceId,
            nodeId,
        );

    useEffect(() => {
        if (!editor || !searchTerm) return;
        setSearchQuery(searchTerm);
        setSearchOpen(true);
        setMatchCount(selectNextMatch(editor, searchTerm));
    }, [editor, searchTerm]);

    useEffect(() => {
        if (!editor || !pageSearch.query.trim()) {
            pageSearch.setResultCount(null);
            return;
        }
        let timer: ReturnType<typeof setTimeout> | null = null;
        const refreshMatchCount = () =>
            pageSearch.setResultCount(
                countDocumentMatches(editor, pageSearch.query),
            );
        const scheduleMatchCount = () => {
            if (timer !== null) clearTimeout(timer);
            timer = setTimeout(refreshMatchCount, 150);
        };
        pageSearch.setResultCount(null);
        scheduleMatchCount();
        editor.on('update', scheduleMatchCount);
        return () => {
            if (timer !== null) clearTimeout(timer);
            editor.off('update', scheduleMatchCount);
        };
    }, [editor, pageSearch.query, pageSearch.setResultCount]);

    useEffect(() => {
        if (
            !editor ||
            !pageSearch.searchStep.query ||
            pageSearch.searchStep.id === 0
        )
            return;
        pageSearch.setResultCount(
            selectNextMatch(
                editor,
                pageSearch.searchStep.query,
                pageSearch.searchStep.previous,
            ),
        );
    }, [editor, pageSearch.searchStep, pageSearch.setResultCount]);

    async function addFiles(files: FileList | File[]) {
        if (!editor) return;
        setUploadError('');
        for (const file of Array.from(files)) {
            try {
                const uploaded = await uploadAttachment(
                    workspaceId,
                    nodeId,
                    file,
                );
                insertAttachment(editor, uploaded);
            } catch (failure) {
                setUploadError(
                    failure instanceof Error
                        ? failure.message
                        : 'Upload failed.',
                );
            }
        }
    }

    async function importMarkdown(file: File) {
        if (!editor) return;
        if (!editor.isEmpty) {
            setImportError(
                'Markdown import is available only in an empty document.',
            );
            return;
        }
        setImportError('');
        try {
            const imported = await readMarkdownFile(file);
            if (!editor.isEmpty) {
                setImportError('The document changed before import finished.');
                return;
            }
            const diagramCount =
                imported.content?.filter((block) => block.type === 'mermaid')
                    .length ?? 0;
            if (diagramCount > 0) {
                beginImport(diagramCount);
                await new Promise<void>((resolve) =>
                    window.setTimeout(resolve, 0),
                );
            }
            if (!editor.isEmpty) {
                cancelImport();
                setImportError('The document changed before import finished.');
                return;
            }
            editor.commands.setContent(imported);
        } catch (failure) {
            cancelImport();
            setImportError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not import the Markdown file.',
            );
        }
    }

    function exportMarkdown() {
        if (!editor) return;
        setExportError('');
        try {
            const markdown = serializeDocumentAsMarkdown(
                title,
                editor.getJSON() as EditorDocument,
                { workspaceId, nodeId, origin: window.location.origin },
            );
            downloadMarkdown(title, markdown);
        } catch (failure) {
            setExportError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not export the Markdown file.',
            );
        }
    }

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!editor) return;
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === 's'
            ) {
                event.preventDefault();
                saveNow();
            }
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === 'f'
            ) {
                event.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [editor, saveNow]);

    return (
        <div className="relative">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span aria-live="polite">
                        {status === 'saving'
                            ? 'Saving…'
                            : status === 'saved'
                              ? 'Saved'
                              : status === 'error'
                                ? 'Save failed'
                                : 'Unsaved changes'}
                    </span>
                    {status === 'error' && (
                        <button
                            type="button"
                            onClick={saveNow}
                            className="underline"
                        >
                            Retry
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {editor?.isEmpty && (
                        <button
                            type="button"
                            onClick={() => markdownInput.current?.click()}
                            className="flex items-center gap-1 rounded p-1 hover:bg-accent"
                        >
                            <FileInput size={16} /> Import Markdown
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={exportMarkdown}
                        disabled={!editor}
                        className="flex items-center gap-1 rounded p-1 hover:bg-accent disabled:opacity-50"
                    >
                        <Download size={16} /> Export Markdown
                    </button>
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        aria-label="Find in document"
                        className="rounded p-1 hover:bg-accent"
                    >
                        <Search size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="flex items-center gap-1 rounded p-1 hover:bg-accent"
                    >
                        <FileUp size={16} /> Add file
                    </button>
                </div>
            </div>
            {(error ||
                uploadError ||
                importError ||
                exportError ||
                cacheError ||
                navigationNotice) && (
                <p role="alert" className="mb-4 text-sm text-destructive">
                    {error ||
                        uploadError ||
                        importError ||
                        exportError ||
                        cacheError ||
                        navigationNotice}
                </p>
            )}
            <input
                ref={markdownInput}
                aria-label="Import Markdown file"
                type="file"
                accept=".md,.markdown,text/markdown"
                className="hidden"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0];
                    if (file) void importMarkdown(file);
                    event.target.value = '';
                }}
            />
            <input
                ref={fileInput}
                aria-label="Upload document file"
                type="file"
                multiple
                className="hidden"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    if (event.target.files) void addFiles(event.target.files);
                    event.target.value = '';
                }}
            />

            {searchOpen && editor && (
                <DocumentSearch
                    editor={editor}
                    query={searchQuery}
                    setQuery={setSearchQuery}
                    matchCount={matchCount}
                    setMatchCount={setMatchCount}
                    onClose={() => setSearchOpen(false)}
                />
            )}

            {editor && <SelectionToolbar editor={editor} />}

            {editor && (
                <EditorBlockGutter
                    editor={editor}
                    onFiles={(files) => void addFiles(files)}
                    onMentionOpen={(targetId) =>
                        router.visit(
                            `/workspaces/${workspaceId}/nodes/${targetId}`,
                        )
                    }
                />
            )}
            {progress && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm"
                    role="status"
                    aria-live="polite"
                >
                    <div className="rounded-xl border border-border bg-background px-8 py-6 text-center shadow-lg">
                        <p className="font-medium">Preparing diagrams…</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {progress.completed} of {progress.total}
                        </p>
                    </div>
                </div>
            )}
            {menu && editor && (
                <SuggestionMenu
                    menu={menu}
                    editor={editor}
                    onClose={() => setMenu(null)}
                />
            )}
            <p className="mt-10 text-xs text-muted-foreground">
                Type / for blocks, @ to mention, or use Markdown shortcuts.
            </p>
        </div>
    );
}
