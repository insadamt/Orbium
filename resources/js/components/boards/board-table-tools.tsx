import type { Editor } from '@tiptap/core';
import { useRef } from 'react';
import { Columns3, Rows3, Table2, ChevronDown } from 'lucide-react';
import * as Menu from '@/components/ui/dropdown-menu';
import { BoardToolButton } from './board-tool-button';

export function BoardTableTools({
    editor,
    disabled,
    rowCount,
    columnCount,
}: {
    editor: Editor;
    disabled: boolean;
    rowCount: number;
    columnCount: number;
}) {
    const restoreEditorFocus = useRef(false);
    function applyTableAction(
        action: 'addRowAfter' | 'addColumnAfter' | 'deleteRow' | 'deleteColumn',
    ) {
        restoreEditorFocus.current = true;
        editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            [action]()
            .run();
    }
    return (
        <Menu.Root
            modal={false}
            onOpenChange={(open) => {
                if (open) restoreEditorFocus.current = false;
            }}
        >
            <Menu.Trigger asChild>
                <BoardToolButton
                    label="Rows and columns"
                    icon={Table2}
                    disabled={disabled}
                >
                    Table <ChevronDown size={12} aria-hidden="true" />
                </BoardToolButton>
            </Menu.Trigger>
            <Menu.Content
                align="start"
                sideOffset={8}
                collisionPadding={12}
                onCloseAutoFocus={(event) => {
                    //
                    // Resume typing after a table action; Escape still returns to the trigger.
                    //
                    if (!restoreEditorFocus.current || editor.isDestroyed)
                        return;
                    event.preventDefault();
                    editor.commands.focus(undefined, { scrollIntoView: false });
                }}
            >
                <Menu.Label>
                    {rowCount} rows · {columnCount} columns
                </Menu.Label>
                <Menu.Item
                    disabled={disabled || rowCount >= 100}
                    onSelect={() => applyTableAction('addRowAfter')}
                >
                    <Rows3 /> Add row below
                </Menu.Item>
                <Menu.Item
                    disabled={disabled || columnCount >= 30}
                    onSelect={() => applyTableAction('addColumnAfter')}
                >
                    <Columns3 /> Add column after
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                    disabled={disabled || rowCount <= 1}
                    onSelect={() => applyTableAction('deleteRow')}
                >
                    <Rows3 /> Remove current row
                </Menu.Item>
                <Menu.Item
                    disabled={disabled || columnCount <= 1}
                    onSelect={() => applyTableAction('deleteColumn')}
                >
                    <Columns3 /> Remove current column
                </Menu.Item>
            </Menu.Content>
        </Menu.Root>
    );
}
