import { AlignHorizontalJustifyCenter } from 'lucide-react';
import * as Menu from '@/components/ui/dropdown-menu';
import type { BoardObjectsController } from './use-board-objects';
import {
    arrangeBoardObjects,
    boardArrangementActions,
} from './board-arrangement';

export function BoardArrangeMenu({
    model,
    disabled,
}: {
    model: BoardObjectsController;
    disabled: boolean;
}) {
    if (model.selectedIds.length < 2) return null;
    return (
        <Menu.Sub>
            <Menu.SubTrigger disabled={disabled}>
                <AlignHorizontalJustifyCenter /> Arrange selection
            </Menu.SubTrigger>
            <Menu.SubContent collisionPadding={12}>
                {boardArrangementActions.map(({ action, label, minimum }) => (
                    <Menu.Item
                        key={action}
                        disabled={
                            disabled || model.selectedIds.length < minimum
                        }
                        onSelect={() => {
                            if (!disabled)
                                model.commit(
                                    arrangeBoardObjects(
                                        model.objectsRef.current,
                                        model.selectedRef.current,
                                        action,
                                    ),
                                );
                        }}
                    >
                        {label}
                    </Menu.Item>
                ))}
            </Menu.SubContent>
        </Menu.Sub>
    );
}
