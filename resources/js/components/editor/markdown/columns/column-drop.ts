// Summary: Resolves side-by-side and in/out-of-column drops into one owner transaction; depends on mounted column editors, canonical source serialization and existing block geometry.
import { EditorView } from '@codemirror/view';
import { isolateHistory } from '@codemirror/commands';
import type { ChangeSpec } from '@codemirror/state';
import {
    columnEditorOwner,
    mountedDocumentColumns,
    type MountedColumns,
} from './column-registry';
import {
    containsColumnLayout,
    equalColumnWidths,
    serializeColumns,
    type ColumnLayout,
} from './column-source';
import { columnLayoutSource } from './column-commands';
import {
    markdownBlockDropTarget,
    markdownBlockElement,
} from '../interactions/markdown-block-drag';
import {
    moveMarkdownBlock,
    type MarkdownBlockRange,
} from '../interactions/markdown-block-actions';
import { markdownDragViewport } from '../interactions/markdown-drag-scroll';

type Pointer = { clientX: number; clientY: number };
type ColumnDestination = {
    view: EditorView;
    columns?: MountedColumns;
    index?: number;
    block: MarkdownBlockRange;
    placement: 'before' | 'after' | 'left' | 'right';
};
export type ColumnDropTarget = {
    owner: EditorView;
    top: number;
    left: number;
    width: number;
    height: number;
    apply: () => void;
};

function removeBlock(source: string, block: MarkdownBlockRange) {
    const before = source.slice(0, block.from).replace(/\n+$/, '');
    const after = source.slice(block.to).replace(/^\n+/, '');
    return [before, after].filter(Boolean).join('\n\n');
}

function insertBlock(
    source: string,
    block: MarkdownBlockRange,
    destination: ColumnDestination,
) {
    const position =
        destination.placement === 'before'
            ? destination.block.from
            : destination.block.to;
    const before = source.slice(0, position).replace(/\n+$/, '');
    const after = source.slice(position).replace(/^\n+/, '');
    return [before, block.source, after].filter(Boolean).join('\n\n');
}

function removeDocumentBlockForColumnMove(
    owner: EditorView,
    block: MarkdownBlockRange,
): ChangeSpec {
    let from = block.from;
    let to = block.to;
    //
    // Consume one neighboring separator so repeated moves do not accumulate blank blocks.
    //
    if (to < owner.state.doc.length) {
        to++;
        while (to < owner.state.doc.length) {
            const line = owner.state.doc.lineAt(to);
            if (line.text.trim()) break;
            to = Math.min(owner.state.doc.length, line.to + 1);
        }
    } else if (from > 0) {
        from--;
        while (from > 0) {
            const line = owner.state.doc.lineAt(from);
            if (line.text.trim()) break;
            from = Math.max(0, line.from - 1);
        }
    }
    return { from, to, insert: '' };
}

