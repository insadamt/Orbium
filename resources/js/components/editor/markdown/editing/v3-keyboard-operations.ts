// Summary: Resolves approved keyboard behavior into owner operations while leaving ordinary navigation and embedded Enter intact; depends on explicit V3 scope and editable text ranges.
import type { EditorState } from '@codemirror/state';
import { v3StructureField } from '../structure/v3-structure-state';
import { isV3TextType, writeV3TextBody } from '../transactions/v3-text-body';
import type { V3BlockOperation } from '../transactions/v3-transaction-types';
import { readV3EditableText } from './v3-editable-text';

export function isV3ProtectedTextBoundary(
    state: EditorState,
    key: V3EditingKey,
) {
    if (
        (key !== 'Backspace' && key !== 'Delete') ||
        !state.selection.main.empty
    )
        return false;
    const index = state.field(v3StructureField).current;
    const block = index.blockAt(state.selection.main.head);
    if (!block || !isV3TextType(block.type)) return false;
    const text = readV3EditableText(state, index, block);
    return key === 'Backspace'
        ? state.selection.main.head === text.from
        : state.selection.main.head >=
              text.model.contentFrom + text.model.content.length;
}

export type V3EditingKey = 'Enter' | 'Shift-Enter' | 'Backspace' | 'Delete';

