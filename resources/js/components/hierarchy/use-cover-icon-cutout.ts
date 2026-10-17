import { useLayoutEffect, useState } from 'react';

function layoutPosition(element: HTMLElement) {
    let left = 0;
    let top = 0;
    let current: HTMLElement | null = element;
    while (current) {
        left += current.offsetLeft;
        top += current.offsetTop;
        const offsetParent: Element | null = current.offsetParent;
        current = offsetParent instanceof HTMLElement ? offsetParent : null;
        if (current) {
            left += current.clientLeft;
            top += current.clientTop;
        }
    }
    return { left, top };
}

function applyCoverIconCutout(cover: HTMLImageElement, icon: HTMLDivElement) {
    // Split and tab motion transform screen bounds without changing header layout.
    const coverWidth = cover.offsetWidth;
    const coverHeight = cover.offsetHeight;
    if (!coverWidth || !coverHeight) return;

    const slot = cover.closest<HTMLElement>('.page-media-cover-slot');
    const availableWidth = slot?.clientWidth ?? coverWidth;
    const layout = cover.closest('.node-media-layout');
    const besideCover =
        layout !== null && getComputedStyle(layout).display === 'grid';
    const compact = besideCover || coverWidth < availableWidth - 1;
    icon.dataset.coverLayout = compact ? 'compact' : 'banner';
    if (compact) {
        cover.style.removeProperty('mask-image');
        cover.style.removeProperty('-webkit-mask-image');
        icon.style.removeProperty('translate');
        return;
    }

    const coverPosition = layoutPosition(cover);
    const iconPosition = layoutPosition(icon);
    const iconStyle = getComputedStyle(icon);
    const radius = Number.parseFloat(iconStyle.borderTopLeftRadius);
    const inset = Number.parseFloat(iconStyle.marginLeft) || 0;
    const offset = Math.max(0, coverPosition.left + inset - iconPosition.left);
    icon.style.translate = `${offset}px`;
    const x = iconPosition.left + offset - coverPosition.left;
    const y = iconPosition.top - coverPosition.top;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${coverWidth}" height="${coverHeight}"><defs><mask id="cutout" maskUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="white"/><rect x="${x}" y="${y}" width="${icon.offsetWidth}" height="${icon.offsetHeight}" rx="${radius}" fill="black"/></mask></defs><rect width="100%" height="100%" fill="white" mask="url(#cutout)"/></svg>`;
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