function applyColumnDrop(
    source: EditorView,
    block: MarkdownBlockRange,
    destination: ColumnDestination,
) {
    const origin = columnEditorOwner(source);
    const owner = origin?.columns.owner ?? source;
    if (
        !owner.state.facet(EditorView.editable) ||
        owner.state.readOnly ||
        owner.compositionStarted ||
        source.compositionStarted ||
        source.state.sliceDoc(block.from, block.to) !== block.source
    )
        return;
    if (mountedDocumentColumns(owner).some((columns) => columns.composing()))
        return;
    if (
        destination.view === source &&
        ['before', 'after'].includes(destination.placement)
    ) {
        moveMarkdownBlock(
            source,
            block,
            destination.block,
            destination.placement,
        );
        return;
    }
    const drafts = new Map<MountedColumns, ColumnLayout>();
    const draft = (columns: MountedColumns) => {
        let layout = drafts.get(columns);
        if (!layout) {
            const current = columns.current().layout;
            layout = {
                widths: [...current.widths],
                bodies: [...current.bodies],
            };
            drafts.set(columns, layout);
        }
        return layout;
    };
    if (origin) {
        const layout = draft(origin.columns);
        layout.bodies[origin.index] = removeBlock(
            layout.bodies[origin.index],
            block,
        );
    }
    const changes: ChangeSpec[] = [];
    let focusColumns = destination.columns;
    let focusIndex = destination.index ?? 0;
    if (destination.columns) {
        const layout = draft(destination.columns);
        if (
            destination.placement === 'left' ||
            destination.placement === 'right'
        ) {
            if (layout.bodies.length >= 3) return;
            focusIndex =
                destination.placement === 'left' ? 0 : layout.bodies.length;
            layout.bodies.splice(focusIndex, 0, block.source);
            layout.widths = equalColumnWidths(layout.bodies.length);
        } else {
            layout.bodies[destination.index!] = insertBlock(
                layout.bodies[destination.index!],
                block,
                destination,
            );
        }
    } else if (
        destination.placement === 'left' ||
        destination.placement === 'right'
    ) {
        const bodies =
            destination.placement === 'left'
                ? [block.source, destination.block.source]
                : [destination.block.source, block.source];
        changes.push({
            from: destination.block.from,
            to: destination.block.to,
            insert: serializeColumns({ widths: equalColumnWidths(2), bodies }),
        });
        focusIndex = destination.placement === 'left' ? 0 : 1;
    } else {
        const position =
            destination.placement === 'before'
                ? destination.block.from
                : destination.block.to;
        changes.push({
            from: position,
            insert:
                destination.placement === 'before'
                    ? `${block.source}\n\n`
                    : `\n\n${block.source}`,
        });
    }
    if (!origin) changes.push(removeDocumentBlockForColumnMove(owner, block));
    for (const [columns, layout] of drafts) {
        const current = columns.current().block;
        if (owner.state.sliceDoc(current.from, current.to) !== current.source)
            return;
        changes.push({
            from: current.from,
            to: current.to,
            insert: columnLayoutSource(current, layout),
        });
    }
    const transaction = owner.state.update({
        changes,
        annotations: isolateHistory.of('full'),
        userEvent: 'move.columns',
    });
    owner.dispatch(transaction);
    //
    // Rebuilding two columns as three finishes after the owner's transaction; focus only once those editors exist.
    //
    queueMicrotask(() => {
        if (
            !focusColumns &&
            ['left', 'right'].includes(destination.placement)
        ) {
            const start = transaction.changes.mapPos(
                destination.block.from,
                -1,
            );
            focusColumns = mountedDocumentColumns(owner).find(
                (columns) => columns.current().block.from === start,
            );
        }
        if (focusColumns) focusColumns.focus(focusIndex);
        else owner.focus();
    });
}

