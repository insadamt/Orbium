import { syntaxTree } from '@codemirror/language';
import { readRichBlock } from './rich/read-rich-block';
import { Prec, type EditorSelection, type Text } from '@codemirror/state';
import { drawSelection, EditorView, keymap } from '@codemirror/view';
import {
    markdownBlockAt,
    markdownBlockPresentation,
} from './interactions/markdown-block-actions';

const blockSelections = new WeakMap<
    EditorView,
    { document: Text; selection: EditorSelection }
>();

export function selectDocumentContents(view: EditorView) {
    let documentView = view;
    let parent = view.dom.parentElement?.closest<HTMLElement>('.cm-editor');
    while (parent) {
        const candidate = EditorView.findFromDOM(parent);
        if (candidate) documentView = candidate;
        parent =
            parent.parentElement?.closest<HTMLElement>('.cm-editor') ?? null;
    }
    documentView.dispatch({
        selection: { anchor: 0, head: documentView.state.doc.length },
        userEvent: 'select.all',
    });
    blockSelections.set(documentView, {
        document: documentView.state.doc,
        selection: documentView.state.selection,
    });
    documentView.focus();
}

export function selectBlockContents(
    view: EditorView,
    range: { from: number; to: number },
) {
    const previous = blockSelections.get(view);
    if (
        previous?.document === view.state.doc &&
        previous.selection === view.state.selection
    ) {
        selectDocumentContents(view);
        return;
    }
    view.dispatch({
        selection: { anchor: range.from, head: range.to },
        userEvent: 'select.block',
    });
    blockSelections.set(view, {
        document: view.state.doc,
        selection: view.state.selection,
    });
}

function selectBlockThenDocument(view: EditorView) {
    if (view.dom.parentElement?.closest<HTMLElement>('.cm-editor')) {
        selectBlockContents(view, { from: 0, to: view.state.doc.length });
        return true;
    }
    const block = markdownBlockAt(view.state, view.state.selection.main.head);
    const presentation = markdownBlockPresentation(view, block);
    const node = syntaxTree(view.state).topNode.childAfter(block.from);
    const rich = node && readRichBlock(view.state, node);
    selectBlockContents(view, {
        from: rich?.contentFrom ?? presentation.contentFrom,
        to:
            rich?.contentTo ??
            presentation.contentFrom + presentation.body.length,
    });
    return true;
}

export const markdownSelectAll = Prec.highest(
    keymap.of([{ key: 'Mod-a', run: selectBlockThenDocument }]),
);

export const orbiumSelectionAppearance = [
    drawSelection({ cursorBlinkRate: 1000 }),
    EditorView.theme({
        '&.cm-focused > .cm-scroller > .cm-content': {
            caretColor: 'transparent !important',
        },
        '&.cm-focused > .cm-scroller > .cm-content > .cm-line::selection, &.cm-focused > .cm-scroller > .cm-content > .cm-line ::selection':
            {
                backgroundColor: 'transparent !important',
            },
        '& > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
            backgroundColor:
                'color-mix(in srgb, var(--foreground) 14%, transparent)',
            borderRadius: '3px',
        },
        '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground':
            {
                backgroundColor:
                    'color-mix(in srgb, var(--foreground) 22%, transparent)',
            },
        '& > .cm-scroller > .cm-cursorLayer .cm-cursor': {
            borderLeft: '2px solid var(--foreground)',
        },
    }),
];
