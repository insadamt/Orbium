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
let initializationPromise: Promise<void> | undefined;
let renderChain: Promise<void> = Promise.resolve();

function loadMermaidDependencies() {
    dependenciesPromise ??= importMermaidDependencies().catch((error) => {
        dependenciesPromise = undefined;
        throw error;
    });
    return dependenciesPromise;
}

export function warmMermaidRenderer(): Promise<void> {
    initializationPromise ??= measureEditorAsync(
        'mermaid.warm-up',
        async () => {
            markEditorPerformance('mermaid.warm-up-started');
            const [{ default: mermaid }] = await loadMermaidDependencies();
            mermaid.initialize({
                startOnLoad: false,
                suppressErrorRendering: true,
                securityLevel: 'strict',
                htmlLabels: false,
                theme: 'neutral',
            });
            markEditorPerformance('mermaid.warm-up-completed');
        },
    ).catch((error) => {
        initializationPromise = undefined;
        throw error;
    });
    return initializationPromise;
}

export async function sanitizeMermaidPreview(
    preview: CachedPreview,
): Promise<CachedPreview> {
    const { default: DOMPurify } = await import('dompurify');
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
): Promise<CachedPreview> {
    await warmMermaidRenderer();
    const [{ default: mermaid }] = await loadMermaidDependencies();
    const renderId = `orbium-mermaid-${crypto.randomUUID()}`;
    const render = renderChain.then(() =>
        measureEditorAsync('mermaid.local-render', () =>
            mermaid.render(renderId, source),
        ),
    );
    renderChain = render.then(
        () => undefined,
        () => undefined,
    );
    const result = await render;
    return sanitizeMermaidPreview({ renderId, svg: result.svg });
}
