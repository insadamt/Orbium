import { inlineIconInsertionMarks } from '@/components/inline-icons/inline-icon-node';
import {
    findInlineIcons,
    type InlineIconChoice,
} from '@/components/inline-icons/icon-catalog';
import { InlineIconGlyph } from '@/components/inline-icons/inline-icon-glyph';
import { legacyIconAttributes } from '@/components/inline-icons/inline-icon-node';
import { announceInsertedIcon } from '@/components/inline-icons/icon-preferences';
import { requestMindMapInlineIcon } from './mindmap-inline-icons';
import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Node, type Editor } from '@tiptap/core';
import {
    Smile,
    type LucideIcon,
    AlignLeft,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ListTodo,
    Quote,
    MessageSquare,
    Code,
} from 'lucide-react';

export const MindMapCallout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,
    parseHTML: () => [{ tag: 'aside[data-callout]' }],
    renderHTML: () => ['aside', { 'data-callout': '' }, 0],
});
type WritingCommand = {
    label: string;
    search: string;
    icon: LucideIcon;
    type: string;
    level?: number;
    choice?: InlineIconChoice;
};
const commands: WritingCommand[] = [
    {
        label: 'Inline icon',
        search: 'icon emoji symbol brand image',
        icon: Smile,
        type: 'inlineIcon',
    },
    {
        label: 'Text',
        search: 'paragraph plain',
        icon: AlignLeft,
        type: 'paragraph',
    },
    {
        label: 'Heading 1',
        search: 'h1 title',
        icon: Heading1,
        type: 'heading',
        level: 1,
    },
    {
        label: 'Heading 2',
        search: 'h2 subtitle',
        icon: Heading2,
        type: 'heading',
        level: 2,
    },
    {
        label: 'Heading 3',
        search: 'h3',
        icon: Heading3,
        type: 'heading',
        level: 3,
    },
    {
        label: 'Bullet list',
        search: 'unordered bullet',
        icon: List,
        type: 'bulletList',
    },
    {
        label: 'Numbered list',
        search: 'ordered number',
        icon: ListOrdered,
        type: 'orderedList',
    },
    {
        label: 'Checklist',
        search: 'task todo checkbox',
        icon: ListTodo,
        type: 'taskList',
    },
    { label: 'Quote', search: 'blockquote', icon: Quote, type: 'blockquote' },
    {
        label: 'Callout',
        search: 'note aside',
        icon: MessageSquare,
        type: 'callout',
    },
    {
        label: 'Code',
        search: 'code block programming',
        icon: Code,
        type: 'codeBlock',
    },
];
function readQuery(editor: Editor) {
    const { selection } = editor.state;
    if (
        editor.view.composing ||
        !selection.empty ||
        !selection.$from.parent.isTextblock ||
        editor.isActive('codeBlock') ||
        editor.isActive('code')
    )
        return null;
    const { $from } = selection;
    const prefix = $from.parent.textBetween(
        0,
        $from.parentOffset,
        undefined,
        '\n',
    );
    const slash = /^\/([a-z0-9 ]*)$/i.exec(prefix);
    if (slash && $from.parentOffset === $from.parent.content.size)
        return {
            mode: 'block' as const,
            query: slash[1],
            from: $from.start(),
            to: selection.from,
        };
    const colon = /(?:^|[\s([]):([a-z0-9_-]{0,40})$/i.exec(prefix);
    return colon
        ? {
              mode: 'icon' as const,
              query: colon[1],
              from: selection.from - colon[1].length - 1,
              to: selection.from,
          }
        : null;
}
function matches(query: string, mode = 'block'): WritingCommand[] {
    if (mode === 'icon')
        return [
            ...findInlineIcons(query)
                .slice(0, 10)
                .map((choice) => ({
                    label: choice.label,
                    search: choice.label,
                    icon: Smile,
                    type: 'iconChoice',
                    choice,
                })),
            {
                label: 'Browse all icons…',
                search: 'icons',
                icon: Smile,
                type: 'inlineIcon',
            },
        ];
    return commands.filter((command) =>
        `${command.label} ${command.search}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
    );
}
export function useMindMapWritingMenu(editor: Editor | null) {
    const menuId = useId();
    const [query, setQuery] = useState<ReturnType<typeof readQuery>>(null);
    const [dismissed, setDismissed] = useState<string | null>(null);
    const [active, setActive] = useState(0);
    const [surface, setSurface] = useState<HTMLElement | null>(null);
    const [position, setPosition] = useState({ left: 0, top: 0 });
    const menu = useRef<HTMLDivElement>(null);
    const filtered = matches(query?.query ?? '', query?.mode);
    const open = query !== null && dismissed !== `${query.from}:${query.query}`;
    useEffect(() => {
        if (!editor) return;
        const dialog = editor.view.dom.closest<HTMLElement>(
            '[data-mindmap-dialog]',
        );
        setSurface(dialog);
        let previous = '';
        const update = () => {
            const next = readQuery(editor);
            const key = next ? `${next.from}:${next.query}` : '';
            if (key !== previous) {
                setActive(0);
                setDismissed(null);
                previous = key;
            }
            setQuery(next);
            if (!next || !dialog) return;
            const bounds = dialog.getBoundingClientRect();
            const caret = editor.view.coordsAtPos(next.to);
            const height = Math.min(320, bounds.height - 24);
            setPosition({
                left: Math.max(
                    12,
                    Math.min(bounds.width - 244, caret.left - bounds.left),
                ),
                top: Math.max(
                    12,
                    Math.min(
                        bounds.height - height - 12,
                        caret.bottom - bounds.top + 8,
                    ),
                ),
            });
        };
        const dismiss = (event: PointerEvent) => {
            if (
                !editor.view.dom.contains(event.target as globalThis.Node) &&
                !menu.current?.contains(event.target as globalThis.Node)
            ) {
                const live = readQuery(editor);
                if (live) setDismissed(`${live.from}:${live.query}`);
            }
        };
        editor.on('transaction', update);
        dialog?.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        document.addEventListener('pointerdown', dismiss);
        update();
        return () => {
            editor.off('transaction', update);
            dialog?.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
            document.removeEventListener('pointerdown', dismiss);
        };
    }, [editor]);
    useLayoutEffect(() => {
        const surface = menu.current;
        const option = surface?.querySelector<HTMLElement>(
            '[aria-selected="true"]',
        );
        if (!surface || !option) return;
        if (option.offsetTop < surface.scrollTop)
            surface.scrollTop = option.offsetTop;
        else if (
            option.offsetTop + option.offsetHeight >
            surface.scrollTop + surface.clientHeight
        )
            surface.scrollTop =
                option.offsetTop + option.offsetHeight - surface.clientHeight;
    }, [active, open]);
    useEffect(() => {
        if (!editor) return;
        const dom = editor.view.dom;
        if (open) {
            dom.setAttribute('aria-controls', menuId);
            if (filtered.length)
                dom.setAttribute(
                    'aria-activedescendant',
                    `${menuId}-${active}`,
                );
        }
        return () => {
            dom.removeAttribute('aria-controls');
            dom.removeAttribute('aria-activedescendant');
        };
    }, [editor, open, active, filtered.length, menuId]);
    function choose(command: (typeof commands)[number]) {
        if (!editor || editor.view.composing) return;
        const live = readQuery(editor);
        if (!live) return;
        if (command.type === 'inlineIcon') {
            setDismissed(`${live.from}:${live.query}`);
            requestMindMapInlineIcon(
                editor,
                live.mode === 'icon' ? live.query : '',
                { from: live.from, to: live.to },
            );
            return;
        }
        const chain = editor
            .chain()
            .focus()
            .deleteRange({ from: live.from, to: live.to })
            .setMeta('boardAction', true);
        if (command.type === 'iconChoice' && command.choice) {
            const choice = command.choice;
            chain
                .insertContent(
                    choice.kind === 'emoji'
                        ? { type: 'text', text: choice.value }
                        : {
                              type: 'inlineIcon',
                              marks: inlineIconInsertionMarks(editor),
                              attrs: legacyIconAttributes(choice),
                          },
                )
                .run();
            announceInsertedIcon(editor.view.dom, choice);
        } else if (command.type === 'heading')
            chain.setHeading({ level: command.level as 1 | 2 | 3 }).run();
        else if (command.type === 'bulletList') chain.toggleBulletList().run();
        else if (command.type === 'orderedList')
            chain.toggleOrderedList().run();
        else if (command.type === 'taskList') chain.toggleTaskList().run();
        else if (command.type === 'blockquote' || command.type === 'callout')
            chain.wrapIn(command.type).run();
        else if (command.type === 'codeBlock')
            chain.setCodeBlock({ language: 'plaintext' }).run();
        else chain.setParagraph().run();
    }
    function onKeyDown(event: KeyboardEvent): boolean {
        if (
            !editor ||
            event.nativeEvent.isComposing ||
            editor.view.composing ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
        )
            return false;
        //
        // Resolve against the live selection because a rapid keystroke can arrive before React renders the menu.
        //
        const live = readQuery(editor);
        if (!live || dismissed === `${live.from}:${live.query}`) return false;
        const options = matches(live.query, live.mode);
        const index =
            live.query === query?.query && live.from === query.from
                ? active
                : 0;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
            setActive(
                options.length
                    ? (index +
                          (event.key === 'ArrowDown' ? 1 : -1) +
                          options.length) %
                          options.length
                    : 0,
            );
        else if (event.key === 'Enter' || event.key === 'Tab') {
            if (options[index]) choose(options[index]);
        } else if (event.key === 'Escape')
            setDismissed(`${live.from}:${live.query}`);
        else return false;
        event.preventDefault();
        event.stopPropagation();
        return true;
    }
    const popup =
        open && surface
            ? createPortal(
                  <div
                      ref={menu}
                      id={menuId}
                      role="listbox"
                      aria-label={
                          query?.mode === 'icon'
                              ? 'Insert inline icon'
                              : 'Branch text type'
                      }
                      className="mindmap-writing-menu"
                      style={position}
                      onPointerDown={(event) => event.preventDefault()}
                  >
                      <p>
                          {query?.mode === 'icon'
                              ? 'Emoji & icons'
                              : 'Text type'}
                      </p>
                      {filtered.map((command, index) => (
                          <button
                              key={command.label}
                              id={`${menuId}-${index}`}
                              type="button"
                              role="option"
                              aria-selected={active === index}
                              onClick={() => choose(command)}
                          >
                              {command.choice ? (
                                  <InlineIconGlyph
                                      choice={command.choice}
                                      workspaceId={0}
                                      nodeId={0}
                                  />
                              ) : (
                                  <command.icon size={16} />
                              )}
                              <span>{command.label}</span>
                          </button>
                      ))}
                      {!filtered.length && <p>No matching text type</p>}
                  </div>,
                  surface,
              )
            : null;
    return { onKeyDown, popup };
}
