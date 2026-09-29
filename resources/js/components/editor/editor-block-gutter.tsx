import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { GripVertical, Plus } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type DragEvent,
    type MouseEvent,
} from 'react';
import BlockContextMenu from './block-context-menu';
import {
    findHoveredBlock,
    insertParagraphAfterBlock,
} from './editor-block-hover';
import { changeBlockOrder } from './editor-controls';
import TableControls from './table-controls';

type BlockLocation = { index: number; top: number };
type DropLocation = { index: number; top: number };

type Props = {
    editor: Editor;
    onFiles: (files: FileList) => void;
    onMentionOpen: (nodeId: number) => void;
};

function findDropLocation(
    editor: Editor,
    surface: HTMLElement,
    draggedIndex: number,
    pointerY: number,
): DropLocation | null {
    const blocks = Array.from(editor.view.dom.children);
    if (blocks.length === 0) return null;
    const insertionIndex = blocks.findIndex((block) => {
        const bounds = block.getBoundingClientRect();
        return pointerY < (bounds.top + bounds.bottom) / 2;
    });
    const beforeIndex = insertionIndex < 0 ? blocks.length : insertionIndex;
    const destinationIndex =
        beforeIndex > draggedIndex ? beforeIndex - 1 : beforeIndex;
    if (destinationIndex === draggedIndex) return null;
    const previousBottom =
        beforeIndex > 0
            ? blocks[beforeIndex - 1].getBoundingClientRect().bottom
            : null;
    const nextTop =
        beforeIndex < blocks.length
            ? blocks[beforeIndex].getBoundingClientRect().top
            : null;
    const boundary =
        previousBottom === null
            ? nextTop! - 8
            : nextTop === null
              ? previousBottom + 8
              : (previousBottom + nextTop) / 2;

    return {
        index: destinationIndex,
        top: boundary - surface.getBoundingClientRect().top,
    };
}

function showBlockDragPreview(
    event: DragEvent<HTMLButtonElement>,
    block: Element,
) {
    const preview = document.createElement('div');
    preview.className = 'editor-block-drag-preview';
    preview.textContent =
        block.textContent?.trim().slice(0, 90) || 'Empty block';
    document.body.append(preview);
    event.dataTransfer.setDragImage(preview, 16, 16);
    window.setTimeout(() => preview.remove(), 0);
}

