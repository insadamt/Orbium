import {
    claimTransferredMediaPlayer,
    registerTransferableMediaPlayer,
} from './transferred-media-players';
import type { AttachmentMetadata } from './rich-model';
import { createAttachmentPlayer } from '@/components/media/attachment-player';
import type { RichBlock, RichContext } from './rich-model';
import {
    loadAttachmentMetadata,
    richAttachmentUrl,
    richMediaSourceUrl,
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
    let unregisterPlayer: (() => void) | undefined;
    let player: ReturnType<typeof createAttachmentPlayer> = null;
    const abort = new AbortController();
    const kind = block.kind === 'image' ? 'image' : 'file';
    const missing = () => {
        if (destroyed) return;
        unregisterPlayer?.();
        unregisterPlayer = undefined;
        player?.destroy();
        player = null;
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
        const installPlayer = (metadata: AttachmentMetadata) => {
            if (destroyed) return;
            link.href = richAttachmentUrl(context, String(metadata.id));
            const url = link.href;
            link.href = `${url}?download=1`;
            link.download = metadata.name;
            if (kind === 'file') {
                const playerOptions = {
                    url: richMediaSourceUrl(context, String(metadata.id)),
                    name: metadata.name,
                    mime: metadata.mime_type,
                    sizeBytes: metadata.size_bytes,
                    onResize: measure,
                    isVisible: context.isVisible,
                };
                player =
                    claimTransferredMediaPlayer(
                        context,
                        String(metadata.id),
                        target,
                    ) ?? createAttachmentPlayer(playerOptions);
                if (player) {
                    if (context.ownerKind === 'board')
                        player.root.dataset.boardInteractive = '';
                    target.prepend(player.root);
                    player.relocate(playerOptions);
                    unregisterPlayer = registerTransferableMediaPlayer(
                        player.root,
                        {
                            attachmentId: String(metadata.id),
                            take: () => {
                                const retained = player;
                                retained?.prepareRelocation();
                                player = null;
                                unregisterPlayer?.();
                                unregisterPlayer = undefined;
                                return retained;
                            },
                        },
                    );
                    link.hidden = true;
                }
            }
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
                const image = element('img', 'h-auto max-w-full rounded-xl');
                image.alt = block.label ?? '';
                image.loading = 'lazy';
                image.src = richMediaSourceUrl(context, String(metadata.id));
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
        };
        const cachedMetadata = context.metadata.get(block.attachmentId);
        if (cachedMetadata) installPlayer(cachedMetadata);
        else
            void loadAttachmentMetadata(
                context,
                block.attachmentId,
                abort.signal,
            )
                .then(installPlayer)
                .catch(() => {
                    if (!destroyed) missing();
                });
    }
    return () => {
        destroyed = true;
        abort.abort();
        unregisterPlayer?.();
        unregisterPlayer = undefined;
        player?.destroy();
    };
}
