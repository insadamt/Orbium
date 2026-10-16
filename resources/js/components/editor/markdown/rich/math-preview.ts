import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { RichContext } from './rich-model';

type MathPreviewRequest = {
    context: RichContext;
    latex: string;
    displayMode: boolean;
};

type MathPreview = { markup: string; failed: boolean };

const editorPreviews = new WeakMap<RichContext, Map<string, MathPreview>>();
const maximumPreviewsPerEditor = 128;

function mathPreviewKey(request: MathPreviewRequest) {
    return JSON.stringify([request.displayMode, request.latex]);
}

export function findPreparedMathPreview(request: MathPreviewRequest) {
    return editorPreviews.get(request.context)?.get(mathPreviewKey(request));
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
    let previews = editorPreviews.get(request.context);
    if (!previews) {
        previews = new Map();
        editorPreviews.set(request.context, previews);
    }
    if (previews.size >= maximumPreviewsPerEditor)
        previews.delete(previews.keys().next().value!);
    previews.set(mathPreviewKey(request), preview);
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
