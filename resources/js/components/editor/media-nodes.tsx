import { Node, mergeAttributes } from '@tiptap/core';
import {
    NodeViewWrapper,
    ReactNodeViewRenderer,
    type NodeViewProps,
} from '@tiptap/react';
import ImageView from './image-view';
import { attachmentUrl } from './editor-api';
import MermaidView from './mermaid-view';
import type { MermaidPreviewSession } from './mermaid-preview-session';

type MediaContext = {
    workspaceId: number;
    nodeId: number;
    mermaidSession: MermaidPreviewSession;
};

function FileView({
    node,
    context,
}: NodeViewProps & { context: MediaContext }) {
    return (
        <NodeViewWrapper
            className="orbium-file my-4 rounded-xl border border-border p-4"
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
                <MermaidView {...props} session={context.mermaidSession} />
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
