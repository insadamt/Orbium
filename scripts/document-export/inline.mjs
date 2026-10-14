import { ExternalHyperlink, TextRun } from 'docx';

const colors = {
    charcoal: '374151',
    gray: '6B7280',
    red: 'DC2626',
    orange: 'EA580C',
    amber: 'B45309',
    green: '15803D',
    teal: '0F766E',
    blue: '2563EB',
    purple: '7C3AED',
    pink: 'DB2777',
};

export function textContent(node) {
    return node.text || (node.children || []).map(textContent).join('');
}

export function firstTextDirection(text) {
    for (const character of text) {
        if (/\p{Letter}/u.test(character))
            return /[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(character)
                ? 'rtl'
                : 'ltr';
    }
    return 'ltr';
}

export async function inlineContent(node, context, marks = {}) {
    const children = async (nextMarks) => {
        const content = [];
        for (const child of node.children || []) {
            content.push(...(await inlineContent(child, context, nextMarks)));
        }
        return content;
    };
    const run = (text, extra = {}) =>
        new TextRun({
            ...marks,
            text,
            rightToLeft: firstTextDirection(text) === 'rtl',
            ...extra,
        });
    switch (node.kind) {
        case 'strong':
            return children({ ...marks, bold: true });
        case 'emphasis':
            return children({ ...marks, italics: true });
        case 'strike':
            return children({ ...marks, strike: true });
        case 'span': {
            const color = node.color?.startsWith('preset:')
                ? colors[node.color.slice(7)]
                : node.color?.replace('#', '');
            return children({
                ...marks,
                ...(color ? { color } : {}),
                ...(node.underline ? { underline: {} } : {}),
            });
        }
        case 'inlineCode':
            return [
                run(node.text, {
                    font: 'Liberation Mono',
                    size: 19,
                    shading: { fill: 'F1F3F4' },
                }),
            ];
        case 'text':
            return [run(node.text)];
        case 'break':
            return [new TextRun({ break: 1 })];
        case 'math':
            return [
                await context.media.equation(
                    node.text,
                    true,
                    context.width,
                    100,
                ),
            ];
        case 'image':
            if (node.path)
                return [
                    await context.media.image(
                        node.path,
                        textContent(node),
                        context.width,
                        context.height,
                        context.imageWidth,
                    ),
                ];
            return [
                run(`[Image unavailable: ${textContent(node) || 'image'}]`, {
                    italics: true,
                    color: '6B7280',
                }),
            ];
        case 'link': {
            const content = await children(marks);
            if (node.missing)
                return [...content, run(' (unavailable)', { color: '6B7280' })];
            if (!node.url) return content;
            return [
                new ExternalHyperlink({
                    link: node.url,
                    children: await children({
                        ...marks,
                        color: '2563EB',
                        underline: {},
                    }),
                }),
            ];
        }
        default:
            return children(marks);
    }
}
