// Preserve valid hidden Orbium color syntax when literal brackets are typed in Live Preview.
import { syntaxTree } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
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


function bracketEscapeAt(view: EditorView, from: number) {
    if (from < 0 || from + 2 > view.state.doc.length) return false;
    const source = view.state.sliceDoc(from, from + 2);
    if (source !== '\\[' && source !== '\\]') return false;
    const node = syntaxTree(view.state).resolveInner(from + 1, 1);
    return node.name === 'Escape' && node.from === from && node.to === from + 2;
}

function deleteVisibleBracket(view: EditorView, backward: boolean) {
    const selection = view.state.selection.main;
    if (!selection.empty) {
        let from = selection.from;
        let to = selection.to;
        for (const position of [from - 1, to - 1]) {
            if (!bracketEscapeAt(view, position)) continue;
            if (from === position + 1) from = position;
            if (to === position + 1) to = position + 2;
        }
        if (from === selection.from && to === selection.to) return false;
        view.dispatch({
            changes: { from, to },
            selection: { anchor: from },
            userEvent: backward ? 'delete.backward' : 'delete.forward',
        });
        return true;
    }
    const caret = selection.head;
    const candidates = backward ? [caret - 2, caret - 1] : [caret, caret - 1];
    for (const from of candidates) {
        if (
            !bracketEscapeAt(view, from) ||
            (backward ? caret <= from : caret >= from + 2)
        )
            continue;
        view.dispatch({
            changes: { from, to: from + 2 },
            selection: { anchor: from },
            userEvent: backward ? 'delete.backward' : 'delete.forward',
        });
        return true;
    }
    return false;
}

function unwrapColoredSpanBoundary(view: EditorView, backward: boolean) {
    const caret = view.state.selection.main.head;
    const tree = syntaxTree(view.state);
    const biases: (1 | -1)[] = backward ? [1, -1] : [-1, 1];
    for (const bias of biases) {
        for (
            let node: SyntaxNode | null = tree.resolveInner(caret, bias);
            node;
            node = node.parent
        ) {
            if (node.name !== 'OrbiumSpan') continue;
            const marks = node.getChildren('OrbiumSpanMark');
            const opening = marks[0];
            const closing = marks.at(-1);
            const metadataNode = node.getChild('OrbiumMetadata');
            if (!opening || !closing || !metadataNode || opening === closing)
                continue;
            const metadata = readOrbiumMetadata(
                view.state.sliceDoc(metadataNode.from, metadataNode.to),
                'inline',
            );
            if (
                !metadata ||
                metadata.icon ||
                (backward ? caret !== opening.to : caret !== closing.from)
            )
                continue;
            // Boundary deletion must remove a whole hidden wrapper, never one marker.
            view.dispatch({
                changes: [
                    { from: opening.from, to: opening.to },
                    { from: closing.from, to: metadataNode.to },
                ],
                selection: {
                    anchor: backward
                        ? opening.from
                        : closing.from - (opening.to - opening.from),
                },
                userEvent: backward ? 'delete.backward' : 'delete.forward',
            });
            return true;
        }
    }
    return false;
}

function deleteSpanTextSafely(view: EditorView, backward: boolean) {
    if (
        !view.state.facet(EditorView.editable) ||
        view.composing ||
        view.compositionStarted ||
        view.state.selection.ranges.length !== 1
    )
        return false;
    if (deleteVisibleBracket(view, backward)) return true;
    return (
        view.state.selection.main.empty &&
        unwrapColoredSpanBoundary(view, backward)
    );
}

export const markdownSpanDeletion = Prec.highest(
    keymap.of([
        { key: 'Backspace', run: (view) => deleteSpanTextSafely(view, true) },
        { key: 'Delete', run: (view) => deleteSpanTextSafely(view, false) },
    ]),
);
