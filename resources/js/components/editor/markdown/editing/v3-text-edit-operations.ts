// Summary: Plans narrow body keystrokes and empty-final-line exits as single history actions; depends on checked text ranges and the existing owner insertion planner.
import { planV3StructureOperation } from '../transactions/v3-block-structure-operations';
import {
    createV3OperationDraft,
    requireV3Block,
    type V3OperationContext,
    type V3BlockOperation,
} from '../transactions/v3-transaction-types';
import { markV3Affected } from '../transactions/v3-source-edits';
import { requireV3TextRange } from './v3-editable-text';
import { writeV3TextBody } from '../transactions/v3-text-body';
import {
    planV3EmptyParagraphAdvance,
    trimV3TrailingWritingRows,
} from './v3-empty-space-operations';

export function planV3TextEdit(
    context: V3OperationContext,
    operation: V3BlockOperation,
) {
    if (operation.kind === 'advance-empty')
        return planV3EmptyParagraphAdvance(context, operation.blockId);
    if (operation.kind !== 'edit-text' && operation.kind !== 'exit-text')
        return null;
    const block = requireV3Block(context, operation.blockId);
    const text = requireV3TextRange({
        ...context,
        block,
        from: operation.from,
        to: operation.to,
    });
    const next = context.index.neighbor(block.id, 1);
    const draft =
        operation.kind === 'exit-text'
            ? planV3StructureOperation(context, {
                  kind: 'insert',
                  type: 'paragraph',
                  body:
                      block.type === 'paragraph'
                          ? writeV3TextBody(
                                { ...text.model, trailing: '\n' },
                                '',
                            )
                          : '\n',
                  target: { parentId: block.parentId, beforeId: next?.id },
              })!
            : createV3OperationDraft();
    const insert =
        operation.kind === 'edit-text'
            ? (block.bodyFrom === block.headerTo ? '\n' : '') + operation.insert
            : '';
    //
    // Exiting a wholly empty typed block must retain its valid marker and identity; only a later empty list item is removed from a nonempty list.
    //
    const keepEmptyMarker =
        operation.kind === 'exit-text' &&
        block.type !== 'paragraph' &&
        !context.state.sliceDoc(text.from, operation.from).trim() &&
        !context.state.sliceDoc(operation.to, text.to).trim();
    if (keepEmptyMarker) {
        markV3Affected(context, draft, [block]);
        return draft;
    }
    if (operation.kind === 'exit-text') {
        const content =
            text.model.content.slice(0, operation.from - text.from) +
            text.model.content.slice(operation.to - text.from);
        let body = trimV3TrailingWritingRows(text.model, content);
        //
        // At an unterminated EOF, the insertion planner already supplies the separating newline; adding it twice would recreate the empty row.
        //
        if (
            block.to === context.state.doc.length &&
            context.state.sliceDoc(block.to - 1, block.to) !== '\n'
        )
            body = body.slice(0, -1);
        draft.changes.push({
            from: block.bodyFrom,
            to: block.bodyTo,
            insert: body,
        });
    } else if (
        text.model.metadata &&
        (operation.from !== operation.to || insert)
    ) {
        const content =
            text.model.content.slice(0, operation.from - text.from) +
            insert +
            text.model.content.slice(operation.to - text.from);
        let body = writeV3TextBody(text.model, content);
        if (block.to < context.state.doc.length && !body.endsWith('\n'))
            body += '\n';
        draft.changes.push({
            from: block.bodyFrom,
            to: block.bodyTo,
            insert: body,
        });
    } else if (operation.from !== operation.to || insert)
        draft.changes.push({ from: operation.from, to: operation.to, insert });
    markV3Affected(context, draft, [block]);
    draft.before = { from: block.from, to: block.to };
    if (operation.kind === 'edit-text') {
        draft.focus = {
            blockId: block.id,
            bodyOffset: operation.from - text.from + operation.insert.length,
            includeTrailing: true,
        };
        draft.afterIds = [block.id];
    }
    return draft;
}
