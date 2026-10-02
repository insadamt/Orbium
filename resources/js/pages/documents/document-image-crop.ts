import type { CoverRatio } from '@/components/hierarchy/cover-presentation';

export type DocumentImageKind = 'icon' | 'cover';

export const documentImageTargets = {
    icon: { width: 512, height: 512, label: 'icon' },
    cover: { width: 1470, height: 432, label: 'cover' },
} as const;

const coverImageTargets: Record<
    CoverRatio,
    { width: number; height: number; label: string }
> = {
    '16:9': { width: 1200, height: 675, label: 'cover' },
    '9:16': { width: 675, height: 1200, label: 'cover' },
    '3:2': { width: 1200, height: 800, label: 'cover' },
    '4:3': { width: 1200, height: 900, label: 'cover' },
    '1:1': { width: 1200, height: 1200, label: 'cover' },
    '4:5': { width: 960, height: 1200, label: 'cover' },
};

export function imageTarget(kind: DocumentImageKind, ratio: CoverRatio) {
    return kind === 'cover'
        ? coverImageTargets[ratio]
        : documentImageTargets.icon;
}

export const supportedDocumentImageTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
]);

type CropPosition = { x: number; y: number };

export function clampCropPosition(
    image: HTMLImageElement,
    kind: DocumentImageKind,
    ratio: CoverRatio,
    zoom: number,
    position: CropPosition,
): CropPosition {
    const target = imageTarget(kind, ratio);
    const scale =
        Math.max(
            target.width / image.naturalWidth,
            target.height / image.naturalHeight,
        ) * zoom;
    const excessX = Math.max(
        0,
        (image.naturalWidth * scale - target.width) / 2,
    );
    const excessY = Math.max(
        0,
        (image.naturalHeight * scale - target.height) / 2,
    );
    return {
        x: Math.max(-excessX, Math.min(excessX, position.x)),
        y: Math.max(-excessY, Math.min(excessY, position.y)),
    };
}

export function drawDocumentImageCrop(
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    kind: DocumentImageKind,
    ratio: CoverRatio,
    zoom: number,
    position: CropPosition,
    preserveTransparency: boolean,
): void {
    const context = canvas.getContext('2d');
    if (!context) return;
    const target = imageTarget(kind, ratio);
    const scale =
        Math.max(
            target.width / image.naturalWidth,
            target.height / image.naturalHeight,
        ) * zoom;
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    const cropPosition = clampCropPosition(image, kind, ratio, zoom, position);
    context.clearRect(0, 0, target.width, target.height);
    if (!preserveTransparency) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, target.width, target.height);
    }
    context.drawImage(
        image,
        (target.width - drawnWidth) / 2 + cropPosition.x,
        (target.height - drawnHeight) / 2 + cropPosition.y,
        drawnWidth,
        drawnHeight,
    );
}

export async function getDocumentImageDimensions(file: File): Promise<{
    width: number;
    height: number;
}> {
    const image = await createImageBitmap(file);
    const dimensions = { width: image.width, height: image.height };
    image.close();
    return dimensions;
}
