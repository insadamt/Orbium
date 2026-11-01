// Summary: Converts slash templates and uploaded media into explicit V3 block operations; depends on existing templates, scoped bodies and the authoritative owner dispatcher.
import type { EditorView } from '@codemirror/view';
import type { MarkdownBlockTemplate } from '../markdown-slash-commands';
import type { V3BlockType } from '../structure/v3-contract';
import { v3StructureField } from '../structure/v3-structure-state';
import { dispatchV3ProductOperation } from './v3-product-commands';
import { createV3Identity, encodeV3Header } from '../structure/v3-contract';
import { v3ColumnProjectionFor } from '../columns/v3/v3-column-registry';

const templateTypes: Record<string, V3BlockType> = {
    Text: 'paragraph',
    'Heading 1': 'heading-1',
    'Heading 2': 'heading-2',
    'Heading 3': 'heading-3',
    'Bullet list': 'bullet-list',
    'Numbered list': 'numbered-list',
    Checklist: 'checklist',
    Quote: 'quote',
    Callout: 'callout',
    Code: 'code',
    Table: 'table',
    Mermaid: 'mermaid',
    'Math block': 'math',
    'Mind Map': 'mindmap',
    Divider: 'divider',
};
export function insertV3Template(
    view: EditorView,
    template: MarkdownBlockTemplate,
    from: number,
    to: number,
) {
    if (!view.state.field(v3StructureField, false)) return false;
    if (template.label === 'Inline math') return false;
    const index = view.state.field(v3StructureField).current;
    const block = index.blockAt(from);
    if (!block)
        throw new Error(
            'Repair the source structure before inserting a block.',
        );
    const before = view.state.sliceDoc(block.bodyFrom, from);
    const after = view.state.sliceDoc(to, block.bodyTo);
    const empty = !before.trim() && !after.trim();
    if (template.label.endsWith('columns')) {
        if (!empty || block.parentId !== null || v3ColumnProjectionFor(view))
            throw new Error('Insert columns in an empty root paragraph.');
        dispatchV3ProductOperation(view, {
            kind: 'create-columns',
            count: template.label.startsWith('2') ? 2 : 3,
            target: { parentId: null, beforeId: block.id },
            replaceBlockId: block.id,
        });
        return true;
    }
    const type = templateTypes[template.label];
    if (!type) return false;
    if (empty)
        dispatchV3ProductOperation(view, {
            kind: 'replace-block',
            blockId: block.id,
            type,
            body: template.source,
            caret: template.caret,
        });
    else {
        const column = v3ColumnProjectionFor(view);
        const offset = column
            ? column.owner.state
                  .field(v3StructureField)
                  .current.columnById(column.columnId)!.bodyFrom
            : 0;
        dispatchV3ProductOperation(view, {
            kind: 'paste',
            blockId: block.id,
            from: from + offset,
            to: to + offset,
            source: `${encodeV3Header({ id: createV3Identity(), type })}\n${template.source}\n`,
        });
    }
    return true;
}
