// Summary: Resolves V3 side/in/out drops using identified owner ranges and existing drag-indicator geometry; depends on mounted column projections and the atomic owner transaction dispatcher, never adjacent Markdown node inference.
import { EditorView } from '@codemirror/view';
import { v3StructureField } from '../../structure/v3-structure-state';
import { executeV3Operation } from '../../transactions/v3-transaction-dispatch';
import { consecutiveV3Blocks } from '../../transactions/v3-source-edits';
import {
    V3OperationError,
    type V3BlockOperation,
} from '../../transactions/v3-transaction-types';
import { markdownDragViewport } from '../../interactions/markdown-drag-scroll';
import { mountedV3ColumnLayouts } from './v3-column-layout';
import { isV3ColumnComposing } from './v3-column-registry';
import { readV3ColumnModel } from './v3-column-model';

export type V3ColumnDropTarget = {
    owner: EditorView;
    top: number;
    left: number;
    width: number;
    height: number;
    apply: () => void;
};

export function resolveV3ColumnDrop(request: {
    owner: EditorView;
    blockIds: readonly string[];
    pointer: { clientX: number; clientY: number };
    isAvailable: () => boolean;
    onError: (error: Error) => void;
}): V3ColumnDropTarget | null {
    const { owner, pointer } = request;
    if (
        !request.isAvailable() ||
        owner.state.readOnly ||
        !owner.state.facet(EditorView.editable) ||
        owner.composing ||
        owner.compositionStarted ||
        isV3ColumnComposing(owner)
    )
        return null;
    const index = owner.state.field(v3StructureField).current;
    if (!index.valid) return null;
    const blocks = consecutiveV3Blocks(
        {
            state: owner.state,
            index,
            allocateIdentity: () => {
                throw new Error('Drop queries never allocate identities.');
            },
        },
        request.blockIds,
    );
    const sourceIds = new Set(blocks.map((block) => block.id));
    const containsLayout = blocks.some((block) => block.type === 'columns');
    const startState = owner.state;
    const viewport = markdownDragViewport(owner);
    const bounds = owner.contentDOM.getBoundingClientRect();
    if (
        pointer.clientX < bounds.left - 12 ||
        pointer.clientX > bounds.right + 12 ||
        pointer.clientY < viewport.top ||
        pointer.clientY > viewport.bottom
    )
        return null;
    function target(
        operation: V3BlockOperation,
        rectangle: { top: number; left: number; width: number; height: number },
    ): V3ColumnDropTarget {
        return {
            owner,
            ...rectangle,
            apply() {
                try {
                    if (owner.state !== startState)
                        throw new V3OperationError(
                            'stale-column-drop',
                            'The document changed during this drop. Drag again.',
                        );
                    const result = executeV3Operation({
                        view: owner,
                        operation,
                        isAvailable: request.isAvailable,
                    });
                    if (result.warning)
                        request.onError(new Error(result.warning));
                } catch (error) {
                    request.onError(
                        error instanceof Error
                            ? error
                            : new Error('The column drop failed.'),
                    );
                }
            },
        };
    }
    for (const layout of mountedV3ColumnLayouts(owner)) {
        const grid = layout.root.querySelector<HTMLElement>(
            '.orbium-columns-grid',
        );
        const rectangle = grid?.getBoundingClientRect();
        if (
            !grid ||
            !rectangle ||
            pointer.clientY < rectangle.top ||
            pointer.clientY > rectangle.bottom ||
            pointer.clientX < rectangle.left - 10 ||
            pointer.clientX > rectangle.right + 10
        )
            continue;
        if (containsLayout) return null;
        const model = readV3ColumnModel(index, layout.layoutId);
        const sideZone = Math.min(40, rectangle.width * 0.07);
        if (
            model.columns.length === 2 &&
            rectangle.width > 680 &&
            (pointer.clientX < rectangle.left + sideZone ||
                pointer.clientX > rectangle.right - sideZone)
        ) {
            const side =
                pointer.clientX < rectangle.left + sideZone ? 'left' : 'right';
            return target(
                {
                    kind: 'add-column',
                    layoutId: layout.layoutId,
                    side,
                    blockIds: request.blockIds,
                },
                {
                    top: rectangle.top,
                    left:
                        side === 'left'
                            ? rectangle.left - 5
                            : rectangle.right + 3,
                    width: 2,
                    height: rectangle.height,
                },
            );
        }
        const projections = layout.projections();
        for (
            let columnIndex = 0;
            columnIndex < model.columns.length;
            columnIndex++
        ) {
            const column = model.columns[columnIndex];
            const view = projections[columnIndex]?.view;
            const host = view?.dom.parentElement;
            const rect = host?.getBoundingClientRect();
            if (
                !view ||
                !rect ||
                pointer.clientX < rect.left - 10 ||
                pointer.clientX > rect.right + 10 ||
                pointer.clientY < rect.top - 4 ||
                pointer.clientY > Math.max(rect.bottom, rect.top + 50)
            )
                continue;
            const position = view.posAtCoords(
                {
                    x: Math.max(
                        rect.left + 1,
                        Math.min(rect.right - 1, pointer.clientX),
                    ),
                    y: Math.max(
                        rect.top + 1,
                        Math.min(rect.bottom - 1, pointer.clientY),
                    ),
                },
                false,
            );
            const hovered =
                position === null
                    ? index.blocksIn(column.id).at(-1)
                    : index.blockAt(column.bodyFrom + position);
            if (!hovered || hovered.parentId !== column.id) return null;
            const local = Math.max(0, hovered.bodyFrom - column.bodyFrom);
            const top = view.coordsAtPos(local)?.top ?? rect.top;
            const bottom =
                view.coordsAtPos(
                    Math.max(
                        local,
                        Math.min(
                            view.state.doc.length,
                            hovered.bodyTo - column.bodyFrom - 1,
                        ),
                    ),
                )?.bottom ?? rect.bottom;
            const before = pointer.clientY < (top + bottom) / 2;
            const next = before ? hovered : index.neighbor(hovered.id, 1);
            if (next && sourceIds.has(next.id)) return null;
            const targetOrder = next?.order ?? index.blocksIn(column.id).length;
            if (
                blocks[0].parentId === column.id &&
                targetOrder >= blocks[0].order &&
                targetOrder <= blocks.at(-1)!.order + 1
            )
                return null;
            return target(
                {
                    kind: 'move',
                    blockIds: request.blockIds,
                    target: {
                        parentId: column.id,
                        ...(next ? { beforeId: next.id } : {}),
                    },
                },
                {
                    top: before ? top : bottom,
                    left: rect.left,
                    width: rect.width,
                    height: 2,
                },
            );
        }
        return null;
    }
    const position = owner.posAtCoords(
        {
            x: Math.max(
                bounds.left + 1,
                Math.min(bounds.right - 1, pointer.clientX),
            ),
            y: pointer.clientY,
        },
        false,
    );
    if (position === null) return null;
    let hovered = index.blockAt(position);
    if (!hovered) return null;
    if (hovered.parentId !== null)
        hovered = index.blockById(
            index.columnById(hovered.parentId)!.layoutId,
        )!;
    if (sourceIds.has(hovered.id)) return null;
    const widget = [
        ...owner.dom.querySelectorAll<HTMLElement>('[data-v3-block-id]'),
    ].find((element) => element.dataset.v3BlockId === hovered!.id);
    const rect = widget?.getBoundingClientRect();
    const top = rect?.top ?? owner.coordsAtPos(hovered.bodyFrom)?.top;
    const bottom =
        rect?.bottom ??
        owner.coordsAtPos(Math.max(hovered.bodyFrom, hovered.to - 1))?.bottom;
    if (top === undefined || bottom === undefined) return null;
    const edge = Math.min(48, (rect?.width ?? bounds.width) * 0.12);
    const left = rect?.left ?? bounds.left;
    const right = rect?.right ?? bounds.right;
    if (
        !containsLayout &&
        hovered.type !== 'columns' &&
        bounds.width > 520 &&
        (pointer.clientX < left + edge || pointer.clientX > right - edge)
    ) {
        const side = pointer.clientX < left + edge ? 'left' : 'right';
        return target(
            {
                kind: 'wrap-columns',
                blockIds: request.blockIds,
                besideId: hovered.id,
                side,
            },
            {
                top,
                left: side === 'left' ? bounds.left - 4 : bounds.right + 2,
                width: 2,
                height: Math.max(24, bottom - top),
            },
        );
    }
    const before = pointer.clientY < (top + bottom) / 2;
    const next = before ? hovered : index.neighbor(hovered.id, 1);
    const targetOrder = next?.order ?? index.blocksIn(null).length;
    if (
        blocks[0].parentId === null &&
        targetOrder >= blocks[0].order &&
        targetOrder <= blocks.at(-1)!.order + 1
    )
        return null;
    return target(
        {
            kind: 'move',
            blockIds: request.blockIds,
            target: { parentId: null, ...(next ? { beforeId: next.id } : {}) },
        },
        {
            top: before ? top : bottom,
            left: bounds.left,
            width: bounds.width,
            height: 2,
        },
    );
}
