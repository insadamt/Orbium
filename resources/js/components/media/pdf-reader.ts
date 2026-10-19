import {
    observePdfDisplayDensity,
    pdfOutputScale,
} from './pdf-display-density';
import type {
    PDFDocumentLoadingTask,
    PDFDocumentProxy,
    RenderTask,
} from 'pdfjs-dist';
import { mediaIconButton } from './media-controls';
import { mountPdfThumbnails } from './pdf-thumbnails';

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
    let zoom: number | undefined;
    let renderedScale = 1;
    let rotation = 0;
    let sidebarVisible = true;
    const thumbnails = mountPdfThumbnails({ onSelectPage: changePage });
    const body = document.createElement('div');
    body.className = 'attachment-pdf-body';
    body.append(thumbnails.root, viewport);
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
        changeZoom((zoom ?? renderedScale) / 1.25),
    );
    const zoomIn = mediaIconButton('Zoom in', 'plus', () =>
        changeZoom((zoom ?? renderedScale) * 1.25),
    );
    const zoomLevel = document.createElement('select');
    zoomLevel.setAttribute('aria-label', 'PDF zoom');
    for (const value of [50, 75, 100, 125, 150, 200, 300]) {
        const option = document.createElement('option');
        option.value = String(value / 100);
        option.textContent = `${value}%`;
        zoomLevel.append(option);
    }
    const automaticZoom = document.createElement('option');
    automaticZoom.value = 'auto';
    automaticZoom.textContent = 'Auto';
    zoomLevel.prepend(automaticZoom);
    zoomLevel.value = 'auto';
    zoomLevel.addEventListener('change', () => {
        zoom = zoomLevel.value === 'auto' ? undefined : Number(zoomLevel.value);
        scheduleRender();
    });
    const sidebar = mediaIconButton('Toggle page previews', 'sidebar', () => {
        sidebarVisible = !sidebarVisible;
        refreshLayout();
    });
    const first = mediaIconButton('First page', 'firstPage', () =>
        changePage(1),
    );
    const last = mediaIconButton('Last page', 'lastPage', () =>
        changePage(pdf?.numPages ?? 1),
    );
    const rotate = mediaIconButton('Rotate clockwise', 'rotate', () => {
        rotation = (rotation + 90) % 360;
        scheduleRender();
    });
    for (const control of [sidebar, first, last, rotate])
        control.classList.add('attachment-pdf-expanded-control');
    function refreshLayout() {
        const expanded = root.closest('[data-expanded="true"]') !== null;
        thumbnails.setVisible(expanded && sidebarVisible);
        sidebar.setAttribute('aria-pressed', String(sidebarVisible));
        scheduleRender();
    }
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
        first.disabled = previous.disabled;
        last.disabled = next.disabled;
        rotate.disabled = !pdf;
        zoomOut.disabled = !pdf || (zoom ?? renderedScale) <= 0.5;
        zoomIn.disabled = !pdf || (zoom ?? renderedScale) >= 3;
        zoomLevel.disabled = !pdf;
        const custom = zoomLevel.querySelector('[data-custom]');
        custom?.remove();
        if (
            zoom !== undefined &&
            ![...zoomLevel.options].some(
                (option) => Number(option.value) === zoom,
            )
        ) {
            const option = document.createElement('option');
            option.dataset.custom = 'true';
            option.value = String(zoom);
            option.textContent = `${Math.round(zoom * 100)}%`;
            zoomLevel.append(option);
        }
        zoomLevel.value = zoom === undefined ? 'auto' : String(zoom);
        thumbnails.selectPage(pageNumber);
    }
    function changePage(value: number) {
        pageNumber = Math.max(
            1,
            Math.min(
                pdf?.numPages ?? 1,
                Number.isFinite(value) ? Math.round(value) || 1 : 1,
            ),
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
        loading.hidden = !canvas.hidden;
        viewport.setAttribute('aria-busy', 'true');
        let pendingCanvas: HTMLCanvasElement | undefined;
        try {
            const currentPage = await pdf.getPage(pageNumber);
            if (destroyed || currentRevision !== revision) return;
            const pageRotation = (currentPage.rotate + rotation) % 360;
            const natural = currentPage.getViewport({
                scale: 1,
                rotation: pageRotation,
            });
            const viewportStyle = getComputedStyle(viewport);
            const width = Math.max(
                1,
                viewport.clientWidth -
                    parseFloat(viewportStyle.paddingLeft) -
                    parseFloat(viewportStyle.paddingRight),
            );
            const pageViewport = currentPage.getViewport({
                scale: zoom ?? width / natural.width,
                rotation: pageRotation,
            });
            renderedScale = pageViewport.scale;
            updateControls();
            const outputScale = pdfOutputScale(viewport, pageViewport);
            const nextCanvas = root.ownerDocument.createElement('canvas');
            pendingCanvas = nextCanvas;
            nextCanvas.width = Math.ceil(pageViewport.width * outputScale);
            nextCanvas.height = Math.ceil(pageViewport.height * outputScale);
            renderTask = currentPage.render({
                canvas: nextCanvas,
                viewport: pageViewport,
                transform: [outputScale, 0, 0, outputScale, 0, 0],
            });
            await renderTask.promise;
            if (destroyed || currentRevision !== revision) return;
            // Keep the displayed page intact until its replacement raster is ready.

            canvas.width = nextCanvas.width;
            canvas.height = nextCanvas.height;
            canvas.getContext('2d')?.drawImage(nextCanvas, 0, 0);
            nextCanvas.width = nextCanvas.height = 0;
            canvas.style.width = `${pageViewport.width}px`;
            canvas.style.height = `${pageViewport.height}px`;
            canvas.setAttribute(
                'aria-label',
                `${name}, page ${pageNumber} of ${pdf.numPages}`,
            );
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
            if (pendingCanvas) pendingCanvas.width = pendingCanvas.height = 0;
            rendering = false;
        }
    }
    async function load() {
        if (started || destroyed) return;
        started = true;
        displayDensity.refresh();
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
            thumbnails.setDocument(pdf);
            refreshLayout();
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
    const displayDensity = observePdfDisplayDensity(viewport, scheduleRender);
    let lastWidth = 0;
    const resize = new ResizeObserver(() => {
        if (Math.abs(viewport.clientWidth - lastWidth) < 2) return;
        lastWidth = viewport.clientWidth;
        scheduleRender();
    });
    resize.observe(viewport);
    viewport.addEventListener('keydown', (event) => {
        if (
            event.target !== viewport ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
        )
            return;
        if (event.key === 'ArrowLeft' || event.key === 'PageUp')
            changePage(pageNumber - 1);
        else if (event.key === 'ArrowRight' || event.key === 'PageDown')
            changePage(pageNumber + 1);
        else if (event.key === 'Home') changePage(1);
        else if (event.key === 'End') changePage(pdf?.numPages ?? 1);
        else if (event.key === '+' || event.key === '=')
            changeZoom((zoom ?? renderedScale) * 1.25);
        else if (event.key === '-') changeZoom((zoom ?? renderedScale) / 1.25);
        else return;
        event.preventDefault();
        event.stopPropagation();
    });
    tools.append(
        sidebar,
        first,
        previous,
        page,
        total,
        next,
        last,
        zoomOut,
        zoomLevel,
        zoomIn,
        rotate,
    );
    root.append(body, tools);
    refreshLayout();
    updateControls();
    return {
        root,
        refresh: refreshLayout,
        relocate(nextOnResize?: () => void) {
            onResize = nextOnResize;
            displayDensity.refresh();
            if (!started) {
                intersection.disconnect();
                void load();
            }

            // Keep the loaded PDF and canvas; a different pane width alone can require a new raster size.

            if (Math.abs(viewport.clientWidth - lastWidth) >= 2)
                refreshLayout();
        },
        destroy() {
            destroyed = true;
            clearTimeout(timer);
            intersection.disconnect();
            resize.disconnect();
            displayDensity.destroy();
            thumbnails.destroy();
            renderTask?.cancel();
            void documentTask?.destroy();
            canvas.width = canvas.height = 0;
        },
    };
}
