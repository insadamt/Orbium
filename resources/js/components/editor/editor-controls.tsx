import type { Editor } from '@tiptap/core';
import type { Node as DocumentSnapshot } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { BubbleMenu } from '@tiptap/react/menus';
import {
    Bold,
    Code2,
    Italic,
    Link2,
    Search,
    Strikethrough,
    Underline,
} from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { EditorMenu } from './editor-suggestions';
import { TextColorPicker } from './text-color-picker';

export function changeBlockOrder(
    editor: Editor,
    from: number,
    to: number,
    duplicate = false,
) {
    const { doc, tr } = editor.state;
    if (
        from < 0 ||
        from >= doc.childCount ||
        to < 0 ||
        to > doc.childCount ||
        (!duplicate && to >= doc.childCount)
    )
        return;
    let sourcePosition = 0;
    for (let index = 0; index < from; index++)
        sourcePosition += doc.child(index).nodeSize;
    const source = doc.child(from);
    if (!duplicate) tr.delete(sourcePosition, sourcePosition + source.nodeSize);
    let destinationPosition = 0;
    for (let index = 0; index < to; index++)
        destinationPosition += tr.doc.child(index).nodeSize;
    tr.insert(destinationPosition, source);
    editor.view.dispatch(tr.scrollIntoView());
}

const documentMatchCache = new WeakMap<
    Editor,
    { document: DocumentSnapshot; query: string; positions: number[] }
>();

function findDocumentMatches(editor: Editor, query: string): number[] {
    if (!query) return [];
    const document = editor.state.doc;
    const cached = documentMatchCache.get(editor);
    if (cached?.document === document && cached.query === query)
        return cached.positions;
    const matches: number[] = [];
    const needle = query.toLocaleLowerCase();
    document.descendants((node, pos) => {
        if (!node.isText || !node.text) return;
        const text = node.text.toLocaleLowerCase();
        let start = 0;
        while ((start = text.indexOf(needle, start)) !== -1) {
            matches.push(pos + start);
            start += needle.length;
        }
    });
    documentMatchCache.set(editor, { document, query, positions: matches });
    return matches;
}

export function countDocumentMatches(editor: Editor, query: string): number {
    return findDocumentMatches(editor, query).length;
}

export function selectNextMatch(
    editor: Editor,
    query: string,
    previous = false,
): number {
    const matches = findDocumentMatches(editor, query);
    const current = editor.state.selection.from;
    const found = previous
        ? (matches.findLast((pos) => pos < current) ?? matches.at(-1))
        : (matches.find((pos) => pos > current) ?? matches[0]);
    if (found !== undefined)
        editor
            .chain()
            .focus()
            .setTextSelection({ from: found, to: found + query.length })
            .scrollIntoView()
            .run();
    return matches.length;
}

export function DocumentSearch({
    editor,
    query,
    setQuery,
    matchCount,
    setMatchCount,
    onClose,
}: {
    editor: Editor;
    query: string;
    setQuery: (value: string) => void;
    matchCount: number;
    setMatchCount: (count: number) => void;
    onClose: () => void;
}) {
    return (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
            <Search size={16} />
            <input
                autoFocus
                aria-label="Search this document"
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setMatchCount(
                        countDocumentMatches(editor, event.target.value),
                    );
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter')
                        setMatchCount(
                            selectNextMatch(editor, query, event.shiftKey),
                        );
                    if (event.key === 'Escape') onClose();
                }}
                className="min-w-40 flex-1 bg-transparent outline-none"
                placeholder="Find in this document"
            />
            <span>{matchCount} matches</span>
            <button type="button" onClick={() => onClose()}>
                Close
            </button>
        </div>
    );
}

export function SelectionToolbar({
    editor,
    active = true,
}: {
    editor: Editor;
    active?: boolean;
}) {
    const activeTab = useRef(active);
    activeTab.current = active;
    const shouldShow = useCallback(
        () => activeTab.current && canFormatTextSelection(editor),
        [editor],
    );
    return (
        <BubbleMenu
            editor={editor}
            shouldShow={shouldShow}
            style={{ display: active ? undefined : 'none' }}
            className="glass-surface flex items-center gap-1 rounded-xl border border-border p-1 shadow-lg"
        >
            <FormatButton
                label="Bold"
                active={editor.isActive('bold')}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold size={16} />
            </FormatButton>
            <FormatButton
                label="Italic"
                active={editor.isActive('italic')}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic size={16} />
            </FormatButton>
            <FormatButton
                label="Underline"
                active={editor.isActive('underline')}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                <Underline size={16} />
            </FormatButton>
            <FormatButton
                label="Strike"
                active={editor.isActive('strike')}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            >
                <Strikethrough size={16} />
            </FormatButton>
            <FormatButton
                label="Inline code"
                active={editor.isActive('code')}
                onClick={() => editor.chain().focus().toggleCode().run()}
            >
                <Code2 size={16} />
            </FormatButton>
            <FormatButton
                label="Link"
                active={editor.isActive('link')}
                onClick={() => {
                    const href = window.prompt(
                        'Link URL (https://, http:// or mailto:)',
                    );
                    if (href && /^(https?:\/\/|mailto:)/i.test(href))
                        editor.chain().focus().setLink({ href }).run();
                }}
            >
                <Link2 size={16} />
            </FormatButton>
            <TextColorPicker editor={editor} />
        </BubbleMenu>
    );
}

