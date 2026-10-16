import type { AttachmentMediaKind } from '@/components/media/attachment-media';
import * as Dialog from '@radix-ui/react-dialog';
import { LibraryBrowser } from './library-browser';
import type { LibraryFile } from './library-api';

export function LibraryPicker({
    workspaceId,
    imagesOnly,
    filesOnly,
    mediaKind,
    onChoose,
    onClose,
    onUpload,
}: {
    workspaceId: number;
    imagesOnly?: boolean;
    filesOnly?: boolean;
    mediaKind?: AttachmentMediaKind;
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
                <Dialog.Overlay className="library-dialog-overlay" />
                <Dialog.Content className="library-picker-dialog">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <Dialog.Title className="text-xl font-semibold">
                            Choose from Library
                        </Dialog.Title>
                        <Dialog.Close className="library-button">
                            Close
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="mb-5 text-sm text-muted-foreground">
                        Reuse a file from this workspace.
                    </Dialog.Description>
                    {onUpload && (
                        <button
                            className="library-button library-button-upload mb-5"
                            onClick={onUpload}
                        >
                            Upload a new{' '}
                            {mediaKind === 'pdf'
                                ? 'PDF'
                                : (mediaKind ??
                                  (imagesOnly ? 'image' : 'file'))}
                        </button>
                    )}
                    <LibraryBrowser
                        workspaceId={workspaceId}
                        imagesOnly={imagesOnly}
                        filesOnly={filesOnly}
                        mediaKind={mediaKind}
                        onChoose={onChoose}
                    />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
