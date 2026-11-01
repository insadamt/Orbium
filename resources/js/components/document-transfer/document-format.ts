// Summary: Reads/writes the active V3 native envelope and normalizes external Markdown separately; depends on strict V3 structure and the existing download helpers.
import {
    encodeV3DocumentFile,
    decodeV3DocumentFile,
} from '../editor/markdown/structure/v3-document-file';
import { prepareMarkdownImport } from '../editor/markdown/interactions/markdown-transfer';
export type TransferFormat = 'orbie' | 'md';
export const encodeOrbie = encodeV3DocumentFile;
export function decodeDocumentFile(
    filename: string,
    source: string,
): { title: string; source: string } {
    if (/\.orbie$/i.test(filename)) return decodeV3DocumentFile(source);
    return {
        title: filename.replace(/\.(md|markdown)$/i, ''),
        source: prepareMarkdownImport(source),
    };
}

export function downloadDocument(
    filename: string,
    content: Blob | string,
): void {
    const url = URL.createObjectURL(
        typeof content === 'string'
            ? new Blob([content], { type: 'text/plain;charset=utf-8' })
            : content,
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function documentFilename(title: string, extension: string): string {
    return `${
        Array.from(title, (character) =>
            character.charCodeAt(0) < 32 ? '-' : character,
        )
            .join('')
            .replace(/[\\/:*?"<>|]/g, '-')
            .trim()
            .replace(/\.+$/, '')
            .slice(0, 120) || 'document'
    }.${extension}`;
}
