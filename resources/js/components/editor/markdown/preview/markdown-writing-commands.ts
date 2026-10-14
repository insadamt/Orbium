import { isolateHistory } from '@codemirror/commands';
import { syntaxTree } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import { exitEmptyMarkdownContainer } from './markdown-container-exit';
import { EditorView, keymap } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { readEditableMarkdownPresentation } from '../interactions/markdown-editable-presentation';
import {
    hasMarkdownAncestor,
    isMarkdownSourceOnlyLine,
} from '../markdown-syntax';
import {
    inlineFormattingBoundary,
    paragraphSplitDelimiters,
} from './markdown-paragraph-split';

const sourceOrNestedBlocks = new Set([
    'OrbiumDirective',
    'OrbiumMathBlock',
    'OrbiumUnclosed',
    'FencedCode',
    'CodeBlock',
    'Table',
    'HTMLBlock',
    'HTMLTag',
    'ListItem',
    'Blockquote',
    'LinkReference',
    'Image',
]);

function writingNode(view: EditorView): SyntaxNode | null {
    const { state } = view;
    if (
        !state.facet(EditorView.editable) ||
        view.compositionStarted ||
        state.selection.ranges.length !== 1
    )
        return null;
    const selection = state.selection.main;
    const line = state.doc.lineAt(selection.head);
    if (
        state.doc.lineAt(selection.from).number !==
            state.doc.lineAt(selection.to).number ||
        isMarkdownSourceOnlyLine(line.text)
    )
        return null;
    const node = syntaxTree(state).resolveInner(line.from, 1);
    for (let parent: SyntaxNode | null = node; parent; parent = parent.parent) {
        if (readEditableMarkdownPresentation(state, parent)) continue;
        if (sourceOrNestedBlocks.has(parent.name)) return null;
    }
    return node;
}

function ancestor(node: SyntaxNode | null, name: RegExp): SyntaxNode | null {
    for (let current = node; current; current = current.parent)
        if (name.test(current.name)) return current;
    return null;
}

function insertParagraph(view: EditorView): boolean {
    const node = writingNode(view);
    if (!node) return false;
    if (
        !ancestor(node, /^(?:Paragraph|ATXHeading[1-6])$/) &&
        view.state.doc.lineAt(view.state.selection.main.head).text.trim()
    )
        return false;
    const selection = view.state.selection.main;
    const line = view.state.doc.lineAt(selection.head);
    const heading = ancestor(node, /^ATXHeading[1-6]$/);
    const prefixEnd = heading?.getChild('HeaderMark')?.to;
    if (prefixEnd !== undefined && selection.from <= prefixEnd) return false;
    const prefix = heading
        ? /^ {0,3}#{1,6}(?:[ \t]+|$)/.exec(line.text)?.[0]
        : undefined;
    if (prefix && !line.text.slice(prefix.length).trim()) {
        view.dispatch({
            changes: { from: line.from, to: line.to },
            selection: { anchor: line.from },
            annotations: isolateHistory.of('full'),
            userEvent: 'input.paragraph',
        });
        return true;
    }
    const delimiters = paragraphSplitDelimiters(view.state);
    const nextPrefix = prefix && delimiters.to < line.to ? prefix : '';
    const separator = line.text.trim() ? '\n\n' : '\n';
    const insert = `${delimiters.closing}${separator}${nextPrefix}${delimiters.opening}`;
    view.dispatch({
        changes: { from: delimiters.from, to: delimiters.to, insert },
        selection: { anchor: delimiters.from + insert.length },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.paragraph',
        scrollIntoView: true,
    });
    return true;
}

function removeHeadingPrefix(view: EditorView): boolean {
    const selection = view.state.selection.main;
    if (!selection.empty) return false;
    const heading = ancestor(writingNode(view), /^ATXHeading[1-6]$/);
    if (!heading) return false;
    const line = view.state.doc.lineAt(selection.head);
    const prefix = /^ {0,3}#{1,6}(?:[ \t]+|$)/.exec(line.text);
    if (!prefix || selection.head > line.from + prefix[0].length) return false;
    const changes = [{ from: line.from, to: line.from + prefix[0].length }];
    const closing = heading.getChildren('HeaderMark').at(1);
    if (closing) changes.push({ from: closing.from, to: closing.to });
    view.dispatch({
        changes,
        selection: { anchor: line.from },
        annotations: isolateHistory.of('full'),
        userEvent: 'delete.backward',
    });
    return true;
}

function removeInlineFormatting(
    view: EditorView,
    edge: 'start' | 'end',
): boolean {
    if (!writingNode(view)) return false;
    const boundary = inlineFormattingBoundary(view.state, edge);
    if (!boundary) return false;
    view.dispatch({
        changes: [
            { from: boundary.from, to: boundary.contentFrom },
            { from: boundary.contentTo, to: boundary.to },
        ],
        selection: {
            anchor:
                edge === 'start'
                    ? boundary.from
                    : boundary.contentTo -
                      (boundary.contentFrom - boundary.from),
        },
        annotations: isolateHistory.of('full'),
        userEvent: `delete.${edge === 'start' ? 'backward' : 'forward'}`,
    });
    return true;
}

function insertLineBreak(view: EditorView): boolean {
    if (!ancestor(writingNode(view), /^Paragraph$/)) return false;
    const selection = view.state.selection.main;
    view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: '  \n' },
        selection: { anchor: selection.from + 3 },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.linebreak',
        scrollIntoView: true,
    });
    return true;
}

function joinPreviousParagraph(view: EditorView): boolean {
    const selection = view.state.selection.main;
    if (!selection.empty) return false;
    const node = writingNode(view);
    if (!ancestor(node, /^Paragraph$/)) return false;
    const line = view.state.doc.lineAt(selection.head);
    if (
        selection.head !== line.from ||
        line.number < 3 ||
        view.state.doc.line(line.number - 1).text !== ''
    )
        return false;
    const previousLine = view.state.doc.line(line.number - 2);
    const previousNode = syntaxTree(view.state).resolveInner(
        previousLine.from,
        1,
    );
    if (
        !previousLine.text.trim() ||
        !ancestor(previousNode, /^Paragraph$/) ||
        hasMarkdownAncestor(previousNode, sourceOrNestedBlocks) ||
        isMarkdownSourceOnlyLine(previousLine.text)
    )
        return false;
    view.dispatch({
        changes: { from: previousLine.to, to: line.from },
        selection: { anchor: previousLine.to },
        annotations: isolateHistory.of('full'),
        userEvent: 'delete.backward',
    });
    return true;
}

export const markdownWritingCommands = Prec.high(
    keymap.of([
        {
            key: 'Enter',
            run: (view) =>
                exitEmptyMarkdownContainer(view) || insertParagraph(view),
        },
        { key: 'Shift-Enter', run: insertLineBreak },
        {
            key: 'Backspace',
            run: (view) =>
                removeHeadingPrefix(view) ||
                removeInlineFormatting(view, 'start') ||
                joinPreviousParagraph(view),
        },
        { key: 'Delete', run: (view) => removeInlineFormatting(view, 'end') },
    ]),
);
