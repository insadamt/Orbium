import type { EditorDocument } from './editor-api';
import { attachmentUrl } from './editor-api';

type ExportContext = {
    workspaceId: number;
    nodeId: number;
    origin: string;
};

export function serializeDocumentAsMarkdown(
    title: string,
    document: EditorDocument,
    context: ExportContext,
): string {
    const body = renderBlocks(document.content ?? [], context).trim();
    return `# ${escapeText(title)}\n${body ? `\n${body}\n` : ''}`;
}

export function downloadMarkdown(title: string, markdown: string): void {
    const filename = `${
        Array.from(title, (character) =>
            character.charCodeAt(0) < 32 ? '-' : character,
        )
            .join('')
            .trim()
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/\.+$/, '')
            .slice(0, 120) || 'document'
    }.md`;
    const url = URL.createObjectURL(
        new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function renderBlocks(nodes: EditorDocument[], context: ExportContext): string {
    return nodes.map((node) => renderBlock(node, context)).join('\n\n');
}

function renderBlock(node: EditorDocument, context: ExportContext): string {
    const children = node.content ?? [];
    switch (node.type) {
        case 'paragraph':
            return renderInline(children, context);
        case 'heading':
            return `${'#'.repeat(Number(node.attrs?.level) || 1)} ${renderInline(children, context)}`;
        case 'blockquote':
        case 'callout':
            return prefixLines(renderBlocks(children, context), '> ');
        case 'bulletList':
        case 'orderedList':
        case 'taskList':
            return renderList(node, context);
        case 'horizontalRule':
            return '---';
        case 'codeBlock':
            return fencedCode(
                children.map((child) => child.text ?? '').join(''),
                attributeText(node.attrs?.language),
            );
        case 'mermaid':
            return fencedCode(attributeText(node.attrs?.source), 'mermaid');
        case 'blockMath':
            return `$$\n${attributeText(node.attrs?.latex)}\n$$`;
        case 'table':
            return renderTable(node, context);
        case 'image': {
            const label = attributeText(
                node.attrs?.alt || node.attrs?.caption || 'Image',
            );
            return `![${escapeLabel(label)}](${assetUrl(node, context)})`;
        }
        case 'file':
            return `[${escapeLabel(attributeText(node.attrs?.name || 'Download file'))}](${assetUrl(node, context)})`;
        default:
            throw new Error(
                `Markdown export does not support the ${node.type} block.`,
            );
    }
}

function renderList(node: EditorDocument, context: ExportContext): string {
    return (node.content ?? [])
        .map((item, index) => {
            const marker =
                node.type === 'taskList'
                    ? `- [${item.attrs?.checked ? 'x' : ' '}] `
                    : node.type === 'orderedList'
                      ? `${Number(node.attrs?.start ?? 1) + index}. `
                      : '- ';
            const content = renderBlocks(item.content ?? [], context);
            return `${marker}${content.replaceAll('\n', `\n${' '.repeat(marker.length)}`)}`;
        })
        .join('\n');
}

function renderTable(node: EditorDocument, context: ExportContext): string {
    const rows = (node.content ?? []).map((row) =>
        (row.content ?? []).map((cell) =>
            renderBlocks(cell.content ?? [], context).replaceAll('\n', '<br>'),
        ),
    );
    if (rows.length === 0) return '';
    const width = Math.max(...rows.map((row) => row.length));
    const line = (cells: string[]) =>
        `| ${Array.from({ length: width }, (_, index) => cells[index] ?? '').join(' | ')} |`;
    return [
        line(rows[0]),
        line(Array(width).fill('---')),
        ...rows.slice(1).map(line),
    ].join('\n');
}

function renderInline(nodes: EditorDocument[], context: ExportContext): string {
    return nodes
        .map((node) => {
            if (node.type === 'hardBreak') return '  \n';
            if (node.type === 'inlineMath')
                return `$${attributeText(node.attrs?.latex)}$`;
            if (node.type === 'mention') {
                const label = `@${attributeText(node.attrs?.label ?? node.attrs?.id)}`;
                const url = `${context.origin}/workspaces/${context.workspaceId}/nodes/${attributeText(node.attrs?.id)}`;
                return `[${escapeLabel(label)}](${url})`;
            }
            if (node.type !== 'text') {
                throw new Error(
                    `Markdown export does not support the ${node.type} inline element.`,
                );
            }
            let value = escapeText(node.text ?? '');
            for (const mark of node.marks ?? []) {
                switch (mark.type) {
                    case 'bold':
                        value = `**${value}**`;
                        break;
                    case 'italic':
                        value = `*${value}*`;
                        break;
                    case 'strike':
                        value = `~~${value}~~`;
                        break;
                    case 'underline':
                        value = `<u>${value}</u>`;
                        break;
                    case 'code':
                        value = `\`${node.text ?? ''}\``;
                        break;
                    case 'link':
                        value = `[${value}](${attributeText(mark.attrs?.href)})`;
                        break;
                    case 'textColor':
                        break;
                    default:
                        throw new Error(
                            `Markdown export does not support ${mark.type} formatting.`,
                        );
                }
            }
            return value;
        })
        .join('');
}

function assetUrl(node: EditorDocument, context: ExportContext): string {
    return `${context.origin}${attachmentUrl(context.workspaceId, context.nodeId, Number(node.attrs?.attachmentId))}`;
}

function fencedCode(source: string, language: string): string {
    const fence = '`'.repeat(
        Math.max(
            3,
            ...Array.from(source.matchAll(/`+/g), ([run]) => run.length + 1),
        ),
    );
    return `${fence}${language}\n${source}\n${fence}`;
}

function prefixLines(value: string, prefix: string): string {
    return value
        .split('\n')
        .map((line) => `${prefix}${line}`)
        .join('\n');
}

function escapeText(value: string): string {
    return value
        .replace(/[\\`*_{}<>#+.!|~-]/g, '\\$&')
        .replaceAll('[', '\\[')
        .replaceAll(']', '\\]');
}

function escapeLabel(value: string): string {
    return value
        .replaceAll('\\', '\\\\')
        .replaceAll('[', '\\[')
        .replaceAll(']', '\\]');
}

function attributeText(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
}
