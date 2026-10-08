import { widgetIcon } from './widget-icons';
import { EditorView } from '@codemirror/view';
import { escapeMarkdownLabel } from '../markdown-syntax';
import { serializeOrbiumBlock, type OrbiumMetadata } from '../dialect/metadata';
import type { RichBlock, RichController, RichWidgetMount } from './rich-model';
import {
    applyRichSource,
    button,
    element,
    preservePresentation,
    sourceControls,
} from './widget-controls';
import {
    isDisplayImage,
    loadAttachmentMetadata,
    richAttachmentUrl,
} from './attachment-metadata';

export function mountMedia(mount: RichWidgetMount): RichController {
    let block = mount.block;
    let destroyed = false;
    let loadingId = '';
    let request: AbortController | undefined;
    const imageMode = block.kind === 'image';
    const controls = sourceControls(mount, imageMode ? 'Image' : 'File');
    const figure = element('figure', 'm-0');
    const image = element('img', 'h-auto max-w-full rounded-xl');
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('load', () => {
        if (!destroyed) mount.view.requestMeasure();
    });
    image.addEventListener('error', () => {
        if (destroyed) return;
        controls.error.textContent = 'Image unavailable.';
        controls.error.hidden = false;
    });
    const frame = element('div', 'group relative max-w-full');
    let resize: {
        pointer: number;
        x: number;
        width: number;
        direction: number;
        maximum: number;
    } | null = null;
    const caption = element('figcaption', 'mt-2 text-sm text-muted-foreground');
    const download = element(
        'a',
        'inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm',
    );
    download.textContent = block.label ?? 'Download file';
    download.download = '';
    download.target = '_blank';
    download.rel = 'noopener noreferrer';
    const details = element(
        'span',
        'ml-3 text-xs text-muted-foreground',
        'Loading attachment…',
    );
    if (imageMode) {
        frame.append(image);
        figure.append(frame, caption);
        controls.output.append(figure);
    } else controls.output.append(widgetIcon('file', 18), download, details);
    if (imageMode) controls.toolbar.append(download);
    const replace = button('Replace', () =>
        mount.context.onUpload({
            view: mount.view,
            from: block.from,
            to: block.to,
            kind: imageMode ? 'image' : 'file',
            imageMetadata: block.metadata,
            presentation: block.presentation,
            wrappers: block.wrappers,
        }),
    );
    const remove = button('Remove', () =>
        applyRichSource(mount.view, block, ''),
    );
    controls.toolbar.append(replace, remove);
    const options = element(
        'div',
        'mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
    );
    const alignment = element('select', 'rounded-md bg-muted px-2 py-1');
    alignment.setAttribute('aria-label', 'Image alignment');
    for (const value of ['start', 'left', 'center', 'right']) {
        const option = element('option', '', value);
        option.value = value;
        alignment.append(option);
    }
    const width = element('input', 'w-24 rounded-md bg-muted px-2 py-1');
    width.type = 'number';
    width.min = '1';
    width.max = '2147483647';
    width.placeholder = 'Auto width';
    width.setAttribute('aria-label', 'Image width in pixels');
    const captionInput = element(
        'input',
        'min-w-40 flex-1 rounded-md bg-muted px-2 py-1',
    );
    captionInput.placeholder = 'Add a caption…';
    captionInput.setAttribute('aria-label', 'Image caption');
    if (imageMode) {
        options.append(alignment, width, captionInput);
        controls.output.append(options);
    }
    function writeImageMetadata() {
        const metadata: OrbiumMetadata = {
            ...block.metadata,
            kind: 'image',
            alignment: alignment.value as OrbiumMetadata['alignment'],
            caption: captionInput.value,
        };
        if (
            width.value &&
            (!Number.isInteger(width.valueAsNumber) ||
                width.valueAsNumber <= 0 ||
                width.valueAsNumber > 2147483647)
        )
            return;
        if (width.value) metadata.width = width.valueAsNumber;
        else delete metadata.width;
        const body = `![${block.labelSource ?? escapeMarkdownLabel(block.label ?? '')}](orbium:attachment/${block.attachmentId})`;
        const source = preservePresentation(
            block,
            serializeOrbiumBlock(metadata, body),
            serializeOrbiumBlock,
        );
        if (applyRichSource(mount.view, block, source))
            block = {
                ...block,
                source,
                to: block.from + source.length,
                metadata,
            };
    }
    alignment.addEventListener('change', writeImageMetadata);
    width.addEventListener('change', writeImageMetadata);
    captionInput.addEventListener('input', writeImageMetadata);
    for (const input of [width, captionInput])
        input.addEventListener('keydown', (event) => {
            if (!(event.ctrlKey || event.metaKey)) event.stopPropagation();
        });
    for (const direction of [-1, 1]) {
        const handle = button('', () => {});
        handle.setAttribute(
            'aria-label',
            `Resize image from ${direction < 0 ? 'left' : 'right'}`,
        );
        handle.className =
            'absolute top-1/2 h-10 w-2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border border-border bg-background opacity-0 focus:opacity-100 group-hover:opacity-100';
        handle.style[direction < 0 ? 'left' : 'right'] = '-4px';
        handle.addEventListener('pointerdown', (event) => {
            if (
                !mount.view.state.facet(EditorView.editable) ||
                event.button !== 0
            )
                return;
            event.preventDefault();
            resize = {
                pointer: event.pointerId,
                x: event.clientX,
                width: frame.getBoundingClientRect().width,
                direction,
                maximum: figure.clientWidth,
            };
            handle.setPointerCapture(event.pointerId);
        });
        handle.addEventListener('pointermove', (event) => {
            if (
                !resize ||
                resize.pointer !== event.pointerId ||
                !mount.view.state.facet(EditorView.editable)
            )
                return;
            const value = Math.round(
                Math.min(
                    resize.maximum,
                    Math.max(
                        Math.min(120, resize.maximum),
                        resize.width +
                            (event.clientX - resize.x) * resize.direction,
                    ),
                ),
            );
            frame.style.width = `${value}px`;
            width.value = String(value);
            mount.view.requestMeasure();
        });
        handle.addEventListener('pointerup', (event) => {
            if (!resize || resize.pointer !== event.pointerId) return;
            resize = null;
            if (handle.hasPointerCapture(event.pointerId))
                handle.releasePointerCapture(event.pointerId);
            writeImageMetadata();
        });
        handle.addEventListener('lostpointercapture', () => {
            if (resize)
                width.value = block.metadata.width
                    ? String(block.metadata.width)
                    : '';
            resize = null;
            frame.style.width = `${Math.max(120, Number(block.metadata.width ?? 720))}px`;
        });
        handle.addEventListener('keydown', (event) => {
            if (
                !['ArrowLeft', 'ArrowRight'].includes(event.key) ||
                !mount.view.state.facet(EditorView.editable)
            )
                return;
            event.preventDefault();
            event.stopPropagation();
            width.value = String(
                Math.max(
                    120,
                    Number(block.metadata.width ?? 720) +
                        (event.key === 'ArrowLeft' ? -10 : 10),
                ),
            );
            writeImageMetadata();
        });
        if (imageMode) frame.append(handle);
    }
    function update(next: RichBlock) {
        block = next;
        controls.update(next);
        const disabled = !mount.view.state.facet(EditorView.editable);
        replace.disabled =
            remove.disabled =
            alignment.disabled =
            width.disabled =
            captionInput.disabled =
                disabled;
        image.alt = next.label ?? '';
        frame.style.width = `${Math.max(120, Number(next.metadata.width ?? 720))}px`;
        image.style.width = '100%';
        frame.style.marginInlineStart = ['center', 'right'].includes(
            String(next.metadata.alignment),
        )
            ? 'auto'
            : '0';
        frame.style.marginInlineEnd = [
            'center',
            'left',
            'start',
            undefined,
        ].includes(next.metadata.alignment as string | undefined)
            ? 'auto'
            : '0';
        if (next.metadata.alignment === 'left') {
            frame.style.marginLeft = '0';
            frame.style.marginRight = 'auto';
        } else if (next.metadata.alignment === 'right') {
            frame.style.marginLeft = 'auto';
            frame.style.marginRight = '0';
        }
        if (disabled) resize = null;
        caption.textContent = String(next.metadata.caption ?? '');
        caption.hidden = !caption.textContent;
        alignment.value = String(next.metadata.alignment ?? 'start');
        if (document.activeElement !== width)
            width.value = next.metadata.width
                ? String(next.metadata.width)
                : '';
        if (document.activeElement !== captionInput)
            captionInput.value = String(next.metadata.caption ?? '');
        if (!next.attachmentId || loadingId === next.attachmentId) return true;
        loadingId = next.attachmentId;
        request?.abort();
        request = new AbortController();
        image.removeAttribute('src');
        download.removeAttribute('href');
        const id = next.attachmentId;
        void loadAttachmentMetadata(mount.context, id, request.signal)
            .then((metadata) => {
                if (destroyed || loadingId !== id) return;
                const url = richAttachmentUrl(mount.context, id);
                download.href = url;
                download.download = metadata.name;
                download.textContent = imageMode
                    ? 'Download'
                    : block.label || metadata.name;
                details.textContent = `${metadata.name} · ${metadata.mime_type} · ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(metadata.size_bytes / 1024)} KB`;
                if (imageMode) {
                    if (
                        metadata.purpose !== 'image' ||
                        !isDisplayImage(metadata.mime_type)
                    )
                        throw new Error(
                            'This attachment is not a supported image.',
                        );
                    image.src = url;
                }
                mount.view.requestMeasure();
            })
            .catch((error: unknown) => {
                if (
                    destroyed ||
                    loadingId !== id ||
                    (error instanceof DOMException &&
                        error.name === 'AbortError')
                )
                    return;
                controls.error.textContent =
                    error instanceof Error
                        ? error.message
                        : 'Attachment unavailable.';
                controls.error.hidden = false;
            });
        return true;
    }
    update(block);
    return {
        update,
        destroy() {
            destroyed = true;
            request?.abort();
            image.removeAttribute('src');
        },
    };
}
