import { useRef, type Ref } from 'react';
import {
    Copy,
    Trash2,
    BringToFront,
    SendToBack,
    Ellipsis,
    SlidersHorizontal,
} from 'lucide-react';
import { BoardToolButton } from './board-tool-button';
import * as Menu from '@/components/ui/dropdown-menu';
import type { BoardObjectsController } from './use-board-objects';
import { BoardArrangeMenu } from './board-arrange-menu';

export function BoardSelectionActions({
    model,
    disabled,
    editing,
    propertiesOpen,
    onToggleProperties,
    triggerRef,
}: {
    model: BoardObjectsController;
    disabled: boolean;
    editing: boolean;
    propertiesOpen: boolean;
    onToggleProperties: () => void;
    triggerRef: Ref<HTMLButtonElement>;
}) {
    const openingProperties = useRef(false);
    const hasResource = model.objects.some(
        (object) =>
            model.selectedIds.includes(object.id) &&
            object.block_type === 'resource',
    );
    return (
        <div className="board-selection-actions">
            <Menu.Root
                modal={false}
                onOpenChange={(open) => {
                    if (open) openingProperties.current = false;
                }}
            >
                <Menu.Trigger asChild>
                    <BoardToolButton
                        ref={triggerRef}
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
                    onCloseAutoFocus={(event) => {
                        //
                        // The properties panel takes focus and can hide this toolbar on smaller screens.
                        //
                        if (openingProperties.current) event.preventDefault();
                    }}
                >
                    {model.selectedIds.length === 1 && (
                        <Menu.Item
                            onSelect={() => {
                                openingProperties.current = !propertiesOpen;
                                onToggleProperties();
                            }}
                        >
                            <SlidersHorizontal />{' '}
                            {propertiesOpen ? 'Hide properties' : 'Properties'}
                        </Menu.Item>
                    )}
                    {!editing && (
                        <>
                            <Menu.Item
                                disabled={disabled}
                                onSelect={model.duplicateSelected}
                            >
                                <Copy /> Duplicate selection
                            </Menu.Item>
                            <BoardArrangeMenu
                                model={model}
                                disabled={disabled}
                            />
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
                        </>
                    )}
                </Menu.Content>
            </Menu.Root>
        </div>
    );
}