export default function EditorBlockGutter({
    editor,
    onFiles,
    onMentionOpen,
}: Props) {
    const surfaceRef = useRef<HTMLDivElement>(null);
    const draggedBlock = useRef<number | null>(null);
    const [hoveredBlock, setHoveredBlock] = useState<BlockLocation | null>(
        null,
    );
    const [menuBlock, setMenuBlock] = useState<BlockLocation | null>(null);
    const [dropLocation, setDropLocation] = useState<DropLocation | null>(null);
    const visibleBlock = menuBlock ?? hoveredBlock;

    useEffect(() => {
        if (!menuBlock) return;
        const closeOutside = (event: PointerEvent) => {
            if (!surfaceRef.current?.contains(event.target as Node))
                setMenuBlock(null);
        };
        document.addEventListener('pointerdown', closeOutside);
        return () => document.removeEventListener('pointerdown', closeOutside);
    }, [menuBlock]);

    function locateBlock(
        target: EventTarget,
        pointerY: number,
    ): BlockLocation | null {
        if (!surfaceRef.current) return null;
        return findHoveredBlock(editor, surfaceRef.current, target, pointerY);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>): void {
        if (draggedBlock.current !== null) {
            event.preventDefault();
            event.stopPropagation();
            const location = surfaceRef.current
                ? findDropLocation(
                      editor,
                      surfaceRef.current,
                      draggedBlock.current,
                      event.clientY,
                  )
                : null;
            if (location)
                changeBlockOrder(editor, draggedBlock.current, location.index);
            finishBlockDrag();
            return;
        }
        if (event.dataTransfer.files.length === 0) return;
        event.preventDefault();
        onFiles(event.dataTransfer.files);
        setDropLocation(null);
    }

    function finishBlockDrag(): void {
        if (draggedBlock.current !== null)
            editor.view.dom.children[draggedBlock.current]?.classList.remove(
                'editor-block-dragging',
            );
        draggedBlock.current = null;
        setDropLocation(null);
        setMenuBlock(null);
        setHoveredBlock(null);
    }

    function openContextMenu(event: MouseEvent<HTMLDivElement>): void {
        const block = locateBlock(event.target, event.clientY);
        if (!block) return;
        event.preventDefault();
        setHoveredBlock(block);
        setMenuBlock(block);
    }

    return (
        <div
            ref={surfaceRef}
            className="relative pl-10 sm:pl-0"
            onMouseMove={(event) => {
                if (menuBlock || draggedBlock.current !== null) return;
                if (
                    (event.target as HTMLElement).closest(
                        '[data-block-controls]',
                    )
                )
                    return;
                const block = locateBlock(event.target, event.clientY);
                if (block)
                    setHoveredBlock((current) =>
                        current?.index === block.index &&
                        current.top === block.top
                            ? current
                            : block,
                    );
            }}
            onMouseLeave={() => {
                if (draggedBlock.current === null) setHoveredBlock(null);
            }}
            onPaste={(event) => {
                if (event.clipboardData.files.length === 0) return;
                event.preventDefault();
                onFiles(event.clipboardData.files);
            }}
            onDropCapture={handleDrop}
            onDragOver={(event) => {
                if (event.dataTransfer.types.includes('Files')) {
                    event.preventDefault();
                    return;
                }
                if (draggedBlock.current === null || !surfaceRef.current)
                    return;
                event.preventDefault();
                setDropLocation(
                    findDropLocation(
                        editor,
                        surfaceRef.current,
                        draggedBlock.current,
                        event.clientY,
                    ),
                );
            }}
            onDragLeave={(event) => {
                if (!surfaceRef.current?.contains(event.relatedTarget as Node))
                    setDropLocation(null);
            }}
            onContextMenu={openContextMenu}
            onClick={(event) => {
                if (menuBlock) setMenuBlock(null);
                const mention = (
                    event.target as HTMLElement
                ).closest<HTMLElement>('[data-mention-id]');
                const targetId = Number(mention?.dataset.mentionId);
                if (targetId) onMentionOpen(targetId);
            }}
        >
            <EditorContent editor={editor} />
            <TableControls editor={editor} surfaceRef={surfaceRef} />
            {visibleBlock && (
                <div
                    data-block-controls
                    className="absolute left-0 z-10 flex items-center rounded-lg text-muted-foreground sm:-left-12"
                    style={{ top: visibleBlock.top }}
                >
                    <button
                        type="button"
                        aria-label="Add block below"
                        title="Add block below"
                        onClick={(event) => {
                            event.stopPropagation();
                            insertParagraphAfterBlock(
                                editor,
                                visibleBlock.index,
                            );
                            setMenuBlock(null);
                            setHoveredBlock(null);
                        }}
                        className="rounded-md p-1 hover:bg-accent hover:text-foreground"
                    >
                        <Plus size={17} />
                    </button>
                    <button
                        type="button"
                        draggable
                        aria-label="Drag block or open block menu"
                        aria-expanded={menuBlock !== null}
                        title="Drag to reorder, click for menu"
                        onClick={(event) => {
                            event.stopPropagation();
                            setMenuBlock(menuBlock ? null : visibleBlock);
                        }}
                        onDragStart={(event) => {
                            draggedBlock.current = visibleBlock.index;
                            setHoveredBlock(visibleBlock);
                            setMenuBlock(null);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData(
                                'application/x-orbium-block',
                                'move',
                            );
                            const block =
                                editor.view.dom.children[visibleBlock.index];
                            if (block) {
                                block.classList.add('editor-block-dragging');
                                showBlockDragPreview(event, block);
                            }
                        }}
                        onDragEnd={finishBlockDrag}
                        className="cursor-grab rounded-md p-1 hover:bg-accent hover:text-foreground active:cursor-grabbing"
                    >
                        <GripVertical size={17} />
                    </button>
                </div>
            )}
            {menuBlock && (
                <div
                    className="absolute left-0 z-20 sm:-left-12"
                    style={{ top: menuBlock.top + 32 }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <BlockContextMenu
                        editor={editor}
                        index={menuBlock.index}
                        onClose={() => {
                            setMenuBlock(null);
                            setHoveredBlock(null);
                        }}
                    />
                </div>
            )}
            {dropLocation && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 left-10 z-10 border-t-2 border-foreground/60 sm:left-0"
                    style={{ top: dropLocation.top }}
                />
            )}
        </div>
    );
}
