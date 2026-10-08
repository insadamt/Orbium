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
