import type {
    PDFDocumentLoadingTask,
    PDFDocumentProxy,
    RenderTask,
} from 'pdfjs-dist';
import { mediaIconButton } from './media-controls';

export function mountPdfReader(
    url: string,
    name: string,
    reportError: (message?: string) => void,
    onResize?: () => void,
) {
    const root = document.createElement('div');
    root.className = 'attachment-pdf-reader';
    const viewport = document.createElement('div');
    viewport.className = 'attachment-pdf-viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('aria-label', `PDF pages: ${name}`);
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
    let documentTask: PDFDocumentLoadingTask | undefined;
    let pdf: PDFDocumentProxy | undefined;
    let renderTask: RenderTask | undefined;
    let destroyed = false;
    let started = false;
    let rendering = false;
    let revision = 0;
    let pageNumber = 1;
    let zoom = 1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tools = document.createElement('div');
    tools.className = 'attachment-pdf-controls';
    const previous = mediaIconButton('Previous page', 'arrowLeft', () =>
        changePage(pageNumber - 1),
    );
    const next = mediaIconButton('Next page', 'arrowRight', () =>
        changePage(pageNumber + 1),
    );
    const page = document.createElement('input');
    page.type = 'number';
    page.min = '1';
    page.value = '1';
    page.setAttribute('aria-label', 'PDF page number');
    const total = document.createElement('span');
    total.textContent = '/ —';
    const zoomOut = mediaIconButton('Zoom out', 'minus', () =>
        changeZoom(zoom / 1.25),
    );
    const zoomIn = mediaIconButton('Zoom in', 'plus', () =>
        changeZoom(zoom * 1.25),
    );
    const fit = mediaIconButton('Fit page width', 'maximize', () =>
        changeZoom(1),
    );
    const zoomLevel = document.createElement('output');
    zoomLevel.setAttribute('aria-label', 'Zoom level');
    zoomLevel.textContent = 'Fit';
    page.addEventListener('change', () => changePage(Number(page.value)));
    page.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            changePage(Number(page.value));
            viewport.focus();
        }
    });
    function updateControls() {
        previous.disabled = !pdf || pageNumber <= 1;
        next.disabled = !pdf || pageNumber >= pdf.numPages;
        page.disabled = !pdf;
        page.value = String(pageNumber);
        page.max = String(pdf?.numPages ?? 1);
        total.textContent = `/ ${pdf?.numPages ?? '—'}`;
        zoomOut.disabled = zoom <= 0.5;
        zoomIn.disabled = zoom >= 3;
        zoomLevel.textContent =
            zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`;
    }
    function changePage(value: number) {
        pageNumber = Math.max(
            1,
            Math.min(pdf?.numPages ?? 1, Math.round(value) || 1),
        );
        viewport.scrollTop = 0;
        scheduleRender();
    }
    function changeZoom(value: number) {
        zoom = Math.max(0.5, Math.min(3, value));
        scheduleRender();
    }
    function scheduleRender() {
        revision++;
        updateControls();
        clearTimeout(timer);
        renderTask?.cancel();
        timer = setTimeout(() => void renderPage(), 80);
    }
    async function renderPage() {
        if (!pdf || destroyed) return;
        if (rendering) {
            timer = setTimeout(() => void renderPage(), 50);
            return;
        }
        const currentRevision = revision;
        rendering = true;
        loading.hidden = false;
        viewport.setAttribute('aria-busy', 'true');
        try {
            const currentPage = await pdf.getPage(pageNumber);
            if (destroyed || currentRevision !== revision) return;
            const natural = currentPage.getViewport({ scale: 1 });
            const width = Math.max(180, viewport.clientWidth - 40);
            const pageViewport = currentPage.getViewport({
                scale: (width / natural.width) * zoom,
            });
            const outputScale = Math.min(
                window.devicePixelRatio || 1,
                2,
                Math.sqrt(
                    8_388_608 / (pageViewport.width * pageViewport.height),
                ),
            );
            canvas.width = Math.ceil(pageViewport.width * outputScale);
            canvas.height = Math.ceil(pageViewport.height * outputScale);
            canvas.style.width = `${pageViewport.width}px`;
            canvas.style.height = `${pageViewport.height}px`;
            canvas.setAttribute(
                'aria-label',
                `${name}, page ${pageNumber} of ${pdf.numPages}`,
            );
            renderTask = currentPage.render({
                canvas,
                viewport: pageViewport,
                transform: [outputScale, 0, 0, outputScale, 0, 0],
            });
            await renderTask.promise;
            if (destroyed || currentRevision !== revision) return;
            loading.hidden = true;
            canvas.hidden = false;
            viewport.setAttribute('aria-busy', 'false');
            const content = await currentPage.getTextContent();
            if (!destroyed && currentRevision === revision)
                text.textContent = content.items
                    .map((item) => ('str' in item ? item.str : ''))
                    .join(' ');
            onResize?.();
        } catch (error) {
            if (
                !destroyed &&
                currentRevision === revision &&
                !(
                    error instanceof Error &&
                    error.name === 'RenderingCancelledException'
                )
            ) {
                loading.hidden = true;
                viewport.setAttribute('aria-busy', 'false');
                reportError(
                    'This PDF page could not be displayed. Download the file to open it in another app.',
                );
            }
        } finally {
            rendering = false;
        }
    }
    async function load() {
        if (started || destroyed) return;
        started = true;
        try {
            const { loadPdfDocument } = await import('./pdf-engine');
            if (destroyed) return;
            documentTask = loadPdfDocument(url);
            documentTask.onPassword = () => {
                reportError(
                    'This PDF is password protected. Download it to open it in your PDF app.',
                );
                loading.hidden = true;
                void documentTask?.destroy();
            };
            pdf = await documentTask.promise;
            if (destroyed) return;
            scheduleRender();
        } catch {
            if (!destroyed) {
                loading.hidden = true;
                reportError(
                    'This PDF could not be opened. Download the file to open it in another app.',
                );
            }
        }
    }
    const intersection = new IntersectionObserver(
        (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                intersection.disconnect();
                void load();
            }
        },
        { rootMargin: '200px' },
    );
    intersection.observe(root);
    let lastWidth = 0;
    const resize = new ResizeObserver(() => {
        if (Math.abs(viewport.clientWidth - lastWidth) < 2) return;
        lastWidth = viewport.clientWidth;
        scheduleRender();
    });
    resize.observe(viewport);
    viewport.addEventListener('keydown', (event) => {
        if (event.target !== viewport) return;
        if (event.key === 'ArrowLeft' || event.key === 'PageUp')
            changePage(pageNumber - 1);
        else if (event.key === 'ArrowRight' || event.key === 'PageDown')
            changePage(pageNumber + 1);
        else return;
        event.preventDefault();
        event.stopPropagation();
    });
    tools.append(previous, page, total, next, zoomOut, zoomLevel, zoomIn, fit);
    root.append(viewport, tools);
    updateControls();
    return {
        root,
        refresh: scheduleRender,
        destroy() {
            destroyed = true;
            clearTimeout(timer);
            intersection.disconnect();
            resize.disconnect();
            renderTask?.cancel();
            void documentTask?.destroy();
            canvas.width = canvas.height = 0;
        },
    };
}
