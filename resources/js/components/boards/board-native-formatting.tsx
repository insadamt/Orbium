import { openLegacyIconPicker } from '@/components/inline-icons/inline-icon-node';
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Popover } from 'radix-ui';
import {
    Smile,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Link2,
    Check,
} from 'lucide-react';
import { BoardTextColorPicker } from './board-text-color-picker';
import { BoardToolButton } from './board-tool-button';
import { safeBoardLink } from './board-block-data';
import type { SelectionBookmark } from '@tiptap/pm/state';
import { useRef } from 'react';

export function BoardNativeFormatting({
    editor,
    disabled,
    onLinkOpenChange,
    onFinish,
    fullscreen = false,
}: {
    editor: Editor;
    disabled: boolean;
    onLinkOpenChange?: (open: boolean) => void;
    onFinish: () => void;
    fullscreen?: boolean;
}) {
    const [linkOpen, setLinkOpen] = useState(false);
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const linkSelection = useRef<SelectionBookmark | null>(null);
    useEffect(() => onLinkOpenChange?.(linkOpen), [linkOpen, onLinkOpenChange]);
    function openLink() {
        linkSelection.current = editor.state.selection.getBookmark();
        setAddress(editor.getAttributes('link').href ?? 'https://');
        setError('');
        setLinkOpen(true);
    }
    useEffect(() => {
        const dom = editor.view.dom;
        const keydown = (event: KeyboardEvent) => {
            if (
                disabled ||
                event.isComposing ||
                !(event.ctrlKey || event.metaKey) ||
                event.altKey ||
                event.key.toLowerCase() !== 'k'
            )
                return;
            event.preventDefault();
            event.stopPropagation();
            setAddress(editor.getAttributes('link').href ?? 'https://');
            linkSelection.current = editor.state.selection.getBookmark();
            setError('');
            setLinkOpen(true);
        };
        dom.addEventListener('keydown', keydown);
        return () => dom.removeEventListener('keydown', keydown);
    }, [editor, disabled]);
    function applyLink(remove = false) {
        const href = address.trim();
        if (!remove && !safeBoardLink(href)) {
            setError('Enter a valid link address.');
            return;
        }
        const selection = linkSelection.current?.resolve(editor.state.doc);
        if (selection)
            editor.view.dispatch(editor.state.tr.setSelection(selection));
        const chain = editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .extendMarkRange('link')
            .command(({ tr }) => {
                tr.setMeta('boardAction', true);
                return true;
            });
        if (remove) chain.unsetLink().run();
        else chain.setLink({ href }).run();
        setLinkOpen(false);
    }
    return (
        <div
            className="board-inline-toolbar"
            role="group"
            aria-label="Text formatting"
            onPointerDown={(event) => {
                if ((event.target as Element).closest('button'))
                    event.preventDefault();
            }}
        >
            {editor.schema.nodes.inlineIcon && (
                <BoardToolButton
                    label="Insert inline icon"
                    icon={Smile}
                    disabled={
                        disabled ||
                        editor.isActive('codeBlock') ||
                        editor.isActive('code')
                    }
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openLegacyIconPicker(editor)}
                />
            )}
            {(
                [
                    [
                        ['bold', Bold, 'Bold', 'Ctrl/Cmd+B'],
                        ['italic', Italic, 'Italic', 'Ctrl/Cmd+I'],
                        ['underline', Underline, 'Underline', 'Ctrl/Cmd+U'],
                    ],
                    [
                        ['strike', Strikethrough, 'Strikethrough', undefined],
                        ['code', Code, 'Inline code', undefined],
                    ],
                ] as const
            ).map((group, index) => (
                <div
                    className="board-toolbar-group"
                    role="group"
                    aria-label={
                        index === 0 ? 'Text emphasis' : 'Text decoration'
                    }
                    key={index}
                >
                    {group.map(([mark, Icon, label, shortcut]) => (
                        <BoardToolButton
                            tooltipClassName={
                                fullscreen ? 'mindmap-tool-tooltip' : undefined
                            }
                            key={mark}
                            label={label}
                            icon={Icon}
                            shortcut={shortcut}
                            aria-pressed={editor.isActive(mark)}
                            disabled={disabled}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() =>
                                editor
                                    .chain()
                                    .focus(undefined, { scrollIntoView: false })
                                    .command(({ tr }) => {
                                        tr.setMeta('boardAction', true);
                                        return true;
                                    })
                                    .toggleMark(mark)
                                    .run()
                            }
                        />
                    ))}
                </div>
            ))}
            <div className="board-toolbar-group" role="group" aria-label="Link">
                <Popover.Root
                    open={linkOpen}
                    onOpenChange={(open) => {
                        if (open) openLink();
                        else setLinkOpen(false);
                    }}
                >
                    <Popover.Trigger asChild>
                        <BoardToolButton
                            tooltipClassName={
                                fullscreen ? 'mindmap-tool-tooltip' : undefined
                            }
                            label="Edit link"
                            icon={Link2}
                            shortcut="Ctrl/Cmd+K"
                            aria-pressed={editor.isActive('link')}
                            disabled={disabled}
                            onMouseDown={(event) => event.preventDefault()}
                        />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content
                            data-board-editor
                            data-mindmap-link-popover={fullscreen || undefined}
                            onKeyDown={(event) => {
                                if (
                                    fullscreen &&
                                    (event.ctrlKey || event.metaKey)
                                )
                                    event.stopPropagation();
                            }}
                            className="board-link-popover glass-surface"
                            sideOffset={10}
                            collisionPadding={12}
                            onCloseAutoFocus={(event) => {
                                event.preventDefault();
                                if (!editor.isDestroyed)
                                    editor.commands.focus(undefined, {
                                        scrollIntoView: false,
                                    });
                            }}
                        >
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (!disabled) applyLink();
                                }}
                            >
                                <label>
                                    Link address
                                    <input
                                        aria-label="Link address"
                                        value={address}
                                        disabled={disabled}
                                        onChange={(event) => {
                                            setAddress(event.target.value);
                                            setError('');
                                        }}
                                        placeholder="https://example.com"
                                        autoComplete="off"
                                        spellCheck={false}
                                    />
                                </label>
                                {error && <p role="alert">{error}</p>}
                                <div>
                                    <button type="submit" disabled={disabled}>
                                        Apply
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            disabled || !editor.isActive('link')
                                        }
                                        onClick={() => applyLink(true)}
                                    >
                                        Remove link
                                    </button>
                                </div>
                            </form>
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            </div>
            <div
                className="board-toolbar-group"
                role="group"
                aria-label="Text color"
            >
                <BoardTextColorPicker editor={editor} disabled={disabled} />
            </div>
            <div
                className="board-toolbar-group"
                role="group"
                aria-label="Editing"
            >
                <BoardToolButton
                    tooltipClassName={
                        fullscreen ? 'mindmap-tool-tooltip' : undefined
                    }
                    label="Finish editing"
                    shortcut="Ctrl/Cmd+Enter"
                    icon={Check}
                    disabled={disabled}
                    data-done="true"
                    onClick={onFinish}
                />
            </div>
        </div>
    );
}
