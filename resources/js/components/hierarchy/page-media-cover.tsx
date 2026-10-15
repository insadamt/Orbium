import type { LibraryFile } from '@/components/library/library-api';
import { useState, type CSSProperties, type Ref } from 'react';
import { PageMediaEditButton } from './page-media-edit-button';
import { ratioNumber, type CoverRatio } from './cover-presentation';

const defaultCoverUrl = '/imgs/default-page-cover.svg';

export function PageMediaCover({
    workspaceId,
    onChooseLibrary,
    imageUrl,
    aspectRatio,
    entityLabel,
    coverRef,
    uploading,
    onChooseImage,
    onResetImage,
}: {
    workspaceId?: number;
    onChooseLibrary?: (file: LibraryFile) => void;
    imageUrl: string | null;
    aspectRatio?: CoverRatio;
    entityLabel: string;
    coverRef: Ref<HTMLImageElement>;
    uploading: boolean;
    onChooseImage: () => void;
    onResetImage: () => void;
}) {
    const [loadedImage, setLoadedImage] = useState<{
        url: string;
        ratio: number;
    } | null>(null);
    const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
    const sourceUrl =
        imageUrl && imageUrl !== failedImageUrl ? imageUrl : defaultCoverUrl;
    const ratio =
        loadedImage?.url === sourceUrl
            ? loadedImage.ratio
            : ratioNumber(
                  sourceUrl === defaultCoverUrl
                      ? '11:3'
                      : (aspectRatio ?? '11:3'),
              );

    return (
        <div
            className="page-media-cover-slot"
            data-cover-shape={
                sourceUrl !== defaultCoverUrl && ratio < 1
                    ? 'portrait'
                    : sourceUrl !== defaultCoverUrl && ratio < 2
                      ? 'compact'
                      : 'landscape'
            }
            style={{ '--page-cover-ratio': ratio } as CSSProperties}
        >
            <div className="page-media-cover page-media-editable">
                <img
                    ref={coverRef}
                    className="page-media-cover-image"
                    src={sourceUrl}
                    alt={`${entityLabel} cover`}
                    onLoad={(event) => {
                        const image = event.currentTarget;
                        if (image.naturalWidth && image.naturalHeight) {
                            setLoadedImage({
                                url: sourceUrl,
                                ratio: image.naturalWidth / image.naturalHeight,
                            });
                        }
                    }}
                    onError={() => {
                        if (sourceUrl !== defaultCoverUrl)
                            setFailedImageUrl(sourceUrl);
                    }}
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
        </div>
    );
}
