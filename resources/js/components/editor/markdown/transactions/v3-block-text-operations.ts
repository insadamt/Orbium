// Summary: Plans body edits and lossless text conversions/splits/paragraph merges with stable IDs; depends on presentation-aware text bodies, balanced inline splitting and exact owner source ranges.
import { encodeV3Header } from '../structure/v3-contract';
import { convertV3CodeBody } from './v3-code-conversion';
import type { V3Block } from '../structure/v3-structure-types';
import {
    createV3OperationDraft,
    requireV3Block,
    V3OperationError,
    type V3BlockOperation,
    type V3OperationContext,
} from './v3-transaction-types';
import { completeV3BlockSource, markV3Affected } from './v3-source-edits';
import {
    convertV3Content,
    paragraphV3Content,
    readV3TextBody,
    writeV3TextBody,
    type V3TextBody,
} from './v3-text-body';
import { splitV3InlineContent } from './v3-inline-split';
import { joinV3InlineContent } from '../editing/v3-inline-join';

function terminateV3Replacement(
    context: V3OperationContext,
    block: V3Block,
    source: string,
) {
    return block.to < context.state.doc.length && !source.endsWith('\n')
        ? `${source}\n`
        : source;
}

function planV3BodyReplacement(
    context: V3OperationContext,
    operation: Extract<
        V3BlockOperation,
        { kind: 'replace-body' | 'replace-block' }
    >,
) {
    const block = requireV3Block(context, operation.blockId);
    if (block.type === 'columns')
        throw new V3OperationError(
            'layout-write-rejected',
            'Edit a child range or use a dedicated layout transaction instead of replacing the whole layout body.',
        );
    const draft = createV3OperationDraft();
    if (operation.kind === 'replace-block') {
        if (operation.type === 'columns')
            throw new V3OperationError(
                'layout-write-rejected',
                'Use the columns command to create a layout.',
            );
        draft.changes.push({
            from: block.from,
            to: block.headerTo,
            insert: encodeV3Header({ id: block.id, type: operation.type }),
        });
        draft.convertedTypes.set(block.id, operation.type);
    }
    const missingHeaderNewline = block.bodyFrom === block.headerTo ? '\n' : '';
    const type =
        operation.kind === 'replace-block' ? operation.type : block.type;
    const body =
        type === 'paragraph' && operation.body === '' ? '\n' : operation.body;
    draft.changes.push({
        from: block.bodyFrom,
        to: block.bodyTo,
        insert:
            missingHeaderNewline + terminateV3Replacement(context, block, body),
    });
    markV3Affected(context, draft, [block]);
    draft.before = { from: block.from, to: block.to };
    draft.afterIds = [block.id];
    draft.focus = {
        blockId: block.id,
        bodyOffset:
            operation.kind === 'replace-body' && operation.focus === 'end'
                ? 'end'
                : 0,
        ...(operation.caret === undefined
            ? {}
            : { sourceOffset: operation.caret }),
    };
    return draft;
}

function planV3Conversion(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'convert' }>,
) {
    const block = requireV3Block(context, operation.blockId);
    if (block.type === operation.type)
        throw new V3OperationError(
            'unchanged-type',
            'The block already has this explicit type.',
        );
    const codeBody = convertV3CodeBody(context, block, operation.type);
    const body =
        codeBody ??
        (() => {
            const model = readV3TextBody(context, block);
            return writeV3TextBody(
                model,
                convertV3Content(model, operation.type),
                operation.type,
            );
        })();
    const source = completeV3BlockSource(
        { id: block.id, type: operation.type },
        body,
    );
    const draft = createV3OperationDraft();
    draft.changes.push({
        from: block.from,
        to: block.to,
        insert: terminateV3Replacement(context, block, source),
    });
    draft.convertedTypes.set(block.id, operation.type);
    markV3Affected(context, draft, [block]);
    draft.focus = {
        blockId: block.id,
        bodyOffset: operation.focus === 'end' ? 'end' : 0,
    };
    draft.before = { from: block.from, to: block.to };
    draft.afterIds = [block.id];
    return draft;
}

