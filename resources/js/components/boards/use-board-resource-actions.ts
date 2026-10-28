import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { BoardLocation } from './board-types';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import type { useBoardAutosave } from './use-board-autosave';
import {
    resourceObjectGeometry,
    resourcePlacementBeside,
} from './board-resource-layout';
import {
    createResourceDocument,
    type CreateResourceRequest,
} from './board-resource-api';
import { BoardSaveError, readBoardSnapshot } from './board-api';

type PendingCreation = { payload: CreateResourceRequest };
function storageKey(location: BoardLocation) {
    return `orbium.board.${location.workspaceId}.${location.boardId}.creation.v1`;
}
function readPending(location: BoardLocation): PendingCreation | null {
    try {
        const source = sessionStorage.getItem(storageKey(location));
        if (!source) return null;
        const payload = JSON.parse(source) as CreateResourceRequest;
        readBoardSnapshot(payload);
        if (
            typeof payload.request_id !== 'string' ||
            typeof payload.title !== 'string' ||
            !payload.object?.id
        )
            return null;
        return { payload };
    } catch {
        return null;
    }
}
export function useBoardResourceActions(
    location: BoardLocation,
    model: BoardObjectsController,
    camera: BoardCameraController,
    save: ReturnType<typeof useBoardAutosave>,
    setLocked: (locked: boolean) => void,
    isLocked: () => boolean,
) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(() => readPending(location));
    const pendingRef = useRef(pending);
    pendingRef.current = pending;
    const running = useRef(false);
    const active = useRef({ model, save });
    active.current = { model, save };
    function clearPending() {
        pendingRef.current = null;
        setPending(null);
        try {
            sessionStorage.removeItem(storageKey(location));
        } catch {}
    }
    async function create(title: string, requestId: string) {
        if (running.current) return false;
        const current = active.current;
        if (current.save.blocked || isLocked())
            throw new Error(
                'Resolve the active draft before creating a Document.',
            );
        running.current = true;
        setLocked(true);
        try {
            await current.save.saveNow();
            if (!current.save.isClean())
                throw new Error(
                    'Finish saving this Board before creating a Document.',
                );
            const payload = pendingRef.current?.payload ?? {
                format_version: 8,
                revision: current.save.currentRevision(),
                objects: current.model.objectsRef.current,
                request_id: requestId,
                title,
                object: resourceObjectGeometry(camera.centerPoint()),
            };
            const record = { payload };
            pendingRef.current = record;
            setPending(record);
            try {
                sessionStorage.setItem(
                    storageKey(location),
                    JSON.stringify(payload),
                );
            } catch {
                toast.warning(
                    'Creation retry recovery is unavailable. Keep this dialog open until creation is confirmed.',
                );
            }
            const result = await createResourceDocument(location, payload);
            current.save.adoptSavedSnapshot(result.snapshot);
            current.model.adoptSavedInsertion(
                result.snapshot.objects,
                payload.object.id,
            );
            clearPending();
            return true;
        } catch (failure) {
            if (
                failure instanceof BoardSaveError &&
                [400, 401, 403, 404, 409, 410, 422].includes(failure.status)
            )
                clearPending();
            if (failure instanceof BoardSaveError && failure.status === 409)
                current.save.recordExternalConflict(failure.message);
            throw failure;
        } finally {
            running.current = false;
            setLocked(false);
        }
    }
    return {
        open,
        pendingTitle: pending?.payload.title,
        openPicker: () => {
            if (isLocked() || save.blocked) return;
            model.finishEditing();
            setOpen(true);
        },
        close: () => {
            if (!running.current) setOpen(false);
        },
        create,
        insertDocument: (targetId: number, sourceObjectId: string) => {
            if (isLocked() || save.blocked) return false;
            const source = model.objectsRef.current.find(
                (object) => object.id === sourceObjectId,
            );
            return model.addResource(
                source ? resourcePlacementBeside(source) : camera.centerPoint(),
                targetId,
            );
        },
        insert: (targetId: number) =>
            !isLocked() &&
            !save.blocked &&
            model.addResource(camera.centerPoint(), targetId),
    };
}