export function resolveColumnDrop(
    source: EditorView,
    block: MarkdownBlockRange,
    pointer: Pointer,
): ColumnDropTarget | null {
    const origin = columnEditorOwner(source);
    const owner = origin?.columns.owner ?? source;
    if (
        !owner.state.facet(EditorView.editable) ||
        owner.state.readOnly ||
        owner.compositionStarted ||
        source.compositionStarted ||
        owner.dom
            .closest('[data-live-preview]')
            ?.getAttribute('data-live-preview') !== 'true'
    )
        return null;
    const viewport = markdownDragViewport(owner);
    const bounds = owner.contentDOM.getBoundingClientRect();
    if (
        pointer.clientX < bounds.left - 12 ||
        pointer.clientX > bounds.right + 12 ||
        pointer.clientY < viewport.top ||
        pointer.clientY > viewport.bottom
    )
        return null;
    const document = owner.state.doc;
    const containsLayout = containsColumnLayout(block.source);
    function target(
        destination: ColumnDestination,
        rectangle: { top: number; left: number; width: number; height: number },
    ): ColumnDropTarget {
        return {
            owner,
            ...rectangle,
            apply: () => {
                if (owner.state.doc === document)
                    applyColumnDrop(source, block, destination);
            },
        };
    }
    for (const columns of mountedDocumentColumns(owner)) {
        const grid = columns.root.querySelector<HTMLElement>(
            '.orbium-columns-grid',
        );
        const rect = grid?.getBoundingClientRect();
        if (
            !grid ||
            !rect ||
            pointer.clientY < rect.top ||
            pointer.clientY > rect.bottom ||
            pointer.clientX < rect.left - 10 ||
            pointer.clientX > rect.right + 10
        )
            continue;
        if (containsLayout || columns.composing()) return null;
        const current = columns.current();
        const outerBlock = { ...current.block, name: 'OrbiumDirective' };
        if (
            current.layout.bodies.length === 2 &&
            rect.width > 680 &&
            (pointer.clientX < rect.left + 10 ||
                pointer.clientX > rect.right - 10)
        ) {
            const left = pointer.clientX < rect.left + 10;
            return target(
                {
                    view: owner,
                    columns,
                    block: outerBlock,
                    placement: left ? 'left' : 'right',
                },
                {
                    top: rect.top,
                    left: left ? rect.left - 5 : rect.right + 3,
                    width: 2,
                    height: rect.height,
                },
            );
        }
        const editors = columns.editors();
        for (let index = 0; index < editors.length; index++) {
            const view = editors[index];
            const editorBounds = view.dom.getBoundingClientRect();
            const rect = view.dom.parentElement!.getBoundingClientRect();
            if (
                pointer.clientX < rect.left - 10 ||
                pointer.clientX > rect.right + 10 ||
                pointer.clientY < rect.top - 4 ||
                pointer.clientY > Math.max(rect.bottom, rect.top + 50)
            )
                continue;
            const drop = markdownBlockDropTarget(view, {
                clientX: Math.max(
                    editorBounds.left + 1,
                    Math.min(editorBounds.right - 1, pointer.clientX),
                ),
                clientY: Math.max(
                    editorBounds.top + 1,
                    Math.min(editorBounds.bottom - 1, pointer.clientY),
                ),
            });
            if (!drop || (view === source && drop.block.from === block.from))
                return null;
            return target(
                {
                    view,
                    columns,
                    index,
                    block: drop.block,
                    placement: drop.placement,
                },
                {
                    top: drop.top,
                    left: rect.left,
                    width: rect.width,
                    height: 2,
                },
            );
        }
        return null;
    }
    const drop = markdownBlockDropTarget(owner, pointer);
    if (
        !drop ||
        !drop.block.source.trim() ||
        (!origin && drop.block.from === block.from)
    )
        return null;
    if (containsColumnLayout(drop.block.source)) {
        if (!origin) return null;
        // Dropping outside a column's body returns the block to the document flow.
        return target(
            { view: owner, block: drop.block, placement: drop.placement },
            {
                top: drop.top,
                left: bounds.left,
                width: bounds.width,
                height: 2,
            },
        );
    }
    const element = markdownBlockElement(owner, drop.block);
    const rect = element?.getBoundingClientRect();
    const edge = Math.min(36, bounds.width * 0.08);
    if (
        !containsLayout &&
        rect &&
        bounds.width > 520 &&
        (pointer.clientX < bounds.left + edge ||
            pointer.clientX > bounds.right - edge)
    ) {
        const left = pointer.clientX < bounds.left + edge;
        return target(
            {
                view: owner,
                block: drop.block,
                placement: left ? 'left' : 'right',
            },
            {
                top: rect.top,
                left: left ? bounds.left - 4 : bounds.right + 2,
                width: 2,
                height: Math.max(24, rect.height),
            },
        );
    }
    return origin
        ? target(
              { view: owner, block: drop.block, placement: drop.placement },
              {
                  top: drop.top,
                  left: bounds.left,
                  width: bounds.width,
                  height: 2,
              },
          )
        : null;
}
