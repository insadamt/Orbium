// Renders explorer cards using shared node media and navigation callbacks.
// Image failures stay local so unavailable uploads do not change saved node metadata.
import {
    PanelsTopLeft,
    Database,
    FileText,
    Folder,
    MoreHorizontal,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { useState } from 'react';
import type { TreeNode } from '@/components/navigation/navigation-types';
import { attachmentUrl } from '@/components/editor/editor-api';
import { nodeImageUrl } from './node-media-api';
import { ratioNumber, type GalleryAppearance } from './cover-presentation';

const icons = {
    folder: Folder,
    document: FileText,
    database: Database,
    board: PanelsTopLeft,
};
type Props = {
    workspaceId: number;
    view: 'grid' | 'list' | 'gallery';
    appearance?: GalleryAppearance;
    legacyPreview?: boolean;
    node: TreeNode;
    selected: boolean;
    revealed?: boolean;
    dragging: boolean;
    placement?: string;
    dragHandlers: HTMLAttributes<HTMLDivElement>;
    onSelect: () => void;
    disabled?: boolean;
    onOpen: (newTab: boolean) => void;
    onActions: (target: HTMLElement) => void;
    canReorder: boolean;
    onReorder: (direction: number) => void;
};

export function FloatingItem({
    workspaceId,
    view,
    appearance,
    legacyPreview,
    node,
    selected,
    revealed,
    dragging,
    placement,
    dragHandlers,
    onSelect,
    disabled,
    onOpen,
    onActions,
    canReorder,
    onReorder,
}: Props) {
    const Icon = icons[node.type];
    const [unavailableCoverId, setUnavailableCoverId] = useState<number | null>(
        null,
    );
    const [unavailableIconId, setUnavailableIconId] = useState<number | null>(
        null,
    );
    const natural = appearance?.layout === 'natural';
    const imageUrl = (attachmentId: number) =>
        node.type === 'document'
            ? attachmentUrl(workspaceId, node.id, attachmentId)
            : nodeImageUrl(workspaceId, node.id, attachmentId);
    return (
        <div
            {...dragHandlers}
            className="floating-item"
            role="button"
            tabIndex={0}
            aria-label={`${node.title}, ${node.type}${selected ? ', selected' : ''}`}
            aria-pressed={selected}
            aria-disabled={disabled}
            aria-keyshortcuts={
                !canReorder
                    ? 'Enter Shift+F10'
                    : view === 'list'
                      ? 'Enter Alt+ArrowUp Alt+ArrowDown Shift+F10'
                      : 'Enter Alt+ArrowLeft Alt+ArrowRight Shift+F10'
            }
            data-selected={selected}
            data-revealed={revealed}
            data-dragging={dragging}
            data-drop={placement}
            data-node-id={node.id}
            data-view={view}
            onClick={(event) => {
                if (event.button !== 0) return;
                if (disabled) return;
                if (event.ctrlKey || event.metaKey) onSelect();
                else onOpen(false);
            }}
            onKeyDown={(event) => {
                if (disabled || event.target !== event.currentTarget) return;
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
                    canReorder &&
                    event.altKey &&
                    (view === 'list'
                        ? ['ArrowUp', 'ArrowDown']
                        : ['ArrowLeft', 'ArrowRight']
                    ).includes(event.key)
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    onReorder(
                        ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1,
                    );
                }
            }}
        >
            {view === 'gallery' && (
                <div
                    className="floating-item-preview"
                    style={
                        appearance && !legacyPreview
                            ? {
                                  aspectRatio: natural
                                      ? ratioNumber(
                                            node.cover_attachment_id
                                                ? node.cover_aspect_ratio
                                                : '16:9',
                                        )
                                      : ratioNumber(appearance.ratio),
                                  height: 'auto',
                              }
                            : undefined
                    }
                >
                    {node.cover_attachment_id &&
                    unavailableCoverId !== node.cover_attachment_id ? (
                        <img
                            src={imageUrl(node.cover_attachment_id)}
                            alt=""
                            draggable={false}
                            loading="lazy"
                            decoding="async"
                            onError={() =>
                                setUnavailableCoverId(
                                    node.cover_attachment_id ?? null,
                                )
                            }
                            style={{
                                objectFit:
                                    natural || appearance?.fit === 'contain'
                                        ? 'contain'
                                        : 'cover',
                            }}
                        />
                    ) : (
                        <Icon size={48} strokeWidth={1.3} aria-hidden="true" />
                    )}
                </div>
            )}
            <span className="floating-item-label">
                {node.icon_attachment_id &&
                unavailableIconId !== node.icon_attachment_id ? (
                    <img
                        className="floating-item-icon-image"
                        draggable={false}
                        src={imageUrl(node.icon_attachment_id)}
                        alt=""
                        onError={() =>
                            setUnavailableIconId(
                                node.icon_attachment_id ?? null,
                            )
                        }
                    />
                ) : node.icon ? (
                    <span
                        className="floating-item-icon-emoji"
                        aria-hidden="true"
                    >
                        {node.icon}
                    </span>
                ) : (
                    <Icon
                        size={32}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="shrink-0 text-muted-foreground"
                    />
                )}
                <span className="min-w-0 flex-1 truncate" title={node.title}>
                    {node.title}
                </span>
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
