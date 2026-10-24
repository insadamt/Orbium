import type { PDFDocumentLoadingTask } from 'pdfjs-dist';
import type { PdfViewSession } from './pdf-view-session';

export function createPdfDocumentResource(options: {
    url: string;
    session?: PdfViewSession;
    onPassword: () => void;
}) {
    let task: PDFDocumentLoadingTask | undefined;
    let generation = 0;
    let destroyed = false;
    let releasing: Promise<void> = Promise.resolve();
    return {
        async load() {
            const currentGeneration = generation;
            const { loadPdfDocument } = await import('./pdf-engine');
            if (destroyed || currentGeneration !== generation) return;
            const loadingTask = loadPdfDocument(options.url);
            task = loadingTask;
            options.session?.record('documentLoads');
            loadingTask.onPassword = () => {
                options.onPassword();
                void release();
            };
            return loadingTask.promise;
        },
        release,
        destroy() {
            destroyed = true;
            return release();
        },
    };

    function release() {
        generation++;
        const previous = task;
        task = undefined;
        if (!previous) return releasing;
        releasing = previous
            .destroy()
            .catch(() => {
                options.session?.record('documentDisposalFailures');
            })
            .finally(() => options.session?.record('documentDisposals'));
        return releasing;
    }
}
