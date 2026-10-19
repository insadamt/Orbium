import { Copy, Trash2, BringToFront, SendToBack, Ellipsis } from 'lucide-react';
import { BoardToolButton } from './board-tool-button';
import * as Menu from '@/components/ui/dropdown-menu';
import type { BoardObjectsController } from './use-board-objects';
import { BoardArrangeMenu } from './board-arrange-menu';

export function BoardSelectionActions({
    model,
    disabled,
}: {
    model: BoardObjectsController;
    disabled: boolean;
}) {
    const hasResource = model.objects.some(
        (object) =>
            model.selectedIds.includes(object.id) &&
            object.block_type === 'resource',
    );
    return (
        <div className="board-selection-actions">
            <Menu.Root modal={false}>
                <Menu.Trigger asChild>
                    <BoardToolButton
                        label="More selection actions"
                        icon={Ellipsis}
                        disabled={disabled}
                    />
                </Menu.Trigger>
                <Menu.Content
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    collisionPadding={12}
                >
                    <Menu.Item
                        disabled={disabled}
                        onSelect={model.duplicateSelected}
                    >
                        <Copy /> Duplicate selection
                    </Menu.Item>
                    <BoardArrangeMenu model={model} disabled={disabled} />
                    <Menu.Separator />
                    <Menu.Item
                        disabled={disabled}
                        onSelect={() => model.changeLayer(true)}
                    >
                        <BringToFront /> Bring to front
                    </Menu.Item>
                    <Menu.Item
                        disabled={disabled}
                        onSelect={() => model.changeLayer(false)}
                    >
                        <SendToBack /> Send to back
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item
                        disabled={disabled}
                        onSelect={model.deleteSelected}
                    >
                        <Trash2 />{' '}
                        {hasResource
                            ? 'Remove from board (keep pages)'
                            : 'Delete selection'}
                    </Menu.Item>
                </Menu.Content>
            </Menu.Root>
        </div>
    );
}
