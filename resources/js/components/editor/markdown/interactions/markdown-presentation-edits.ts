import { isolateHistory } from '@codemirror/commands';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';
import type { EditorView } from '@codemirror/view';
import { serializeOrbiumBlock } from '../dialect/metadata';
import { readEditableMarkdownPresentation } from './markdown-editable-presentation';
import { markdownSourceParser } from './markdown-source-parser';

export function replacePresentedMarkdown(
    view: EditorView,
    edit: { from: number; to: number; source: string; caret: number },
) {
    for (
        let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(
            edit.from,
            1,
        );
        node;
        node = node.parent
    ) {
        const presentation = readEditableMarkdownPresentation(view.state, node);
        if (
            !presentation ||
            edit.from < presentation.body.from ||
            edit.to > presentation.body.to
        )
            continue;
        const before = view.state.sliceDoc(presentation.body.from, edit.from);
        const body =
            before +
            edit.source +
            view.state.sliceDoc(edit.to, presentation.body.to);
        const caretInBody = before.length + edit.caret;
        const children: SyntaxNode[] = [];
        for (
            let child = markdownSourceParser.parse(body).topNode.firstChild;
            child;
            child = child.nextSibling
        )
            children.push(child);
        if (!children.length) {
            const source = serializeOrbiumBlock({
                ...presentation.metadata,
                kind: 'empty',
            });
            view.dispatch({
                changes: { from: node.from, to: node.to, insert: source },
                selection: { anchor: node.from },
                annotations: isolateHistory.of('full'),
                userEvent: 'input.slash',
            });
            return true;
        }
        let source = '';
        let caret = 0;
        for (const [index, child] of children.entries()) {
            const metadata = { ...presentation.metadata };
            if (!/^(?:Paragraph|(?:ATX|Setext)Heading[1-6])$/.test(child.name))
                delete metadata.align;
            if (child.name !== 'OrderedList') delete metadata.listType;
            const fragment = serializeOrbiumBlock(
                metadata,
                body.slice(child.from, child.to),
            );
            if (index) source += '\n\n';
            if (
                caretInBody >= child.from &&
                (caretInBody <= child.to || index === children.length - 1)
            )
                caret =
                    source.length +
                    fragment.indexOf('\n') +
                    1 +
                    Math.min(caretInBody - child.from, child.to - child.from);
            source += fragment;
        }
        view.dispatch({
            changes: { from: node.from, to: node.to, insert: source },
            selection: { anchor: node.from + caret },
            annotations: isolateHistory.of('full'),
            userEvent: 'input.slash',
            scrollIntoView: true,
        });
        view.focus();
        return true;
    }
    return false;
}
