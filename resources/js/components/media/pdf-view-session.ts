export type PdfViewState = {
    pageNumber: number;
    pageCount: number;
    zoom?: number;
    rotation: number;
    sidebarVisible: boolean;
    scrollLeft: number;
    scrollTop: number;
};

export type PdfPageGeometry = {
    pageNumber: number;
    rotation: number;
    width: number;
    height: number;
    pixelWidth: number;
    pixelHeight: number;
};

export type PreparedPdfPage = PdfPageGeometry & {
    canvas: HTMLCanvasElement;
    text: string;
    pageCount: number;
    naturalWidth: number;
    naturalHeight: number;
    scale: number;
};

export type PdfReaderEvent =
    | 'readerShellCreations'
    | 'readerShellDestructions'
    | 'documentLoads'
    | 'documentDisposals'
    | 'documentDisposalFailures'
    | 'pageRasterizations'
    | 'skippedRasters';

export type PdfViewSession = {
    reusePreparedPage: () => PreparedPdfPage | undefined;
    readViewState: () => PdfViewState | undefined;
    rememberViewState: (state: PdfViewState) => void;
    rememberPreparedPage: (page: PreparedPdfPage) => void;
    scheduleDocumentLoad: (run: () => Promise<void>) => () => void;
    schedulePageRender: (run: () => Promise<void>) => () => void;
    activateReader: () => void;
    isReaderActive: () => boolean;
    subscribeActivation: (listener: () => void) => () => void;
    record: (event: PdfReaderEvent) => void;
};

export function samePdfPageGeometry(
    before: PdfPageGeometry,
    after: PdfPageGeometry,
) {
    //
    // Subpixel layout rounding can vary during translation without changing the useful page resolution.
    //
    return (
        before.pageNumber === after.pageNumber &&
        before.rotation === after.rotation &&
        Math.abs(before.width - after.width) < 1 &&
        Math.abs(before.height - after.height) < 1 &&
        Math.abs(before.pixelWidth - after.pixelWidth) <= 1 &&
        Math.abs(before.pixelHeight - after.pixelHeight) <= 1
    );
}
