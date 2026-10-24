import { pdfOutputScale } from './pdf-display-density';
import {
    samePdfPageGeometry,
    type PdfPageGeometry,
    type PreparedPdfPage,
} from './pdf-view-session';

export function pdfPageGeometry({
    viewport,
    pageNumber,
    rotation,
    naturalWidth,
    naturalHeight,
    zoom,
}: {
    viewport: HTMLElement;
    pageNumber: number;
    rotation: number;
    naturalWidth: number;
    naturalHeight: number;
    zoom?: number;
}) {
    const style = getComputedStyle(viewport);
    const availableWidth = Math.max(
        1,
        viewport.clientWidth -
            (parseFloat(style.paddingLeft) || 0) -
            (parseFloat(style.paddingRight) || 0),
    );
    const scale = zoom ?? availableWidth / naturalWidth;
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    const outputScale = pdfOutputScale(viewport, { width, height });
    return {
        pageNumber,
        rotation,
        width,
        height,
        pixelWidth: Math.ceil(width * outputScale),
        pixelHeight: Math.ceil(height * outputScale),
        scale,
        outputScale,
    };
}

export function createPdfPageSurface(viewport: HTMLElement, name: string) {
    const canvas = document.createElement('canvas');
    canvas.hidden = true;
    canvas.setAttribute('role', 'img');
    const text = document.createElement('p');
    text.className = 'sr-only';
    const loading = document.createElement('span');
    loading.className = 'attachment-pdf-loading';
    loading.textContent = 'Loading document…';
    loading.setAttribute('role', 'status');
    viewport.append(canvas, text, loading);
    let displayed: Omit<PreparedPdfPage, 'canvas'> | undefined;
    return {
        canvas,
        text,
        loading,
        getDisplayed: () => displayed,
        resizeDisplay(geometry: PdfPageGeometry) {
            canvas.style.width = `${geometry.width}px`;
            canvas.style.height = `${geometry.height}px`;
        },
        matches: (geometry: PdfPageGeometry) =>
            Boolean(
                displayed &&
                !canvas.hidden &&
                samePdfPageGeometry(displayed, geometry),
            ),
        display(page: PreparedPdfPage) {
            canvas.width = page.pixelWidth;
            canvas.height = page.pixelHeight;
            canvas.getContext('2d')?.drawImage(page.canvas, 0, 0);
            canvas.style.width = `${page.width}px`;
            canvas.style.height = `${page.height}px`;
            canvas.setAttribute(
                'aria-label',
                `${name}, page ${page.pageNumber} of ${page.pageCount}`,
            );
            text.textContent = page.text;
            loading.hidden = true;
            canvas.hidden = false;
            viewport.setAttribute('aria-busy', 'false');
            displayed = page;
        },
        clear() {
            canvas.width = canvas.height = 0;
            displayed = undefined;
        },
    };
}
