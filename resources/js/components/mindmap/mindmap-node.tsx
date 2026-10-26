import type { KeyboardEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
    NodeViewWrapper,
    ReactNodeViewRenderer,
    type NodeViewProps,
} from '@tiptap/react';
import { MindMapBlock } from './mindmap-block';
import { validMindMap } from './mindmap-data';
import { useHostedDocumentSession } from '@/components/editor/hosted-document-session';

function MindMapNodeView({ node, editor, updateAttributes }: NodeViewProps) {
    const hosted = useHostedDocumentSession();
    if (!validMindMap(node.attrs.mindmap))
        return (
            <NodeViewWrapper contentEditable={false}>
                <p role="alert">Unsupported Mind Map. Original data is kept.</p>
            </NodeViewWrapper>
        );
    return (
        <NodeViewWrapper
            contentEditable={false}
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                if (
                    (event.ctrlKey || event.metaKey) &&
                    ['z', 'y'].includes(event.key.toLowerCase()) &&
                    !event.nativeEvent.isComposing
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.shiftKey || event.key.toLowerCase() === 'y')
                        editor.commands.redo();
                    else editor.commands.undo();
                }
            }}
        >
            <MindMapBlock
                data={node.attrs.mindmap}
                editable={editor.isEditable && !hosted?.readOnly}
                onComposition={hosted?.setComposing}
                onChange={(mindmap) => {
                    if (!editor.isEditable || hosted?.readOnly) return false;
                    updateAttributes({ mindmap });
                    return true;
                }}
            />
        </NodeViewWrapper>
    );
}
export const MindMapNode = Node.create({
    name: 'mindmap',
    group: 'block',
    atom: true,
    draggable: true,
    addAttributes: () => ({ mindmap: { default: null, rendered: false } }),
    parseHTML: () => [
        {
            tag: 'div[data-mindmap]',
            getAttrs: (element) => {
                try {
                    const mindmap = JSON.parse(
                        element.getAttribute('data-mindmap') ?? 'null',
                    );
                    return validMindMap(mindmap) ? { mindmap } : false;
                } catch {
                    return false;
                }
            },
        },
    ],
    renderHTML: ({ node, HTMLAttributes }) => [
        'div',
        mergeAttributes(HTMLAttributes, {
            'data-mindmap': JSON.stringify(node.attrs.mindmap),
        }),
        'Mind Map',
    ],
    addNodeView: () => ReactNodeViewRenderer(MindMapNodeView),
});
