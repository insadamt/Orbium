import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Download,
    Maximize2,
    Trash2,
} from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { attachmentUrl } from './editor-api';

type ImageViewProps = NodeViewProps & {
    context: { workspaceId: number; nodeId: number };
};
type ResizeSession = {
    pointerId: number;
    startX: number;
    startWidth: number;
    direction: -1 | 1;
    maximumWidth: number;
};

const minimumImageWidth = 120;

function clampImageWidth(width: number, maximumWidth: number) {
    return Math.round(
        Math.min(
            maximumWidth,
            Math.max(Math.min(minimumImageWidth, maximumWidth), width),
        ),
    );
}

export default function ImageView({
    node,
    updateAttributes,
    deleteNode,
    selected,
    context,
}: ImageViewProps) {
    const imageContainer = useRef<HTMLDivElement>(null);
    const resizeSession = useRef<ResizeSession | null>(null);
    const [previewWidth, setPreviewWidth] = useState<number | null>(null);
    const attachmentId = Number(node.attrs.attachmentId);
    const savedWidth = Number(node.attrs.width) || 720;
    const imageWidth = previewWidth ?? savedWidth;
    const alignment = String(node.attrs.alignment || 'start');
    const caption = String(node.attrs.caption ?? '');
    const imageUrl = attachmentUrl(
        context.workspaceId,
        context.nodeId,
        attachmentId,
    );

    function availableWidth() {
        return Math.max(
            1,
            Math.floor(imageContainer.current?.clientWidth || 720),
        );
    }

    function beginResize(
        event: PointerEvent<HTMLButtonElement>,
        direction: -1 | 1,
    ) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        resizeSession.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startWidth: Math.min(savedWidth, availableWidth()),
            direction,
            maximumWidth: availableWidth(),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function updateResize(event: PointerEvent<HTMLButtonElement>) {
        const session = resizeSession.current;
        if (!session || session.pointerId !== event.pointerId) return;
        setPreviewWidth(
            clampImageWidth(
                session.startWidth +
                    (event.clientX - session.startX) * session.direction,
                session.maximumWidth,
            ),
        );
    }

    function finishResize(
        event: PointerEvent<HTMLButtonElement>,
        save: boolean,
    ) {
        const session = resizeSession.current;
        if (!session || session.pointerId !== event.pointerId) return;
        const finalWidth = clampImageWidth(
            session.startWidth +
                (event.clientX - session.startX) * session.direction,
            session.maximumWidth,
        );
        resizeSession.current = null;
        setPreviewWidth(null);
        if (save && finalWidth !== savedWidth)
            updateAttributes({ width: finalWidth });
    }

    function resizeWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        event.stopPropagation();
        const step = event.shiftKey ? 50 : 10;
        updateAttributes({
            width: clampImageWidth(
                Math.min(savedWidth, availableWidth()) +
                    (event.key === 'ArrowRight' ? step : -step),
                availableWidth(),
            ),
        });
    }

    return (
        <NodeViewWrapper className="editor-image my-5" dir={node.attrs.dir}>
            <div ref={imageContainer} contentEditable={false}>
                <figure
                    className="max-w-full"
                    style={{
                        width: imageWidth,
                        marginLeft:
                            alignment === 'left' ||
                            (alignment === 'start' && node.attrs.dir !== 'rtl')
                                ? 0
                                : 'auto',
                        marginRight:
                            alignment === 'right' ||
                            (alignment === 'start' && node.attrs.dir === 'rtl')
                                ? 0
                                : 'auto',
                    }}
                >
                    <div
                        className={`relative rounded-lg ${selected ? 'ring-2 ring-ring' : ''}`}
                    >
                        <img
                            src={imageUrl}
                            loading="lazy"
                            decoding="async"
                            alt={String(node.attrs.alt ?? '')}
                            draggable={false}
                            className="block h-auto w-full rounded-lg"
                        />
                        {selected && (
                            <div
                                role="toolbar"
                                aria-label="Image controls"
                                className="glass-surface editor-image-toolbar absolute top-1/2 z-10 flex w-10 -translate-y-1/2 flex-col items-center gap-1 rounded-lg border border-border p-1 text-xs shadow-sm"
                            >
                                {(
                                    [
                                        ['left', AlignLeft],
                                        ['center', AlignCenter],
                                        ['right', AlignRight],
                                    ] as const
                                ).map(([value, Icon]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        aria-label={`Align image ${value}`}
                                        aria-pressed={alignment === value}
                                        onClick={() =>
                                            updateAttributes({
                                                alignment: value,
                                            })
                                        }
                                        className={`rounded-md p-1.5 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring ${alignment === value ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        <Icon size={16} aria-hidden="true" />
                                    </button>
                                ))}
                                <span
                                    className="my-1 h-px w-6 bg-border"
                                    aria-hidden="true"
                                />
                                <span className="text-center text-[10px] leading-tight text-muted-foreground tabular-nums">
                                    {Math.round(
                                        Math.min(imageWidth, availableWidth()),
                                    )}{' '}
                                    px
                                </span>
                                <button
                                    type="button"
                                    title="Fill available width"
                                    aria-label="Fill available width"
                                    onClick={() =>
                                        updateAttributes({
                                            width: availableWidth(),
                                        })
                                    }
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                    <Maximize2 size={16} aria-hidden="true" />
                                </button>
                                <span
                                    className="my-1 h-px w-6 bg-border"
                                    aria-hidden="true"
                                />
                                <a
                                    href={imageUrl}
                                    download
                                    title="Download image"
                                    aria-label="Download image"
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                    <Download size={16} aria-hidden="true" />
                                </a>
                                <button
                                    type="button"
                                    aria-label="Delete image"
                                    title="Delete image"
                                    onClick={deleteNode}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                    <Trash2 size={16} aria-hidden="true" />
                                </button>
                            </div>
                        )}
                        {selected && (
                            <>
                                {(
                                    [
                                        'top-left',
                                        'top-right',
                                        'bottom-left',
                                        'bottom-right',
                                    ] as const
                                ).map((corner) => {
                                    const direction = corner.endsWith('left')
                                        ? -1
                                        : 1;
                                    return (
                                        <button
                                            key={corner}
                                            type="button"
                                            aria-label={`Resize image from ${corner.replace('-', ' ')}; use arrow keys for precise sizing`}
                                            title="Drag to resize · Arrow keys: 10 px · Shift + arrows: 50 px"
                                            className={`editor-image-resize-handle editor-image-resize-handle--${corner}`}
                                            onPointerDown={(event) =>
                                                beginResize(event, direction)
                                            }
                                            onPointerMove={updateResize}
                                            onPointerUp={(event) =>
                                                finishResize(event, true)
                                            }
                                            onPointerCancel={(event) =>
                                                finishResize(event, false)
                                            }
                                            onKeyDown={resizeWithKeyboard}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </div>
                    {(selected || caption) && (
                        <figcaption className="mt-2 text-sm text-muted-foreground">
                            <input
                                aria-label="Image caption"
                                value={caption}
                                onChange={(event) =>
                                    updateAttributes({
                                        caption: event.target.value,
                                    })
                                }
                                placeholder="Add a caption…"
                                className="w-full bg-transparent text-center outline-none placeholder:text-muted-foreground/70 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring"
                            />
                        </figcaption>
                    )}
                </figure>
            </div>
        </NodeViewWrapper>
    );
}
