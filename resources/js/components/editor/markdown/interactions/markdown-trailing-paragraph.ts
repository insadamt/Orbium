import { isolateHistory } from '@codemirror/commands';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import type { Tree } from '@lezer/common';
import { readRichBlock } from '../rich/read-rich-block';
import { markdownBlockElement } from './markdown-block-drag';
import type { MarkdownBlockRange } from './markdown-block-actions';

function trailingSpecialBlock(state: EditorState, tree: Tree) {
    if (tree.length < state.doc.length) return null;
    const node = tree.topNode.lastChild;
    if (!node) return null;
    const rich = readRichBlock(state, node);
    const special = rich
        ? !['metadata', 'empty', 'inline-math'].includes(rich.kind)
        : ['CodeBlock', 'HorizontalRule', 'HTMLBlock'].includes(node.name);
    if (!special) return null;
    const from = state.doc.lineAt(node.from).from;
    const to = state.doc.lineAt(Math.max(node.from, node.to - 1)).to;
    const block: MarkdownBlockRange = {
        from,
        to,
        name: node.name,
        source: state.sliceDoc(from, to),
    };
    return {
        block,
        missingParagraphBreaks: Math.max(
            0,
            2 - (state.doc.lines - state.doc.lineAt(to).number),
        ),
    };
}

function focusParagraphAfterLastBlock(view: EditorView) {
    if (!view.state.facet(EditorView.editable) || view.compositionStarted)
        return;
    const tree = ensureSyntaxTree(view.state, view.state.doc.length, 10);
    const trailing = tree && trailingSpecialBlock(view.state, tree);
    if (!trailing) return;
    const end = view.state.doc.length;
    if (!trailing.missingParagraphBreaks) {
        view.dispatch({ selection: { anchor: end }, scrollIntoView: true });
    } else {
        const paragraphSeparator = '\n'.repeat(trailing.missingParagraphBreaks);
        view.dispatch({
            changes: { from: end, insert: paragraphSeparator },
            selection: { anchor: end + paragraphSeparator.length },
            annotations: isolateHistory.of('full'),
            userEvent: 'input.paragraph',
            scrollIntoView: true,
        });
    }
    view.focus();
}

export const markdownTrailingParagraph = ViewPlugin.fromClass(
    class {
        readonly button = document.createElement('button');
        trailing: ReturnType<typeof trailingSpecialBlock> = null;

        constructor(readonly view: EditorView) {
            this.button.type = 'button';
            this.button.className = 'orbium-markdown-trailing-paragraph';
            this.button.setAttribute('aria-label', 'Add a text block below');
            this.button.textContent = 'Click to write below';
            this.button.addEventListener('click', this.addParagraph);
            view.dom.append(this.button);
            view.dom.addEventListener('pointerdown', this.clickBelowContent);
            this.trailing = trailingSpecialBlock(
                view.state,
                syntaxTree(view.state),
            );
            this.updateButton();
        }

        addParagraph = () => focusParagraphAfterLastBlock(this.view);

        clickBelowContent = (event: PointerEvent) => {
            if (
                event.button !== 0 ||
                ![
                    this.view.dom,
                    this.view.scrollDOM,
                    this.view.contentDOM,
                ].includes(event.target as HTMLElement)
            )
                return;
            const trailing = this.trailing;
            if (!trailing) return;
            const element = markdownBlockElement(this.view, trailing.block);
            if (
                !element ||
                event.clientY <= element.getBoundingClientRect().bottom
            )
                return;
            event.preventDefault();
            this.addParagraph();
        };

        updateButton() {
            const trailing = this.trailing;
            const writingBelow =
                trailing &&
                !trailing.missingParagraphBreaks &&
                this.view.hasFocus &&
                this.view.state.selection.main.head >=
                    this.view.state.doc.line(this.view.state.doc.lines).from;
            this.button.hidden =
                !this.view.state.facet(EditorView.editable) ||
                !trailing ||
                Boolean(writingBelow);
        }

        update(update: ViewUpdate) {
            const contentChanged =
                update.docChanged ||
                syntaxTree(update.startState) !== syntaxTree(update.state);
            if (contentChanged)
                this.trailing = trailingSpecialBlock(
                    update.state,
                    syntaxTree(update.state),
                );
            if (
                contentChanged ||
                update.selectionSet ||
                update.focusChanged ||
                update.startState.facet(EditorView.editable) !==
                    update.state.facet(EditorView.editable)
            )
                this.updateButton();
        }

        destroy() {
            this.button.removeEventListener('click', this.addParagraph);
            this.button.remove();
            this.view.dom.removeEventListener(
                'pointerdown',
                this.clickBelowContent,
            );
        }
    },
);
