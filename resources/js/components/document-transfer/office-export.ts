import { readMermaidPreviewDimensions } from '../editor/mermaid-preview-layout';
import {
    renderMermaidPreview,
    sanitizeMermaidPreview,
} from '../editor/mermaid-preview-renderer';
import { transferRequest } from './transfer-api';

export type OfficeExportOptions = {
    format: 'docx' | 'pdf';
    paper: 'a4' | 'letter';
    orientation: 'portrait' | 'landscape';
    page_numbers: boolean;
};

type OfficeExportInput = {
    workspaceId: number;
    nodeId: number;
    source: string;
    diagrams: Record<string, string>;
    options: OfficeExportOptions;
};

async function diagramPng(source: string): Promise<string> {
    const rendered = await renderMermaidPreview(source);
    if (!rendered) throw new Error('A diagram could not be rendered.');
    const preview = await sanitizeMermaidPreview(rendered);
    const dimensions = preview && readMermaidPreviewDimensions(preview);
    if (!preview || !dimensions)
        throw new Error('A diagram has invalid dimensions.');
    const scale = Math.min(
        2,
        4096 / dimensions.width,
        4096 / dimensions.height,
    );
    const width = Math.max(1, Math.floor(dimensions.width * scale));
    const height = Math.max(1, Math.floor(dimensions.height * scale));
    const svg = new DOMParser().parseFromString(
        preview.svg,
        'image/svg+xml',
    ).documentElement;
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.style.removeProperty('max-width');
    const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], {
            type: 'image/svg+xml',
        }),
    );
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Diagram export is unavailable.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        return canvas.toDataURL('image/png').split(',')[1];
    } finally {
        URL.revokeObjectURL(url);
    }
}

export async function generateOfficeExport({
    workspaceId,
    nodeId,
    source,
    diagrams,
    options,
}: OfficeExportInput): Promise<Blob> {
    const entries = Object.entries(diagrams);
    if (entries.length > 100)
        throw new Error(
            'Document export supports up to 100 distinct diagrams.',
        );
    const renderedDiagrams = [];
    for (const [hash, diagram] of entries) {
        try {
            renderedDiagrams.push({ hash, png: await diagramPng(diagram) });
        } catch {
            throw new Error(
                'A Mermaid diagram could not be exported. Fix its source and try again.',
            );
        }
    }
    const response = await transferRequest(
        `/workspaces/${workspaceId}/documents/${nodeId}/office-export`,
        {
            method: 'POST',
            signal: AbortSignal.timeout(150_000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source,
                diagrams: renderedDiagrams,
                ...options,
            }),
        },
    );
    return response.blob();
}
