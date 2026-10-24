import type { PageMentionCandidate } from '@/components/editor/mention-candidates';
import {
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
    type MutableRefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/core';
import {
    AtSign,
    FileText,
    Database,
    PanelsTopLeft,
    Folder,
} from 'lucide-react';
import { BoardPageInsertionContext } from './board-page-insertion-context';
import { useBoardEditorAnchor } from './use-board-editor-anchor';
import { useBoardPageSearch } from './use-board-page-search';
import type { BoardContentProps } from './board-text-block';

function readMentionQuery(editor: Editor) {
    const { empty, $from, from } = editor.state.selection;
    if (
        !empty ||
        !editor.isFocused ||
        !editor.isEditable ||
        editor.isActive('link') ||
        editor.view.composing ||
        editor.isActive('code')
    )
        return null;
    const before = $from.parent.textBetween(
        0,
        $from.parentOffset,
        '\n',
        '\ufffc',
    );
    const match = /(?:^|[\s(])@([^@\n\ufffc]{0,120})$/.exec(before);
    if (!match) return null;
    const start = from - match[1].length - 1;
    if (
        editor.state.doc.rangeHasMark(
            start,
            start + 1,
            editor.schema.marks.link,
        )
    )
        return null;
    return { from: start, to: from, query: match[1] };
}

export function BoardPageMentions({
    editor,
    props,
    keyHandler,
}: {
    editor: Editor;
    props: BoardContentProps;
    keyHandler: MutableRefObject<((event: KeyboardEvent) => boolean) | null>;
}) {
    const insertion = useContext(BoardPageInsertionContext);
    const [mention, setMention] = useState(() => readMentionQuery(editor));
    const dismissed = useRef<string | null>(null);
    const [documentsOnly, setDocumentsOnly] = useState(false);
    const [selected, setSelected] = useState(0);
    const listId = useId();
    const signature = mention
        ? `${mention.from}:${mention.to}:${mention.query}`
        : '';
    const open = Boolean(
        mention && dismissed.current !== signature && !props.readOnly,
    );
    const results = useBoardPageSearch({
        workspaceId: props.workspaceId,
        boardId: props.boardId,
        query: mention?.query ?? '',
        documentsOnly,
        enabled: open,
    });
    const visible = results.resources.slice(0, 8);
    useEffect(() => {
        const update = () => {
            const next = readMentionQuery(editor);
            if (!next) dismissed.current = null;
            setMention(next);
            setSelected(0);
        };
        const blur = () => {
            dismissed.current = signature;
            setMention(null);
        };
        editor.on('transaction', update);
        editor.on('focus', update);
        editor.on('blur', blur);
        return () => {
            editor.off('transaction', update);
            editor.off('focus', update);
            editor.off('blur', blur);
        };
    }, [editor, signature]);
    function choose(resource: PageMentionCandidate) {
        const current = readMentionQuery(editor);
        if (
            !current ||
            !mention ||
            current.from !== mention.from ||
            current.to !== mention.to ||
            current.query !== mention.query
        )
            return;
        if (documentsOnly) {
            if (
                resource.type !== 'document' ||
                !insertion?.insertDocument(resource.id, props.object.id)
            )
                return;
        }
        //
        // Use the existing safe-link format so Board references survive older readers without adding Document mention-index ownership.
        //
        const content = documentsOnly
            ? []
            : [
                  {
                      type: 'text',
                      text: `@${resource.title}`,
                      marks: [{ type: 'link', attrs: { href: resource.url } }],
                  },
                  { type: 'text', text: ' ', marks: [] },
              ];
        dismissed.current = signature;
        editor
            .chain()
            .command(({ tr }) => {
                tr.setMeta('boardAction', true);
                return true;
            })
            .insertContentAt({ from: current.from, to: current.to }, content)
            .run();
        setMention(null);
    }
    useEffect(() => {
        keyHandler.current = (event) => {
            if (!open) return false;
            if (event.key === 'Escape') {
                dismissed.current = signature;
                setMention(null);
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                const delta = event.key === 'ArrowDown' ? 1 : -1;
                setSelected(
                    (index) =>
                        (index + delta + Math.max(1, visible.length)) %
                        Math.max(1, visible.length),
                );
            } else if (event.key === 'Tab') {
                setDocumentsOnly((value) => !value);
                setSelected(0);
            } else if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.ctrlKey &&
                !event.metaKey
            ) {
                if (visible[selected]) choose(visible[selected]);
            } else return false;
            event.preventDefault();
            event.stopPropagation();
            return true;
        };
        return () => {
            keyHandler.current = null;
        };
    });
    useEffect(() => {
        if (!open) return;
        document
            .getElementById(`${listId}-${selected}`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [selected, open, listId]);
    useEffect(() => {
        const dom = editor.view.dom;
        if (open) {
            dom.setAttribute('aria-autocomplete', 'list');
            dom.setAttribute('aria-controls', listId);
            dom.setAttribute('aria-expanded', 'true');
            if (visible[selected])
                dom.setAttribute(
                    'aria-activedescendant',
                    `${listId}-${selected}`,
                );
        }
        return () => {
            for (const attribute of [
                'aria-autocomplete',
                'aria-controls',
                'aria-expanded',
                'aria-activedescendant',
            ])
                dom.removeAttribute(attribute);
        };
    }, [editor, open, listId, selected, visible]);
    return open ? (
        <BoardMentionPopover editor={editor} boardId={props.boardId}>
            <div
                className="board-page-mention-modes"
                role="group"
                aria-label="Insert page as"
            >
                <button
                    type="button"
                    aria-pressed={!documentsOnly}
                    onClick={() => {
                        setDocumentsOnly(false);
                        setSelected(0);
                    }}
                >
                    <AtSign size={14} />
                    Mention
                </button>
                <button
                    type="button"
                    aria-pressed={documentsOnly}
                    onClick={() => {
                        setDocumentsOnly(true);
                        setSelected(0);
                    }}
                >
                    <FileText size={14} />
                    Inline Document
                </button>
            </div>
            <div
                role="listbox"
                aria-label={
                    documentsOnly ? 'Documents to embed' : 'Pages to mention'
                }
                id={listId}
                aria-busy={results.loading}
            >
                {visible.map((resource, index) => {
                    const Icon =
                        resource.type === 'document'
                            ? FileText
                            : resource.type === 'database'
                              ? Database
                              : resource.type === 'folder'
                                ? Folder
                                : PanelsTopLeft;
                    return (
                        <button
                            type="button"
                            role="option"
                            aria-selected={selected === index}
                            key={resource.id}
                            id={`${listId}-${index}`}
                            onPointerMove={() => setSelected(index)}
                            onClick={() => choose(resource)}
                        >
                            <Icon size={16} />
                            <span>
                                <strong>{resource.title}</strong>
                                <small>
                                    {resource.parent_title ?? 'Workspace root'}{' '}
                                    · {resource.type}
                                </small>
                            </span>
                        </button>
                    );
                })}
            </div>
            {results.error ? (
                <p role="alert">{results.error}</p>
            ) : results.loading ? (
                <p role="status">Finding pages…</p>
            ) : !visible.length ? (
                <p role="status">
                    No matching {documentsOnly ? 'Documents' : 'pages'}.
                </p>
            ) : null}
            <p className="board-page-mention-help">
                ↑↓ choose · Enter insert · Tab switch · Esc dismiss
            </p>
        </BoardMentionPopover>
    ) : null;
}

function BoardMentionPopover({
    editor,
    boardId,
    children,
}: {
    editor: Editor;
    boardId: number;
    children: React.ReactNode;
}) {
    const anchor = useBoardEditorAnchor(editor, 'caret', boardId);
    return createPortal(
        <div
            ref={anchor}
            hidden
            className="board-page-mentions glass-surface"
            data-board-editor
            data-board-interactive
            onPointerDown={(event) => event.preventDefault()}
        >
            {children}
        </div>,
        document.body,
    );
}
