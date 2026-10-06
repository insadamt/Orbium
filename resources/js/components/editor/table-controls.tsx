import type { Editor } from '@tiptap/core';
import { TableMap } from '@tiptap/pm/tables';
import { Plus } from 'lucide-react';
import { useEffect, useState, type RefObject } from 'react';
import type { EditorActivityController } from './editor-activity-controller';
import { useEditorActivity } from './use-editor-activity';
import {
    adjustEditorPerformanceCounter,
    measureEditorWork,
} from '@/lib/editor-performance';

type TableLocation = {
    position: number;
    width: number;
    height: number;
    left: number;
    top: number;
    direction: 'ltr' | 'rtl';
};

function activeTable(
    editor: Editor,
    surface: HTMLElement,
): TableLocation | null {
    const { $from } = editor.state.selection;
    let tableDepth = $from.depth;
    while (tableDepth > 0 && $from.node(tableDepth).type.name !== 'table')
        tableDepth--;
    if (tableDepth === 0) return null;

    const position = $from.before(tableDepth);
    const tableNode = editor.state.doc.nodeAt(position);
    const tableWrapper = editor.view.nodeDOM(position);
    if (!(tableWrapper instanceof HTMLElement) || !tableNode) return null;

    const tableBounds = tableWrapper.getBoundingClientRect();
    const surfaceBounds = surface.getBoundingClientRect();
    return {
        position,
        width: tableBounds.width,
        height: tableBounds.height,
        left: tableBounds.left - surfaceBounds.left,
        top: tableBounds.top - surfaceBounds.top,
        direction:
            getComputedStyle(tableWrapper).direction === 'rtl' ||
            tableNode.attrs.dir === 'rtl'
                ? 'rtl'
                : 'ltr',
    };
}

function selectCell(
    editor: Editor,
    tablePosition: number,
    row: number,
    column: number,
): boolean {
    const table = editor.state.doc.nodeAt(tablePosition);
    if (!table) return false;
    const map = TableMap.get(table);
    const cellPosition = tablePosition + 1 + map.map[row * map.width + column];
    return editor
        .chain()
        .focus()
        .setTextSelection(cellPosition + 2)
        .run();
}

export default function TableControls({
    editor,
    surfaceRef,
    activityController,
}: {
    editor: Editor;
    activityController: EditorActivityController;
    surfaceRef: RefObject<HTMLDivElement | null>;
}) {
    const { active } = useEditorActivity(activityController);
    const [table, setTable] = useState<TableLocation | null>(null);

    useEffect(() => {
        const surface = surfaceRef.current;
        if (!active || !surface) return;
        const updateLocation = () => {
            if (!activityController.getSnapshot().active) return;
            measureEditorWork('table-controls.geometry', () => {
                const editorLeft = editor.view.dom.getBoundingClientRect().left;
                const availableWidth = Math.max(
                    0,
                    window.innerWidth - editorLeft - 40,
                );
                const width = `${availableWidth}px`;
                // Avoid unchanged inherited style writes during scrolling.
                if (
                    surface.style.getPropertyValue(
                        '--table-available-width',
                    ) !== width
                )
                    surface.style.setProperty('--table-available-width', width);
                setTable(activeTable(editor, surface));
            });
        };
        const resizeObserver = new ResizeObserver(updateLocation);
        resizeObserver.observe(surface);
        adjustEditorPerformanceCounter('editor-ui.active-observers', 1);
        editor.on('selectionUpdate', updateLocation);
        editor.on('update', updateLocation);
        window.addEventListener('resize', updateLocation);
        window.addEventListener('scroll', updateLocation, true);
        updateLocation();
        return () => {
            adjustEditorPerformanceCounter('editor-ui.active-observers', -1);
            resizeObserver.disconnect();
            editor.off('selectionUpdate', updateLocation);
            editor.off('update', updateLocation);
            window.removeEventListener('resize', updateLocation);
            window.removeEventListener('scroll', updateLocation, true);
        };
    }, [editor, surfaceRef, active, activityController]);

    if (!active || !table) return null;

    function addRow() {
        if (!table) return;
        const node = editor.state.doc.nodeAt(table.position);
        if (!node) return;
        const map = TableMap.get(node);
        if (selectCell(editor, table.position, map.height - 1, 0))
            editor.chain().focus().addRowAfter().run();
    }

    function addColumn() {
        if (!table) return;
        const node = editor.state.doc.nodeAt(table.position);
        if (!node) return;
        const map = TableMap.get(node);
        if (selectCell(editor, table.position, 0, map.width - 1))
            editor.chain().focus().addColumnAfter().run();
    }

    return (
        <div
            data-table-controls
            className="pointer-events-none absolute inset-0 z-20"
        >
            <button
                type="button"
                aria-label="Add row to table"
                title="Add row"
                onMouseDown={(event) => event.preventDefault()}
                onClick={addRow}
                className="table-edge-control"
                style={{
                    left: table.left,
                    top: table.top + table.height + 5,
                    width: table.width,
                    height: 22,
                }}
            >
                <Plus size={15} />
            </button>
            <button
                type="button"
                aria-label="Add column to table"
                title="Add column"
                onMouseDown={(event) => event.preventDefault()}
                onClick={addColumn}
                className="table-edge-control"
                style={{
                    left:
                        table.direction === 'rtl'
                            ? table.left - 27
                            : table.left + table.width + 5,
                    top: table.top,
                    width: 22,
                    height: table.height,
                }}
            >
                <Plus size={15} />
            </button>
        </div>
    );
}
