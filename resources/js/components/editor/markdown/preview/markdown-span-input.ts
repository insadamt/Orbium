// Preserve valid hidden Orbium color syntax when literal brackets are typed in Live Preview.
import { syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { readOrbiumMetadata } from '../dialect/metadata';
import { pendingInlineFormatting } from '../markdown-pending-formatting';

const structuredInlineNodes = new Set([
    'InlineCode',
    'Link',
    'LinkReference',
    'Autolink',
    'Image',
    'HTMLTag',
    'OrbiumMath',
    'OrbiumInlineMath',
]);

function insideEditableOrbiumSpan(view: EditorView, from: number, to: number) {
    for (
        let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(from, 1);
        node;
        node = node.parent
    ) {
        if (structuredInlineNodes.has(node.name)) return false;
        if (node.name !== 'OrbiumSpan') continue;
        const markers = node.getChildren('OrbiumSpanMark');
        const metadata = node.getChild('OrbiumMetadata');
        const values = metadata && readOrbiumMetadata(
            view.state.sliceDoc(metadata.from, metadata.to),
            'inline',
        );
        return Boolean(
            markers[0] &&
            markers[1] &&
            from >= markers[0].to &&
            to <= markers[1].from &&
            values &&
            !values.icon
        );
    }
    return false;
}

export const escapeTypedSpanBrackets = EditorView.inputHandler.of(
    (view, from, to, text) => {
        if (
            (text !== '[' && text !== ']') ||
            view.compositionStarted ||
            !view.state.facet(EditorView.editable) ||
            view.state.field(pendingInlineFormatting, false) ||
            !insideEditableOrbiumSpan(view, from, to)
        ) return false;
        view.dispatch({
            changes: { from, to, insert: '\\' + text },
            selection: { anchor: from + 2 },
            userEvent: 'input.type',
        });
        return true;
    },
);
