import { observePdfReaderLayout } from './pdf-display-density';
import { createPdfPageSurface, pdfPageGeometry } from './pdf-page-surface';
import type { PdfViewSession } from './pdf-view-session';
import { createPdfDocumentResource } from './pdf-document-resource';
import { mountPdfReaderKeyboard } from './pdf-reader-keyboard';
import { rasterizePdfPage } from './pdf-page-raster';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { mediaIconButton } from './media-controls';
import { mountPdfThumbnails } from './pdf-thumbnails';

export function mountPdfReader(
    url: string,
    name: string,
    reportError: (message?: string) => void,
    onResize?: () => void,
    session?: PdfViewSession,
) {
    const root = document.createElement('div');
    root.className = 'attachment-pdf-reader';
    const viewport = document.createElement('div');
    viewport.className = 'attachment-pdf-viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('aria-label', `PDF pages: ${name}`);
    const surface = createPdfPageSurface(viewport, name);
    const { canvas, loading } = surface;
    const restoredView = session?.readViewState();
    const preparedPage = session?.reusePreparedPage();
    if (preparedPage) surface.display(preparedPage);
    session?.record('readerShellCreations');
    const documentResource = createPdfDocumentResource({
        url,
        session,
        onPassword: () => {
            reportError(
                'This PDF is password protected. Download it to open it in your PDF app.',
            );
            loading.hidden = true;
        },
    });
    let finishInitialPreparation: (() => void) | undefined;
    let releaseInFlight: Promise<void> = Promise.resolve();
    let pdf: PDFDocumentProxy | undefined;
    let renderTask: RenderTask | undefined;
    let destroyed = false;
    let started = false;
    let rendering = false;
    let revision = 0;
    let renderAgain = false;
    let pageNumber = restoredView?.pageNumber ?? 1;
    let pageCount = restoredView?.pageCount ?? preparedPage?.pageCount ?? 0;
    let zoom = restoredView?.zoom;
    let renderedScale = preparedPage?.scale ?? 1;
    let rotation = restoredView?.rotation ?? 0;
    let sidebarVisible = restoredView?.sidebarVisible ?? true;
    let restoreScrollPending = Boolean(restoredView);
    let cancelQueuedLoad: (() => void) | undefined;
    let cancelQueuedRender: (() => void) | undefined;
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
        changePage(pageCount || 1),
    );
    const rotate = mediaIconButton('Rotate clockwise', 'rotate', () => {
        session?.activateReader();
        rotation = (rotation + 90) % 360;
        scheduleRender();
    });
    for (const control of [sidebar, first, last, rotate])
        control.classList.add('attachment-pdf-expanded-control');
    function refreshLayout() {
        const expanded = root.closest('[data-expanded="true"]') !== null;
        thumbnails.setVisible(expanded && sidebarVisible);
        sidebar.setAttribute('aria-pressed', String(sidebarVisible));
        if (expanded && session) load();
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
        previous.disabled = !pageCount || pageNumber <= 1;
        next.disabled = !pageCount || pageNumber >= pageCount;
        page.disabled = !pageCount;
        page.value = String(pageNumber);
        page.max = String(pageCount || 1);
        total.textContent = `/ ${pageCount || '—'}`;
        first.disabled = previous.disabled;
        last.disabled = next.disabled;
        rotate.disabled = !pageCount;
        zoomOut.disabled = !pageCount || (zoom ?? renderedScale) <= 0.5;
        zoomIn.disabled = !pageCount || (zoom ?? renderedScale) >= 3;
        zoomLevel.disabled = !pageCount;
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
        session?.activateReader();
        restoreScrollPending = false;
        pageNumber = Math.max(
            1,
            Math.min(
                pageCount || 1,
                Number.isFinite(value) ? Math.round(value) || 1 : 1,
            ),
        );
        viewport.scrollTop = 0;
        scheduleRender();
    }
    function changeZoom(value: number) {
        session?.activateReader();
        zoom = Math.max(0.5, Math.min(3, value));
        scheduleRender();
    }
    function rememberView() {
        if (restoreScrollPending) return;
        session?.rememberViewState({
            pageNumber,
            pageCount,
            zoom,
            rotation,
            sidebarVisible,
            scrollLeft: viewport.scrollLeft,
            scrollTop: viewport.scrollTop,
        });
    }
    function restoreScroll() {
        if (!restoreScrollPending || !root.isConnected || canvas.hidden) return;
        viewport.scrollLeft = restoredView?.scrollLeft ?? 0;
        viewport.scrollTop = restoredView?.scrollTop ?? 0;
        restoreScrollPending = false;
    }
    function matchesDisplayedPage() {
        const displayed = surface.getDisplayed();
        if (
            !displayed ||
            displayed.pageNumber !== pageNumber ||
            displayed.rotation !== rotation ||
            !root.isConnected
        )
            return false;
        const geometry = pdfPageGeometry({
            viewport,
            pageNumber,
            rotation,
            naturalWidth: displayed.naturalWidth,
            naturalHeight: displayed.naturalHeight,
            zoom,
        });
        const matches = surface.matches(geometry);
        if (!matches) surface.resizeDisplay(geometry);
        return matches;
    }
    function queueRender() {
        clearTimeout(timer);
        cancelQueuedRender?.();
        if (session)
            cancelQueuedRender = session.schedulePageRender(async () => {
                cancelQueuedRender = undefined;
                await renderPage();
            });
        else timer = setTimeout(() => void renderPage(), 80);
    }
    function scheduleRender() {
        if (destroyed) return;
        updateControls();
        rememberView();
        if (!root.isConnected) return;
        revision++;
        clearTimeout(timer);
        cancelQueuedRender?.();
        cancelQueuedRender = undefined;
        if (matchesDisplayedPage()) {
            renderAgain = false;
            renderTask?.cancel();
            viewport.setAttribute('aria-busy', 'false');
            session?.record('skippedRasters');
            restoreScroll();
            if (!rendering) completePreparation();
            return;
        }
        if (rendering) {
            renderAgain = true;
            renderTask?.cancel();
            return;
        }
        if (pdf) queueRender();
        else if (session) load();
    }
    async function renderPage() {
        if (!pdf || destroyed) return;
        if (rendering) {
            renderAgain = true;
            return;
        }
        const currentRevision = revision;
        rendering = true;
        loading.hidden = !canvas.hidden;
        viewport.setAttribute('aria-busy', 'true');
        try {
            await rasterizePdfPage({
                pdf,
                viewport,
                pageNumber,
                rotation,
                zoom,
                surface,
                session,
                isCurrent: () => !destroyed && currentRevision === revision,
                setRenderTask: (task) => {
                    renderTask = task;
                },
            });
            if (destroyed || currentRevision !== revision) return;
            renderedScale = surface.getDisplayed()?.scale ?? renderedScale;
            updateControls();
            viewport.setAttribute('aria-busy', 'false');
            restoreScroll();
            rememberView();
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
            renderTask = undefined;
            if (renderAgain && !destroyed) {
                renderAgain = false;
                queueRender();
            } else completePreparation();
        }
    }
    function releaseInactiveDocument() {
        if (
            session &&
            pdf &&
            !rendering &&
            !cancelQueuedRender &&
            !finishInitialPreparation &&
            !session.isReaderActive() &&
            !root.closest('[data-expanded="true"]')
        ) {
            pdf = undefined;
            started = false;
            thumbnails.clearDocument();
            releaseInFlight = documentResource.release();
        }
        return releaseInFlight;
    }
    function completePreparation() {
        const finish = finishInitialPreparation;
        finishInitialPreparation = undefined;
        void releaseInactiveDocument().finally(() => {
            finish?.();
        });
    }
    const removeActivation = session?.subscribeActivation(() => {
        void releaseInactiveDocument();
    });
    function load() {
        if (started || destroyed) return;
        started = true;
        layout.refreshDensity();
        const run = async () => {
            cancelQueuedLoad = undefined;
            if (
                session &&
                matchesDisplayedPage() &&
                !root.closest('[data-expanded="true"]')
            ) {
                started = false;
                return;
            }
            try {
                await releaseInFlight;
                if (destroyed) return;
                pdf = await documentResource.load();
                if (!pdf) return;
                if (destroyed) return;
                pageCount = pdf.numPages;
                pageNumber = Math.min(pageNumber, pageCount);
                const initialPrepared = session
                    ? new Promise<void>((resolve) => {
                          finishInitialPreparation = resolve;
                      })
                    : undefined;
                thumbnails.setDocument(pdf);
                refreshLayout();
                await initialPrepared;
            } catch {
                if (!destroyed) {
                    loading.hidden = true;
                    reportError(
                        'This PDF could not be opened. Download the file to open it in another app.',
                    );
                }
            }
        };
        if (session) cancelQueuedLoad = session.scheduleDocumentLoad(run);
        else void run();
    }
    const layout = observePdfReaderLayout({
        root,
        viewport,
        onVisible: () => {
            layout.refreshDensity();
            restoreScroll();
            if (session) scheduleRender();
            else load();
        },
        onResize: () => {
            restoreScroll();
            scheduleRender();
        },
        onDensityChange: scheduleRender,
    });
    viewport.addEventListener('scroll', rememberView, { passive: true });
    const removeKeyboard = mountPdfReaderKeyboard(viewport, {
        readPage: () => pageNumber,
        readPageCount: () => pageCount,
        readScale: () => zoom ?? renderedScale,
        changePage,
        changeZoom,
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
    return {
        root,
        refresh: refreshLayout,
        relocate(nextOnResize?: () => void) {
            onResize = nextOnResize;
            layout.refreshDensity();
            if (!started) {
                layout.stopObservingVisibility();
                if (session) scheduleRender();
                else load();
            }

            // Keep the loaded PDF and canvas; a different pane width alone can require a new raster size.

            if (layout.widthChanged()) refreshLayout();
        },
        destroy() {
            rememberView();
            destroyed = true;
            clearTimeout(timer);
            cancelQueuedLoad?.();
            cancelQueuedRender?.();
            layout.destroy();
            thumbnails.destroy();
            renderTask?.cancel();
            removeActivation?.();
            removeKeyboard();
            void documentResource
                .destroy()
                .finally(() => finishInitialPreparation?.());
            viewport.removeEventListener('scroll', rememberView);
            surface.clear();
            session?.record('readerShellDestructions');
        },
    };
}
