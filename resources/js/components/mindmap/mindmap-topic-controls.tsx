import { useRef, useState } from 'react';
import {
    MoveHorizontal,
    CornerDownRight,
    Plus,
    Trash2,
    Type,
    FoldVertical,
    UnfoldVertical,
    GitBranch,
    X,
} from 'lucide-react';
import { BoardToolButton } from '@/components/boards/board-tool-button';
import { AppSelect } from '@/components/ui/app-select';
import { MindMapWidthPanel } from './mindmap-width-panel';
import { mindMapTopicWidth } from './mindmap-topic-width';
import type { MindMapData, MindMapTopic } from './mindmap-data';

type Props = {
    selected: MindMapTopic;
    data: MindMapData;
    descendants: Set<string>;
    onRename: () => void;
    onAdd: (sibling?: boolean) => void;
    onRemove: () => void;
    onToggle: () => void;
    onMove: (parentId: string) => void;
    onWidthCommit: (width: number) => boolean;
};

export function MindMapTopicControls({
    selected,
    data,
    descendants,
    onRename,
    onAdd,
    onRemove,
    onToggle,
    onMove,
    onWidthCommit,
}: Props) {
    const [panel, setPanel] = useState<{
        topicId: string;
        kind: 'parent' | 'width';
    } | null>(null);
    const widthButton = useRef<HTMLButtonElement>(null);
    const parentOpen =
        panel?.topicId === selected.id && panel.kind === 'parent';
    const widthOpen = panel?.topicId === selected.id && panel.kind === 'width';
    const rootSelected = selected.id === data.root_id;
    const hasChildren = data.topics.some(
        (topic) => topic.parent_id === selected.id,
    );
    const common = {
        tooltipSide: 'right' as const,
        tooltipClassName: 'mindmap-tool-tooltip',
    };
    return (
        <>
            <div
                className="mindmap-tools"
                role="toolbar"
                aria-label="Mind Map topic tools"
            >
                <BoardToolButton
                    {...common}
                    label="Add child"
                    shortcut="Tab"
                    icon={Plus}
                    onClick={() => onAdd()}
                />
                <BoardToolButton
                    {...common}
                    label="Add sibling"
                    shortcut="Enter"
                    icon={CornerDownRight}
                    disabled={rootSelected}
                    disabledReason="The central topic has no siblings."
                    onClick={() => onAdd(true)}
                />
                <span className="mindmap-tool-separator" />
                <BoardToolButton
                    {...common}
                    label="Rename topic"
                    shortcut="F2"
                    icon={Type}
                    onClick={onRename}
                />
                <BoardToolButton
                    {...common}
                    ref={widthButton}
                    label="Branch width"
                    icon={MoveHorizontal}
                    aria-expanded={widthOpen}
                    onClick={() =>
                        setPanel(
                            widthOpen
                                ? null
                                : { topicId: selected.id, kind: 'width' },
                        )
                    }
                />
                <BoardToolButton
                    {...common}
                    label={
                        selected.collapsed ? 'Expand branch' : 'Collapse branch'
                    }
                    icon={selected.collapsed ? UnfoldVertical : FoldVertical}
                    disabled={!hasChildren}
                    disabledReason="Add a child topic first."
                    onClick={onToggle}
                />
                <BoardToolButton
                    {...common}
                    label="Change parent"
                    icon={GitBranch}
                    disabled={rootSelected}
                    disabledReason="The central topic has no parent."
                    aria-expanded={parentOpen}
                    onClick={() =>
                        setPanel(
                            parentOpen
                                ? null
                                : { topicId: selected.id, kind: 'parent' },
                        )
                    }
                />
                <span className="mindmap-tool-separator" />
                <BoardToolButton
                    {...common}
                    label="Delete branch"
                    shortcut="Delete"
                    icon={Trash2}
                    disabled={rootSelected}
                    disabledReason="The central topic cannot be deleted."
                    className="board-tool-button editor-toolbar-button mindmap-delete"
                    onClick={onRemove}
                />
            </div>
            {parentOpen && !rootSelected && (
                <div
                    className="mindmap-parent-panel"
                    role="group"
                    aria-label="Change topic parent"
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            event.stopPropagation();
                            setPanel(null);
                        }
                    }}
                >
                    <div className="mindmap-parent-heading">
                        <span>Change parent</span>
                        <button
                            type="button"
                            aria-label="Close parent picker"
                            onClick={() => setPanel(null)}
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <AppSelect
                        label="Topic parent"
                        value={selected.parent_id ?? ''}
                        searchPlaceholder="Find parent topic…"
                        contentClassName="mindmap-parent-menu"
                        options={data.topics
                            .filter((topic) => !descendants.has(topic.id))
                            .map((topic) => ({
                                value: topic.id,
                                label: topic.text || 'Untitled topic',
                            }))}
                        onValueChange={(parentId) => {
                            onMove(parentId);
                            setPanel(null);
                        }}
                    />
                </div>
            )}
            {widthOpen && (
                <MindMapWidthPanel
                    key={selected.id}
                    width={selected.width ?? mindMapTopicWidth.default}
                    onCommit={onWidthCommit}
                    onClose={() => {
                        setPanel(null);
                        widthButton.current?.focus({ preventScroll: true });
                    }}
                />
            )}
        </>
    );
}
