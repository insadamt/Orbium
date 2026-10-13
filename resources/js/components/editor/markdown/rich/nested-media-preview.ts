import type { RichBlock, RichContext } from './rich-model';
import {
    loadAttachmentMetadata,
    richAttachmentUrl,
    isDisplayImage,
} from './attachment-metadata';
import { showMissingReferenceDialog } from '../preview/missing-reference-dialog';
import { checkReferenceAvailability } from '../preview/reference-availability';
import { element } from './widget-controls';
export function mountNestedMedia(
    target: HTMLElement,
    block: RichBlock,
    context: RichContext,
    measure: () => void,
): () => void {
    let destroyed = false;
    const abort = new AbortController();
    const kind = block.kind === 'image' ? 'image' : 'file';
    const missing = () => {
        if (destroyed) return;
        const button = element(
            'button',
            'flex min-h-20 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground hover:bg-accent',
            `Missing ${kind}${block.label ? ` — ${block.label}` : ''}`,
        );
        button.type = 'button';
        button.addEventListener('click', () =>
            showMissingReferenceDialog(
                target.ownerDocument,
                kind,
                block.label ?? '',
            ),
        );
        target.replaceChildren(button);
        if (block.metadata.caption)
            target.append(
                element(
                    'p',
                    'text-sm text-muted-foreground',
                    String(block.metadata.caption),
                ),
            );
        measure();
    };
    if (block.missingReference || !block.attachmentId) missing();
    else {
        const link = element('a', 'cm-md-link', block.label || 'Attachment');
        target.append(link);
        void loadAttachmentMetadata(context, block.attachmentId, abort.signal)
            .then((metadata) => {
                if (destroyed) return;
                link.href = richAttachmentUrl(context, String(metadata.id));
                link.download = metadata.name;
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    void checkReferenceAvailability(
                        link.href,
                        window.location.origin,
                    )
                        .then((available) => {
                            if (destroyed) return;
                            if (!available) {
                                missing();
                                showMissingReferenceDialog(
                                    target.ownerDocument,
                                    kind,
                                    block.label ?? '',
                                );
                                return;
                            }
                            const download =
                                target.ownerDocument.createElement('a');
                            download.href = link.href;
                            download.download = link.download;
                            target.ownerDocument.body.append(download);
                            download.click();
                            download.remove();
                        })
                        .catch((failure: unknown) => {
                            if (!destroyed)
                                showMissingReferenceDialog(
                                    target.ownerDocument,
                                    kind,
                                    '',
                                    {
                                        title: 'Could not open this item',
                                        message:
                                            failure instanceof Error
                                                ? failure.message
                                                : 'Please try again.',
                                    },
                                );
                        });
                });
                if (kind === 'image' && isDisplayImage(metadata.mime_type)) {
                    const image = element(
                        'img',
                        'h-auto max-w-full rounded-xl',
                    );
                    image.alt = block.label ?? '';
                    image.loading = 'lazy';
                    image.src = link.href;
                    image.style.width = block.metadata.width
                        ? `${Number(block.metadata.width)}px`
                        : '';
                    image.addEventListener('load', measure);
                    image.addEventListener('error', missing);
                    target.replaceChildren(image);
                    if (block.metadata.caption)
                        target.append(
                            element(
                                'p',
                                'text-sm text-muted-foreground',
                                String(block.metadata.caption),
                            ),
                        );
                }
                measure();
            })
            .catch(() => {
                if (!destroyed) missing();
            });
    }
    return () => {
        destroyed = true;
        abort.abort();
    };
}
