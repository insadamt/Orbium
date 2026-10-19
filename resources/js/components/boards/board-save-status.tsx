import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import type { BoardSnapshot } from './board-types';
import type { useBoardAutosave } from './use-board-autosave';

export function BoardSaveStatus({
    save,
    onLoaded,
    uploading = false,
    busyLabel,
}: {
    save: ReturnType<typeof useBoardAutosave>;
    onLoaded: (snapshot: BoardSnapshot) => void;
    uploading?: boolean;
    busyLabel?: string;
}) {
    const [confirmReload, setConfirmReload] = useState(false);
    return (
        <>
            <div
                className="board-save-status glass-surface"
                data-status={save.status}
                data-expanded={Boolean(
                    save.error || save.notice || save.storageWarning,
                )}
                aria-live="polite"
            >
                <span>
                    {
                        {
                            saved: 'Saved',
                            unsaved: 'Unsaved changes',
                            saving: 'Saving…',
                            error: 'Not saved',
                            loading: 'Loading latest…',
                        }[save.status]
                    }
                </span>
                {busyLabel && <span role="status">{busyLabel}</span>}
                {(save.error || save.notice || save.storageWarning) && (
                    <span
                        className={
                            save.error || save.storageWarning
                                ? 'text-destructive'
                                : ''
                        }
                    >
                        {[save.error, save.notice, save.storageWarning]
                            .filter(Boolean)
                            .join(' ')}
                    </span>
                )}
                {save.status === 'error' && (
                    <div className="flex flex-wrap gap-3">
                        {!save.blocked && (
                            <button
                                type="button"
                                onClick={() => void save.saveNow()}
                            >
                                Retry save
                            </button>
                        )}
                        <button type="button" onClick={save.downloadDraft}>
                            Download local draft
                        </button>
                        <button
                            type="button"
                            disabled={uploading}
                            onClick={() => setConfirmReload(true)}
                        >
                            Load latest
                        </button>
                    </div>
                )}
            </div>
            <Dialog open={confirmReload} onOpenChange={setConfirmReload}>
                <DialogContent>
                    <DialogTitle>Load the latest Board?</DialogTitle>
                    <p className="text-sm leading-6 text-muted-foreground">
                        This replaces your unsaved local changes with the saved
                        Board. Download your local draft first if you want to
                        keep a copy.
                    </p>
                    <div className="flex flex-wrap justify-end gap-3 text-sm">
                        <button type="button" onClick={save.downloadDraft}>
                            Download local draft
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmReload(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={save.status === 'loading' || uploading}
                            className="rounded-lg bg-foreground px-4 py-2 text-background disabled:opacity-40"
                            onClick={async () => {
                                const snapshot = await save.loadLatest();
                                if (snapshot) {
                                    onLoaded(snapshot);
                                    setConfirmReload(false);
                                }
                            }}
                        >
                            {save.status === 'loading'
                                ? 'Loading…'
                                : 'Load latest'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
