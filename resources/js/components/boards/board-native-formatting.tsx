import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Popover } from 'radix-ui';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Link2,
} from 'lucide-react';
import { safeBoardLink } from './board-block-data';
import type { SelectionBookmark } from '@tiptap/pm/state';
import { useRef } from 'react';

export function BoardNativeFormatting({
    editor,
    disabled,
    onLinkOpenChange,
}: {
    editor: Editor;
    disabled: boolean;
    onLinkOpenChange?: (open: boolean) => void;
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
            role="toolbar"
            aria-label="Text formatting"
            onPointerDown={(event) => {
                if ((event.target as Element).closest('button'))
                    event.preventDefault();
            }}
        >
            {(
                [
                    ['bold', Bold],
                    ['italic', Italic],
                    ['underline', Underline],
                    ['strike', Strikethrough],
                    ['code', Code],
                ] as const
            ).map(([mark, Icon]) => (
                <button
                    type="button"
                    key={mark}
                    title={mark}
                    aria-label={mark}
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
                >
                    <Icon size={15} />
                </button>
            ))}
            <Popover.Root
                open={linkOpen}
                onOpenChange={(open) => {
                    if (open) openLink();
                    else setLinkOpen(false);
                }}
            >
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        aria-label="Edit link"
                        aria-pressed={editor.isActive('link')}
                        disabled={disabled}
                        onMouseDown={(event) => event.preventDefault()}
                    >
                        <Link2 size={15} />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        data-board-editor
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
    );
}
