// Summary: Routes block shortcuts through shared controls and identified V3 selection; depends on stable block actions and existing rich source reveal behavior.
import { selectV3BlockFromHandle } from '../editing/v3-live-editing';
import { selectedV3ProductHeadPosition } from '../runtime/v3-product-commands';
import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { revealRichSource } from '../rich/rich-effects';
import {
    adjacentMarkdownBlock,
    markdownBlockAt,
    moveMarkdownBlock,
} from './markdown-block-actions';

export function markdownBlockKeymap(
    openCurrentBlockMenu: (view: EditorView) => void,
) {
    return Prec.high(
        keymap.of([
            {
                key: 'Mod-Shift-m',
                run(view) {
                    openCurrentBlockMenu(view);
                    return true;
                },
            },
            ...(['ArrowUp', 'ArrowDown'] as const).map((key) => ({
                key: `Alt-Shift-${key}`,
                run(view: EditorView) {
                    const block = markdownBlockAt(
                        view.state,
                        selectedV3ProductHeadPosition(view) ??
                            view.state.selection.main.head,
                    );
                    const neighbor = adjacentMarkdownBlock(
                        view,
                        block,
                        key === 'ArrowUp',
                    );
                    if (neighbor) moveMarkdownBlock(view, block, neighbor);
                    return true;
                },
            })),
            {
                key: 'Mod-Shift-a',
                run(view) {
                    const block = markdownBlockAt(
                        view.state,
                        selectedV3ProductHeadPosition(view) ??
                            view.state.selection.main.head,
                    );
                    if (block.v3Id) {
                        selectV3BlockFromHandle(view, block.v3Id);
                        return true;
                    }
                    view.dispatch({
                        selection: { anchor: block.from, head: block.to },
                        effects: revealRichSource.of(block.from),
                    });
                    return true;
                },
            },
        ]),
    );
}
