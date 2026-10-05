import type { CachedPreview } from './mermaid-preview-renderer';

export type MermaidSubscriber = (
    preview?: CachedPreview,
    error?: string,
) => void;

export type MermaidPreviewEntry = {
    source: string;
    subscribers: Map<HTMLElement, MermaidSubscriber>;
    queuedAt: number;
    state:
        | 'pending'
        | 'lookup'
        | 'cached'
        | 'render'
        | 'ready'
        | 'error'
        | 'display';
    preview?: CachedPreview;
    displayed: Set<HTMLElement>;
    sanitized: boolean;
    error?: string;
    persisted: boolean;
    persistPending: boolean;
    attemptedSave: number;
};