export function resolveV3KeyboardOperation(request: {
    state: EditorState;
    key: V3EditingKey;
    blockId?: string;
}): V3BlockOperation | null {
    const { state, key } = request;
    const index = state.field(v3StructureField).current;
    if (!index.valid || state.selection.ranges.length !== 1) return null;
    const selection = state.selection.main;
    const block = request.blockId
        ? index.blockById(request.blockId)
        : index.blockAt(selection.head);
    if (!block) {
        if (
            !index.structure.blocks.length &&
            (key === 'Enter' || key === 'Shift-Enter')
        )
            return {
                kind: 'insert',
                target: { parentId: null },
                type: 'paragraph',
                body: '\n',
            };
        return null;
    }
    if (
        (key === 'Enter' || key === 'Shift-Enter') &&
        block.type === 'paragraph' &&
        !readV3EditableText(state, index, block).model.content.trim()
    )
        return { kind: 'advance-empty', blockId: block.id };
    if (block.type === 'spacer') {
        if (key === 'Backspace' || key === 'Delete')
            return {
                kind: 'delete',
                blockIds: [block.id],
                ensureParagraph: true,
            };
        const next = index.neighbor(block.id, 1);
        return {
            kind: 'insert',
            type: 'paragraph',
            body: '\n',
            target: { parentId: block.parentId, beforeId: next?.id },
        };
    }
    if (key === 'Shift-Enter') {
        const next = index.neighbor(block.id, 1);
        return {
            kind: 'insert',
            target: {
                parentId: block.parentId,
                ...(next ? { beforeId: next.id } : {}),
            },
            type: 'paragraph',
            body: '\n',
        };
    }
    if (
        block.type === 'columns' &&
        key === 'Enter' &&
        selection.empty &&
        selection.head >= block.bodyTo
    ) {
        const next = index.neighbor(block.id, 1);
        return {
            kind: 'insert',
            type: 'paragraph',
            body: '\n',
            target: { parentId: null, beforeId: next?.id },
        };
    }
    if (!isV3TextType(block.type)) return null;
    const text = readV3EditableText(state, index, block);
    if (selection.from < text.from || selection.to > text.to) return null;
    const before = state.sliceDoc(text.from, selection.from);
    const after = state.sliceDoc(selection.to, text.to);
    const line = state.doc.lineAt(selection.from);
    const prefix = state.sliceDoc(
        Math.max(line.from, text.from),
        selection.from,
    );
    if (key === 'Enter') {
        const finalLine = selection.empty && /^[ \t\n]*$/.test(after);
        const emptyLine =
            /^[ \t]*(?:>[ \t]*)?$/.test(prefix) ||
            (/^heading-[1-6]$/.test(block.type) &&
                /^ {0,3}#{1,6}[ \t]*$/.test(prefix));
        const fence = /^( {0,3})\\(`{3,}|~{3,})([^`~]*)$/.exec(prefix);
        if (
            block.type === 'paragraph' &&
            finalLine &&
            line.from === text.from &&
            /^ {0,3}\\\$\$[ \t]*$/.test(prefix)
        )
            return {
                kind: 'replace-block',
                blockId: block.id,
                type: 'math',
                body: writeV3TextBody(text.model, '$$\n\n$$', 'math'),
                caret: 0,
            };
        if (
            block.type === 'paragraph' &&
            finalLine &&
            fence &&
            line.from === text.from
        ) {
            const opening = `${fence[1]}${fence[2]}${fence[3]}`;
            return {
                kind: 'replace-block',
                blockId: block.id,
                type:
                    fence[3].trim().split(/\s+/)[0].toLowerCase() === 'mermaid'
                        ? 'mermaid'
                        : 'code',
                body: writeV3TextBody(
                    text.model,
                    `${opening}\n\n${fence[1]}${fence[2]}${after}`,
                ),
                caret: text.model.metadata ? 0 : opening.length + 1,
            };
        }
        const item =
            /^([ \t]*)([-+*]|\d+[.)])([ \t]+)(?:\[([ xX])\][ \t]*)?(.*)$/.exec(
                prefix,
            );
        const list = /^(bullet-list|numbered-list|checklist)$/.test(block.type);
        if (block.type === 'paragraph' && finalLine && !emptyLine)
            return {
                kind: 'exit-text',
                blockId: block.id,
                from: selection.from,
                to: selection.to,
            };
        if (
            finalLine &&
            (list ? (item && !item[5].trim()) || emptyLine : emptyLine)
        )
            return {
                kind: 'exit-text',
                blockId: block.id,
                from: Math.max(line.from, text.from),
                to: selection.to,
            };
        let continuation = '';
        if (list && item) {
            const marker = /^\d/.test(item[2])
                ? item[2].replace(
                      /^\d+/,
                      String(Number.parseInt(item[2], 10) + 1),
                  )
                : item[2];
            continuation = `${item[1]}${marker}${item[3]}${block.type === 'checklist' ? '[ ] ' : ''}`;
        } else if (block.type === 'quote' || block.type === 'callout') {
            continuation = /^([ \t]*>[ \t]?)/.exec(prefix)?.[1] ?? '> ';
        }
        return {
            kind: 'edit-text',
            blockId: block.id,
            from: selection.from,
            to: selection.to,
            insert: `\n${continuation}`,
        };
    }
    if (!selection.empty) return null;
    const startPrefix = /^(?:heading-[1-6])$/.test(block.type)
        ? (/^ {0,3}#{1,6}[ \t]+/.exec(text.model.content)?.[0] ?? '')
        : /^(bullet-list|numbered-list|checklist)$/.test(block.type)
          ? (/^[ \t]*(?:[-+*]|\d+[.)])[ \t]+(?:\[[ xX]\][ \t]*)?/.exec(
                text.model.content,
            )?.[0] ?? '')
          : /^(quote|callout)$/.test(block.type)
            ? (/^>[ \t]?/.exec(text.model.content)?.[0] ?? '')
            : '';
    const atStart = before === '' || before === startPrefix;
    const atEnd = /^[ \t\n]*$/.test(after);
    if ((key === 'Backspace' && !atStart) || (key === 'Delete' && !atEnd))
        return null;
    if (block.type !== 'paragraph')
        return {
            kind: 'convert',
            blockId: block.id,
            type: 'paragraph',
            focus: key === 'Delete' ? 'end' : 'start',
        };
    if (!text.model.content.trim())
        return { kind: 'delete', blockIds: [block.id], ensureParagraph: true };
    const neighbor = index.neighbor(block.id, key === 'Backspace' ? -1 : 1);
    if (!neighbor) return null;
    if (neighbor.type === 'paragraph') {
        return {
            kind: 'merge',
            earlierId: key === 'Backspace' ? neighbor.id : block.id,
            laterId: key === 'Backspace' ? block.id : neighbor.id,
        };
    }
    return null;
}
