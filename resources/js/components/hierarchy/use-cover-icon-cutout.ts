import { useLayoutEffect, useState } from 'react';

function applyCoverIconCutout(cover: HTMLImageElement, icon: HTMLDivElement) {
    const coverBounds = cover.getBoundingClientRect();
    if (!coverBounds.width || !coverBounds.height) return;

    const slot = cover.closest('.page-media-cover-slot');
    const availableWidth =
        slot?.getBoundingClientRect().width ?? coverBounds.width;
    const compact = coverBounds.width < availableWidth - 1;
    icon.dataset.coverLayout = compact ? 'compact' : 'banner';
    if (compact) {
        cover.style.removeProperty('mask-image');
        cover.style.removeProperty('-webkit-mask-image');
        icon.style.removeProperty('translate');
        return;
    }

    const iconBounds = icon.getBoundingClientRect();
    const iconStyle = getComputedStyle(icon);
    const radius = Number.parseFloat(iconStyle.borderTopLeftRadius);
    const previousOffset = Number.parseFloat(icon.style.translate) || 0;
    const naturalIconLeft = iconBounds.left - previousOffset;
    const inset = Number.parseFloat(iconStyle.marginLeft) || 0;
    const offset = Math.max(0, coverBounds.left + inset - naturalIconLeft);
    icon.style.translate = `${offset}px`;
    const x = naturalIconLeft + offset - coverBounds.left;
    const y = iconBounds.top - coverBounds.top;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${coverBounds.width}" height="${coverBounds.height}"><defs><mask id="cutout" maskUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="white"/><rect x="${x}" y="${y}" width="${iconBounds.width}" height="${iconBounds.height}" rx="${radius}" fill="black"/></mask></defs><rect width="100%" height="100%" fill="white" mask="url(#cutout)"/></svg>`;
    const maskImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    cover.style.maskImage = maskImage;
    cover.style.webkitMaskImage = maskImage;
}

export function useCoverIconCutout() {
    const [cover, setCover] = useState<HTMLImageElement | null>(null);
    const [icon, setIcon] = useState<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (!cover || !icon) return;

        function updateCutout() {
            if (cover && icon) applyCoverIconCutout(cover, icon);
        }

        const observer = new ResizeObserver(updateCutout);
        observer.observe(cover);
        observer.observe(icon);
        if (cover.parentElement) observer.observe(cover.parentElement);
        const slot = cover.closest('.page-media-cover-slot');
        if (slot) observer.observe(slot);
        if (icon.parentElement) observer.observe(icon.parentElement);
        cover.addEventListener('load', updateCutout);
        updateCutout();

        return () => {
            observer.disconnect();
            cover.removeEventListener('load', updateCutout);
            cover.style.removeProperty('mask-image');
            cover.style.removeProperty('-webkit-mask-image');
            icon.style.removeProperty('translate');
            delete icon.dataset.coverLayout;
        };
    }, [cover, icon]);

    return { coverRef: setCover, iconRef: setIcon };
}
