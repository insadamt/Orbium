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
    const controls = sourceControls(mount, imageMode ? 'Image' : 'File', false);
    controls.toolbar.hidden = true;
    const figure = element('figure', 'm-0 max-w-full');
    const image = element('img', 'block h-auto w-full rounded-lg');
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('load', () => {
        if (!destroyed) {
            applyImageWidth();
            mount.view.requestMeasure();
        }
    });
    image.addEventListener('error', () => {
        if (destroyed) return;
        controls.error.textContent = 'Image unavailable.';
        controls.error.hidden = false;
    });
    const frame = element('div', 'group relative max-w-full rounded-lg');
    let resize: {
        pointer: number;
        x: number;
        width: number;
        direction: number;
        maximum: number;
    } | null = null;
    const caption = element('figcaption', 'mt-2 text-sm text-muted-foreground');
    const download = element('a', 'font-medium underline');
    download.textContent = block.label ?? 'Download file';
    download.download = '';
    download.target = '_blank';
    download.rel = 'noopener noreferrer';
    const details = element(
        'span',
        'ms-3 text-xs text-muted-foreground',
        'Loading attachment…',
    );
    if (imageMode) {
        frame.append(image);
        figure.append(frame, caption);
        controls.output.append(figure);
    } else controls.output.append(download, details);
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
    let selected = false;
    const overlay = element(
        'div',
        'glass-surface editor-image-toolbar absolute top-1/2 z-10 flex w-10 -translate-y-1/2 flex-col items-center gap-1 rounded-lg border border-border p-1 text-xs shadow-sm',
    );
    overlay.setAttribute('role', 'toolbar');
    overlay.setAttribute('aria-label', 'Image controls');
    overlay.hidden = true;
    const alignmentButtons: HTMLButtonElement[] = [];
    for (const value of ['left', 'center', 'right'] as const) {
        const control = button('', () => {
            alignment.value = value;
            writeImageMetadata();
        });
        control.setAttribute('aria-label', `Align image ${value}`);
        control.className =
            'rounded-md p-1.5 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring';
        control.append(widgetIcon(value, 16));
        alignmentButtons.push(control);
        overlay.append(control);
    }
    const widthLabel = element(
        'span',
        'text-center text-[10px] leading-tight text-muted-foreground tabular-nums',
    );
    function applyImageWidth() {
        figure.style.width = `${block.metadata.width ? Math.max(120, Number(block.metadata.width)) : image.naturalWidth || 720}px`;
    }
    const widthObserver = new ResizeObserver(() => {
        const measuredWidth = Math.round(frame.getBoundingClientRect().width);
        widthLabel.textContent =
            measuredWidth > 0 ? `${measuredWidth} px` : 'Auto';
    });
    if (imageMode) widthObserver.observe(frame);
    const fill = button('', () => {
        width.value = String(Math.round(mount.root.clientWidth));
        writeImageMetadata();
    });
    fill.setAttribute('aria-label', 'Fill available width');
    fill.title = 'Fill available width';
    fill.append(widgetIcon('maximize', 16));
    download.setAttribute('aria-label', 'Download image');
    if (imageMode) download.replaceChildren(widgetIcon('download', 16));
    remove.setAttribute('aria-label', 'Delete image');
    remove.replaceChildren(widgetIcon('trash', 16));
    replace.setAttribute('aria-label', 'Replace image');
    replace.replaceChildren(widgetIcon('edit', 16));
    overlay.append(widthLabel, fill, download, replace, remove);
    const resizeHandles: HTMLButtonElement[] = [];
    function setSelected(next: boolean) {
        selected = next && mount.view.state.facet(EditorView.editable);
        overlay.hidden = !selected;
        frame.classList.toggle('ring-2', selected);
        frame.classList.toggle('ring-ring', selected);
        caption.hidden = !selected && !captionInput.value;
        captionInput.readOnly = !selected;
        resizeHandles.forEach((handle) => {
            handle.hidden = !selected;
        });
        mount.view.requestMeasure();
    }
    const dismiss = (event: PointerEvent) => {
        if (!mount.root.contains(event.target as Node)) setSelected(false);
    };
    if (imageMode) {
        captionInput.className =
            'w-full bg-transparent text-center outline-none placeholder:text-muted-foreground/70 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring';
        caption.append(captionInput);
        frame.append(overlay);
        mount.root.addEventListener('orbium-edit-rich', () =>
            setSelected(true),
        );
        figure.addEventListener('click', () => setSelected(true));
        figure.addEventListener('focusin', () => setSelected(true));
        image.tabIndex = -1;
        image.draggable = false;
        image.setAttribute('aria-label', 'Select image');
        document.addEventListener('pointerdown', dismiss);
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
    for (const corner of [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
    ]) {
        const direction = corner.endsWith('left') ? -1 : 1;
        const handle = button('', () => {});
        handle.setAttribute(
            'aria-label',
            `Resize image from ${corner.replace('-', ' ')}`,
        );
        handle.className = `editor-image-resize-handle editor-image-resize-handle--${corner}`;
        handle.hidden = true;
        resizeHandles.push(handle);
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
                maximum: mount.root.clientWidth,
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
            figure.style.width = `${value}px`;
            width.value = String(value);
            widthLabel.textContent = `${value} px`;
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
            applyImageWidth();
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
                    frame.getBoundingClientRect().width +
                        (event.key === 'ArrowLeft' ? -1 : 1) *
                            (event.shiftKey ? 50 : 10),
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
        applyImageWidth();
        image.style.width = '100%';
        figure.style.marginInlineStart = ['center', 'right'].includes(
            String(next.metadata.alignment),
        )
            ? 'auto'
            : '0';
        figure.style.marginInlineEnd = [
            'center',
            'left',
            'start',
            undefined,
        ].includes(next.metadata.alignment as string | undefined)
            ? 'auto'
            : '0';
        if (next.metadata.alignment === 'left') {
            figure.style.marginLeft = '0';
            figure.style.marginRight = 'auto';
        } else if (next.metadata.alignment === 'right') {
            figure.style.marginLeft = 'auto';
            figure.style.marginRight = '0';
        }
        if (disabled) resize = null;
        caption.hidden = !selected && !next.metadata.caption;
        if (!frame.isConnected) widthLabel.textContent = 'Auto';
        alignmentButtons.forEach((control, index) =>
            control.setAttribute(
                'aria-pressed',
                String(
                    ['left', 'center', 'right'][index] ===
                        next.metadata.alignment,
                ),
            ),
        );
        if (disabled) setSelected(false);
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
                if (!imageMode)
                    download.textContent = block.label || metadata.name;
                details.textContent = `${Math.ceil(metadata.size_bytes / 1024)} KB`;
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
            widthObserver.disconnect();
            controls.destroy();
            destroyed = true;
            request?.abort();
            image.removeAttribute('src');
            document.removeEventListener('pointerdown', dismiss);
        },
    };
}
