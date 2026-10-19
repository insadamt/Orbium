import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/core';
import {
    boardWritingCommands,
    createWritingReplacement,
    markdownWritingCommand,
    type BoardWritingCommand,
} from './board-writing-commands';
import { nativeEditorData } from './board-native-editor-schema';
import { useBoardEditorAnchor } from './use-board-editor-anchor';
import type { BoardContentProps } from './board-text-block';

function readSlashQuery(editor: Editor) {
    const { doc, selection } = editor.state;
    if (
        editor.view.composing ||
        !selection.empty ||
        doc.childCount !== 1 ||
        selection.$from.parentOffset !== selection.$from.parent.content.size
    )
        return null;
    return (
        /^\/([a-z0-9 ]*)$/i.exec(
            doc.textBetween(0, doc.content.size, '\n', '\n'),
        )?.[1] ?? null
    );
}

function matchingWritingCommands(query: string) {
    const search = query
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/^h([1-3])$/, 'heading$1');
    return boardWritingCommands.filter((command) =>
        command.title.toLowerCase().replace(/\s+/g, '').includes(search),
    );
}

export function BoardWritingMenu({
    editor,
    ...props
}: BoardContentProps & { editor: Editor }) {
    const [query, setQuery] = useState<string | null>(null);
    const [dismissedQuery, setDismissedQuery] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const previousQuery = useRef<string | null>(null);
    const menuId = useId();
    const writableKind = ['text', 'heading', 'quote', 'callout'].includes(
        props.object.block_type,
    );
    const open =
        writableKind &&
        !props.readOnly &&
        query !== null &&
        dismissedQuery !== query;
    const commands = matchingWritingCommands(query ?? '');
    function apply(command: BoardWritingCommand, clearContent: boolean) {
        if (props.readOnly || editor.view.composing) return false;
        const content = clearContent
            ? []
            : (nativeEditorData(
                  props.object.block_type,
                  props.object.data,
                  editor.getJSON(),
              ).content ?? []);
        return props.onTransform(
            createWritingReplacement(command, content, props.object.data),
        );
    }
    useEffect(() => {
        const update = () => {
            const next = readSlashQuery(editor);
            if (next !== previousQuery.current) {
                previousQuery.current = next;
                setActiveIndex(0);
                setDismissedQuery(null);
            }
            setQuery(next);
        };
        editor.on('transaction', update);
        update();
        return () => {
            editor.off('transaction', update);
        };
    }, [editor]);
    useEffect(() => {
        const dom = editor.view.dom;
        if (open) {
            dom.dataset.boardSlashOpen = 'true';
            dom.setAttribute('aria-controls', menuId);
            if (commands.length)
                dom.setAttribute(
                    'aria-activedescendant',
                    `${menuId}-${activeIndex}`,
                );
        }
        const keydown = (event: KeyboardEvent) => {
            if (
                event.isComposing ||
                editor.view.composing ||
                event.getModifierState('AltGraph') ||
                props.readOnly ||
                !writableKind
            )
                return;
            //
            // React menu state can lag behind the current keystroke; accept commands against the live editor query.
            //
            const liveQuery = readSlashQuery(editor);
            const liveCommands = matchingWritingCommands(liveQuery ?? '');
            const liveIndex = liveQuery === query ? activeIndex : 0;
            const liveOpen = liveQuery !== null && liveQuery !== dismissedQuery;
            let handled = false;
            if (
                event.key === 'Backspace' &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey &&
                props.object.block_type !== 'text' &&
                editor.state.selection.empty &&
                !editor.state.doc.textContent &&
                editor.state.doc.firstChild?.content.size === 0
            ) {
                handled = apply(boardWritingCommands[0], false);
            } else if (
                event.key === ' ' &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey &&
                props.object.block_type === 'text'
            ) {
                const { selection } = editor.state;
                const { doc } = editor.state;
                const marker = doc.textBetween(0, doc.content.size, '\n', '\n');
                const command =
                    selection.empty &&
                    selection.$from.parentOffset === marker.length
                        ? markdownWritingCommand(marker)
                        : undefined;
                if (command) handled = apply(command, true);
            } else if (
                (event.ctrlKey || event.metaKey) &&
                event.altKey &&
                /^[0-3]$/.test(event.key)
            ) {
                const command = boardWritingCommands.find(
                    (item) =>
                        item.id ===
                        (event.key === '0' ? 'text' : `heading${event.key}`),
                );
                if (command) handled = apply(command, false);
            } else if (
                liveOpen &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey
            ) {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    setActiveIndex((index) =>
                        liveCommands.length
                            ? ((liveQuery === query ? index : 0) +
                                  (event.key === 'ArrowDown' ? 1 : -1) +
                                  liveCommands.length) %
                              liveCommands.length
                            : 0,
                    );
                    handled = true;
                } else if (event.key === 'Enter' && liveCommands[liveIndex])
                    handled = apply(liveCommands[liveIndex], true);
                else if (event.key === 'Escape') {
                    setDismissedQuery(liveQuery);
                    handled = true;
                }
            }
            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        const dismiss = (event: PointerEvent) => {
            if (!open || !(event.target instanceof Node)) return;
            if (
                dom.contains(event.target) ||
                document.getElementById(menuId)?.contains(event.target)
            )
                return;
            setDismissedQuery(query);
        };
        dom.addEventListener('keydown', keydown, true);
        document.addEventListener('pointerdown', dismiss);
        return () => {
            dom.removeEventListener('keydown', keydown, true);
            document.removeEventListener('pointerdown', dismiss);
            delete dom.dataset.boardSlashOpen;
            dom.removeAttribute('aria-controls');
            dom.removeAttribute('aria-activedescendant');
        };
    });
    if (!open) return null;
    return (
        <BoardWritingMenuSurface
            boardId={props.boardId}
            editor={editor}
            menuId={menuId}
            commands={commands}
            activeIndex={activeIndex}
            onChoose={(command) => apply(command, true)}
        />
    );
}

function BoardWritingMenuSurface({
    boardId,
    editor,
    menuId,
    commands,
    activeIndex,
    onChoose,
}: {
    boardId: number;
    editor: Editor;
    menuId: string;
    commands: BoardWritingCommand[];
    activeIndex: number;
    onChoose: (command: BoardWritingCommand) => boolean;
}) {
    const surface = useBoardEditorAnchor(editor, 'caret', boardId);
    useLayoutEffect(() => {
        const menu = surface.current;
        const option = menu?.querySelector<HTMLElement>(
            '[aria-selected="true"]',
        );
        if (!menu || !option) return;
        if (option.offsetTop < menu.scrollTop)
            menu.scrollTop = option.offsetTop;
        else if (
            option.offsetTop + option.offsetHeight >
            menu.scrollTop + menu.clientHeight
        )
            menu.scrollTop =
                option.offsetTop + option.offsetHeight - menu.clientHeight;
    }, [activeIndex, commands, surface]);
    return createPortal(
        <div
            ref={surface}
            id={menuId}
            data-board-editor
            className="board-writing-menu glass-surface"
            role="listbox"
            aria-label="Change block type"
        >
            <p>Change block type</p>
            {commands.map((command, index) => (
                <button
                    type="button"
                    role="option"
                    id={`${menuId}-${index}`}
                    aria-selected={index === activeIndex}
                    key={command.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onChoose(command)}
                >
                    {command.title}
                </button>
            ))}
            {!commands.length && <p>No matching block</p>}
        </div>,
        document.body,
    );
}
