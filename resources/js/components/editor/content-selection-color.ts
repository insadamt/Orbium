import type { JSONContent } from '@tiptap/core';

export function colorDocumentContent(
    node: JSONContent,
    color: string | null,
): JSONContent {
    if (node.type === 'codeBlock') return node;
    if (node.type === 'text' || node.type === 'inlineIcon') {
        const marks = (node.marks ?? []).filter(
            (mark) => mark.type !== 'textColor',
        );
        if (color) marks.push({ type: 'textColor', attrs: { color } });
        const next = { ...node };
        if (marks.length) next.marks = marks;
        else delete next.marks;
        return next;
    }
    return node.content
        ? {
              ...node,
              content: node.content.map((child) =>
                  colorDocumentContent(child, color),
              ),
          }
        : node;
}

export function documentContentColors(
    node: JSONContent,
): (string | undefined)[] {
    if (node.type === 'codeBlock') return [];
    if (node.type === 'text' || node.type === 'inlineIcon')
        return [
            node.marks?.find((mark) => mark.type === 'textColor')?.attrs?.color,
        ];
    return (node.content ?? []).flatMap(documentContentColors);
}

export function uniformContentColor(
    colors: (string | undefined)[],
): string | undefined {
    return colors.length && colors.every((color) => color === colors[0])
        ? colors[0]
        : undefined;
}
