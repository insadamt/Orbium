import type { JSONContent } from '@tiptap/core';
import { Lexer, marked, type Token, type Tokens } from 'marked';

const maximumMarkdownBytes = 400_000;

export async function readMarkdownFile(file: File): Promise<JSONContent> {
    if (!/\.(md|markdown)$/i.test(file.name)) {
        throw new Error('Choose a .md or .markdown file.');
    }
    if (file.size > maximumMarkdownBytes) {
        throw new Error('Markdown files must be smaller than 400 KB.');
    }
    const source = await file.text();
    const content = convertBlocks(
        marked.lexer(source, { gfm: true, breaks: false }),
    );
    if (content.length === 0) {
        throw new Error('The Markdown file has no content to import.');
    }
    const document = { type: 'doc', content };
    if (new TextEncoder().encode(JSON.stringify(document)).length > 1_000_000) {
        throw new Error('The converted document exceeds the 1 MB save limit.');
    }
    return document;
}

function convertBlocks(tokens: Token[]): JSONContent[] {
    return tokens.flatMap((token): JSONContent[] => {
        switch (token.type) {
            case 'heading':
                return [
                    {
                        type: 'heading',
                        attrs: {
                            level: Math.min((token as Tokens.Heading).depth, 3),
                        },
                        content: convertInline(token.tokens ?? []),
                    },
                ];
            case 'paragraph':
            case 'text':
                return [
                    paragraph(
                        convertInline(
                            token.tokens ??
                                Lexer.lexInline((token as Tokens.Text).text),
                        ),
                    ),
                ];
            case 'blockquote':
                return [
                    {
                        type: 'blockquote',
                        content: convertBlocks(token.tokens ?? []),
                    },
                ];
            case 'list':
                return [convertList(token as Tokens.List)];
            case 'table':
                return [convertTable(token as Tokens.Table)];
            case 'code':
                return [convertCodeBlock(token as Tokens.Code)];
            case 'hr':
                return [{ type: 'horizontalRule' }];
            case 'html':
                return [
                    paragraph([
                        { type: 'text', text: (token as Tokens.HTML).text },
                    ]),
                ];
            case 'space':
            case 'def':
                return [];
            default:
                return token.raw.trim()
                    ? [paragraph([{ type: 'text', text: token.raw }])]
                    : [];
        }
    });
}

function convertList(list: Tokens.List): JSONContent {
    const isTaskList =
        list.items.length > 0 && list.items.every((item) => item.task);
    const type = isTaskList
        ? 'taskList'
        : list.ordered
          ? 'orderedList'
          : 'bulletList';
    return {
        type,
        ...(type === 'orderedList' && list.start && list.start !== 1
            ? { attrs: { start: list.start } }
            : {}),
        content: list.items.map((item) => ({
            type: isTaskList ? 'taskItem' : 'listItem',
            ...(isTaskList
                ? { attrs: { checked: Boolean(item.checked) } }
                : {}),
            content: convertListItem(item),
        })),
    };
}

function convertListItem(item: Tokens.ListItem): JSONContent[] {
    const content = convertBlocks(item.tokens);
    return content.length === 0 ? [paragraph()] : content;
}

function convertTable(table: Tokens.Table): JSONContent {
    const row = (cells: Tokens.TableCell[], header: boolean): JSONContent => ({
        type: 'tableRow',
        content: cells.map((cell) => ({
            type: header ? 'tableHeader' : 'tableCell',
            content: [paragraph(convertInline(cell.tokens))],
        })),
    });
    return {
        type: 'table',
        content: [
            row(table.header, true),
            ...table.rows.map((cells) => row(cells, false)),
        ],
    };
}

function convertCodeBlock(token: Tokens.Code): JSONContent {
    const language =
        token.lang?.trim().split(/\s+/)[0]?.toLowerCase() || 'plaintext';
    if (language === 'mermaid') {
        return { type: 'mermaid', attrs: { source: token.text } };
    }
    return {
        type: 'codeBlock',
        attrs: { language },
        content: token.text ? [{ type: 'text', text: token.text }] : [],
    };
}

function paragraph(content: JSONContent[] = []): JSONContent {
    return { type: 'paragraph', content };
}

function convertInline(
    tokens: Token[],
    marks: JSONContent['marks'] = [],
): JSONContent[] {
    return tokens.flatMap((token): JSONContent[] => {
        switch (token.type) {
            case 'strong':
                return convertInline(token.tokens ?? [], [
                    ...marks,
                    { type: 'bold' },
                ]);
            case 'em':
                return convertInline(token.tokens ?? [], [
                    ...marks,
                    { type: 'italic' },
                ]);
            case 'del':
                return convertInline(token.tokens ?? [], [
                    ...marks,
                    { type: 'strike' },
                ]);
            case 'codespan':
                return textNode(token.text, [...marks, { type: 'code' }]);
            case 'link': {
                const href = safeLink(token.href);
                return convertInline(
                    token.tokens ?? [],
                    href
                        ? [...marks, { type: 'link', attrs: { href } }]
                        : marks,
                );
            }
            case 'image':
                return textNode(token.text || token.href, marks);
            case 'br':
                return [{ type: 'hardBreak' }];
            case 'text':
                return token.tokens
                    ? convertInline(token.tokens, marks)
                    : textNode(token.text, marks);
            case 'escape':
            case 'html':
                return textNode(token.text, marks);
            default:
                return textNode(token.raw, marks);
        }
    });
}

function textNode(value: string, marks: JSONContent['marks']): JSONContent[] {
    return value
        ? [{ type: 'text', text: value, ...(marks?.length ? { marks } : {}) }]
        : [];
}

function safeLink(href: string): string | null {
    try {
        const url = new URL(href, window.location.origin);
        return ['http:', 'https:', 'mailto:'].includes(url.protocol)
            ? href
            : null;
    } catch {
        return null;
    }
}
