import { isolateHistory } from '@codemirror/commands';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState, Transaction } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { serializeOrbiumBlock } from '../dialect/metadata';
import { readEditableMarkdownPresentation } from '../interactions/markdown-editable-presentation';
import { refreshRichBlocks } from '../rich/rich-effects';
import type { OrbiumMetadata } from '../dialect/metadata';

function readPresentationAncestors(state: EditorState, position: number) {
    const ancestors: {
        node: SyntaxNode;
        presentation: NonNullable<
            ReturnType<typeof readEditableMarkdownPresentation>
        >;
    }[] = [];
    for (
        let node: SyntaxNode | null = syntaxTree(state).resolveInner(
            position,
            -1,
        );
        node;
        node = node.parent
    ) {
        const presentation = readEditableMarkdownPresentation(state, node);
        if (presentation) ancestors.push({ node, presentation });
    }
    return ancestors;
}

export function insertPresentedContainerExit(
    view: EditorView,
    transaction: Transaction,
) {
    const ancestors = readPresentationAncestors(
        view.state,
        view.state.selection.main.head,
    );
    const inner = ancestors[0];
    const outer = ancestors.at(-1);
    if (!inner || !outer) return false;
    const { node } = outer;
    const { presentation } = inner;
    const from = transaction.changes.mapPos(presentation.body.from, -1);
    const to = transaction.changes.mapPos(presentation.body.to, 1);
    const remaining = transaction.state.sliceDoc(from, to).trimEnd();
    if (!remaining) return false;
    const first = ancestors.reduce(
        (body, ancestor) =>
            serializeOrbiumBlock(ancestor.presentation.metadata, body),
        remaining,
    );
    const paragraphMetadata: OrbiumMetadata = { kind: 'empty' };
    for (const ancestor of [...ancestors].reverse())
        Object.assign(paragraphMetadata, ancestor.presentation.metadata);
    paragraphMetadata.kind = 'empty';
    delete paragraphMetadata.listType;
    const second = serializeOrbiumBlock(paragraphMetadata);
    const source = `${first}\n\n${second}`;
    const paragraphFrom = node.from + first.length + 2;
    view.dispatch({
        changes: { from: node.from, to: node.to, insert: source },
        selection: { anchor: paragraphFrom },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.paragraph',
        scrollIntoView: true,
    });
    const tree =
        ensureSyntaxTree(view.state, node.from + source.length, 10) ??
        syntaxTree(view.state);
    view.dispatch({
        effects: refreshRichBlocks.of({
            from: node.from,
            to: node.from + source.length,
            tree,
        }),
    });
    view.dom
        .querySelector<HTMLElement>(`[data-rich-from="${paragraphFrom}"]`)
        ?.dispatchEvent(new Event('orbium-edit-rich'));
    return true;
}
