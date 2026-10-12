import { Database, FileText, Folder, MoreHorizontal } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { OrbingEntity, WorldPoint } from './orbing-layout';

const nodeIcons = { folder: Folder, document: FileText, database: Database };

export function OrbingEntityNode({
    entity,
    point,
    zoom,
    selected,
    onSelect,
    onOpen,
    onKeyboardFocus,
    onActions,
}: {
    entity: OrbingEntity;
    point: WorldPoint;
    zoom: number;
    selected: boolean;
    onSelect: () => void;
    onOpen: (newTab: boolean) => void;
    onKeyboardFocus: () => void;
    onActions: (target: HTMLElement) => void;
}) {
    const { node } = entity;
    const Icon = nodeIcons[node.type];
    return (
        <div
            className="orbing-entity"
            style={
                {
                    left: point.x,
                    top: point.y,
                    '--entity-size': `${(node.type === 'document' ? 24 : 30) * Math.max(0.85, Math.min(1.15, Math.sqrt(zoom * entity.scale)))}px`,
                } as CSSProperties
            }
            data-node-id={node.id}
            data-type={node.type}
            data-selected={selected}
        >
            <button
                type="button"
                className="orbing-entity-target"
                tabIndex={0}
                aria-label={`${node.title}, ${node.type}. Select; Enter to open.`}
                aria-pressed={selected}
                aria-keyshortcuts="Enter Space Shift+F10"
                data-orbing-node={node.id}
                onFocus={(event) => {
                    if (
                        event.target === event.currentTarget &&
                        event.currentTarget.matches(':focus-visible')
                    )
                        onKeyboardFocus();
                }}
                onClick={(event) => {
                    onSelect();
                    if (event.ctrlKey || event.metaKey) onOpen(true);
                }}
                onDoubleClick={(event) => {
                    if (!event.ctrlKey && !event.metaKey) onOpen(false);
                }}
                onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        onOpen(event.ctrlKey || event.metaKey);
                    } else if (event.key === ' ') {
                        event.preventDefault();
                        onSelect();
                    } else if (event.shiftKey && event.key === 'F10') {
                        event.preventDefault();
                        event.stopPropagation();
                        onActions(event.currentTarget);
                    }
                }}
            >
                <span className="orbing-entity-body" aria-hidden="true">
                    <span className="orbing-entity-icon">
                        <Icon size="100%" strokeWidth={1.4} />
                    </span>
                </span>
                <span className="orbing-entity-title" title={node.title}>
                    {node.title}
                    {entity.childCount > 0 && (
                        <span className="orbing-child-count">
                            {entity.childCount}
                        </span>
                    )}
                </span>
            </button>
            <button
                type="button"
                className="orbing-entity-actions"
                aria-label={`Actions for ${node.title}`}
                onDoubleClick={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onSelect();
                    onActions(event.currentTarget);
                }}
            >
                <MoreHorizontal size={16} />
            </button>
        </div>
    );
}
