import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { GalleryAppearanceEditor } from './gallery-appearance-editor';
import type { GalleryAppearance } from './cover-presentation';

type Props = {
    draft: GalleryAppearance | null;
    saving: boolean;
    onChange: (draft: GalleryAppearance) => void;
    onClose: () => void;
    onSave: () => void;
};

export function GalleryAppearanceDialog({
    draft,
    saving,
    onChange,
    onClose,
    onSave,
}: Props) {
    return (
        <Dialog
            open={draft !== null}
            onOpenChange={(open) => {
                if (!open && !saving) onClose();
            }}
        >
            <DialogContent>
                <DialogTitle>Gallery appearance</DialogTitle>
                {draft && (
                    <GalleryAppearanceEditor
                        value={draft}
                        onChange={onChange}
                    />
                )}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg px-4 py-2 text-sm hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Apply'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
