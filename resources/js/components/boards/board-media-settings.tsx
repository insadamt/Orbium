import {
    Captions,
    Check,
    ChevronDown,
    Crop,
    FolderOpen,
    Plus,
    Maximize,
    Replace,
    RotateCcw,
    Scan,
    Upload,
    X,
    type LucideIcon,
} from 'lucide-react';
import { Popover } from 'radix-ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as Menu from '@/components/ui/dropdown-menu';
import { BoardToolButton } from './board-tool-button';
import type { BoardContentProps } from './board-text-block';
import './board-media-toolbar.css';

export function BoardMediaSettings({
    props,
    uploading,
    onUpload,
    onChooseLibrary,
    onResetProportions,
}: {
    props: BoardContentProps;
    uploading: boolean;
    onUpload: () => void;
    onChooseLibrary: () => void;
    onResetProportions: () => void;
}) {
    const sourceActionSelected = useRef(false);
    const [toolbar, setToolbar] = useState<HTMLElement | null>(null);
    const [captionOpen, setCaptionOpen] = useState(false);
    const [framingOpen, setFramingOpen] = useState(false);
    useEffect(() => {
        setToolbar(
            document.getElementById(`board-formatting-${props.boardId}`),
        );
    }, [props.boardId]);
    useEffect(() => {
        //
        // Closing edit mode must discard popover visibility so reopening does not resurrect an old panel.
        //
        if (!props.editing) {
            setCaptionOpen(false);
            setFramingOpen(false);
        }
    }, [props.editing]);
    if (!toolbar || !props.editing) return null;
    const { data } = props.object;
    const disabled = props.readOnly || uploading;
    const hasAttachment = Boolean(data.attachment_id);
    const imageFit = data.image_fit ?? 'cover';
    return createPortal(
        <div className="board-media-controls" data-board-editor>
            <div
                className="board-toolbar-group"
                role="group"
                aria-label="Media source"
            >
                <Menu.Root
                    modal={false}
                    onOpenChange={(open) => {
                        if (open) sourceActionSelected.current = false;
                    }}
                >
                    <Menu.Trigger asChild>
                        <BoardToolButton
                            label={hasAttachment ? 'Replace file' : 'Add file'}
                            icon={hasAttachment ? Replace : Plus}
                            disabled={disabled}
                        >
                            {hasAttachment ? 'Replace' : 'Add file'}
                            <ChevronDown size={12} aria-hidden="true" />
                        </BoardToolButton>
                    </Menu.Trigger>
                    <Menu.Content
                        sideOffset={8}
                        collisionPadding={12}
                        align="start"
                        onCloseAutoFocus={(event) => {
                            //
                            // The Library dialog and native file picker own focus after choosing a source.
                            //
                            if (sourceActionSelected.current)
                                event.preventDefault();
                        }}
                    >
                        <Menu.Label>
                            {hasAttachment ? 'Replace media' : 'Add media'}
                        </Menu.Label>
                        <Menu.Item
                            disabled={disabled}
                            onSelect={() => {
                                sourceActionSelected.current = true;
                                onUpload();
                            }}
                        >
                            <Upload /> Upload file
                        </Menu.Item>
                        <Menu.Item
                            disabled={disabled}
                            onSelect={() => {
                                sourceActionSelected.current = true;
                                onChooseLibrary();
                            }}
                        >
                            <FolderOpen /> Choose from Library
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Root>
            </div>
            <div
                className="board-toolbar-group"
                role="group"
                aria-label="Media presentation"
            >
                <MediaSettingsPopover
                    title="Caption"
                    icon={Captions}
                    open={captionOpen}
                    onOpenChange={setCaptionOpen}
                    disabled={disabled}
                    active={Boolean(data.caption)}
                >
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            setCaptionOpen(false);
                        }}
                    >
                        <label className="board-media-field">
                            Caption text
                            <input
                                type="text"
                                value={data.caption ?? ''}
                                placeholder="Add a caption…"
                                disabled={disabled}
                                onChange={(event) =>
                                    props.onChange(
                                        {
                                            ...data,
                                            caption: event.target.value,
                                        },
                                        'typing',
                                    )
                                }
                            />
                        </label>
                        <div className="board-media-panel-actions">
                            <BoardToolButton
                                label="Clear caption"
                                disabled={disabled || !data.caption}
                                onClick={() =>
                                    props.onChange({ ...data, caption: '' })
                                }
                            >
                                Clear
                            </BoardToolButton>
                            <Popover.Close asChild>
                                <BoardToolButton
                                    label="Finish caption"
                                    icon={Check}
                                >
                                    Done
                                </BoardToolButton>
                            </Popover.Close>
                        </div>
                    </form>
                </MediaSettingsPopover>
                {props.object.block_type === 'image' && hasAttachment && (
                    <MediaSettingsPopover
                        title="Image framing"
                        icon={Crop}
                        open={framingOpen}
                        onOpenChange={setFramingOpen}
                        disabled={disabled}
                    >
                        <div
                            className="board-media-fit-options"
                            role="group"
                            aria-label="Image fit"
                        >
                            {(
                                [
                                    {
                                        value: 'contain',
                                        label: 'Fit',
                                        icon: Maximize,
                                    },
                                    {
                                        value: 'cover',
                                        label: 'Fill',
                                        icon: Scan,
                                    },
                                ] as const
                            ).map(({ value, label, icon }) => (
                                <BoardToolButton
                                    key={value}
                                    label={
                                        value === 'contain'
                                            ? 'Fit entire image'
                                            : 'Fill crop frame'
                                    }
                                    icon={icon}
                                    aria-pressed={imageFit === value}
                                    disabled={disabled}
                                    onClick={() =>
                                        props.onChange({
                                            ...data,
                                            image_fit: value,
                                        })
                                    }
                                >
                                    {label}
                                </BoardToolButton>
                            ))}
                        </div>
                        {imageFit === 'cover' && (
                            <div className="board-media-crop-fields">
                                {(['x', 'y'] as const).map((axis) => (
                                    <label
                                        className="board-media-field"
                                        key={axis}
                                    >
                                        <span>
                                            {axis === 'x'
                                                ? 'Horizontal position'
                                                : 'Vertical position'}
                                            <span>
                                                {Math.round(
                                                    data.image_position?.[
                                                        axis
                                                    ] ?? 50,
                                                )}
                                                %
                                            </span>
                                        </span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={
                                                data.image_position?.[axis] ??
                                                50
                                            }
                                            disabled={disabled}
                                            onChange={(event) =>
                                                props.onChange(
                                                    {
                                                        ...data,
                                                        image_position: {
                                                            x:
                                                                data
                                                                    .image_position
                                                                    ?.x ?? 50,
                                                            y:
                                                                data
                                                                    .image_position
                                                                    ?.y ?? 50,
                                                            [axis]: Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        },
                                                    },
                                                    'typing',
                                                )
                                            }
                                        />
                                    </label>
                                ))}
                                <p className="board-media-panel-hint">
                                    Finish editing, then drag an image edge to
                                    resize the crop frame.
                                </p>
                            </div>
                        )}
                        <div className="board-media-panel-actions">
                            <BoardToolButton
                                label="Reset image proportions"
                                icon={RotateCcw}
                                disabled={disabled}
                                onClick={onResetProportions}
                            >
                                Reset proportions
                            </BoardToolButton>
                        </div>
                    </MediaSettingsPopover>
                )}
            </div>
            {uploading && (
                <span className="board-media-upload-status" role="status">
                    Uploading…
                </span>
            )}
        </div>,
        toolbar,
    );
}

function MediaSettingsPopover({
    title,
    icon,
    open,
    onOpenChange,
    disabled,
    active,
    children,
}: {
    title: string;
    icon: LucideIcon;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    disabled: boolean;
    active?: boolean;
    children: ReactNode;
}) {
    const content = useRef<HTMLDivElement>(null);
    return (
        <Popover.Root open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
                <BoardToolButton
                    label={title}
                    icon={icon}
                    disabled={disabled}
                    aria-pressed={active}
                />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    ref={content}
                    onOpenAutoFocus={(event) => {
                        const field =
                            content.current?.querySelector<HTMLInputElement>(
                                'input[type="text"]',
                            );
                        if (field) {
                            event.preventDefault();
                            field.focus({ preventScroll: true });
                        }
                    }}
                    className="board-media-popover glass-surface"
                    data-board-editor
                    sideOffset={10}
                    collisionPadding={12}
                    align="start"
                    aria-label={title}
                >
                    <div className="board-media-panel-heading">
                        <span>{title}</span>
                        <Popover.Close asChild>
                            <BoardToolButton
                                label={`Close ${title.toLowerCase()}`}
                                icon={X}
                            />
                        </Popover.Close>
                    </div>
                    {children}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
