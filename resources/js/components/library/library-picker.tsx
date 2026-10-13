import * as Dialog from '@radix-ui/react-dialog';
import { LibraryBrowser } from './library-browser';
import type { LibraryFile } from './library-api';

export function LibraryPicker({
    workspaceId,
    imagesOnly,
    onChoose,
    onClose,
    onUpload,
}: {
    workspaceId: number;
    imagesOnly?: boolean;
    onChoose: (file: LibraryFile) => void;
    onClose: () => void;
    onUpload?: () => void;
}) {
    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-[81] max-h-[85vh] w-[min(900px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-6 shadow-xl">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <Dialog.Title className="text-xl font-semibold">
                            Choose from Library
                        </Dialog.Title>
                        <Dialog.Close className="rounded-lg border px-3 py-2">
                            Close
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="mb-5 text-sm text-muted-foreground">
                        Reuse a file from this workspace.
                    </Dialog.Description>
                    {onUpload && (
                        <button
                            className="mb-5 rounded-lg border px-3 py-2"
                            onClick={onUpload}
                        >
                            Upload a new {imagesOnly ? 'image' : 'file'}
                        </button>
                    )}
                    <LibraryBrowser
                        workspaceId={workspaceId}
                        imagesOnly={imagesOnly}
                        onChoose={onChoose}
                    />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