function canFormatTextSelection(editor: Editor): boolean {
    const { selection, doc, schema } = editor.state;
    if (
        !editor.isEditable ||
        !(selection instanceof TextSelection) ||
        selection.empty
    )
        return false;

    let containsText = false;
    let supportsFormatting = true;
    doc.nodesBetween(selection.from, selection.to, (node) => {
        if (node.isText && node.text?.length) containsText = true;
        if (
            (node.isTextblock &&
                !node.type.allowsMarkType(schema.marks.bold)) ||
            (node.isAtom && !node.isText)
        ) {
            supportsFormatting = false;
        }
    });

    return containsText && supportsFormatting;
}

function FormatButton({
    label,
    active,
    onClick,
    children,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={`rounded p-2 ${active ? 'bg-accent' : 'hover:bg-accent'}`}
        >
            {children}
        </button>
    );
}

export function SuggestionMenu({
    menu,
    editor,
    onClose,
}: {
    menu: EditorMenu;
    editor: Editor;
    onClose: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const items =
        menu.type === 'slash'
            ? menu.items.map((item) => ({
                  label: item.label,
                  action: () => {
                      editor
                          .chain()
                          .focus()
                          .deleteRange({ from: menu.from, to: menu.to })
                          .run();
                      item.run(editor);
                      onClose();
                  },
              }))
            : menu.items.map((item) => ({
                  label: `${item.title} · ${item.type}`,
                  action: () => {
                      editor
                          .chain()
                          .focus()
                          .insertContentAt(
                              { from: menu.from, to: menu.to },
                              {
                                  type: 'mention',
                                  attrs: {
                                      id: String(item.id),
                                      label: item.title,
                                  },
                              },
                          )
                          .run();
                      onClose();
                  },
              }));
    const viewportHeight =
        typeof window === 'undefined' ? 768 : window.innerHeight;
    const anchorTop = menu.rect?.top ?? 150;
    const anchorBottom = menu.rect?.bottom ?? 150;
    const spaceBelow = viewportHeight - anchorBottom - 16;
    const spaceAbove = anchorTop - 16;
    const expectedHeight = Math.min(288, Math.max(items.length, 1) * 36 + 8);
    const openAbove = spaceBelow < expectedHeight && spaceAbove > spaceBelow;
    const availableHeight = openAbove ? spaceAbove : spaceBelow;
    const anchorNode = editor.view.domAtPos(menu.from).node;
    const anchorElement =
        anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
    const isRtl =
        anchorElement !== null &&
        getComputedStyle(anchorElement).direction === 'rtl';
    const menuWidth = Math.min(256, window.innerWidth - 16);
    const preferredLeft = isRtl
        ? (menu.rect?.right ?? 50) - menuWidth
        : (menu.rect?.left ?? 50);
    const left = Math.max(
        8,
        Math.min(preferredLeft, window.innerWidth - menuWidth - 8),
    );

    useEffect(() => {
        const menuElement = menuRef.current;
        const selectedOption = menuElement?.querySelector<HTMLElement>(
            '[aria-selected="true"]',
        );
        if (!menuElement || !selectedOption) return;

        const menuBounds = menuElement.getBoundingClientRect();
        const optionBounds = selectedOption.getBoundingClientRect();
        const visibleTop = menuBounds.top + menuElement.clientTop;
        const visibleBottom = menuBounds.bottom - menuElement.clientTop;
        if (optionBounds.top < visibleTop) {
            menuElement.scrollTop -= visibleTop - optionBounds.top;
        } else if (optionBounds.bottom > visibleBottom) {
            menuElement.scrollTop += optionBounds.bottom - visibleBottom;
        }
    }, [menu]);

    return createPortal(
        <div
            ref={menuRef}
            role="listbox"
            aria-label={
                menu.type === 'slash' ? 'Block commands' : 'Mention items'
            }
            className="glass-surface fixed z-50 max-h-72 w-64 max-w-[calc(100vw-16px)] overflow-auto rounded-xl border border-border p-1 shadow-xl"
            style={{
                left,
                maxHeight: Math.max(48, Math.min(288, availableHeight)),
                ...(openAbove
                    ? { bottom: viewportHeight - anchorTop + 8 }
                    : { top: anchorBottom + 8 }),
            }}
        >
            {items.length === 0 && (
                <p className="p-3 text-xs text-muted-foreground">No matches</p>
            )}
            {items.map((item, index) => (
                <button
                    key={item.label}
                    type="button"
                    role="option"
                    aria-selected={index === menu.selectedIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={item.action}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent ${index === menu.selectedIndex ? 'bg-accent' : ''}`}
                >
                    {item.label}
                </button>
            ))}
        </div>,
        document.body,
    );
}
