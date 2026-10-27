import './mindmap-inline-icons.css';
import {
    MindMapOwnerContext,
    type MindMapOwner,
} from './mindmap-owner-context';
import { RichBlockIcon } from '@/components/editor/ui/rich-block-icon';
import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, Check } from 'lucide-react';
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
} from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MindMapCanvas } from './mindmap-canvas';
import { validMindMap, type MindMapData } from './mindmap-data';
import { layoutMindMap } from './mindmap-layout';
import { useMindMapOwnerStatus } from './use-mindmap-owner-status';
import '../boards/board-toolbar-polish.css';
import './mindmap.css';
import './mindmap-fullscreen.css';

type Props = {
    data: MindMapData;
    owner?: MindMapOwner;
    editable?: boolean;
    editingRequested?: boolean;
    onChange?: (map: MindMapData, typing?: boolean) => boolean;
    onComposition?: (active: boolean) => void;
    onStartEditing?: () => void;
    onFinishEditing?: () => void;
};

export function MindMapBlock({
    data: incoming,
    owner,
    editable = false,
    editingRequested,
    onChange,
    onComposition,
    onStartEditing,
    onFinishEditing,
}: Props) {
    const [data, setData] = useState(incoming);
    const [mode, setMode] = useState<'edit' | 'preview' | null>(null);
    const anchor = useRef<HTMLDivElement>(null);
    const dialog = useRef<HTMLDivElement>(null);
    const composing = useRef(false);
    const [previewTreeHeight, setPreviewTreeHeight] = useState(0);
    const estimatedPreviewHeight = useMemo(
        () =>
            validMindMap(data)
                ? Math.min(440, Math.max(200, layoutMindMap(data).height + 76))
                : 200,
        [data],
    );
    const previewHeight = previewTreeHeight
        ? Math.min(440, Math.max(200, previewTreeHeight + 76))
        : estimatedPreviewHeight;
    const status = useMindMapOwnerStatus(anchor, mode !== null);
    useLayoutEffect(() => setData(incoming), [incoming]);
    useEffect(() => {
        if (editingRequested !== undefined)
            setMode(editingRequested ? 'edit' : null);
    }, [editingRequested]);

    function closeEditor() {
        if (
            composing.current ||
            dialog.current?.querySelector('[data-mindmap-uploading]')
        )
            return;
        setMode(null);
        if (mode === 'edit') onFinishEditing?.();
    }
    function updateComposition(active: boolean) {
        composing.current = active;
        //
        // Autosave queries the owner DOM, while the live editor lives in a dialog portal.
        //
        if (anchor.current)
            anchor.current.dataset.mindmapComposing = String(active);
        onComposition?.(active);
    }
    function dispatchOwnerHistory(event: KeyboardEvent) {
        if (
            (event.ctrlKey || event.metaKey) &&
            !event.altKey &&
            event.key.toLowerCase() === 'f' &&
            !event.nativeEvent.isComposing &&
            !composing.current
        ) {
            if ((event.target as Element).closest('[data-inline-icon-picker]'))
                return;
            const search = dialog.current?.querySelector<HTMLInputElement>(
                '[data-mindmap-search-input]',
            );
            if (search) {
                event.preventDefault();
                event.stopPropagation();
                search.focus();
                search.select();
            }
            return;
        }
        if (
            !(event.ctrlKey || event.metaKey) ||
            event.altKey ||
            !['z', 'y'].includes(event.key.toLowerCase())
        )
            return;
        if (
            event.target instanceof Element &&
            event.target.closest(
                '[data-inline-icon-picker], [role="menu"], [role="listbox"], .board-link-popover, [data-mindmap-width-panel] input, [data-mindmap-search-input], [data-mindmap-style-panel] input',
            )
        )
            return;
        event.preventDefault();
        event.stopPropagation();
        if (
            composing.current ||
            event.nativeEvent.isComposing ||
            !editable ||
            mode !== 'edit'
        )
            return;
        const host = anchor.current;
        const KeyboardEventConstructor =
            host?.ownerDocument.defaultView?.KeyboardEvent;
        //
        // Re-enter the real owner's keyboard path; nested CodeMirror roots do not receive portal DOM events.
        //
        if (host && KeyboardEventConstructor)
            host.dispatchEvent(
                new KeyboardEventConstructor('keydown', {
                    key: event.key,
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    shiftKey: event.shiftKey,
                    bubbles: true,
                    cancelable: true,
                }),
            );
        requestAnimationFrame(() => {
            const active = host?.ownerDocument.activeElement;
            if (
                active === host?.ownerDocument.body ||
                active === dialog.current
            )
                focusCanvas();
        });
    }
    function focusCanvas() {
        const host = dialog.current;
        if (host?.dataset.state !== 'open') return;
        //
        // Prefer the selected topic so creation shortcuts work immediately on opening.
        //
        const topic = host.querySelector<HTMLElement>(
            '[role="treeitem"][aria-selected="true"]',
        );
        const viewport = host.querySelector<HTMLElement>('.mindmap-viewport');
        (topic ?? viewport)?.focus({ preventScroll: true });
    }
    return (
        <MindMapOwnerContext.Provider value={owner}>
            <TooltipProvider>
                <div
                    ref={anchor}
                    className="orbium-mindmap attachment-player orbium-rich-card"
                    style={
                        {
                            '--mindmap-preview-height': `${previewHeight}px`,
                        } as CSSProperties
                    }
                    data-rich-writing
                    data-mindmap-composing="false"
                >
                    <div
                        className="attachment-heading orbium-rich-card-heading"
                        data-board-interactive
                    >
                        <span className="attachment-type-icon">
                            <RichBlockIcon name="mindmap" />
                        </span>
                        <div className="attachment-identity">
                            <div className="attachment-title">Mind map</div>
                            <span className="attachment-description">
                                Topic diagram
                            </span>
                        </div>
                        <div className="attachment-actions">
                            {editable && (
                                <button
                                    type="button"
                                    className="attachment-action"
                                    aria-label="Edit Mind Map"
                                    title="Edit Mind Map"
                                    aria-haspopup="dialog"
                                    onClick={() => {
                                        onStartEditing?.();
                                        setMode('edit');
                                    }}
                                >
                                    <RichBlockIcon name="edit" size={17} />
                                </button>
                            )}
                            <button
                                type="button"
                                className="attachment-action"
                                aria-label="Open Mind Map in fullscreen"
                                title="Full preview"
                                aria-haspopup="dialog"
                                onClick={() => setMode('preview')}
                            >
                                <RichBlockIcon name="maximize" size={17} />
                            </button>
                        </div>
                    </div>
                    <div className="mindmap-block-preview">
                        <MindMapCanvas
                            data={data}
                            onLayoutHeight={setPreviewTreeHeight}
                        />
                    </div>
                </div>
                <Dialog.Root
                    open={mode !== null}
                    onOpenChange={(open) => {
                        if (!open) closeEditor();
                    }}
                >
                    <Dialog.Portal
                        container={anchor.current?.ownerDocument.body}
                    >
                        <Dialog.Overlay className="mermaid-full-overlay" />
                        <Dialog.Content
                            ref={dialog}
                            onOpenAutoFocus={(event) => {
                                event.preventDefault();
                                requestAnimationFrame(focusCanvas);
                            }}
                            className="mermaid-full-dialog mindmap-full-dialog"
                            data-mindmap-dialog
                            data-board-interactive
                            onPointerDown={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => event.stopPropagation()}
                            onKeyDownCapture={dispatchOwnerHistory}
                            onEscapeKeyDown={(event) => {
                                if (
                                    composing.current ||
                                    dialog.current?.querySelector(
                                        '[data-mindmap-resizing], [data-mindmap-dragging], [data-mindmap-uploading]',
                                    ) ||
                                    (event.target as Element)?.closest(
                                        'textarea, [data-mindmap-topic-editor], [data-mindmap-width-panel], [data-inline-icon-picker], [data-mindmap-template-panel], [data-mindmap-style-panel], [data-mindmap-search-input], [role="menu"], [role="listbox"]',
                                    )
                                )
                                    event.preventDefault();
                            }}
                            onInteractOutside={(event) =>
                                event.preventDefault()
                            }
                            onCloseAutoFocus={(event) => {
                                event.preventDefault();
                                anchor.current
                                    ?.querySelector<HTMLButtonElement>('button')
                                    ?.focus({ preventScroll: true });
                            }}
                        >
                            <header className="mindmap-full-header">
                                <div>
                                    <Dialog.Title className="mermaid-full-title">
                                        Mind map
                                    </Dialog.Title>
                                    <Dialog.Description className="sr-only">
                                        Double-click a topic to edit text. Type
                                        / for text types and icons, or : to
                                        search inline icons. Escape finishes
                                        text editing. With a topic selected, Tab
                                        adds a child and Enter adds a sibling.
                                        Drag empty canvas to pan.
                                    </Dialog.Description>
                                </div>
                                <div className="mindmap-full-header-actions">
                                    {mode === 'edit' && (
                                        <span
                                            className="mindmap-owner-status"
                                            role="status"
                                            data-status={status}
                                        >
                                            {status
                                                ? {
                                                      saved: 'Saved',
                                                      unsaved:
                                                          'Unsaved changes',
                                                      saving: 'Saving…',
                                                      error: 'Not saved',
                                                      loading: 'Loading…',
                                                  }[status]
                                                : 'Autosave managed by page'}
                                        </span>
                                    )}
                                    {mode === 'preview' && editable && (
                                        <button
                                            type="button"
                                            className="mindmap-done"
                                            onClick={() => {
                                                onStartEditing?.();
                                                setMode('edit');
                                            }}
                                        >
                                            <Pencil size={15} /> Edit
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="mindmap-done"
                                        onClick={closeEditor}
                                    >
                                        <Check size={15} /> Done
                                    </button>
                                </div>
                            </header>
                            <MindMapCanvas
                                data={data}
                                editable={mode === 'edit' && editable}
                                fullscreen
                                onComposition={updateComposition}
                                onChange={(next, typing) => {
                                    const accepted =
                                        onChange?.(next, typing) ?? false;
                                    if (accepted) setData(next);
                                    return accepted;
                                }}
                            />
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            </TooltipProvider>
        </MindMapOwnerContext.Provider>
    );
}
