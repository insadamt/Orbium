let nextDialogId = 0;
export type MissingReferenceKind = 'page' | 'image' | 'file';
export function missingReferenceKind(url: string): MissingReferenceKind | null {
    const match = /^#orbium-missing-(page|image|file)-[1-9]\d*$/.exec(url);
    return match ? (match[1] as MissingReferenceKind) : null;
}
export function showMissingReferenceDialog(
    owner: Document,
    kind: MissingReferenceKind,
    label: string,
    options: { message?: string; title?: string } = {},
): void {
    if (owner.querySelector('dialog[data-missing-reference]')) return;
    const dialog = owner.createElement('dialog');
    dialog.dataset.missingReference = kind;
    dialog.className =
        'glass-surface fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 text-foreground shadow-xl backdrop:bg-black/40';
    const title = owner.createElement('h2');
    title.id = `orbium-missing-reference-${++nextDialogId}`;
    title.className = 'mb-3 text-lg font-medium';
    title.textContent = options.title ?? `This ${kind} is missing`;
    const detail = owner.createElement('p');
    detail.className = 'text-sm text-muted-foreground';
    detail.textContent =
        options.message ??
        `${label ? `“${label}” ` : 'This item '}was not included in the export, was deleted, or is no longer available to you.`;
    const close = owner.createElement('button');
    close.type = 'button';
    close.className =
        'mt-5 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground';
    close.textContent = 'Close';
    close.addEventListener('click', () => dialog.close());
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.append(title, detail, close);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    owner.body.append(dialog);
    dialog.showModal();
    close.focus();
}
