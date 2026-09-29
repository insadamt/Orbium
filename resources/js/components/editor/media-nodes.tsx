import { Node, mergeAttributes } from '@tiptap/core';
import {
    NodeViewWrapper,
    ReactNodeViewRenderer,
    type NodeViewProps,
} from '@tiptap/react';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { attachmentUrl } from './editor-api';

type MediaContext = { workspaceId: number; nodeId: number };

function ImageView({
    node,
    updateAttributes,
    selected,
    context,
}: NodeViewProps & { context: MediaContext }) {
    const { workspaceId, nodeId } = context;
    const attachmentId = Number(node.attrs.attachmentId);
    return (
        <NodeViewWrapper className="editor-image my-5" data-drag-handle>
            <figure
                className={selected ? 'outline outline-2 outline-ring' : ''}
            >
                <img
                    src={attachmentUrl(workspaceId, nodeId, attachmentId)}
                    alt={String(node.attrs.alt ?? '')}
                    width={Number(node.attrs.width) || undefined}
                    className="max-w-full rounded-lg"
                    style={{
                        marginInline:
                            node.attrs.alignment === 'center'
                                ? 'auto'
                                : undefined,
                    }}
                />
                <figcaption className="mt-2 text-sm text-muted-foreground">
                    <input
                        aria-label="Image caption"
                        value={String(node.attrs.caption ?? '')}
                        onChange={(event) =>
                            updateAttributes({ caption: event.target.value })
                        }
                        placeholder="Add a caption"
                        className="w-full bg-transparent text-center outline-none"
                    />
                </figcaption>
            </figure>
            {selected && (
                <div
                    className="mt-2 flex gap-2 text-xs"
                    contentEditable={false}
                >
                    <button
                        type="button"
                        onClick={() => updateAttributes({ alignment: 'left' })}
                    >
                        Left
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            updateAttributes({ alignment: 'center' })
                        }
                    >
                        Center
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            updateAttributes({
                                width: Math.max(
                                    160,
                                    Number(node.attrs.width || 720) - 100,
                                ),
                            })
                        }
                    >
                        Smaller
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            updateAttributes({
                                width: Math.min(
                                    1200,
                                    Number(node.attrs.width || 720) + 100,
                                ),
                            })
                        }
                    >
                        Larger
                    </button>
                </div>
            )}
        </NodeViewWrapper>
    );
}

function FileView({
    node,
    context,
}: NodeViewProps & { context: MediaContext }) {
    return (
        <NodeViewWrapper
            className="my-4 rounded-xl border border-border p-4"
            data-drag-handle
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
            <span className="ml-3 text-xs text-muted-foreground">
                {Math.ceil(Number(node.attrs.sizeBytes || 0) / 1024)} KB
            </span>
        </NodeViewWrapper>
    );
}

function MermaidView({ node, updateAttributes, selected }: NodeViewProps) {
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [showSource, setShowSource] = useState(false);
    const source = String(node.attrs.source ?? '');

    useEffect(() => {
        let active = true;
        const render = async () => {
            try {
                const { default: mermaid } = await import('mermaid');
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'strict',
                    htmlLabels: false,
                    theme: 'neutral',
                });
                const result = await mermaid.render(
                    `orbium-mermaid-${crypto.randomUUID()}`,
                    source,
                );
                if (active) {
                    setPreview(
                        DOMPurify.sanitize(result.svg, {
                            USE_PROFILES: { svg: true, svgFilters: true },
                        }),
                    );
                    setError('');
                }
            } catch {
                if (active) {
                    setPreview('');
                    setError(
                        'Diagram syntax could not be rendered. The source is preserved.',
                    );
                }
            }
        };
        void render();
        return () => {
            active = false;
        };
    }, [source]);

    return (
        <NodeViewWrapper
            className="my-4 rounded-xl border border-border p-4"
            data-drag-handle
        >
            <div
                className="mb-2 flex justify-between text-xs text-muted-foreground"
                contentEditable={false}
            >
                <span>Mermaid</span>
                <button
                    type="button"
                    onClick={() => setShowSource(!showSource)}
                >
                    {showSource ? 'Preview' : 'Edit source'}
                </button>
            </div>
            {(showSource || selected || error) && (
                <textarea
                    aria-label="Mermaid source"
                    value={source}
                    onChange={(event) =>
                        updateAttributes({ source: event.target.value })
                    }
                    rows={6}
                    className="mb-3 w-full rounded-md bg-muted p-3 font-mono text-sm"
                />
            )}
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
            {preview && (
                <div
                    className="overflow-auto"
                    dangerouslySetInnerHTML={{ __html: preview }}
                />
            )}
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
                alignment: { default: 'left' },
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
                { 'data-file-id': HTMLAttributes.attachmentId },
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
            return ['div', { 'data-mermaid': '' }, HTMLAttributes.source];
        },
        addNodeView() {
            return ReactNodeViewRenderer(MermaidView);
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
        renderHTML() {
            return [
                'aside',
                { 'data-callout': '', class: 'editor-callout' },
                0,
            ];
        },
    });
    return [ImageNode, FileNode, MermaidNode, CalloutNode];
}
