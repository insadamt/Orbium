// Summary: Adapts existing product controls to explicit V3 identities and owner transactions; depends on the scoped index, registered column projections and the checked transaction dispatcher.
import { v3BlockSelectionField } from '../editing/v3-block-selection';
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import type { V3BlockType } from '../structure/v3-contract';
import { executeV3Operation } from '../transactions/v3-transaction-dispatch';
import type { V3BlockOperation } from '../transactions/v3-transaction-types';
import { v3ColumnProjectionFor } from '../columns/v3/v3-column-registry';
import type { MarkdownBlockRange } from '../interactions/markdown-block-actions';

const names: Record<V3BlockType, string> = {
    paragraph: 'Paragraph',
    spacer: 'V3Spacer',
    'heading-1': 'ATXHeading1',
    'heading-2': 'ATXHeading2',
    'heading-3': 'ATXHeading3',
    'heading-4': 'ATXHeading4',
    'heading-5': 'ATXHeading5',
    'heading-6': 'ATXHeading6',
    'bullet-list': 'BulletList',
    'numbered-list': 'OrderedList',
    checklist: 'BulletList',
    quote: 'Blockquote',
    callout: 'Blockquote',
    divider: 'HorizontalRule',
    code: 'FencedCode',
    mermaid: 'FencedCode',
    math: 'OrbiumMathBlock',
    table: 'Table',
    image: 'Image',
    file: 'Link',
    video: 'Link',
    audio: 'Link',
    pdf: 'Link',
    mindmap: 'OrbiumDirective',
    columns: 'V3Layout',
};
export function v3ProductBlockAt(
    state: EditorState,
    position: number,
): MarkdownBlockRange | null {
    const index = state.field(v3StructureField, false)?.current;
    const block = index?.blockAt(position);
    if (!block) return null;
    const from = block.type === 'columns' ? block.from : block.bodyFrom;
    return {
        v3Id: block.id,
        from,
        to: block.to,
        name: names[block.type],
        source: state.sliceDoc(from, block.to),
    };
}
export function dispatchV3ProductOperation(
    view: EditorView,
    operation: V3BlockOperation,
    focusEditor = true,
) {
    const owner = v3ColumnProjectionFor(view)?.owner ?? view;
    return executeV3Operation({
        view: owner,
        operation,
        focusEditor,
        preserveSelection: !focusEditor,
        isAvailable: () =>
            owner.dom.isConnected && !owner.dom.closest('[hidden], [inert]'),
    });
}
export function v3ProductNeighbor(
    view: EditorView,
    id: string,
    previous: boolean,
) {
    const index = view.state.field(v3StructureField).current;
    const block = index.blockById(id);
    if (!block) return null;
    const siblings = index.blocksIn(block.parentId);
    const selected = selectedV3ProductIds(view, id);
    const edge = previous ? selected[0] : selected.at(-1)!;
    const neighbor =
        siblings[
            siblings.findIndex((item) => item.id === edge) + (previous ? -1 : 1)
        ];
    return neighbor ? v3ProductBlockAt(view.state, neighbor.bodyFrom) : null;
}
export function moveV3ProductBlock(
    view: EditorView,
    id: string,
    targetId: string,
    placement: string,
) {
    const owner = v3ColumnProjectionFor(view)?.owner ?? view;
    const index = owner.state.field(v3StructureField).current;
    const target = index.blockById(targetId);
    if (!target) return;
    const siblings = index.blocksIn(target.parentId);
    const beforeId =
        placement === 'before'
            ? target.id
            : siblings[siblings.findIndex((item) => item.id === target.id) + 1]
                  ?.id;
    return dispatchV3ProductOperation(view, {
        kind: 'move',
        blockIds: selectedV3ProductIds(view, id),
        target: { parentId: target.parentId, beforeId },
    }).prepared.transaction.changes;
}
export function v3TypeForPrefix(prefix: string): V3BlockType {
    if (/^#+ $/.test(prefix))
        return `heading-${prefix.trim().length}` as V3BlockType;
    return (
        (
            {
                '': 'paragraph',
                '- ': 'bullet-list',
                '1. ': 'numbered-list',
                '- [ ] ': 'checklist',
                '> ': 'quote',
                '> [!NOTE]\n> ': 'callout',
                '```': 'code',
            } as Record<string, V3BlockType>
        )[prefix] ?? 'paragraph'
    );
}
export function insertV3ParagraphAfter(
    view: EditorView,
    id: string,
    options: { motion?: 'none' } = {},
) {
    const owner = v3ColumnProjectionFor(view)?.owner ?? view;
    const index = owner.state.field(v3StructureField).current;
    const block = index.blockById(id);
    if (!block) return;
    const siblings = index.blocksIn(block.parentId);
    dispatchV3ProductOperation(view, {
        kind: 'insert',
        type: 'paragraph',
        body: '',
        motion: options.motion,
        target: {
            parentId: block.parentId,
            beforeId:
                siblings[siblings.findIndex((item) => item.id === id) + 1]?.id,
        },
    });
}

export function selectedV3ProductIds(
    view: EditorView,
    id: string,
): readonly string[] {
    const ids = view.state.field(v3BlockSelectionField, false)?.ids;
    return ids?.includes(id) ? ids : [id];
}

export function selectedV3ProductHeadPosition(view: EditorView) {
    const selected = view.state.field(v3BlockSelectionField, false);
    //
    // A blank block's selected body can end exactly at its neighbor's header; the head ID remains the authoritative control target.
    //
    return selected
        ? (view.state.field(v3StructureField).current.blockById(selected.headId)
              ?.bodyFrom ?? null)
        : null;
}
