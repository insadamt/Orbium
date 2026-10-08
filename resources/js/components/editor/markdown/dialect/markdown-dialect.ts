import type {
    BlockContext,
    Element,
    Line,
    MarkdownConfig,
} from '@lezer/markdown';
import { jsonObjectEnd } from './metadata';

let nestedParseDepth = 0;

function parseLiteralBlock(
    cx: BlockContext,
    line: Line,
    directive: boolean,
): boolean {
    if (cx.depth !== 1 || line.indent - line.baseIndent >= 4) return false;
    const opening = line.text.slice(line.pos);
    const header = directive ? /^(:{3,})orbium (\{.*)$/.exec(opening) : null;
    if (directive ? !header : opening.trimEnd() !== '$$') return false;
    const start = cx.lineStart + line.pos;
    const openingEnd = cx.lineStart + line.text.length;
    const children: Element[] = [cx.elt('OrbiumHeader', start, openingEnd)];
    const bodyLines: string[] = [];
    let bodyStart = openingEnd + 1;
    let end = openingEnd;
    let closed = false;
    let codeFence: { marker: string; length: number } | null = null;
    while (cx.nextLine()) {
        const text = line.text;
        const plain = text.trim();
        const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(text);
        if (!codeFence && (directive ? plain === header![1] : plain === '$$')) {
            const closeStart = cx.lineStart;
            end = closeStart + text.length;
            if (bodyLines.length) {
                const body = bodyLines.join('\n');
                if (directive && nestedParseDepth < 32) {
                    nestedParseDepth++;
                    try {
                        children.push(cx.elt(cx.parser.parse(body), bodyStart));
                    } finally {
                        nestedParseDepth--;
                    }
                } else
                    children.push(
                        cx.elt('OrbiumLiteral', bodyStart, closeStart - 1),
                    );
            }
            children.push(cx.elt('OrbiumClose', closeStart, end));
            cx.nextLine();
            closed = true;
            break;
        }
        if (directive && fence) {
            if (!codeFence)
                codeFence = { marker: fence[1][0], length: fence[1].length };
            else if (
                fence[1][0] === codeFence.marker &&
                fence[1].length >= codeFence.length &&
                !fence[2].trim()
            )
                codeFence = null;
        }
        if (!bodyLines.length) bodyStart = cx.lineStart;
        bodyLines.push(text);
        end = cx.lineStart + text.length;
    }
    cx.addElement(
        cx.elt(
            closed
                ? directive
                    ? 'OrbiumDirective'
                    : 'OrbiumMathBlock'
                : 'OrbiumUnclosed',
            start,
            end,
            children,
        ),
    );
    return true;
}

function balancedSpanEnd(text: string, start: number): number | null {
    let depth = 1;
    let codeLength = 0;
    for (let position = start; position < text.length; position++) {
        if (text[position] === '\\') {
            position++;
            continue;
        }
        if (text[position] === '\n' && text[position + 1] === '\n') return null;
        if (text[position] === '`') {
            let end = position;
            while (text[end] === '`') end++;
            const length = end - position;
            if (!codeLength) codeLength = length;
            else if (length === codeLength) codeLength = 0;
            position = end - 1;
        } else if (!codeLength && text[position] === '[') {
            if (++depth > 32) return null;
        } else if (!codeLength && text[position] === ']' && --depth === 0)
            return position;
    }
    return null;
}

export const orbiumMarkdownDialect: MarkdownConfig = {
    defineNodes: [
        { name: 'OrbiumDirective', block: true },
        { name: 'OrbiumMathBlock', block: true },
        { name: 'OrbiumUnclosed', block: true },
        'OrbiumHeader',
        'OrbiumClose',
        'OrbiumLiteral',
        'OrbiumMath',
        'OrbiumInlineMath',
        'OrbiumSpan',
        'OrbiumSpanMark',
        'OrbiumMetadata',
    ],
    parseBlock: [
        {
            name: 'OrbiumDirective',
            before: 'FencedCode',
            parse: (cx, line) => parseLiteralBlock(cx, line, true),
        },
        {
            name: 'OrbiumMathBlock',
            before: 'FencedCode',
            parse: (cx, line) => parseLiteralBlock(cx, line, false),
        },
    ],
    parseInline: [
        {
            name: 'OrbiumInline',
            before: 'Link',
            parse(cx, next, position) {
                if (next !== 58) return -1;
                const rest = cx.slice(position, cx.end);
                if (rest.startsWith(':orbium-math{')) {
                    const end = jsonObjectEnd(rest, 12);
                    if (!end) return -1;
                    cx.addElement(
                        cx.elt('OrbiumInlineMath', position, position + end),
                    );
                    return position + end;
                }
                if (!rest.startsWith(':orbium[') || nestedParseDepth >= 32)
                    return -1;
                const closing = balancedSpanEnd(rest, 8);
                if (closing === null || closing === 8) return -1;
                const end = jsonObjectEnd(rest, closing + 1);
                if (!end) return -1;
                nestedParseDepth++;
                let content: Element[];
                try {
                    content = cx.parser.parseInline(
                        rest.slice(8, closing),
                        position + 8,
                    );
                } finally {
                    nestedParseDepth--;
                }
                cx.addElement(
                    cx.elt('OrbiumSpan', position, position + end, [
                        cx.elt('OrbiumSpanMark', position, position + 8),
                        ...content,
                        cx.elt(
                            'OrbiumSpanMark',
                            position + closing,
                            position + closing + 1,
                        ),
                        cx.elt(
                            'OrbiumMetadata',
                            position + closing + 1,
                            position + end,
                        ),
                    ]),
                );
                return position + end;
            },
        },
        {
            name: 'OrbiumMath',
            before: 'Link',
            parse(cx, next, position) {
                if (
                    next !== 36 ||
                    cx.char(position + 1) === 36 ||
                    /\s/.test(cx.slice(position + 1, position + 2))
                )
                    return -1;
                for (let end = position + 1; end < cx.end; end++) {
                    if (cx.char(end) === 10) return -1;
                    if (cx.char(end) === 92) {
                        end++;
                        continue;
                    }
                    if (cx.char(end) === 36) {
                        if (
                            end === position + 1 ||
                            /\s/.test(cx.slice(end - 1, end))
                        )
                            return -1;
                        cx.addElement(cx.elt('OrbiumMath', position, end + 1));
                        return end + 1;
                    }
                }
                return -1;
            },
        },
    ],
};
