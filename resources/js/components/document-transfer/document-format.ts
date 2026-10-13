export type TransferFormat = 'orbie' | 'md';
export function encodeOrbie(title: string, source: string): string {
    return `<!-- orbium-document ${JSON.stringify({ version: 2, title })} -->\n${source}`;
}
export function decodeDocumentFile(
    filename: string,
    source: string,
): { title: string; source: string } {
    source = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const title = filename.replace(/\.(orbie|md|markdown)$/i, '');
    if (!/\.orbie$/i.test(filename)) return { title, source };
    const header = /^<!-- orbium-document (.+) -->\n/.exec(source);
    if (!header)
        throw new Error('This Orbium document has no valid format header.');
    const metadata = JSON.parse(header[1]) as {
        version?: unknown;
        title?: unknown;
    };
    if (metadata.version !== 1 && metadata.version !== 2)
        throw new Error(
            'This Orbium document version is unsupported. Update Orbium first.',
        );
    if (
        typeof metadata.title !== 'string' ||
        !metadata.title.trim() ||
        metadata.title.length > 255
    )
        throw new Error('The document title is invalid.');
    return { title: metadata.title, source: source.slice(header[0].length) };
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
