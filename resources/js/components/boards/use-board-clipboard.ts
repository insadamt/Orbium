import type { ClipboardEvent } from 'react';
import { toast } from 'sonner';
import { boardBlockText } from './board-block-data';
import { validBoardObjects } from './board-api';
import { clamp } from './board-geometry';
import {
    boardLimits,
    type BoardObject,
    type BoardLocation,
    type BoardPoint,
} from './board-types';
import type { BoardObjectsController } from './use-board-objects';

const clipboardMime = 'application/x-orbium-board+json';

export function useBoardClipboard(
    model: BoardObjectsController,
    location: BoardLocation,
    centerPoint: () => BoardPoint,
    blocked: boolean,
) {
    function isEditor(event: ClipboardEvent) {
        return (event.target as Element).closest(
            '[data-board-editor], [data-board-interactive], button, a, input, textarea, select',
        );
    }
    function copy(event: ClipboardEvent<HTMLDivElement>, cut = false) {
        if (isEditor(event)) return;
        const objects = model.objectsRef.current.filter((object) =>
            model.selectedRef.current.includes(object.id),
        );
        if (!objects.length) return;
        try {
            event.clipboardData.setData(
                clipboardMime,
                JSON.stringify({
                    format_version: 2,
                    origin: window.location.origin,
                    workspace_id: location.workspaceId,
                    objects,
                }),
            );
            event.clipboardData.setData(
                'text/plain',
                objects.map(boardBlockText).join('\n\n'),
            );
            event.preventDefault();
            if (cut && !blocked) model.deleteSelected();
        } catch {
            toast.error('Could not copy these blocks. The originals are kept.');
        }
    }
    function paste(event: ClipboardEvent<HTMLDivElement>) {
        if (isEditor(event) || blocked) return;
        const encoded = event.clipboardData.getData(clipboardMime);
        const text = event.clipboardData.getData('text/plain');
        if (!encoded && !text) return;
        event.preventDefault();
        try {
            const point = centerPoint();
            if (!encoded) {
                model.addBlock(point, 'text', text);
                return;
            }
            if (encoded.length > 8_000_000)
                throw new Error(
                    'The copied blocks exceed the Board clipboard limit.',
                );
            const payload = JSON.parse(encoded) as {
                format_version?: number;
                origin?: string;
                workspace_id?: number;
                objects?: unknown;
            };
            if (
                payload.format_version !== 2 ||
                payload.origin !== window.location.origin ||
                payload.workspace_id !== location.workspaceId ||
                !validBoardObjects(payload.objects)
            )
                throw new Error(
                    'Paste Board blocks within the same Orbium workspace.',
                );
            if (!payload.objects.length) return;
            const left = Math.min(...payload.objects.map((object) => object.x));
            const top = Math.min(...payload.objects.map((object) => object.y));
            const copies: BoardObject[] = payload.objects.map(
                (object, index) => ({
                    id: crypto.randomUUID(),
                    block_type: object.block_type,
                    content_format_version: 1,
                    data: structuredClone(object.data),
                    width: object.width,
                    height: object.height,
                    x: clamp(
                        point.x + object.x - left,
                        -boardLimits.coordinate,
                        boardLimits.coordinate,
                    ),
                    y: clamp(
                        point.y + object.y - top,
                        -boardLimits.coordinate,
                        boardLimits.coordinate,
                    ),
                    layer: model.objectsRef.current.length + index,
                }),
            );
            const next = [...model.objectsRef.current, ...copies];
            if (!validBoardObjects(next))
                throw new Error(
                    'Pasting these blocks would exceed the Board object or text limit.',
                );
            model.finishEditing();
            model.commit(next);
            model.select(copies.map((object) => object.id));
        } catch (failure) {
            toast.error(
                failure instanceof Error
                    ? failure.message
                    : 'The copied blocks are invalid.',
            );
        }
    }
    return {
        onCopy: (event: ClipboardEvent<HTMLDivElement>) => copy(event),
        onCut: (event: ClipboardEvent<HTMLDivElement>) => copy(event, true),
        onPaste: paste,
    };
}
