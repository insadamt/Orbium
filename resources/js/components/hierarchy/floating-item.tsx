import { Database, FileText, Folder, MoreHorizontal } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { TreeNode } from '@/components/navigation/navigation-types';

const icons = { folder: Folder, document: FileText, database: Database };
type Props = {
    node: TreeNode;
    selected: boolean;
    dragging: boolean;
    placement?: string;
    dragHandlers: HTMLAttributes<HTMLDivElement>;
    onSelect: () => void;
    onOpen: (newTab: boolean) => void;
    onActions: (target: HTMLElement) => void;
    onReorder: (direction: number) => void;
};

export function FloatingItem({
    node,
    selected,
    dragging,
    placement,
    dragHandlers,
    onSelect,
    onOpen,
    onActions,
    onReorder,
}: Props) {
    const Icon = icons[node.type];
    return (
        <div
            {...dragHandlers}
            className="floating-item"
            role="button"
            tabIndex={0}
            aria-label={`${node.title}, ${node.type}`}
            aria-pressed={selected}
            aria-keyshortcuts="Enter Alt+ArrowLeft Alt+ArrowRight Shift+F10"
            data-selected={selected}
            data-dragging={dragging}
            data-drop={placement}
            data-node-id={node.id}
            onClick={(event) => {
                if (event.button !== 0) return;
                onSelect();
                onOpen(event.ctrlKey || event.metaKey);
            }}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === 'Enter') {
                    event.preventDefault();
                    onOpen(event.ctrlKey || event.metaKey);
                }
                if (event.key === ' ') {
                    event.preventDefault();
                    onSelect();
                }
                if (event.shiftKey && event.key === 'F10') {
                    event.preventDefault();
                    onActions(event.currentTarget);
                }
                if (
                    event.altKey &&
                    ['ArrowLeft', 'ArrowRight'].includes(event.key)
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    onReorder(event.key === 'ArrowLeft' ? -1 : 1);
                }
            }}
        >
            <Icon
                size={21}
                strokeWidth={1.5}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 flex-1 truncate" title={node.title}>
                {node.title}
            </span>
            <button
                type="button"
                className="floating-item-actions"
                aria-label={`Actions for ${node.title}`}
                onDoubleClick={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onActions(event.currentTarget);
                }}
            >
                <MoreHorizontal size={17} />
            </button>
        </div>
    );
}
