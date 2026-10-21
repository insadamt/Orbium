import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { RichContext } from './rich-model';

type MathPreviewRequest = {
    context: RichContext;
    latex: string;
    displayMode: boolean;
};

export type MathPreview = { markup: string; failed: boolean };

type PreparedMathPreviews = {
    entries: Map<string, MathPreview>;
    bytes: number;
};
const editorPreviews = new WeakMap<object, PreparedMathPreviews>();
const maximumPreviewsPerEditor = 128;
const maximumPreparedBytes = 4 * 1024 * 1024;

function mathPreviewKey(request: MathPreviewRequest) {
    return JSON.stringify([request.displayMode, request.latex]);
}

export function findPreparedMathPreview(request: MathPreviewRequest) {
    const previews = editorPreviews.get(
        request.context.mathPreviewScope ?? request.context,
    );
    return previews?.entries.get(mathPreviewKey(request));
}

export function cachePreparedMathPreview(
    request: MathPreviewRequest,
    preview: MathPreview,
) {
    const scope = request.context.mathPreviewScope ?? request.context;
    let previews = editorPreviews.get(scope);
    if (!previews) {
        previews = { entries: new Map(), bytes: 0 };
        editorPreviews.set(scope, previews);
    }
    const key = mathPreviewKey(request);
    const existing = previews.entries.get(key);
    if (existing) {
        previews.entries.delete(key);
        previews.bytes -= (key.length + existing.markup.length) * 2;
    }
    const bytes = (key.length + preview.markup.length) * 2;
    if (bytes > maximumPreparedBytes) return;
    previews.entries.set(key, preview);
    previews.bytes += bytes;
    //
    // Board remounts can share this scope; bound compiled markup as well as entry count.
    //
    while (
        previews.entries.size > maximumPreviewsPerEditor ||
        previews.bytes > maximumPreparedBytes
    ) {
        const oldestKey = previews.entries.keys().next().value;
        if (oldestKey === undefined) break;
        const oldest = previews.entries.get(oldestKey)!;
        previews.entries.delete(oldestKey);
        previews.bytes -= (oldestKey.length + oldest.markup.length) * 2;
    }
}

function prepareMathPreview(request: MathPreviewRequest): MathPreview {
    const prepared = findPreparedMathPreview(request);
    if (prepared) return prepared;
    let preview: MathPreview;
    try {
        preview = {
            markup: katex.renderToString(request.latex, {
                displayMode: request.displayMode,
                throwOnError: true,
                trust: false,
                maxExpand: 1000,
                maxSize: 20,
            }),
            failed: false,
        };
    } catch {
        preview = {
            markup: 'Equation could not be rendered. Edit the source to fix it.',
            failed: true,
        };
    }
    cachePreparedMathPreview(request, preview);
    return preview;
}

export function displayMathPreview(output: HTMLElement, preview: MathPreview) {
    if (preview.failed) {
        output.textContent = preview.markup;
        output.setAttribute('role', 'alert');
    } else {
        output.innerHTML = preview.markup;
        output.removeAttribute('role');
    }
}

export function renderMath(output: HTMLElement, request: MathPreviewRequest) {
    displayMathPreview(output, prepareMathPreview(request));
}
