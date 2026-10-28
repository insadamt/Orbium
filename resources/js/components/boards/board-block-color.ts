import { createRestyledBoardDrawing } from './board-drawing-restyle';
import { resolveColorHex } from '@/components/editor/ui/color-spectrum-values';
import type { BoardObject, BoardInline } from './board-types';
import {
    colorDocumentContent,
    documentContentColors,
} from '@/components/editor/content-selection-color';
import {
    colorMarkdownContent,
    markdownContentColors,
} from '@/components/editor/markdown/interactions/markdown-content-color';
import { boardTableData, readBoardTable } from './board-table-data';
import { serializeRichTable } from '@/components/editor/markdown/rich/rich-table-source';
import {
    mindMapTopicDocument,
    replaceMindMapTopicDocument,
} from '@/components/mindmap/mindmap-topic-document';

const cachedColors = new WeakMap<BoardObject, (string | undefined)[]>();
export function boardObjectColors(object: BoardObject): (string | undefined)[] {
    const cached = cachedColors.get(object);
    if (cached) return cached;
    const colors = readBoardObjectColors(object);
    cachedColors.set(object, colors);
    return colors;
}

function readBoardObjectColors(object: BoardObject): (string | undefined)[] {
    const { data } = object;
    if (data.drawing)
        return [
            data.drawing.color === 'currentColor'
                ? undefined
                : data.drawing.color,
        ];
    if (data.mindmap)
        return data.mindmap.topics.flatMap((topic) =>
            documentContentColors(mindMapTopicDocument(topic)),
        );
    if (data.table_source) {
        const table = readBoardTable(data.table_source)?.table;
        return (
            table?.rows.flatMap((row) =>
                row.flatMap((cell) => markdownContentColors(cell.source)),
            ) ?? []
        );
    }
    const inline =
        data.content ??
        data.items?.flatMap((item) => item.content) ??
        data.rows?.flat(2);
    return inline
        ? documentContentColors({ type: 'doc', content: inline })
        : [];
}

export function colorBoardObject(
    object: BoardObject,
    color: string | null,
): BoardObject {
    if (object.data.drawing)
        return (
            createRestyledBoardDrawing(object, {
                color: color
                    ? resolveColorHex(color).toLowerCase()
                    : 'currentColor',
            }) ?? object
        );
    const colors = boardObjectColors(object);
    if (
        !colors.length ||
        colors.every((existing) => existing === (color ?? undefined))
    )
        return object;
    const { data } = object;
    if (data.mindmap) {
        let map = data.mindmap;
        for (const topic of data.mindmap.topics) {
            const body = mindMapTopicDocument(topic);
            if (documentContentColors(body).length)
                map = replaceMindMapTopicDocument(
                    map,
                    topic.id,
                    colorDocumentContent(body, color),
                );
        }
        return { ...object, data: { ...data, mindmap: map } };
    }
    if (data.table_source) {
        const table = readBoardTable(data.table_source)?.table;
        if (!table) return object;
        const source = serializeRichTable({
            ...table,
            rows: table.rows.map((row) =>
                row.map((cell) => ({
                    ...cell,
                    source: colorMarkdownContent(cell.source, color),
                })),
            ),
        });
        return { ...object, data: boardTableData(data, source) ?? data };
    }
    const colorInline = (content: BoardInline[]) =>
        content.map((node) => colorDocumentContent(node, color) as BoardInline);
    return {
        ...object,
        data: {
            ...data,
            ...(data.content ? { content: colorInline(data.content) } : {}),
            ...(data.items
                ? {
                      items: data.items.map((item) => ({
                          ...item,
                          content: colorInline(item.content),
                      })),
                  }
                : {}),
            ...(data.rows
                ? { rows: data.rows.map((row) => row.map(colorInline)) }
                : {}),
        },
    };
}
