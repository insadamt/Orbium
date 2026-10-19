import { useRef, useState } from 'react';
import {
    Plus,
    Link2,
    Type,
    Heading1,
    List,
    Quote,
    MessageSquare,
    Code2,
    Table2,
    Image,
    Paperclip,
    Sigma,
    Workflow,
    Minus,
} from 'lucide-react';
import * as Menu from '@/components/ui/dropdown-menu';
import { boardBlockLabels } from './board-block-data';
import type { BoardBlockKind } from './board-types';

const blockChoices = [
    {
        kind: 'text',
        icon: Type,
        description: 'Write freely on the canvas',
    },
    {
        kind: 'heading',
        icon: Heading1,
        description: 'Give an idea a title',
    },
    {
        kind: 'list',
        icon: List,
        description: 'Bullets, numbers or a checklist',
    },
    {
        kind: 'quote',
        icon: Quote,
        description: 'Highlight a thought',
    },
    {
        kind: 'callout',
        icon: MessageSquare,
        description: 'Set an important note apart',
    },
    {
        kind: 'image',
        icon: Image,
        description: 'Upload or choose from Library',
    },
    {
        kind: 'table',
        icon: Table2,
        description: 'Compare ideas side by side',
    },
    {
        kind: 'file',
        icon: Paperclip,
        description: 'Files, audio, video and PDFs',
    },
    {
        kind: 'code',
        icon: Code2,
        description: 'Code with syntax highlighting',
    },
    {
        kind: 'math',
        icon: Sigma,
        description: 'Typeset a formula',
    },
    {
        kind: 'mermaid',
        icon: Workflow,
        description: 'Build a diagram with Mermaid',
    },
    {
        kind: 'divider',
        icon: Minus,
        description: 'Separate areas of your board',
    },
] as const;

export function BoardBlockPicker({
    disabled,
    active,
    onAdd,
    onResource,
}: {
    disabled: boolean;
    active: boolean;
    onAdd: (kind: BoardBlockKind) => void;
    onResource: () => void;
}) {
    const [open, setOpen] = useState(false);
    const insertedBlock = useRef(false);
    return (
        <Menu.Root
            open={open && !disabled}
            onOpenChange={(nextOpen) => {
                if (nextOpen) insertedBlock.current = false;
                setOpen(nextOpen);
            }}
            modal={false}
        >
            <Menu.Trigger asChild>
                <button
                    type="button"
                    className="board-tool-button"
                    disabled={disabled}
                    aria-label="Add block"
                    aria-pressed={active}
                    title="Add block"
                >
                    <Plus size={19} aria-hidden="true" />
                    <span className="board-dock-label">Add</span>
                </button>
            </Menu.Trigger>
            <Menu.Content
                className="board-block-picker"
                side="top"
                align="center"
                sideOffset={14}
                collisionPadding={12}
                aria-label="Add a block"
                onCloseAutoFocus={(event) => {
                    //
                    // Keep focus on the canvas after choosing a placement tool so Enter can place the block.
                    //
                    if (insertedBlock.current) event.preventDefault();
                }}
            >
                <Menu.Label className="board-picker-heading">
                    Add to board
                </Menu.Label>
                <div className="board-picker-grid">
                    {blockChoices.map(({ kind, icon: Icon, description }) => (
                        <Menu.Item
                            key={kind}
                            className="board-picker-item"
                            disabled={disabled}
                            textValue={boardBlockLabels[kind]}
                            onSelect={() => {
                                insertedBlock.current = true;
                                onAdd(kind);
                            }}
                        >
                            <span className="board-picker-label">
                                <Icon size={15} aria-hidden="true" />
                                {boardBlockLabels[kind]}
                            </span>
                            <span className="board-picker-description">
                                {description}
                            </span>
                        </Menu.Item>
                    ))}
                </div>
                <Menu.Separator />
                <Menu.Item
                    onSelect={() => {
                        //
                        // Let the page picker own focus instead of restoring it to the dock.
                        //
                        insertedBlock.current = true;
                        onResource();
                    }}
                    disabled={disabled}
                >
                    <Link2 /> Link page or create Document
                </Menu.Item>
            </Menu.Content>
        </Menu.Root>
    );
}
