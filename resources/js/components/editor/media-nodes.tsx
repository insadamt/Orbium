import { Node, mergeAttributes } from '@tiptap/core';
import {
    NodeViewWrapper,
    ReactNodeViewRenderer,
    type NodeViewProps,
} from '@tiptap/react';
import { Eye, Pencil } from 'lucide-react';
import ImageView from './image-view';
import { useEffect, useRef, useState } from 'react';
import { attachmentUrl } from './editor-api';
import {
    getMermaidPreviewPriority,
    useMermaidPreviewActivation,
} from './mermaid-preview-proximity';
import { queueMermaidPreview } from './mermaid-preview-queue';
import {
    getMermaidPreview,
    preloadMermaidRenderer,
} from './mermaid-preview-renderer';
import type { SavedMermaidPreviews } from './use-mermaid-cache-preparation';

type MediaContext = {
    workspaceId: number;
    nodeId: number;
    cachedMermaidPreviews: SavedMermaidPreviews;
};

function FileView({
    node,
    context,
}: NodeViewProps & { context: MediaContext }) {
    return (
        <NodeViewWrapper
            className="my-4 rounded-xl border border-border p-4"
            data-drag-handle
            dir={node.attrs.dir}
            contentEditable={false}
        >
            <a
                href={attachmentUrl(
                    context.workspaceId,
                    context.nodeId,
                    Number(node.attrs.attachmentId),
                )}
                className="font-medium underline"
                download
            >
                {String(node.attrs.name || 'Download file')}
            </a>
            <span className="ms-3 text-xs text-muted-foreground">
                {Math.ceil(Number(node.attrs.sizeBytes || 0) / 1024)} KB
            </span>
        </NodeViewWrapper>
    );
}

function MermaidView({
    node,
    updateAttributes,
    context,
}: NodeViewProps & { context: MediaContext }) {
    const { previewContainer, activated } = useMermaidPreviewActivation();
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [renderedSource, setRenderedSource] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const sourceInput = useRef<HTMLTextAreaElement>(null);
    const source = String(node.attrs.source ?? '');
    const [sourceDraft, setSourceDraft] = useState(source);

    useEffect(() => {
        if (!isEditing) setSourceDraft(source);
    }, [source, isEditing]);

    useEffect(() => {
        if (isEditing) sourceInput.current?.focus();
    }, [isEditing]);

    useEffect(() => {
        if (!context.cachedMermaidPreviews[source]) preloadMermaidRenderer();
    }, [context.cachedMermaidPreviews, source]);

    useEffect(() => {
        if (!activated || isEditing || renderedSource === source) return;
        let active = true;
        const render = async () => {
            try {
                const previewSvg = await getMermaidPreview(
                    source,
                    context.cachedMermaidPreviews[source],
                );
                if (active) {
                    setPreview(previewSvg);
                    setError('');
                    setRenderedSource(source);
                }
            } catch {
                if (active) {
                    setPreview('');
                    setError(
                        'Diagram syntax could not be rendered. The source is preserved.',
                    );
                    setRenderedSource(source);
                }
            }
        };
        const cancel = queueMermaidPreview({
            render,
            getPriority: () =>
                getMermaidPreviewPriority(previewContainer.current),
        });
        return () => {
            active = false;
            cancel();
        };
    }, [
        source,
        renderedSource,
        activated,
        isEditing,
        previewContainer,
        context.cachedMermaidPreviews,
    ]);

    return (
        <NodeViewWrapper
            className="my-4 rounded-xl border border-border p-4"
            data-drag-handle
            dir={node.attrs.dir}
            contentEditable={false}
        >
            <div ref={previewContainer}>
                <div
                    className="mb-2 flex justify-between text-xs text-muted-foreground"
                    contentEditable={false}
                >
                    <span>Mermaid</span>
                    <div
                        role="group"
                        aria-label="Mermaid mode"
                        className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5"
                    >
                        <button
                            type="button"
                            aria-pressed={isEditing}
                            onClick={() => setIsEditing(true)}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-ring ${isEditing ? 'bg-background text-foreground shadow-sm' : 'hover:bg-accent hover:text-foreground'}`}
                        >
                            <Pencil size={13} aria-hidden="true" /> Edit
                        </button>
                        <button
                            type="button"
                            aria-pressed={!isEditing}
                            onClick={() => setIsEditing(false)}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-ring ${!isEditing ? 'bg-background text-foreground shadow-sm' : 'hover:bg-accent hover:text-foreground'}`}
                        >
                            <Eye size={14} aria-hidden="true" /> Preview
                        </button>
                    </div>
                </div>
                {isEditing ? (
                    <textarea
                        ref={sourceInput}
                        aria-label="Mermaid source"
                        value={sourceDraft}
                        onChange={(event) => {
                            setSourceDraft(event.target.value);
                            updateAttributes({ source: event.target.value });
                        }}
                        rows={6}
                        dir="ltr"
                        className="w-full rounded-md bg-muted p-3 font-mono text-sm"
                    />
                ) : !activated ? null : renderedSource !== source ? (
                    <p className="text-sm text-muted-foreground">
                        Rendering diagram…
                    </p>
                ) : error ? (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                ) : preview ? (
                    <div
                        className="overflow-auto"
                        dangerouslySetInnerHTML={{ __html: preview }}
                    />
                ) : null}
            </div>
        </NodeViewWrapper>
    );
}

