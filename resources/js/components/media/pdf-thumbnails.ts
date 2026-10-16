import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

type PdfThumbnailOptions = {
    onSelectPage: (pageNumber: number) => void;
};

export function mountPdfThumbnails(options: PdfThumbnailOptions) {
    const root = document.createElement('nav');
    root.className = 'attachment-pdf-thumbnails';
    root.setAttribute('aria-label', 'PDF page previews');
    const buttons: HTMLButtonElement[] = [];
    const visiblePages = new Set<number>();
    let pdf: PDFDocumentProxy | undefined;
    let activePage = 1;
    let enabled = false;
    let destroyed = false;
    let rendering = false;
    let renderTask: RenderTask | undefined;
    let renderingPage: number | undefined;
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                const pageNumber = Number(
                    (entry.target as HTMLElement).dataset.page,
                );
                if (entry.isIntersecting) visiblePages.add(pageNumber);
                else {
                    visiblePages.delete(pageNumber);
                    if (renderingPage === pageNumber) renderTask?.cancel();
                    releaseCanvas(buttons[pageNumber - 1]);
                }
            }
            void renderVisiblePages();
        },
        { root, rootMargin: '160px' },
    );

    function releaseCanvas(button: HTMLButtonElement) {
        const canvas = button.querySelector('canvas');
        if (canvas) {
            canvas.width = canvas.height = 0;
            canvas.remove();
        }
    }

    async function renderVisiblePages() {
        if (rendering || !enabled || !pdf || destroyed) return;
        rendering = true;
        try {
            for (const pageNumber of visiblePages) {
                if (!enabled || destroyed) break;
                const button = buttons[pageNumber - 1];
                if (button.querySelector('canvas')) continue;
                renderingPage = pageNumber;
                const canvas = document.createElement('canvas');
                canvas.setAttribute('aria-hidden', 'true');
                try {
                    const page = await pdf.getPage(pageNumber);
                    if (!enabled || destroyed || !visiblePages.has(pageNumber))
                        continue;
                    const natural = page.getViewport({ scale: 1 });
                    const viewport = page.getViewport({
                        scale: Math.min(
                            120 / natural.width,
                            160 / natural.height,
                        ),
                    });
                    canvas.width = Math.ceil(viewport.width);
                    canvas.height = Math.ceil(viewport.height);
                    renderTask = page.render({ canvas, viewport });
                    await renderTask.promise;
                    if (enabled && !destroyed && visiblePages.has(pageNumber))
                        button.prepend(canvas);
                    else canvas.width = canvas.height = 0;
                } catch {
                    canvas.width = canvas.height = 0;
                    // Navigation stays usable when an individual thumbnail cannot render.
                }
            }
        } finally {
            rendering = false;
            renderTask = undefined;
            renderingPage = undefined;
        }
    }

    function selectPage(pageNumber: number) {
        buttons[activePage - 1]?.removeAttribute('aria-current');
        activePage = pageNumber;
        const button = buttons[pageNumber - 1];
        button?.setAttribute('aria-current', 'page');
        if (enabled && button) {
            const top = button.offsetTop;
            if (
                top < root.scrollTop ||
                top + button.offsetHeight > root.scrollTop + root.clientHeight
            )
                root.scrollTop = Math.max(0, top - 12);
        }
    }

    return {
        root,
        setDocument(document: PDFDocumentProxy) {
            pdf = document;
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const button = documentButton(pageNumber);
                buttons.push(button);
                root.append(button);
                observer.observe(button);
            }
            selectPage(activePage);
        },
        selectPage,
        setVisible(visible: boolean) {
            enabled = visible;
            root.hidden = !visible;
            if (visible) {
                selectPage(activePage);
                void renderVisiblePages();
            } else {
                renderTask?.cancel();
                buttons.forEach(releaseCanvas);
            }
        },
        destroy() {
            destroyed = true;
            observer.disconnect();
            renderTask?.cancel();
            buttons.forEach(releaseCanvas);
        },
    };

    function documentButton(pageNumber: number) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.page = String(pageNumber);
        button.setAttribute('aria-label', `Go to page ${pageNumber}`);
        const label = document.createElement('span');
        label.textContent = String(pageNumber);
        button.append(label);
        button.addEventListener('click', () =>
            options.onSelectPage(pageNumber),
        );
        return button;
    }
}
