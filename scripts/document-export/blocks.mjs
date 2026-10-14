import {
    AlignmentType,
    BorderStyle,
    LevelFormat,
    Paragraph,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    WidthType,
} from 'docx';
import { firstTextDirection, inlineContent, textContent } from './inline.mjs';

const headingNames = [
    'Heading1',
    'Heading2',
    'Heading3',
    'Heading4',
    'Heading5',
    'Heading6',
];

function paragraphSettings(node, context) {
    const direction =
        context.direction === 'auto' || !context.direction
            ? firstTextDirection(textContent(node))
            : context.direction;
    return {
        bidirectional: direction === 'rtl',
        alignment:
            node.align ||
            context.align ||
            (direction === 'rtl' ? AlignmentType.RIGHT : AlignmentType.LEFT),
        ...(context.quote
            ? { indent: { left: 300, right: 300 }, shading: { fill: 'F1F3F4' } }
            : {}),
        ...(context.numbering ? { numbering: context.numbering } : {}),
        widowControl: true,
        ...(context.tableCell ? { spacing: { after: 60, line: 240 } } : {}),
    };
}

async function paragraphsFromChildren(node, context) {
    const result = [];
    for (const child of node.children || [])
        result.push(...(await documentBlocks(child, context)));
    return result;
}

async function listBlocks(node, context) {
    const reference = `list-${context.numberingDefinitions.length}`;
    const formats = {
        a: LevelFormat.LOWER_LETTER,
        A: LevelFormat.UPPER_LETTER,
        i: LevelFormat.LOWER_ROMAN,
        I: LevelFormat.UPPER_ROMAN,
    };
    const level = Math.min(context.listDepth || 0, 8);
    context.numberingDefinitions.push({
        reference,
        levels: Array.from({ length: 9 }, (_, index) => ({
            level: index,
            format: node.ordered
                ? formats[context.listType] || LevelFormat.DECIMAL
                : LevelFormat.BULLET,
            text: node.ordered ? `%${index + 1}.` : '•',
            start: node.start || 1,
            alignment: AlignmentType.START,
            style: {
                paragraph: {
                    indent: { left: (index + 1) * 360, hanging: 240 },
                },
            },
        })),
    });
    const result = [];
    for (const item of node.children || []) {
        let first = true;
        for (const child of item.children || []) {
            result.push(
                ...(await documentBlocks(child, {
                    ...context,
                    listDepth: level + 1,
                    numbering:
                        first && child.kind === 'paragraph'
                            ? { reference, level }
                            : undefined,
                })),
            );
            first = false;
        }
    }
    return result;
}

function tableRows(node) {
    return (node.children || []).flatMap((child) =>
        child.kind === 'row' || child.blockKind === 'row'
            ? [child]
            : tableRows(child),
    );
}

