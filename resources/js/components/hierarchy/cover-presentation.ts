export const coverRatios = [
    '16:9',
    '9:16',
    '3:2',
    '4:3',
    '1:1',
    '4:5',
] as const;
export type CoverRatio = (typeof coverRatios)[number];
export type GalleryAppearance = {
    layout: 'natural' | 'uniform';
    ratio: CoverRatio;
    fit: 'contain' | 'crop';
};

export function ratioNumber(ratio: CoverRatio | null | undefined): number {
    if (!ratio) return 1470 / 432;
    const [width, height] = ratio.split(':').map(Number);
    return width / height;
}

export function galleryAppearance(
    value: Partial<GalleryAppearance> | null | undefined,
): GalleryAppearance {
    return {
        layout: value?.layout === 'uniform' ? 'uniform' : 'natural',
        ratio: coverRatios.includes(value?.ratio as CoverRatio)
            ? (value?.ratio as CoverRatio)
            : '16:9',
        fit: value?.fit === 'crop' ? 'crop' : 'contain',
    };
}
