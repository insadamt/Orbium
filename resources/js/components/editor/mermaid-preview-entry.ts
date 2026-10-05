import type { CachedPreview } from './mermaid-preview-renderer';

export type MermaidPreviewDimensions = {
    width: number;
    height: number;
    maxWidth?: number;
};

export type MermaidPreviewUpdate = {
    preview?: CachedPreview;
    dimensions?: MermaidPreviewDimensions;
    error?: string;
};

export type MermaidSubscriber = (update: MermaidPreviewUpdate) => void;

export type MermaidPreviewEntry = {
    source: string;
    subscribers: Map<HTMLElement, MermaidSubscriber>;
    queuedAt: number;
    state:
        | 'pending'
        | 'lookup'
        | 'cached'
        | 'render'
        | 'reserve'
        | 'ready'
        | 'error'
        | 'display';
    preview?: CachedPreview;
    dimensions?: MermaidPreviewDimensions;
    displayed: Set<HTMLElement>;
    sanitized: boolean;
    error?: string;
    persisted: boolean;
    persistPending: boolean;
    attemptedSave: number;
};
