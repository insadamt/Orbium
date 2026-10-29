// Summary: Creates and validates native block content and readable labels; depends on the shared inline, shape, drawing and Mind Map schemas.

import { defaultBoardShape, validBoardShapeData } from './board-shape-data';
import {
    createMindMap,
    validMindMap,
    mindMapText,
} from '@/components/mindmap/mindmap-data';
import { validBoardDrawing } from './board-drawing-data';
import { readBoardTable } from './board-table-data';
import { validBoardInline } from './board-inline-data';
export { safeBoardLink, validBoardInline } from './board-inline-data';
import {
    boardBlockKinds,
    type BoardBlockData,
    type BoardBlockKind,
    type BoardInline,
    type BoardShapeKind,
    type BoardObject,
} from './board-types';
export const boardBlockLabels: Record<
    BoardBlockKind | BoardShapeKind | 'pdf' | 'video' | 'audio',
    string
> = {
    text: 'Text',
    heading: 'Heading',
    list: 'List',
    quote: 'Quote',
    callout: 'Callout',
    code: 'Code',
    table: 'Table',
    image: 'Image',
    file: 'File',
    pdf: 'PDF',
    video: 'Video',
    audio: 'Audio',
    math: 'Math',
    mermaid: 'Diagram',
    divider: 'Divider',
    resource: 'Resource',
    drawing: 'Drawing',
    mindmap: 'Mind Map',
    shape: 'Shape',
    rectangle: 'Rectangle',
    rounded_rectangle: 'Rounded rectangle',
    ellipse: 'Ellipse',
    diamond: 'Diamond',
    triangle: 'Triangle',
    hexagon: 'Hexagon',
};
export function plainInline(text: string): BoardInline[] {
    return text
        .split('\n')
        .flatMap((line, index) => [
            ...(index ? [{ type: 'hardBreak' as const }] : []),
            ...(line ? [{ type: 'text' as const, text: line }] : []),
        ]);
}
export function inlineText(content: BoardInline[] = []) {
    return content
        .map((node) =>
            node.type === 'hardBreak'
                ? '\n'
                : node.type === 'inlineIcon'
                  ? (node.attrs?.label ?? '')
                  : (node.text ?? ''),
        )
        .join('');
}
export function boardBlockText(object: BoardObject) {
    if (object.block_type === 'mindmap' && object.data.mindmap)
        return mindMapText(object.data.mindmap);
    if (object.block_type === 'drawing') return 'Freehand stroke';
    return (
        object.data.source ??
        object.data.caption ??
        (object.data.items
            ? object.data.items
                  .map((item) => inlineText(item.content))
                  .join('\n')
            : object.data.rows
              ? object.data.rows
                    .map((row) => row.map(inlineText).join('\t'))
                    .join('\n')
              : inlineText(object.data.content))
    );
}
export function boardDataBytes(data: BoardBlockData) {
    return new TextEncoder().encode(JSON.stringify(data)).length;
}
export function createBoardBlockData(
    kind: BoardBlockKind,
    text = '',
): BoardBlockData {
    if (kind === 'shape')
        return {
            shape: defaultBoardShape('rectangle'),
            content: plainInline(text),
            align: 'center',
        };
    if (kind === 'mindmap') return { mindmap: createMindMap() };
    if (['text', 'heading', 'quote', 'callout'].includes(kind))
        return {
            content: plainInline(text),
            ...(kind === 'heading' ? { level: 1 } : {}),
        };
    if (kind === 'list')
        return {
            list_style: 'bullet',
            items: [{ content: plainInline(text), checked: false, indent: 0 }],
        };
    if (kind === 'table')
        return {
            rows: [
                [[], []],
                [[], []],
            ],
        };
    if (kind === 'image' || kind === 'file')
        return { attachment_id: null, name: '', caption: '' };
    if (kind === 'code') return { source: text, language: 'plaintext' };
    if (kind === 'math') return { source: text || 'x^2 + y^2 = z^2' };
    if (kind === 'mermaid') return { source: text || 'graph TD\n  A --> B' };
    return {};
}
export function validBoardBlockData(
    kind: BoardBlockKind,
    data: BoardBlockData,
) {
    if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        !boardBlockKinds.includes(kind)
    )
        return false;
    if (
        data.text_scale !== undefined &&
        (!Number.isFinite(data.text_scale) ||
            data.text_scale < 0.25 ||
            data.text_scale > 8)
    )
        return false;
    if (
        data.manual_height !== undefined &&
        typeof data.manual_height !== 'boolean'
    )
        return false;
    if (
        data.image_fit !== undefined &&
        !['contain', 'cover'].includes(data.image_fit)
    )
        return false;
    if (
        data.image_position !== undefined &&
        (!data.image_position ||
            typeof data.image_position !== 'object' ||
            Array.isArray(data.image_position) ||
            !['x', 'y'].every((axis) => {
                const value = data.image_position![axis as 'x'];
                return Number.isFinite(value) && value >= 0 && value <= 100;
            }))
    )
        return false;
    if (
        data.media_kind !== undefined &&
        (kind !== 'file' ||
            !['pdf', 'video', 'audio'].includes(data.media_kind))
    )
        return false;
    if (data.align && !['left', 'center', 'right'].includes(data.align))
        return false;
    if (data.dir && !['auto', 'ltr', 'rtl'].includes(data.dir)) return false;
    if (
        data.legacy_source !== undefined &&
        typeof data.legacy_source !== 'string'
    )
        return false;
    if (kind === 'shape') return validBoardShapeData(data);
    if (kind === 'mindmap')
        return (
            Object.keys(data).every((key) => key === 'mindmap') &&
            validMindMap(data.mindmap)
        );
    if (kind === 'drawing')
        return (
            Object.keys(data).every((key) =>
                ['drawing', 'text_scale'].includes(key),
            ) && validBoardDrawing(data.drawing)
        );
    if (kind === 'resource')
        return (
            Number.isSafeInteger(data.target_node_id) &&
            data.target_node_id! > 0 &&
            Object.keys(data).every((key) =>
                ['target_node_id', 'text_scale'].includes(key),
            )
        );
    if (['text', 'heading', 'quote', 'callout'].includes(kind))
        return (
            validBoardInline(data.content) &&
            (kind !== 'heading' || [1, 2, 3].includes(data.level ?? 0))
        );
    if (kind === 'list')
        return (
            ['bullet', 'ordered', 'check'].includes(data.list_style ?? '') &&
            Array.isArray(data.items) &&
            data.items.length > 0 &&
            data.items.length <= 1000 &&
            data.items.every(
                (item) =>
                    validBoardInline(item.content) &&
                    typeof item.checked === 'boolean' &&
                    Number.isInteger(item.indent) &&
                    item.indent >= 0 &&
                    item.indent <= 12,
            )
        );
    if (kind === 'table')
        return (
            (data.table_source === undefined ||
                (typeof data.table_source === 'string' &&
                    Boolean(readBoardTable(data.table_source)))) &&
            Array.isArray(data.rows) &&
            data.rows.length > 0 &&
            data.rows.length <= 100 &&
            data.rows.every(
                (row) =>
                    Array.isArray(row) &&
                    row.length > 0 &&
                    row.length <= 30 &&
                    row.length === data.rows![0].length &&
                    row.every(validBoardInline),
            )
        );
    if (['code', 'math', 'mermaid'].includes(kind))
        return (
            typeof data.source === 'string' &&
            (kind !== 'mermaid' ||
                new TextEncoder().encode(data.source).length <= 50000) &&
            (kind !== 'code' || typeof data.language === 'string')
        );
    if (kind === 'image' || kind === 'file')
        return (
            (data.attachment_id === null ||
                (Number.isSafeInteger(data.attachment_id) &&
                    data.attachment_id! > 0)) &&
            typeof data.name === 'string' &&
            typeof data.caption === 'string'
        );
    return kind === 'divider';
}

export function containsBoardNul(value: unknown): boolean {
    if (typeof value === 'string') return value.includes('\0');
    if (!value || typeof value !== 'object') return false;
    return Object.values(value).some(containsBoardNul);
}
