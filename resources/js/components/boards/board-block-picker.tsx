import { Fragment, useRef, useState } from 'react';
import {
    Plus,
    Check,
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
    FileText,
    Video,
    AudioLines,
    Sigma,
    Workflow,
    Minus,
} from 'lucide-react';
import * as Menu from '@/components/ui/dropdown-menu';
import { BoardToolButton } from './board-tool-button';
import { boardBlockLabels } from './board-block-data';
import type { BoardPlacementKind, BoardTool } from './board-types';

const blockGroups = [
    {
        label: 'Writing',
        choices: [
            { kind: 'text', icon: Type },
            { kind: 'heading', icon: Heading1 },
            { kind: 'list', icon: List },
            { kind: 'quote', icon: Quote },
            { kind: 'callout', icon: MessageSquare },
            { kind: 'divider', icon: Minus },
        ],
    },
    {
        label: 'Media',
        choices: [
            { kind: 'image', icon: Image },
            { kind: 'video', icon: Video },
            { kind: 'audio', icon: AudioLines },
            { kind: 'pdf', icon: FileText },
            { kind: 'file', icon: Paperclip },
        ],
    },
    {
        label: 'Technical',
        choices: [
            { kind: 'table', icon: Table2 },
            { kind: 'code', icon: Code2 },
            { kind: 'math', icon: Sigma },
            { kind: 'mermaid', icon: Workflow },
            { kind: 'mindmap', icon: Workflow },
        ],
    },
] as const;

export function BoardBlockPicker({
    disabled,
    disabledReason,
    tool,
    onAdd,
    onResource,
}: {
    disabled: boolean;
    disabledReason?: string;
    tool: BoardTool;
    onAdd: (kind: BoardPlacementKind) => void;
    onResource: () => void;
}) {
    const [open, setOpen] = useState(false);
    const insertedBlock = useRef(false);
    const activeChoice = blockGroups
        .flatMap((group) => [...group.choices])
        .find((choice) => choice.kind === tool);
    const active = Boolean(activeChoice);
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
                <BoardToolButton
                    label={
                        active && activeChoice
                            ? `Place ${boardBlockLabels[activeChoice.kind].toLowerCase()}`
                            : 'Add block'
                    }
                    icon={active ? (activeChoice?.icon ?? Plus) : Plus}
                    data-board-add-trigger
                    tooltipSide="right"
                    disabled={disabled}
                    disabledReason={disabledReason}
                    aria-pressed={active}
                ></BoardToolButton>
            </Menu.Trigger>
            <Menu.Content
                className="board-block-picker"
                side="right"
                align="center"
                sideOffset={10}
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
                {blockGroups.map(({ label, choices }, groupIndex) => (
                    <Fragment key={label}>
                        {groupIndex > 0 && <Menu.Separator />}
                        <Menu.Group aria-label={label}>
                            <Menu.Label className="board-picker-category">
                                {label}
                            </Menu.Label>
                            {choices.map(({ kind, icon: Icon }) => (
                                <Menu.Item
                                    key={kind}
                                    className="board-picker-item"
                                    disabled={disabled}
                                    textValue={boardBlockLabels[kind]}
                                    aria-current={
                                        tool === kind ? 'true' : undefined
                                    }
                                    onSelect={() => {
                                        insertedBlock.current = true;
                                        onAdd(kind);
                                    }}
                                >
                                    <Icon size={16} aria-hidden="true" />
                                    <span>{boardBlockLabels[kind]}</span>
                                    {tool === kind && (
                                        <Check
                                            size={14}
                                            className="board-picker-check"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Menu.Item>
                            ))}
                        </Menu.Group>
                    </Fragment>
                ))}
                <Menu.Separator />
                <Menu.Item
                    className="board-picker-item"
                    onSelect={() => {
                        //
                        // Let the page picker own focus instead of restoring it to the dock.
                        //
                        insertedBlock.current = true;
                        onResource();
                    }}
                    disabled={disabled}
                >
                    <Link2 /> Inline Document
                </Menu.Item>
            </Menu.Content>
        </Menu.Root>
    );
}
