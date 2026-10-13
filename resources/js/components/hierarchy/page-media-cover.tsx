import type { LibraryFile } from '@/components/library/library-api';
import type { Ref } from 'react';
import { PageMediaEditButton } from './page-media-edit-button';

export function PageMediaCover({
    workspaceId,
    onChooseLibrary,
    imageUrl,
    entityLabel,
    coverRef,
    uploading,
    onChooseImage,
    onResetImage,
}: {
    workspaceId?: number;
    onChooseLibrary?: (file: LibraryFile) => void;
    imageUrl: string | null;
    entityLabel: string;
    coverRef: Ref<HTMLImageElement>;
    uploading: boolean;
    onChooseImage: () => void;
    onResetImage: () => void;
}) {
    return (
        <div className="page-media-cover page-media-editable">
            <img
                ref={coverRef}
                className="page-media-cover-image"
                src={imageUrl ?? '/imgs/default-page-cover.svg'}
                alt={`${entityLabel} cover`}
            />
            <div className="page-media-cover-edit">
                <PageMediaEditButton
                    workspaceId={workspaceId}
                    onChooseLibrary={onChooseLibrary}
                    entityLabel={entityLabel}
                    kind="cover"
                    hasCustomImage={Boolean(imageUrl)}
                    uploading={uploading}
                    onChooseImage={onChooseImage}
                    onResetImage={onResetImage}
                />
            </div>
        </div>
    );
}
