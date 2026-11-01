// Summary: Pastes complete typed blocks with fresh structural identities while preserving surrounding text in one owner action; depends on validated clipboard source, balanced inline splitting and stage-3 integrity checks.
import { EditorState } from '@codemirror/state';
import type { V3BlockType } from '../structure/v3-contract';
import { V3DocumentIndex } from '../structure/v3-document-index';
import { parseV3Structure } from '../structure/v3-structure-parser';
import { copyV3Range } from '../transactions/v3-block-structure-operations';
import {
    completeV3BlockSource,
    consecutiveV3Blocks,
    markV3Affected,
    removalV3Range,
    appendV3Insertion,
    v3InsertionPosition,
} from '../transactions/v3-source-edits';
import { splitV3InlineContent } from '../transactions/v3-inline-split';
import { writeV3TextBody } from '../transactions/v3-text-body';
import {
    createV3OperationDraft,
    requireV3Block,
    V3OperationError,
    type V3BlockOperation,
    type V3OperationContext,
    type V3OperationDraft,
} from '../transactions/v3-transaction-types';
import { requireV3TextRange } from './v3-editable-text';
import { readCalloutSource } from '../dialect/callout-source';

function createV3PasteSuffix(request: {
    type: V3BlockType;
    content: string;
    offset: number;
    suffix: string;
}) {
    const { type, content, offset, suffix } = request;
    if (type === 'callout')
        return {
            type: 'paragraph' as const,
            content: suffix.replace(/^>[ \t]?/gm, ''),
        };
    const heading = /^heading-([1-6])$/.exec(type);
    if (heading)
        return {
            type,
            content: new RegExp(`^#{${heading[1]}}(?:[ \\t]|$)`).test(suffix)
                ? suffix
                : `${'#'.repeat(Number(heading[1]))} ${suffix}`,
        };
    if (type === 'quote')
        return {
            type,
            content: suffix.startsWith('>') ? suffix : `> ${suffix}`,
        };
    if (/^(bullet-list|numbered-list|checklist)$/.test(type)) {
        const marker = /^[ \t]*(?:[-+*]|\d+[.)])[ \t]+(?:\[[ xX]\][ \t]*)?/;
        const prefix =
            marker.exec(content.slice(0, offset).split('\n').at(-1)!)?.[0] ??
            '';
        return {
            type,
            content: marker.test(suffix) ? suffix : prefix + suffix,
        };
    }
    return { type, content: suffix };
}

function copyV3PasteSource(
    context: V3OperationContext,
    draft: V3OperationDraft,
    source: string,
    parentId: string | null,
) {
    const index = new V3DocumentIndex(parseV3Structure(source));
    const roots = index.blocksIn(null);
    if (
        !index.valid ||
        !roots.length ||
        (parentId !== null && roots.some((block) => block.type === 'columns'))
    )
        throw new V3OperationError(
            'invalid-paste-source',
            'Paste requires valid complete blocks and cannot nest a column layout.',
        );
    const pasted = copyV3Range(
        { ...context, index, state: EditorState.create({ doc: source }) },
        draft,
        roots,
        parentId,
    );
    const ids = roots.map((block) => draft.copiedIds.get(block.id)!);
    return { source: pasted.endsWith('\n') ? pasted : `${pasted}\n`, ids };
}

export function planV3Paste(
    context: V3OperationContext,
    operation: V3BlockOperation,
) {
    if (
        operation.kind !== 'paste' &&
        operation.kind !== 'paste-blocks' &&
        operation.kind !== 'paste-at'
    )
        return null;
    const draft = createV3OperationDraft();
    if (operation.kind === 'paste-at') {
        const position = v3InsertionPosition(context, operation.target);
        const pasted = copyV3PasteSource(
            context,
            draft,
            operation.source,
            operation.target.parentId,
        );
        appendV3Insertion(context, draft, position, pasted.source);
        if (operation.target.parentId !== null)
            draft.affectedIds.add(
                context.index.columnById(operation.target.parentId)!.layoutId,
            );
        draft.afterIds = pasted.ids;
        draft.focus = { blockId: pasted.ids.at(-1)!, bodyOffset: 'end' };
        return draft;
    }
    if (operation.kind === 'paste-blocks') {
        const blocks = consecutiveV3Blocks(context, operation.blockIds);
        const range = removalV3Range(context, blocks);
        const pasted = copyV3PasteSource(
            context,
            draft,
            operation.source,
            blocks[0].parentId,
        );
        for (const block of context.index.structure.blocks)
            if (block.from >= range.from && block.to <= range.to)
                draft.removedBlocks.add(block.id);
        for (const column of context.index.structure.columns)
            if (column.from >= range.from && column.to <= range.to)
                draft.removedColumns.add(column.id);
        draft.changes.push({ ...range, insert: pasted.source });
        markV3Affected(context, draft, blocks);
        draft.before = range;
        draft.afterIds = pasted.ids;
        draft.focus = { blockId: pasted.ids.at(-1)!, bodyOffset: 'end' };
        return draft;
    }
    const block = requireV3Block(context, operation.blockId);
    const text = requireV3TextRange({
        ...context,
        block,
        from: operation.from,
        to: operation.to,
    });
    const model = text.model;
    const content = context.state.sliceDoc(
        text.from,
        Math.max(text.from + model.content.length, operation.to),
    );
    const prefix = splitV3InlineContent(
        content,
        operation.from - text.from,
    ).earlier;
    const suffix = splitV3InlineContent(
        content,
        operation.to - text.from,
    ).later;
    if (block.type === 'callout' && !readCalloutSource(prefix))
        throw new V3OperationError(
            'atomic-callout-header',
            'Move the paste position after the callout marker/title. Its presentation was not changed.',
        );
    const pasted = copyV3PasteSource(
        context,
        draft,
        operation.source,
        block.parentId,
    );
    let source = completeV3BlockSource(
        { id: block.id, type: block.type },
        writeV3TextBody({ ...model, trailing: '\n\n' }, prefix),
    );
    source += pasted.source;
    if (suffix) {
        const id = context.allocateIdentity();
        const trailing = createV3PasteSuffix({
            type: block.type,
            content,
            offset: operation.to - text.from,
            suffix,
        });
        source += completeV3BlockSource(
            { id, type: trailing.type },
            writeV3TextBody(
                { ...model, leading: '' },
                trailing.content,
                trailing.type,
            ),
        );
        draft.createdBlocks.set(id, {
            type: trailing.type,
            parentId: block.parentId,
        });
    }
    if (!source.endsWith('\n') && block.to < context.state.doc.length)
        source += '\n';
    draft.changes.push({ from: block.from, to: block.to, insert: source });
    markV3Affected(context, draft, [block]);
    draft.before = { from: block.from, to: block.to };
    draft.afterIds = [block.id, ...pasted.ids];
    draft.focus = { blockId: pasted.ids.at(-1)!, bodyOffset: 'end' };
    return draft;
}
