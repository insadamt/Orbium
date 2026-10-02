import type { Editor, JSONContent } from '@tiptap/core';
import { router, usePage } from '@inertiajs/react';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { FileUp, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import 'katex/dist/katex.min.css';
import EditorBlockGutter from './editor-block-gutter';
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
import {
    createSuggestionExtensions,
    type EditorMenu,
} from './editor-suggestions';
import { useDocumentAutosave } from './use-document-autosave';
import CodeBlockView from './code-block-view';
import MathBlockView from './math-block-view';
import MathInlineView from './math-inline-view';

type Props = {
    workspaceId: number;
    nodeId: number;
    content: EditorDocument;
    revision: number;
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
    content,
    revision,
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
    const fileInput = useRef<HTMLInputElement>(null);
    const { status, error, navigationNotice, queueSave, saveNow } =
        useDocumentAutosave(workspaceId, nodeId, revision);

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                codeBlock: false,
                dropcursor: false,
                link: { openOnClick: false, autolink: true },
            }),
            SelectBlockShortcut,
            CodeBlockLowlight.configure({ lowlight }).extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockView);
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
            ...createMediaExtensions({ workspaceId, nodeId }),
            ...createSuggestionExtensions({
                workspaceId,
                onMenuChange: setMenu,
                onUpload: () => fileInput.current?.click(),
            }),
        ],
        [workspaceId, nodeId],
    );

    const editor = useEditor(
        {
            extensions,
            content: content as JSONContent,
            immediatelyRender: false,
            editorProps: {
                attributes: {
                    class: 'orbium-editor min-h-[45vh] outline-none',
                },
            },
            onUpdate: ({ editor: updatedEditor }) =>
                queueSave(updatedEditor.state.doc),
        },
        [extensions],
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
            {(error || uploadError || navigationNotice) && (
                <p role="alert" className="mb-4 text-sm text-destructive">
                    {error || uploadError || navigationNotice}
                </p>
            )}
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
