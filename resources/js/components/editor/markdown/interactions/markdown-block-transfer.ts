import { isolateHistory } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';
import type { MarkdownBlockRange } from './markdown-block-actions';
import type { markdownBlockDropTarget } from './markdown-block-drag';
import type { MarkdownLimits } from '../markdown-api';
import { validateMarkdownTransfer } from './markdown-transfer';
import {
    markdownBlockMotion,
    type MarkdownBlockMotionSnapshot,
} from './markdown-block-motion';
import { linkedMarkdownMoveEffect } from './markdown-linked-move-history';

export type MarkdownDropTarget = NonNullable<
    ReturnType<typeof markdownBlockDropTarget>
>;

export function prepareTransferredMarkdownInsertion(request: {
    view: EditorView;
    block: MarkdownBlockRange;
    target: MarkdownDropTarget;
    limits: MarkdownLimits;
}) {
    const { view, block, target, limits } = request;
    const emptyDocument = !view.state.doc.toString().trim();
    const position =
        target.placement === 'before' ? target.block.from : target.block.to;
    const changes = view.state.changes(
        emptyDocument
            ? { from: 0, to: view.state.doc.length, insert: block.source }
            : {
                  from: position,
                  insert:
                      target.placement === 'before'
                          ? `${block.source}\n\n`
                          : `\n\n${block.source}`,
              },
    );
    // Validate before removing the original so an oversized destination cannot lose a block.
    validateMarkdownTransfer(changes.apply(view.state.doc).toString(), limits);
    const insertedFrom = emptyDocument
        ? 0
        : position + (target.placement === 'before' ? 0 : 2);
    return { changes, insertedFrom };
}

export function insertTransferredMarkdownBlock(
    view: EditorView,
    block: MarkdownBlockRange,
    insertion: ReturnType<typeof prepareTransferredMarkdownInsertion>,
    moveId?: string,
) {
    const { changes, insertedFrom } = insertion;
    const motion = view.plugin(markdownBlockMotion);

    // Insertion has no outgoing block in the destination document.

    const snapshot = motion?.capture();
    view.dispatch({
        changes,
        effects: linkedMarkdownMoveEffect(moveId),
        annotations: isolateHistory.of('full'),
        userEvent: 'input.block-transfer',
    });
    if (snapshot)
        motion?.play(snapshot, changes, {
            from: insertedFrom,
            to: insertedFrom + block.source.length,
        });
    return changes;
}

export function removeTransferredMarkdownBlock(
    view: EditorView,
    block: MarkdownBlockRange,
    options: {
        moveId?: string;
        snapshot?: MarkdownBlockMotionSnapshot | null;
    } = {},
) {
    let from = block.from;
    let to = block.to;
    if (to < view.state.doc.length) {
        to++;
        while (to < view.state.doc.length) {
            const line = view.state.doc.lineAt(to);
            if (line.text.trim()) break;
            to = Math.min(view.state.doc.length, line.to + 1);
        }
    } else if (from > 0) {
        from--;
        while (from > 0) {
            const line = view.state.doc.lineAt(from);
            if (line.text.trim()) break;
            from = Math.max(0, line.from - 1);
        }
    }
    const changes = view.state.changes({ from, to });
    const motion = view.plugin(markdownBlockMotion);
    const snapshot = options.snapshot ?? motion?.capture(block);
    view.dispatch({
        changes,
        effects: linkedMarkdownMoveEffect(options.moveId),
        annotations: isolateHistory.of('full'),
        userEvent: 'delete.block-transfer',
    });
    if (snapshot) motion?.play(snapshot, changes);
}
