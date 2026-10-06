import {
    markEditorPerformance,
    measureEditorAsync,
} from '@/lib/editor-performance';

export type CachedPreview = { svg: string; renderId: string };
export const mermaidRendererVersion = 'mermaid-12.0.0-neutral-strict-v1';

function importMermaidDependencies() {
    return Promise.all([import('mermaid'), import('dompurify')]);
}
let dependenciesPromise:
    | ReturnType<typeof importMermaidDependencies>
    | undefined;
let initializationPromise: Promise<boolean> | undefined;
let renderChain: Promise<void> = Promise.resolve();

function loadMermaidDependencies() {
    dependenciesPromise ??= importMermaidDependencies().catch((error) => {
        dependenciesPromise = undefined;
        throw error;
    });
    return dependenciesPromise;
}

export function warmMermaidRenderer(
    shouldWarm: () => boolean = () => true,
): Promise<boolean> {
    initializationPromise ??= measureEditorAsync(
        'mermaid.warm-up',
        async () => {
            markEditorPerformance('mermaid.warm-up-started');
            const [{ default: mermaid }] = await loadMermaidDependencies();
            if (!shouldWarm()) {
                initializationPromise = undefined;
                return false;
            }
            mermaid.initialize({
                startOnLoad: false,
                suppressErrorRendering: true,
                securityLevel: 'strict',
                htmlLabels: false,
                theme: 'neutral',
            });
            markEditorPerformance('mermaid.warm-up-completed');
            return true;
        },
    ).catch((error) => {
        initializationPromise = undefined;
        throw error;
    });
    return initializationPromise;
}

export async function sanitizeMermaidPreview(
    preview: CachedPreview,
    shouldPrepare: () => boolean = () => true,
): Promise<CachedPreview | null> {
    const { default: DOMPurify } = await import('dompurify');
    if (!shouldPrepare()) return null;
    return {
        ...preview,
        svg: DOMPurify.sanitize(preview.svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
        }),
    };
}

export function instantiateMermaidSvg(preview: CachedPreview): string {
    return preview.svg.replaceAll(
        preview.renderId,
        `orbium-mermaid-${crypto.randomUUID()}`,
    );
}

export async function renderMermaidPreview(
    source: string,
    shouldRender: () => boolean = () => true,
): Promise<CachedPreview | null> {
    if (!shouldRender()) return null;
    if (!(await warmMermaidRenderer(shouldRender))) return null;
    const [{ default: mermaid }] = await loadMermaidDependencies();
    const renderId = `orbium-mermaid-${crypto.randomUUID()}`;
    const render = renderChain.then(() => {
        if (!shouldRender()) return null;
        return measureEditorAsync('mermaid.local-render', () =>
            mermaid.render(renderId, source),
        );
    });
    renderChain = render.then(
        () => undefined,
        () => undefined,
    );
    const result = await render;
    return result ? { renderId, svg: result.svg } : null;
}