export function createMediaExtensions(context: MediaContext) {
    const ImageNode = Node.create({
        name: 'image',
        group: 'block',
        atom: true,
        draggable: true,
        addAttributes() {
            return {
                attachmentId: { default: null },
                alt: { default: '' },
                caption: { default: '' },
                width: { default: 720 },
                alignment: { default: 'start' },
            };
        },
        parseHTML() {
            return [{ tag: 'img[data-attachment-id]' }];
        },
        renderHTML({ HTMLAttributes }) {
            return [
                'img',
                mergeAttributes(HTMLAttributes, {
                    src: attachmentUrl(
                        context.workspaceId,
                        context.nodeId,
                        Number(HTMLAttributes.attachmentId),
                    ),
                    'data-attachment-id': HTMLAttributes.attachmentId,
                }),
            ];
        },
        addNodeView() {
            return ReactNodeViewRenderer((props) => (
                <ImageView {...props} context={context} />
            ));
        },
    });
    const FileNode = Node.create({
        name: 'file',
        group: 'block',
        atom: true,
        draggable: true,
        addAttributes() {
            return {
                attachmentId: { default: null },
                name: { default: '' },
                sizeBytes: { default: 0 },
            };
        },
        parseHTML() {
            return [{ tag: 'div[data-file-id]' }];
        },
        renderHTML({ HTMLAttributes }) {
            return [
                'div',
                mergeAttributes(HTMLAttributes, {
                    'data-file-id': HTMLAttributes.attachmentId,
                }),
                HTMLAttributes.name,
            ];
        },
        addNodeView() {
            return ReactNodeViewRenderer((props) => (
                <FileView {...props} context={context} />
            ));
        },
    });
    const MermaidNode = Node.create({
        name: 'mermaid',
        group: 'block',
        atom: true,
        draggable: true,
        addAttributes() {
            return { source: { default: 'graph TD\n  A --> B' } };
        },
        parseHTML() {
            return [{ tag: 'div[data-mermaid]' }];
        },
        renderHTML({ HTMLAttributes }) {
            return [
                'div',
                mergeAttributes(HTMLAttributes, { 'data-mermaid': '' }),
                HTMLAttributes.source,
            ];
        },
        addNodeView() {
            return ReactNodeViewRenderer((props) => (
                <MermaidView {...props} context={context} />
            ));
        },
    });
    const CalloutNode = Node.create({
        name: 'callout',
        group: 'block',
        content: 'block+',
        defining: true,
        parseHTML() {
            return [{ tag: 'aside[data-callout]' }];
        },
        renderHTML({ HTMLAttributes }) {
            return [
                'aside',
                mergeAttributes(HTMLAttributes, {
                    'data-callout': '',
                    class: 'editor-callout',
                }),
                0,
            ];
        },
    });
    return [ImageNode, FileNode, MermaidNode, CalloutNode];
}
