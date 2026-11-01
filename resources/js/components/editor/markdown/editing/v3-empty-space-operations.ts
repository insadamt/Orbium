// Summary: Turns repeated empty-paragraph Enter into non-editable spacing and trims abandoned trailing writing rows; depends on checked text models and the existing identified insertion planner.
import { encodeV3Header } from '../structure/v3-contract';
import { planV3StructureOperation } from '../transactions/v3-block-structure-operations';
import { markV3Affected } from '../transactions/v3-source-edits';
import {
    readV3TextBody,
    writeV3TextBody,
    type V3TextBody,
} from '../transactions/v3-text-body';
import {
    requireV3Block,
    V3OperationError,
    type V3OperationContext,
} from '../transactions/v3-transaction-types';

const emptyContinuation =
    /^[ \t]*(?:>|(?:[-+*]|\d+[.)])[ \t]+(?:\[ \][ \t]*)?)[ \t]*$/;

export function hasV3TrailingWritingRows(model: V3TextBody) {
    const lines = model.content.split('\n');
    return (
        (!model.metadata && model.trailing.length > 1) ||
        /\n[ \t]*$/.test(model.content) ||
        (/^(bullet-list|numbered-list|checklist|quote|callout)$/.test(
            model.type,
        ) &&
            lines.length > 1 &&
            emptyContinuation.test(lines.at(-1)!))
    );
}

export function trimV3TrailingWritingRows(
    model: V3TextBody,
    content = model.content,
) {
    //
    // One raw newline separates identities; extra trailing rows are temporary writing positions, not saved spacing blocks.
    //
    return writeV3TextBody(
        { ...model, trailing: '\n' },
        v3ContentWithoutTrailingRows(model, content),
    );
}

export function v3ContentWithoutTrailingRows(
    model: V3TextBody,
    content = model.content,
) {
    let next = content.replace(/(?:\n[ \t]*)+$/, '');
    if (
        /^(bullet-list|numbered-list|checklist|quote|callout)$/.test(model.type)
    ) {
        const lines = next.split('\n');
        while (lines.length > 1 && emptyContinuation.test(lines.at(-1)!))
            lines.pop();
        next = lines.join('\n').replace(/(?:\n[ \t]*)+$/, '');
    }
    return next;
}

export function planV3EmptyParagraphAdvance(
    context: V3OperationContext,
    blockId: string,
) {
    const block = requireV3Block(context, blockId);
    const model = readV3TextBody(context, block);
    if (block.type !== 'paragraph' || model.content.trim())
        throw new V3OperationError(
            'nonempty-spacing',
            'Only an empty paragraph can become an empty-space block.',
        );
    const next = context.index.neighbor(block.id, 1);
    const draft = planV3StructureOperation(context, {
        kind: 'insert',
        type: 'paragraph',
        body: writeV3TextBody({ ...model, trailing: '\n' }, ''),
        target: { parentId: block.parentId, beforeId: next?.id },
    })!;
    draft.changes.push({
        from: block.from,
        to: block.headerTo,
        insert: encodeV3Header({ id: block.id, type: 'spacer' }),
    });
    draft.changes.push({
        from: block.bodyFrom,
        to: block.bodyTo,
        insert: `${block.bodyFrom === block.headerTo ? '\n' : ''}\n`,
    });
    draft.convertedTypes.set(block.id, 'spacer');
    markV3Affected(context, draft, [block]);
    draft.before = { from: block.from, to: block.to };
    return draft;
}
