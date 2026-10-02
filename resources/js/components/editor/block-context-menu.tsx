import type { Editor } from '@tiptap/core';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowDown,
    ArrowUp,
    Copy,
    Files,
    Trash2,
} from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { blockFormatting, setBlockAlignment } from './block-formatting';
import { changeBlockOrder } from './editor-controls';
import { findBlockCommands } from './editor-commands';

type Props = {
    editor: Editor;
    index: number;
    anchor: { x: number; y: number };
    onClose: () => void;
};

const convertibleBlocks = new Set([
    'Text',
    'Heading 1',
    'Heading 2',
    'Heading 3',
    'Bullet list',
    'Numbered list',
    'Checklist',
    'Quote',
    'Code',
]);

function blockStart(editor: Editor, index: number): number {
    let position = 0;
    for (let blockIndex = 0; blockIndex < index; blockIndex++)
        position += editor.state.doc.child(blockIndex).nodeSize;
    return position;
}

function deleteBlock(editor: Editor, index: number): void {
    const { doc, schema, tr } = editor.state;
    const position = blockStart(editor, index);
    tr.delete(position, position + doc.child(index).nodeSize);
    if (tr.doc.childCount === 0) tr.insert(0, schema.nodes.paragraph.create());
    editor.view.dispatch(tr.scrollIntoView());
}

export default function BlockContextMenu({
    editor,
    index,
    anchor,
    onClose,
}: Props) {
    const menuRef = useRef<HTMLDivElement>(null);
    const formatting = blockFormatting(editor, index);
    const blockCount = editor.state.doc.childCount;

    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const bounds = menu.getBoundingClientRect();
        menu.style.left = `${Math.max(8, Math.min(anchor.x, window.innerWidth - bounds.width - 8))}px`;
        menu.style.top = `${Math.max(8, Math.min(anchor.y, window.innerHeight - bounds.height - 8))}px`;
        menu.style.visibility = 'visible';
        menu.querySelector<HTMLSelectElement>('select')?.focus({
            preventScroll: true,
        });
    }, [anchor]);

    function perform(action: () => void): void {
        action();
        onClose();
    }

    return (
        <div
            ref={menuRef}
            role="dialog"
            aria-label="Block options"
            data-block-context-menu
            className="glass-surface fixed z-50 max-h-[calc(100vh-16px)] w-64 overflow-y-auto rounded-xl border border-border p-2 text-sm text-foreground shadow-xl"
            style={{ left: anchor.x, top: anchor.y, visibility: 'hidden' }}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    onClose();
                    editor.commands.focus();
                }
            }}
            onClick={(event) => event.stopPropagation()}
        >
            <label className="block px-1 text-xs font-medium text-muted-foreground">
                Block type
                <select
                    aria-label="Turn block into"
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    onChange={(event) => {
                        const command = findBlockCommands('').find(
                            (item) => item.label === event.target.value,
                        );
                        if (!command) return;
                        perform(() => {
                            editor
                                .chain()
                                .focus()
                                .setTextSelection(blockStart(editor, index) + 1)
                                .run();
                            command.run(editor);
                        });
                    }}
                >
                    <option value="">Turn into…</option>
                    {findBlockCommands('')
                        .filter((item) => convertibleBlocks.has(item.label))
                        .map((item) => (
                            <option key={item.label} value={item.label}>
                                {item.label}
                            </option>
                        ))}
                </select>
            </label>

            <fieldset className="mt-3">
                <legend className="px-1 text-xs font-medium text-muted-foreground">
                    Text alignment
                </legend>
                <div className="mt-1 grid grid-cols-3 gap-1">
                    <ChoiceButton
                        label="Left"
                        title="Align left"
                        icon={<AlignLeft size={15} />}
                        active={formatting.alignment === 'left'}
                        disabled={!formatting.canAlign}
                        onClick={() =>
                            perform(() =>
                                setBlockAlignment(editor, index, 'left'),
                            )
                        }
                    />
                    <ChoiceButton
                        label="Center"
                        title="Align center"
                        icon={<AlignCenter size={15} />}
                        active={formatting.alignment === 'center'}
                        disabled={!formatting.canAlign}
                        onClick={() =>
                            perform(() =>
                                setBlockAlignment(editor, index, 'center'),
                            )
                        }
                    />
                    <ChoiceButton
                        label="Right"
                        title="Align right"
                        icon={<AlignRight size={15} />}
                        active={formatting.alignment === 'right'}
                        disabled={!formatting.canAlign}
                        onClick={() =>
                            perform(() =>
                                setBlockAlignment(editor, index, 'right'),
                            )
                        }
                    />
                </div>
            </fieldset>

            <div className="mt-3 grid grid-cols-2 gap-1 border-t border-border/70 pt-2">
                <ActionButton
                    icon={<ArrowUp size={15} />}
                    label="Move up"
                    disabled={index === 0}
                    onClick={() =>
                        perform(() =>
                            changeBlockOrder(editor, index, index - 1),
                        )
                    }
                />
                <ActionButton
                    icon={<ArrowDown size={15} />}
                    label="Move down"
                    disabled={index >= blockCount - 1}
                    onClick={() =>
                        perform(() =>
                            changeBlockOrder(editor, index, index + 1),
                        )
                    }
                />
                <ActionButton
                    icon={<Files size={15} />}
                    label="Duplicate"
                    onClick={() =>
                        perform(() =>
                            changeBlockOrder(editor, index, index + 1, true),
                        )
                    }
                />
                <ActionButton
                    icon={<Copy size={15} />}
                    label="Copy text"
                    onClick={() =>
                        perform(() => {
                            void navigator.clipboard.writeText(
                                editor.state.doc.child(index).textContent,
                            );
                        })
                    }
                />
            </div>
            <ActionButton
                icon={<Trash2 size={15} />}
                label="Delete block"
                destructive
                onClick={() => perform(() => deleteBlock(editor, index))}
            />
        </div>
    );
}

function ChoiceButton({
    label,
    title,
    icon,
    active,
    disabled = false,
    onClick,
}: {
    label: string;
    title: string;
    icon?: ReactNode;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={`flex items-center justify-center gap-1 rounded-md border px-1.5 py-1.5 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-foreground/40 bg-accent' : 'border-border/70'}`}
        >
            {icon}
            {label}
        </button>
    );
}

function ActionButton({
    icon,
    label,
    onClick,
    disabled = false,
    destructive = false,
}: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 ${destructive ? 'mt-1 text-destructive' : ''}`}
        >
            {icon}
            {label}
        </button>
    );
}
