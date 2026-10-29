// Renders only expanded folder descendants, never database records.
import { useMemo, useState, type ReactNode, type DragEvent } from 'react';
import { ChevronDown, ChevronRight, Database, FileText, Folder, PanelsTopLeft } from 'lucide-react';
import type { TreeNode } from './navigation-types';
import { nodeUrl } from './navigation-types';
import { attachmentUrl } from '@/components/editor/editor-api';
import { nodeImageUrl } from '@/components/hierarchy/node-media-api';
import { openLocation } from './tab-navigation';

const initialPageSize = 160;
const typeIcons = { folder: Folder, document: FileText, database: Database, board: PanelsTopLeft };

export function WorkspaceSidebarTree({
    workspaceId,
    nodes,
    activeNodeId,
    expandedIds,
    onToggle,
    onMove,
}: {
    workspaceId: number;
    nodes: TreeNode[];
    activeNodeId?: number;
    expandedIds: number[];
    onToggle: (id: number) => void;
    onMove: (sourceId: number, destinationId: number) => void;
}) {
    const [limits, setLimits] = useState<Record<string, number>>({});
    const childrenByParent = useMemo(() => {
        const grouped = new Map<number | null, TreeNode[]>();
        for (const node of nodes) {
            const siblings = grouped.get(node.parent_id) ?? [];
            siblings.push(node);
            grouped.set(node.parent_id, siblings);
        }
        for (const siblings of grouped.values()) {
            siblings.sort(
                (a, b) => a.position - b.position || a.id - b.id,
            );
        }
        return grouped;
    }, [nodes]);
    const expanded = new Set(expandedIds);

    function renderChildren(parentId: number | null, depth: number): ReactNode {
        // Limit one branch to avoid rendering thousands of rows at once.
        if (depth > 40) return null;
        const children = childrenByParent.get(parentId) ?? [];
        const key = String(parentId ?? 'root');
        const count = limits[key] ?? initialPageSize;
        return (
            <>
                {children.slice(0, count).map((node) => {
                    const Icon = typeIcons[node.type];
                    const isFolder = node.type === 'folder';
                    const isExpanded = isFolder && expanded.has(node.id);
                    return (
                        <div key={node.id}>
                            <div
                                className="workspace-tree-row"
                                data-active={node.id === activeNodeId}
                                style={{ paddingInlineStart: 8 + Math.min(depth, 20) * 14 }}
                                draggable
                                onDragStart={(event: DragEvent<HTMLDivElement>) => {
                                    event.dataTransfer.setData('application/orbium-node', String(node.id));
                                    event.dataTransfer.setData(
                                        `application/orbium-workspace-${workspaceId}`,
                                        String(workspaceId),
                                    );
                                    event.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragOver={(event) => {
                                    if (
                                        isFolder &&
                                        event.dataTransfer.types.includes(`application/orbium-workspace-${workspaceId}`)
                                    ) {
                                        event.preventDefault();
                                        event.dataTransfer.dropEffect = 'move';
                                    }
                                }}
                                onDrop={(event) => {
                                    if (!isFolder || !event.dataTransfer.types.includes(`application/orbium-workspace-${workspaceId}`))
                                        return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    const sourceId = Number(event.dataTransfer.getData('application/orbium-node'));
                                    if (Number.isSafeInteger(sourceId) && sourceId !== node.id)
                                        onMove(sourceId, node.id);
                                }}
                            >
                                {isFolder ? (
                                    <button
                                        type="button"
                                        className="workspace-tree-chevron"
                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.title}`}
                                        aria-expanded={isExpanded}
                                        onClick={() => onToggle(node.id)}
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                ) : (
                                    <span className="workspace-tree-chevron" aria-hidden="true" />
                                )}
                                <button
                                    type="button"
                                    className="workspace-tree-link"
                                    title={node.title}
                                    aria-current={node.id === activeNodeId ? 'page' : undefined}
                                    onClick={(event) =>
                                        openLocation(
                                            nodeUrl(workspaceId, node),
                                            event.ctrlKey || event.metaKey,
                                        )
                                    }
                                >
                                    {node.icon_attachment_id ? (
                                        <img
                                            className="workspace-tree-image"
                                            src={
                                                node.type === 'document'
                                                    ? attachmentUrl(workspaceId, node.id, node.icon_attachment_id)
                                                    : nodeImageUrl(workspaceId, node.id, node.icon_attachment_id)
                                            }
                                            alt=""
                                            loading="lazy"
                                        />
                                    ) : node.icon ? (
                                        <span className="workspace-tree-emoji" aria-hidden="true">{node.icon}</span>
                                    ) : (
                                        <Icon size={16} aria-hidden="true" />
                                    )}
                                    <span className="workspace-tree-name">{node.title}</span>
                                </button>
                            </div>
                            {isExpanded && renderChildren(node.id, depth + 1)}
                        </div>
                    );
                })}
                {children.length > count && (
                    <button
                        type="button"
                        className="workspace-tree-more"
                        style={{ paddingInlineStart: 36 + depth * 14 }}
                        onClick={() =>
                            setLimits((previous) => ({
                                ...previous,
                                [key]: count + initialPageSize,
                            }))
                        }
                    >
                        Show more ({children.length - count} remaining)
                    </button>
                )}
            </>
        );
    }

    return (
        <nav aria-label="Workspace explorer" className="workspace-sidebar-tree">
            {renderChildren(null, 0)}
        </nav>
    );
}
