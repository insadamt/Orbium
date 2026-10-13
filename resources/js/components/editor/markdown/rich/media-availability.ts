import type { RichBlock, RichWidgetMount } from './rich-model';
import { button } from './widget-controls';
import { richAttachmentUrl } from './attachment-metadata';
import { showMissingReferenceDialog } from '../preview/missing-reference-dialog';
import { checkReferenceAvailability } from '../preview/reference-availability';

type MediaElements = {
    imageMode: boolean;
    frame: HTMLElement;
    output: HTMLElement;
    image: HTMLImageElement;
    download: HTMLAnchorElement;
    details: HTMLElement;
    readBlock: () => RichBlock;
};
export function installMediaAvailability(
    mount: RichWidgetMount,
    elements: MediaElements,
) {
    let destroyed = false;
    const kind = elements.imageMode ? 'image' : 'file';
    const showMissing = () =>
        showMissingReferenceDialog(
            mount.root.ownerDocument,
            kind,
            elements.readBlock().label ?? '',
        );
    const missingButton = button('', showMissing);
    missingButton.className =
        'flex min-h-24 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground hover:bg-accent';
    missingButton.hidden = true;
    if (elements.imageMode) elements.frame.append(missingButton);
    else elements.output.append(missingButton);
    function setMissing(missing: boolean) {
        missingButton.hidden = !missing;
        elements.image.hidden = missing;
        elements.download.hidden = missing;
        elements.details.hidden = missing;
        missingButton.textContent = `Missing ${kind}${elements.readBlock().label ? ` — ${elements.readBlock().label}` : ''}`;
        mount.view.requestMeasure();
    }
    const click = (event: MouseEvent) => {
        event.preventDefault();
        if (!missingButton.hidden || !elements.download.href) {
            showMissing();
            return;
        }
        const href = elements.download.href;
        const sourceId = elements.readBlock().attachmentId;
        void checkReferenceAvailability(href, window.location.origin)
            .then((available) => {
                if (destroyed || elements.readBlock().attachmentId !== sourceId)
                    return;
                if (!available) {
                    setMissing(true);
                    showMissing();
                    return;
                }
                const link = mount.root.ownerDocument.createElement('a');
                link.href = href;
                link.download = elements.download.download;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                mount.root.ownerDocument.body.append(link);
                link.click();
                link.remove();
            })
            .catch((failure: unknown) => {
                if (!destroyed)
                    showMissingReferenceDialog(
                        mount.root.ownerDocument,
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
    };
    const imageClick = () => {
        const id = elements.readBlock().attachmentId;
        if (!id || elements.readBlock().missingReference) return;
        void checkReferenceAvailability(
            richAttachmentUrl(mount.context, id),
            window.location.origin,
        )
            .then((available) => {
                if (destroyed || elements.readBlock().attachmentId !== id)
                    return;
                if (!available) {
                    setMissing(true);
                    showMissing();
                }
            })
            .catch((failure: unknown) => {
                if (!destroyed)
                    showMissingReferenceDialog(
                        mount.root.ownerDocument,
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
    };
    elements.image.addEventListener('click', imageClick);
    elements.download.addEventListener('click', click);
    return {
        setMissing,
        destroy() {
            destroyed = true;
            elements.download.removeEventListener('click', click);
            elements.image.removeEventListener('click', imageClick);
        },
    };
}
