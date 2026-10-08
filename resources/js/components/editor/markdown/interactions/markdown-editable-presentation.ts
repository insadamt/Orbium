import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { readRichBlock } from '../rich/read-rich-block';

export function readEditableMarkdownPresentation(
    state: EditorState,
    node: SyntaxNode,
) {
    if (node.name !== 'OrbiumDirective') return null;
    const block = readRichBlock(state, node);
    const body = node.getChild('Document');
    const header = node.getChild('OrbiumHeader');
    const close = node.getChild('OrbiumClose');
    if (block?.kind !== 'metadata' || !body?.firstChild || !header || !close)
        return null;
    return { body, header, close, metadata: block.presentation };
}