function planV3Split(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'split' }>,
) {
    const block = requireV3Block(context, operation.blockId);
    if (!/^(paragraph|heading-[1-6])$/.test(block.type))
        throw new V3OperationError(
            'unsupported-split',
            'Only paragraphs/headings split here; lists remain whole blocks and rich data needs its dedicated adapter.',
        );
    const model = readV3TextBody(context, block);
    const plain = paragraphV3Content(model);
    const parts = splitV3InlineContent(plain, operation.offset);
    const heading = /^heading-([1-6])$/.exec(block.type);
    const prefix = heading ? `${'#'.repeat(Number(heading[1]))} ` : '';
    const laterId = context.allocateIdentity();
    const earlier = completeV3BlockSource(
        { id: block.id, type: block.type },
        writeV3TextBody({ ...model, trailing: '\n' }, prefix + parts.earlier),
    );
    const later = completeV3BlockSource(
        { id: laterId, type: block.type },
        writeV3TextBody({ ...model, leading: '' }, prefix + parts.later),
    );
    const draft = createV3OperationDraft();
    draft.changes.push({
        from: block.from,
        to: block.to,
        insert: terminateV3Replacement(context, block, earlier + later),
    });
    draft.createdBlocks.set(laterId, {
        type: block.type,
        parentId: block.parentId,
    });
    markV3Affected(context, draft, [block]);
    draft.focus = { blockId: laterId, bodyOffset: 0 };
    draft.before = { from: block.from, to: block.to };
    draft.afterIds = [block.id, laterId];
    return draft;
}

function comparableV3Presentation(model: V3TextBody) {
    return JSON.stringify(
        Object.entries(model.metadata ?? {})
            .filter(([key]) => key !== 'kind')
            .sort(([left], [right]) => left.localeCompare(right)),
    );
}

function planV3Merge(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'merge' }>,
) {
    const earlier = requireV3Block(context, operation.earlierId);
    const later = requireV3Block(context, operation.laterId);
    if (
        earlier.type !== 'paragraph' ||
        later.type !== 'paragraph' ||
        earlier.parentId !== later.parentId ||
        later.order !== earlier.order + 1
    )
        throw new V3OperationError(
            'incompatible-merge',
            'Merge requires adjacent paragraphs in the same scope. Convert a text block separately first.',
        );
    const left = readV3TextBody(context, earlier);
    const right = readV3TextBody(context, later);
    if (comparableV3Presentation(left) !== comparableV3Presentation(right))
        throw new V3OperationError(
            'incompatible-presentation',
            'Paragraphs with different presentation cannot merge losslessly.',
        );
    const body = writeV3TextBody(
        { ...left, trailing: right.trailing },
        joinV3InlineContent(left.content, right.content),
    );
    const source = completeV3BlockSource(
        { id: earlier.id, type: 'paragraph' },
        body,
    );
    const draft = createV3OperationDraft();
    draft.changes.push({
        from: earlier.from,
        to: later.to,
        insert: terminateV3Replacement(context, later, source),
    });
    markV3Affected(context, draft, [earlier, later]);
    draft.removedBlocks.add(later.id);
    draft.before = { from: earlier.from, to: later.to };
    draft.afterIds = [earlier.id];
    draft.focus = { blockId: earlier.id, bodyOffset: left.content.length };
    return draft;
}

export function planV3TextOperation(
    context: V3OperationContext,
    operation: V3BlockOperation,
) {
    switch (operation.kind) {
        case 'replace-block':
        case 'replace-body':
            return planV3BodyReplacement(context, operation);
        case 'convert':
            return planV3Conversion(context, operation);
        case 'split':
            return planV3Split(context, operation);
        case 'merge':
            return planV3Merge(context, operation);
        default:
            throw new V3OperationError(
                'unknown-operation',
                'This structural operation has no planner.',
            );
    }
}