async function tableBlock(node, context) {
    const rows = tableRows(node);
    const occupied = [];
    let columnCount = 1;
    const positionedRows = rows.map((row, rowIndex) => {
        occupied[rowIndex] ||= [];
        let column = 0;
        return (row.children || []).map((cell) => {
            while (occupied[rowIndex][column]) column++;
            const span = cell.colspan || 1;
            const rowSpan = cell.rowspan || 1;
            for (let y = 0; y < rowSpan; y++) {
                occupied[rowIndex + y] ||= [];
                for (let x = 0; x < span; x++)
                    occupied[rowIndex + y][column + x] = true;
            }
            column += span;
            columnCount = Math.max(columnCount, column);
            return { cell };
        });
    });
    const rendered = [];
    for (const cells of positionedRows) {
        const output = [];
        for (const { cell } of cells) {
            const span = cell.colspan || 1;
            const width = Math.max(
                20,
                (context.width / columnCount) * span - 16,
            );
            const cellContext = {
                ...context,
                width,
                align: cell.align || context.align,
                numbering: undefined,
                tableCell: true,
                header: Boolean(cell.header),
            };
            const content =
                cell.blockKind === 'cell'
                    ? await paragraphsFromChildren(cell, cellContext)
                    : [
                          new Paragraph({
                              ...paragraphSettings(cell, cellContext),
                              children: await inlineContent(cell, cellContext, {
                                  bold: Boolean(cell.header),
                              }),
                          }),
                      ];
            if (!content.length || content.at(-1) instanceof Table)
                content.push(new Paragraph(''));
            output.push(
                new TableCell({
                    children: content,
                    columnSpan: span,
                    rowSpan: cell.rowspan || 1,
                    width: { size: width * 15 + 240, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    ...(cell.header ? { shading: { fill: 'E8EAED' } } : {}),
                }),
            );
        }
        rendered.push(
            new TableRow({
                children: output,
                tableHeader:
                    cells.length > 0 && cells.every(({ cell }) => cell.header),
                cantSplit: true,
            }),
        );
    }
    if (!rendered.length) return [];
    const border = { style: BorderStyle.SINGLE, size: 4, color: 'DADCE0' };
    return [
        new Table({
            rows: rendered,
            columnWidths: Array(columnCount).fill(
                (context.width * 15) / columnCount,
            ),
            width: { size: context.width * 15, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            borders: {
                top: border,
                bottom: border,
                left: border,
                right: border,
                insideHorizontal: border,
                insideVertical: border,
            },
        }),
        new Paragraph({ spacing: { after: 100 }, children: [] }),
    ];
}

export async function documentBlocks(node, context) {
    switch (node.kind) {
        case 'orbium': {
            const nextContext = {
                ...context,
                direction: node.dir || context.direction,
                align: node.align || node.alignment || context.align,
                imageWidth: node.width || context.imageWidth,
                listType: node.listType || context.listType,
            };
            if (node.blockKind === 'table')
                return tableBlock(node, nextContext);
            if (node.blockKind === 'math')
                return documentBlocks(
                    { kind: 'math', text: node.latex },
                    nextContext,
                );
            if (node.blockKind === 'empty') return [new Paragraph('')];
            const output = await paragraphsFromChildren(node, nextContext);
            if (node.blockKind === 'image' && node.caption)
                output.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: node.caption,
                                italics: true,
                                color: '6B7280',
                                size: 20,
                            }),
                        ],
                    }),
                );
            return output;
        }
        case 'paragraph':
        case 'heading':
            return [
                new Paragraph({
                    ...paragraphSettings(node, context),
                    ...(node.kind === 'heading'
                        ? {
                              heading: headingNames[node.level - 1],
                              keepNext: true,
                              keepLines: true,
                          }
                        : {}),
                    children: await inlineContent(
                        node,
                        context,
                        context.header ? { bold: true } : {},
                    ),
                }),
            ];
        case 'codeBlock':
            return node.text.split('\n').map(
                (line) =>
                    new Paragraph({
                        bidirectional: false,
                        spacing: { after: 0, before: 0, line: 240 },
                        shading: { fill: 'F1F3F4' },
                        children: [
                            new TextRun({
                                text: line || ' ',
                                font: 'Liberation Mono',
                                size: 18,
                            }),
                        ],
                    }),
            );
        case 'diagram':
            return [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        await context.media.image(
                            context.media.diagrams[node.hash],
                            'Mermaid diagram',
                            context.width,
                            context.height,
                        ),
                    ],
                }),
            ];
        case 'math':
            return [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        await context.media.equation(
                            node.text,
                            false,
                            context.width,
                            context.height,
                        ),
                    ],
                }),
            ];
        case 'divider':
            return [
                new Paragraph({
                    children: [],
                    border: {
                        bottom: {
                            style: BorderStyle.SINGLE,
                            size: 4,
                            color: 'DADCE0',
                        },
                    },
                }),
            ];
        case 'quote':
            return paragraphsFromChildren(node, { ...context, quote: true });
        case 'list':
            return listBlocks(node, context);
        case 'table':
            return tableBlock(node, context);
        default:
            return paragraphsFromChildren(node, context);
    }
}
