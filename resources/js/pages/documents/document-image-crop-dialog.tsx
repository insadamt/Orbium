import * as Dialog from '@radix-ui/react-dialog';
import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
} from 'react';
import {
    clampCropPosition,
    documentImageTargets,
    drawDocumentImageCrop,
    type DocumentImageKind,
} from './document-image-crop';

type Props = {
    file: File;
    kind: DocumentImageKind;
    onCancel: () => void;
    onConfirm: (file: File) => void;
};
type CropPosition = { x: number; y: number };
type DragSession = {
    pointerId: number;
    startX: number;
    startY: number;
    position: CropPosition;
};

export default function DocumentImageCropDialog({
    file,
    kind,
    onCancel,
    onConfirm,
}: Props) {
    const target = documentImageTargets[kind];
    const outputMimeType =
        file.type === 'image/png' || file.type === 'image/webp'
            ? file.type
            : 'image/jpeg';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragSession = useRef<DragSession | null>(null);
    const active = useRef(true);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState<CropPosition>({ x: 0, y: 0 });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
        };
    }, []);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        const source = new Image();
        let mounted = true;
        source.onload = () => {
            if (mounted) setImage(source);
        };
        source.onerror = () => {
            if (mounted) setError('This image could not be opened.');
        };
        source.src = url;
        return () => {
            mounted = false;
            URL.revokeObjectURL(url);
        };
    }, [file]);

    useEffect(() => {
        if (image && canvasRef.current)
            drawDocumentImageCrop(
                canvasRef.current,
                image,
                kind,
                zoom,
                position,
                outputMimeType !== 'image/jpeg',
            );
    }, [image, kind, outputMimeType, zoom, position]);

    function moveImage(nextPosition: CropPosition) {
        if (!image) return;
        setPosition(clampCropPosition(image, kind, zoom, nextPosition));
    }

    function beginDrag(event: PointerEvent<HTMLCanvasElement>) {
        if (!image || event.button !== 0) return;
        event.preventDefault();
        dragSession.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            position,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function updateDrag(event: PointerEvent<HTMLCanvasElement>) {
        const session = dragSession.current;
        if (
            !session ||
            session.pointerId !== event.pointerId ||
            !canvasRef.current
        )
            return;
        const scale =
            target.width / canvasRef.current.getBoundingClientRect().width;
        moveImage({
            x: session.position.x + (event.clientX - session.startX) * scale,
            y: session.position.y + (event.clientY - session.startY) * scale,
        });
    }

    function moveWithKeyboard(event: KeyboardEvent<HTMLCanvasElement>) {
        if (!image || !event.key.startsWith('Arrow')) return;
        event.preventDefault();
        const step =
            (event.shiftKey ? 40 : 10) *
            (target.width / event.currentTarget.getBoundingClientRect().width);
        const horizontal =
            event.key === 'ArrowLeft'
                ? -step
                : event.key === 'ArrowRight'
                  ? step
                  : 0;
        const vertical =
            event.key === 'ArrowUp'
                ? -step
                : event.key === 'ArrowDown'
                  ? step
                  : 0;
        moveImage({ x: position.x + horizontal, y: position.y + vertical });
    }

    function changeZoom(nextZoom: number) {
        setZoom(nextZoom);
        if (image)
            setPosition((current) =>
                clampCropPosition(image, kind, nextZoom, current),
            );
    }

    async function saveCrop() {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        setSaving(true);
        setError('');
        try {
            drawDocumentImageCrop(
                canvas,
                image,
                kind,
                zoom,
                position,
                outputMimeType !== 'image/jpeg',
            );
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (result) =>
                        result
                            ? resolve(result)
                            : reject(new Error('Crop failed')),
                    outputMimeType,
                    0.9,
                );
            });
            if (!active.current) return;
            const extension =
                outputMimeType === 'image/png'
                    ? 'png'
                    : outputMimeType === 'image/webp'
                      ? 'webp'
                      : 'jpg';
            const name = `${file.name.replace(/\.[^.]+$/, '')}-cropped.${extension}`;
            onConfirm(new File([blob], name, { type: outputMimeType }));
        } catch {
            if (!active.current) return;
            setError('Could not crop this image. Please choose another image.');
            setSaving(false);
        }
    }

    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open) onCancel();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
                <Dialog.Content className="glass-surface fixed top-1/2 left-1/2 z-50 max-h-[calc(100vh-2rem)] w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border p-5 text-foreground shadow-2xl sm:p-6">
                    <Dialog.Title className="text-lg font-semibold">
                        Crop {target.label}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                        Drag the image or use arrow keys to position it. The
                        saved {target.label} will be {target.width} ×{' '}
                        {target.height} pixels.
                    </Dialog.Description>
                    <div className="mt-5 flex justify-center overflow-hidden rounded-xl bg-muted p-3 sm:p-5">
                        <canvas
                            ref={canvasRef}
                            width={target.width}
                            height={target.height}
                            tabIndex={0}
                            aria-label={`${target.label} crop preview; drag or use arrow keys to reposition`}
                            onPointerDown={beginDrag}
                            onPointerMove={updateDrag}
                            onPointerUp={() => {
                                dragSession.current = null;
                            }}
                            onPointerCancel={() => {
                                dragSession.current = null;
                            }}
                            onKeyDown={moveWithKeyboard}
                            className={`block h-auto touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring ${kind === 'icon' ? 'w-full max-w-80' : 'w-full max-w-[600px]'} ${image ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        />
                    </div>
                    <label className="mt-5 flex items-center gap-3 text-sm">
                        <span className="shrink-0">Zoom</span>
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={(event) =>
                                changeZoom(Number(event.target.value))
                            }
                            className="min-w-0 flex-1 accent-foreground"
                        />
                        <span className="w-10 text-right text-muted-foreground tabular-nums">
                            {Math.round(zoom * 100)}%
                        </span>
                    </label>
                    {error && (
                        <p
                            role="alert"
                            className="mt-3 text-sm text-destructive"
                        >
                            {error}
                        </p>
                    )}
                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg px-4 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!image || saving}
                            onClick={() => void saveCrop()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                        >
                            {saving ? 'Cropping…' : 'Use image'}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
