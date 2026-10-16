import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export function loadPdfDocument(url: string) {
    GlobalWorkerOptions.workerSrc = workerUrl;
    const assets = new URL(
        `${import.meta.env.BASE_URL}pdfjs-${version}/`,
        import.meta.url,
    ).href;
    return getDocument({
        url,
        withCredentials: true,
        enableXfa: false,
        cMapUrl: `${assets}cmaps/`,
        standardFontDataUrl: `${assets}standard_fonts/`,
        wasmUrl: `${assets}wasm/`,
        iccUrl: `${assets}iccs/`,
        maxImageSize: 16_777_216,
        canvasMaxAreaInBytes: 67_108_864,
    });
}
