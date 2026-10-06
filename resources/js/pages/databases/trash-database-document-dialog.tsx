import { router } from '@inertiajs/react';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import DatabaseDialog from './database-dialog';
import type { DatabaseDocument } from './types';

type Props = {
    document: DatabaseDocument;
    base: string;
    onClose: () => void;
};

export default function TrashDatabaseDocumentDialog({
    document,
    base,
    onClose,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    function moveDocumentToTrash() {
        if (processing) return;
        setError('');
        router.delete(`${base}/documents/${document.id}`, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                toast.success('Document moved to Trash');
                onClose();
            },
            onError: (errors) =>
                setError(
                    Object.values(errors).join(' ') ||
                        'Could not move this document to Trash. Please try again.',
                ),
        });
    }

    return (
        <DatabaseDialog
            open
            onClose={() => {
                if (!processing) onClose();
            }}
            title="Move document to Trash?"
            description={`“${document.title}” will be removed from this database. You can restore it from the workspace Trash with its content and properties.`}
        >
            {error && (
                <p role="alert" className="px-6 pb-4 text-sm text-destructive">
                    {error}
                </p>
            )}
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                <button
                    type="button"
                    disabled={processing}
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-sm hover:bg-muted disabled:opacity-40"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    disabled={processing}
                    onClick={moveDocumentToTrash}
                    className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                    {processing ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Trash2 size={14} />
                    )}
                    {processing ? 'Moving…' : 'Move to Trash'}
                </button>
            </div>
        </DatabaseDialog>
    );
}
