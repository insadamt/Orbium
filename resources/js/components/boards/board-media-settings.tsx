import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { BoardContentProps } from './board-text-block';

export function BoardMediaSettings({
    props,
    actions,
    uploading,
    onResetProportions,
}: {
    props: BoardContentProps;
    actions: ReactNode;
    uploading: boolean;
    onResetProportions: () => void;
}) {
    const [toolbar, setToolbar] = useState<HTMLElement | null>(null);
    const [cropping, setCropping] = useState(false);
    useEffect(() => {
        setToolbar(
            document.getElementById(`board-formatting-${props.boardId}`),
        );
    }, [props.boardId]);
    if (!toolbar || !props.editing) return null;
    const { data } = props.object;
    const disabled = props.readOnly || uploading;
    return createPortal(
        <div className="board-media-controls" data-board-editor>
            {actions}
            {props.object.block_type === 'image' && data.attachment_id && (
                <>
                    <button
                        type="button"
                        disabled={disabled}
                        aria-pressed={cropping}
                        onClick={() => {
                            setCropping(!cropping);
                            if (!cropping)
                                props.onChange({ ...data, image_fit: 'cover' });
                        }}
                    >
                        Crop
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={onResetProportions}
                    >
                        Reset proportions
                    </button>
                    {cropping && (
                        <>
                            <span>
                                Finish editing and drag an edge to change the
                                crop frame.
                            </span>
                            {(['x', 'y'] as const).map((axis) => (
                                <label key={axis}>
                                    {axis === 'x'
                                        ? 'Horizontal crop'
                                        : 'Vertical crop'}
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={
                                            data.image_position?.[axis] ?? 50
                                        }
                                        disabled={disabled}
                                        onChange={(event) =>
                                            props.onChange(
                                                {
                                                    ...data,
                                                    image_position: {
                                                        x:
                                                            data.image_position
                                                                ?.x ?? 50,
                                                        y:
                                                            data.image_position
                                                                ?.y ?? 50,
                                                        [axis]: Number(
                                                            event.target.value,
                                                        ),
                                                    },
                                                },
                                                'typing',
                                            )
                                        }
                                    />
                                </label>
                            ))}
                        </>
                    )}
                </>
            )}
            <input
                aria-label="Caption"
                placeholder="Add a caption…"
                value={data.caption ?? ''}
                disabled={disabled}
                onChange={(event) =>
                    props.onChange(
                        { ...data, caption: event.target.value },
                        'typing',
                    )
                }
            />
        </div>,
        toolbar,
    );
}
