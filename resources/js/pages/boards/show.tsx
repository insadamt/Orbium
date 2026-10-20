import { Head, usePage } from '@inertiajs/react';
import { Ellipsis, Star, Settings2, Maximize, Minimize } from 'lucide-react';
import { useRef, useState } from 'react';
import * as Menu from '@/components/ui/dropdown-menu';
import {
    NodeMediaHeader,
    type MediaContainer,
} from '@/components/hierarchy/node-media-header';
import type { TreeNode } from '@/components/navigation/navigation-types';
import { useNodeFavorite } from '@/components/navigation/use-node-favorite';
import { useNavigation } from '@/components/navigation/navigation-store';
import { useBoardWorkspace } from '@/components/boards/use-board-workspace';
import { useBoardFullscreen } from '@/components/boards/use-board-fullscreen';
import { BoardToolButton } from '@/components/boards/board-tool-button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { BoardCanvas } from '@/components/boards/board-canvas';
import type { BoardSnapshot } from '@/components/boards/board-types';

type BoardPageProps = {
    workspace: { id: number; name: string };
    currentNode: TreeNode & MediaContainer & { type: 'board' };
    errors: Record<string, string>;
    boardContent: BoardSnapshot;
};

export default function BoardPage() {
    const { workspace, currentNode, errors, boardContent } =
        usePage<BoardPageProps>().props;
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [toolbarHost, setToolbarHost] = useState<HTMLDivElement | null>(null);
    const openingDetails = useRef(false);
    const boardOptionsButton = useRef<HTMLButtonElement>(null);
    const pageRef = useBoardWorkspace();
    const { fullscreen, toggleFullscreen } = useBoardFullscreen(pageRef);
    const tabId = useNavigation((state) => state.activeId);
    const { savingFavorite, toggleFavorite } = useNodeFavorite(
        workspace.id,
        currentNode,
    );

    return (
        <>
            <Head title={currentNode.title} />
            <div ref={pageRef} className="board-page floating-body-island">
                <div className="board-page-heading">
                    <NodeMediaHeader
                        key={`${currentNode.id}:${currentNode.title}`}
                        workspaceId={workspace.id}
                        node={currentNode}
                        layout="toolbar"
                    />
                    <div
                        ref={setToolbarHost}
                        className="board-toolbar-slot floating-surface"
                    />
                    <BoardToolButton
                        label={
                            fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                        }
                        icon={fullscreen ? Minimize : Maximize}
                        aria-pressed={fullscreen}
                        tooltipSide="bottom"
                        onClick={toggleFullscreen}
                    />
                    <Menu.Root
                        modal={false}
                        onOpenChange={(open) => {
                            if (open) openingDetails.current = false;
                        }}
                    >
                        <Menu.Trigger asChild>
                            <button
                                type="button"
                                className="board-tool-button"
                                ref={boardOptionsButton}
                                aria-label="Board options"
                                title="Board options"
                            >
                                <Ellipsis size={17} aria-hidden="true" />
                            </button>
                        </Menu.Trigger>
                        <Menu.Content
                            align="end"
                            sideOffset={10}
                            onCloseAutoFocus={(event) => {
                                //
                                // The details dialog must keep focus when opened from this menu.
                                //
                                if (openingDetails.current)
                                    event.preventDefault();
                            }}
                        >
                            <Menu.Item
                                onSelect={() => {
                                    openingDetails.current = true;
                                    setDetailsOpen(true);
                                }}
                            >
                                <Settings2 /> Board details
                            </Menu.Item>
                            <Menu.Item
                                disabled={savingFavorite}
                                onSelect={toggleFavorite}
                            >
                                <Star
                                    fill={
                                        currentNode.is_favorite
                                            ? 'currentColor'
                                            : 'none'
                                    }
                                />
                                {currentNode.is_favorite
                                    ? 'Remove from favorites'
                                    : 'Add to favorites'}
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Root>
                </div>
                <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <DialogContent
                        className="board-details-dialog"
                        onCloseAutoFocus={(event) => {
                            //
                            // The dialog opens from a menu item that unmounts, so return to its persistent trigger.
                            //
                            event.preventDefault();
                            boardOptionsButton.current?.focus({
                                preventScroll: true,
                            });
                        }}
                    >
                        <DialogTitle>Board details</DialogTitle>
                        <div id={`board-details-${currentNode.id}`}>
                            <NodeMediaHeader
                                key={`${currentNode.id}:${currentNode.title}`}
                                workspaceId={workspace.id}
                                node={currentNode}
                                detail="Board"
                                layout="document"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
                {Object.keys(errors).length > 0 && (
                    <p role="alert" className="mt-4 text-sm text-destructive">
                        {Object.values(errors).join(' ')}
                    </p>
                )}
                {tabId && (
                    <BoardCanvas
                        key={`${currentNode.id}:${tabId}`}
                        workspaceId={workspace.id}
                        boardId={currentNode.id}
                        tabId={tabId}
                        snapshot={boardContent}
                        toolbarHost={toolbarHost}
                    />
                )}
            </div>
        </>
    );
}
