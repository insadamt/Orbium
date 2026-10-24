import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { createPdfPageSurface, pdfPageGeometry } from './pdf-page-surface';
import type { PdfViewSession } from './pdf-view-session';

export async function rasterizePdfPage(options: {
    pdf: PDFDocumentProxy;
    viewport: HTMLElement;
    pageNumber: number;
    rotation: number;
    zoom?: number;
    surface: ReturnType<typeof createPdfPageSurface>;
    session?: PdfViewSession;
    isCurrent: () => boolean;
    setRenderTask: (task: RenderTask) => void;
}) {
    const { pdf, viewport, pageNumber, rotation, zoom, surface, session } =
        options;
    let pendingCanvas: HTMLCanvasElement | undefined;
    try {
        const page = await pdf.getPage(pageNumber);
        if (!options.isCurrent()) return false;
        const pageRotation = (page.rotate + rotation) % 360;
        const natural = page.getViewport({ scale: 1, rotation: pageRotation });
        const geometry = pdfPageGeometry({
            viewport,
            pageNumber,
            rotation,
            naturalWidth: natural.width,
            naturalHeight: natural.height,
            zoom,
        });
        if (surface.matches(geometry)) {
            session?.record('skippedRasters');
            return false;
        }
        const pageViewport = page.getViewport({
            scale: geometry.scale,
            rotation: pageRotation,
        });
        const canvas = viewport.ownerDocument.createElement('canvas');
        pendingCanvas = canvas;
        canvas.width = geometry.pixelWidth;
        canvas.height = geometry.pixelHeight;
        session?.record('pageRasterizations');
        const task = page.render({
            canvas,
            viewport: pageViewport,
            transform: [geometry.outputScale, 0, 0, geometry.outputScale, 0, 0],
        });
        options.setRenderTask(task);
        await task.promise;
        if (!options.isCurrent()) return false;
        const content = await page.getTextContent();
        if (!options.isCurrent()) return false;
        //
        // Publish complete pixels and accessible text together; stale or canceled revisions never replace the readable page.
        //
        const visual = {
            ...geometry,
            canvas,
            text: content.items
                .map((item) => ('str' in item ? item.str : ''))
                .join(' '),
            pageCount: pdf.numPages,
            naturalWidth: natural.width,
            naturalHeight: natural.height,
        };
        surface.display(visual);
        session?.rememberPreparedPage(visual);
        return true;
    } finally {
        if (pendingCanvas) pendingCanvas.width = pendingCanvas.height = 0;
    }
}
