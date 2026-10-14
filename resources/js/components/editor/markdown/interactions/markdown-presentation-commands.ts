import { isolateHistory } from '@codemirror/commands';
import { syntaxTree } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { serializeOrbiumBlock } from '../dialect/metadata';
import { paragraphSplitDelimiters } from '../preview/markdown-paragraph-split';
import { readEditableMarkdownPresentation } from './markdown-editable-presentation';

function splitPresentedParagraph(view: EditorView) {
    if (
        !view.state.facet(EditorView.editable) ||
        view.compositionStarted ||
        view.state.selection.ranges.length !== 1
    )
        return false;
    const range = view.state.selection.main;
    for (
        let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(
            range.from,
            1,
        );
        node;
        node = node.parent
    ) {
        const presentation = readEditableMarkdownPresentation(view.state, node);
        const child = presentation?.body.firstChild;
        if (
            !presentation ||
            !child ||
            !/^(?:Paragraph|(?:ATX|Setext)Heading[1-6])$/.test(child.name)
        )
            continue;
        if (range.to > child.to || range.from < child.from) return false;
        const delimiters = paragraphSplitDelimiters(view.state);
        const before =
            view.state.sliceDoc(child.from, delimiters.from) +
            delimiters.closing;
        const after =
            delimiters.opening + view.state.sliceDoc(delimiters.to, child.to);
        const heading = child.getChild('HeaderMark');
        const prefix =
            heading && view.state.sliceDoc(child.from, heading.to) + ' ';
        const first = serializeOrbiumBlock(
            {
                ...presentation.metadata,
                kind: before.trim() ? 'block' : 'empty',
            },
            before,
        );
        const nextBody = (prefix && after.trim() ? prefix : '') + after;
        const second = serializeOrbiumBlock(
            {
                ...presentation.metadata,
                kind: nextBody.trim() ? 'block' : 'empty',
            },
            nextBody,
        );
        const headerLength = second.indexOf('\n') + 1;
        view.dispatch({
            changes: {
                from: node.from,
                to: node.to,
                insert: `${first}\n\n${second}`,
            },
            selection: {
                anchor:
                    node.from +
                    first.length +
                    2 +
                    headerLength +
                    (prefix && after.trim() ? prefix.length : 0),
            },
            annotations: isolateHistory.of('full'),
            userEvent: 'input.paragraph',
            scrollIntoView: true,
        });
        return true;
    }
    return false;
}

export const markdownPresentationCommands = Prec.highest(
    keymap.of([{ key: 'Enter', run: splitPresentedParagraph }]),
);
