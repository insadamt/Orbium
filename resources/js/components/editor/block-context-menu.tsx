import type { Editor } from '@tiptap/core';
import { ArrowDown, ArrowUp, Copy, Files, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { changeBlockOrder } from './editor-controls';
import { findBlockCommands } from './editor-commands';

type Props = {
    editor: Editor;
    index: number;
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

export default function BlockContextMenu({ editor, index, onClose }: Props) {
    const menuRef = useRef<HTMLDivElement>(null);
    const blockCount = editor.state.doc.childCount;

    useEffect(() => {
        menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }, []);

    function perform(action: () => void): void {
        action();
        onClose();
    }

    return (
        <div
            ref={menuRef}
            role="menu"
            aria-label="Block actions"
            className="glass-surface w-56 rounded-xl border border-border p-1.5 text-sm shadow-xl"
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    onClose();
                    editor.commands.focus();
                }
            }}
            onMouseDown={(event) => event.stopPropagation()}
        >
            <MenuAction
                icon={<ArrowUp size={15} />}
                label="Move up"
                disabled={index === 0}
                onClick={() =>
                    perform(() => changeBlockOrder(editor, index, index - 1))
                }
            />
            <MenuAction
                icon={<ArrowDown size={15} />}
                label="Move down"
                disabled={index >= blockCount - 1}
                onClick={() =>
                    perform(() => changeBlockOrder(editor, index, index + 1))
                }
            />
            <MenuAction
                icon={<Files size={15} />}
                label="Duplicate"
                onClick={() =>
                    perform(() =>
                        changeBlockOrder(editor, index, index + 1, true),
                    )
                }
            />
            <MenuAction
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
            <div className="my-1 border-t border-border/70" />
            <label className="block px-2 py-1.5 text-xs text-muted-foreground">
                Turn into
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
                    <option value="">Choose type…</option>
                    {findBlockCommands('')
                        .filter((item) => convertibleBlocks.has(item.label))
                        .map((item) => (
                            <option key={item.label} value={item.label}>
                                {item.label}
                            </option>
                        ))}
                </select>
            </label>
            <div className="my-1 border-t border-border/70" />
            <MenuAction
                icon={<Trash2 size={15} />}
                label="Delete"
                destructive
                onClick={() => perform(() => deleteBlock(editor, index))}
            />
        </div>
    );
}

function MenuAction({
    icon,
    label,
    onClick,
    disabled = false,
    destructive = false,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 ${destructive ? 'text-destructive' : ''}`}
        >
            {icon}
            {label}
        </button>
    );
}
