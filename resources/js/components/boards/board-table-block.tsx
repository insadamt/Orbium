import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { mountTable } from '@/components/editor/markdown/rich/table-widget';
import type { RichController } from '@/components/editor/markdown/rich/rich-model';
import {
    boardTableData,
    boardTableSource,
    readBoardTable,
} from './board-table-data';
import type { BoardContentProps } from './board-text-block';
import { mountBoardTablePreview } from './board-table-preview';
import {
    useBoardPreparedPreviews,
    useBoardWorkScheduler,
} from './board-resource-previews';
import { BoardMermaidPreviewSession } from './board-mermaid-preview-session';

export function BoardTableBlock(props: BoardContentProps) {
    const scheduler = useBoardWorkScheduler();
    const prepared = useBoardPreparedPreviews();
    const host = useRef<HTMLDivElement>(null);
    const callbacks = useRef(props);
    callbacks.current = props;
    const session = useRef<{ sync: () => void } | null>(null);
    const scrollPosition = useRef({ left: 0, top: 0 });

    useEffect(() => {
        const root = host.current!;
        const rememberScroll = () => {
            const scroller = root.querySelector('.tableWrapper');
            if (scroller)
                scrollPosition.current = {
                    left: scroller.scrollLeft,
                    top: scroller.scrollTop,
                };
        };
        const restoreScroll = () => {
            const scroller = root.querySelector('.tableWrapper');
            if (scroller) {
                scroller.scrollLeft = scrollPosition.current.left;
                scroller.scrollTop = scrollPosition.current.top;
            }
        };
        if (!props.editing) {
            let data = callbacks.current.object.data;
            let disposePreview = mountBoardTablePreview({
                root,
                data,
                location: props,
                scheduler,
                prepared,
            });
            restoreScroll();
            session.current = {
                sync: () => {
                    const next = callbacks.current.object.data;
                    if (next === data) return;
                    rememberScroll();
                    disposePreview();
                    data = next;
                    disposePreview = mountBoardTablePreview({
                        root,
                        data,
                        location: callbacks.current,
                        scheduler,
                        prepared,
                    });
                    restoreScroll();
                },
            };
            return () => {
                rememberScroll();
                session.current = null;
                disposePreview();
            };
        }
        const sourceHost = document.createElement('div');
        sourceHost.hidden = true;
        root.append(sourceHost);
        const surface = document.createElement('div');
        root.append(surface);
        const editable = new Compartment();
        let controller: RichController | undefined;
        let synchronizing = false;
        let destroyed = false;
        const mermaid = new BoardMermaidPreviewSession(
            {
                workspaceId: props.workspaceId,
                nodeId: props.boardId,
                ownerKind: 'board',
            },
            prepared,
        );
        const view = new EditorView({
            parent: sourceHost,
            state: EditorState.create({
                doc: boardTableSource(callbacks.current.object.data),
                extensions: [
                    editable.of(
                        EditorView.editable.of(
                            props.editing && !props.readOnly,
                        ),
                    ),
                    EditorView.updateListener.of((update) => {
                        if (!update.docChanged || synchronizing) return;
                        const current = callbacks.current;
                        const source = update.state.doc.toString();
                        const next = boardTableData(
                            current.object.data,
                            source,
                        );
                        if (!next)
                            toast.error(
                                'Board tables support up to 100 rows and 30 columns.',
                            );
                        const typing = Boolean(
                            document.activeElement?.closest(
                                '.orbium-rich-text-input',
                            ),
                        );
                        const accepted =
                            next &&
                            current.onChange(
                                next,
                                typing ? 'typing' : 'action',
                            );
                        //
                        // The shared widget finishes its source write before receiving the canonical Board snapshot or a rejected edit rollback.
                        //
                        queueMicrotask(() => {
                            if (destroyed) return;
                            if (!accepted) sync();
                            else {
                                const block = readBoardTable(source);
                                if (block) controller?.update(block);
                            }
                        });
                    }),
                ],
            }),
        });
        //
        // Structural Document actions return focus to their host; this adapter keeps the source view hidden and returns it to the visible Board surface.
        //
        view.focus = () => root.focus({ preventScroll: true });
        const block = readBoardTable(view.state.doc.toString());
        if (block)
            controller = mountTable({
                root: surface,
                view,
                block,
                onHistory: (direction) =>
                    root.dispatchEvent(
                        new KeyboardEvent('keydown', {
                            key: direction === 'redo' ? 'y' : 'z',
                            ctrlKey: true,
                            bubbles: true,
                            cancelable: true,
                        }),
                    ),
                context: {
                    workspaceId: props.workspaceId,
                    nodeId: props.boardId,
                    ownerKind: 'board',
                    mermaid,
                    mathPreviewScope: prepared.mathScope,
                    metadata: new Map(),
                    isVisible: () => root.isConnected,
                    onUpload: () => {},
                },
            });
        function sync() {
            const current = callbacks.current;
            const source = boardTableSource(current.object.data);
            if (
                view.state.doc.toString() === source &&
                view.state.facet(EditorView.editable) ===
                    (current.editing && !current.readOnly)
            )
                return;
            synchronizing = true;
            try {
                if (view.state.doc.toString() !== source)
                    view.dispatch({
                        changes: {
                            from: 0,
                            to: view.state.doc.length,
                            insert: source,
                        },
                    });
                view.dispatch({
                    effects: editable.reconfigure(
                        EditorView.editable.of(
                            current.editing && !current.readOnly,
                        ),
                    ),
                });
                const next = readBoardTable(source);
                if (next) controller?.update(next);
            } finally {
                synchronizing = false;
            }
        }
        session.current = { sync };
        restoreScroll();
        mermaid.start(root);
        return () => {
            rememberScroll();
            destroyed = true;
            session.current = null;
            controller?.destroy();
            view.destroy();
            mermaid.destroy();
            root.replaceChildren();
            callbacks.current.onComposition(false);
        };
    }, [props.boardId, props.workspaceId, props.editing, scheduler, prepared]);

    useEffect(() => {
        session.current?.sync();
    }, [
        props.object.data,
        props.editing,
        props.readOnly,
        props.editorResetVersion,
    ]);

    useEffect(() => {
        if (!props.editing || props.readOnly) return;
        const root = host.current!;
        const point = props.editPoint?.current;
        if (props.editPoint) props.editPoint.current = null;
        const target = point
            ? document.elementFromPoint(point.x, point.y)
            : null;
        const cell =
            target instanceof Element && root.contains(target)
                ? target
                      .closest('td, th')
                      ?.querySelector<HTMLElement>('[role="button"]')
                : null;
        (cell ?? root.querySelector<HTMLElement>('[role="button"]'))?.click();
    }, [props.editing, props.readOnly, props.editPoint]);

    useEffect(() => {
        if (!props.editing) return;
        const root = host.current!;
        let blockToolbar: HTMLElement | null = null;
        function updateFormattingPriority() {
            blockToolbar =
                document
                    .getElementById(`board-formatting-${props.boardId}`)
                    ?.closest<HTMLElement>('.board-selection-tools') ?? null;
            if (!blockToolbar) return;
            const selection = document.getSelection();
            blockToolbar.dataset.textFormattingActive = String(
                Boolean(
                    selection &&
                    !selection.isCollapsed &&
                    root.contains(selection.anchorNode),
                ),
            );
        }
        document.addEventListener('selectionchange', updateFormattingPriority);
        updateFormattingPriority();
        return () => {
            document.removeEventListener(
                'selectionchange',
                updateFormattingPriority,
            );
            if (blockToolbar) delete blockToolbar.dataset.textFormattingActive;
        };
    }, [props.editing, props.boardId]);

    return (
        <div
            ref={host}
            tabIndex={-1}
            className="board-table orbium-table-container relative"
            onFocusCapture={() => props.onHistoryBoundary?.()}
            data-board-editor={props.editing || undefined}
            data-board-native-editor={props.editing || undefined}
            data-board-scroll={props.editing || undefined}
            onCompositionStart={() => props.onComposition(true)}
            onCompositionEnd={() => props.onComposition(false)}
            onKeyDown={(event) => {
                if (
                    !event.nativeEvent.isComposing &&
                    (event.key === 'Escape' ||
                        (event.key === 'Enter' &&
                            (event.ctrlKey || event.metaKey)))
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    props.onFinish();
                }
            }}
        />
    );
}
