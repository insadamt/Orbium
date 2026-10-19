import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Selection, TextSelection } from '@tiptap/pm/state';
import { AddMarkStep, RemoveMarkStep } from '@tiptap/pm/transform';
import type { JSONContent } from '@tiptap/core';
import { plainInline } from './board-block-data';
import {
    nativeEditorData,
    nativeEditorDocument,
    nativeEditorExtensions,
    nativeStructureChanged,
} from './board-native-editor-schema';
import { BoardSelectionFormatting } from './board-selection-formatting';
import { BoardWritingMenu } from './board-writing-menu';
import type { BoardContentProps } from './board-text-block';

export function BoardNativeEditor(props: BoardContentProps) {
    const callbacks = useRef(props);
    callbacks.current = props;
    const [toolbar, setToolbar] = useState<HTMLElement | null>(null);
    const [, refresh] = useState(0);
    const appliedResetVersion = useRef(props.editorResetVersion);
    const [extensions] = useState(() => [
        ...nativeEditorExtensions(props.object.block_type, () =>
            callbacks.current.onFinish(),
        ),
        StarterKit.configure({
            document: false,
            undoRedo: false,
            heading: false,
            bulletList: false,
            orderedList: false,
            listItem: false,
            listKeymap: false,
            blockquote: false,
            codeBlock: false,
            horizontalRule: false,
            trailingNode: false,
            dropcursor: false,
            gapcursor: false,
            link: {
                openOnClick: false,
                HTMLAttributes: {
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            },
        }),
    ]);
    const editor = useEditor({
        extensions,
        content: nativeEditorDocument(
            props.object.block_type,
            props.object.data,
        ),
        editable: !props.readOnly,
        editorProps: {
            attributes: {
                class: 'board-inline-input',
                'aria-label': `Board ${props.object.block_type}`,
                role: 'textbox',
                'aria-multiline': 'true',
            },
            handleKeyDown: (_view, event) => {
                if (event.isComposing || _view.composing) return false;
                const current = callbacks.current;
                if (event.key === 'Escape') {
                    event.preventDefault();
                    current.onFinish();
                    return true;
                }
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    current.onFinish();
                    return true;
                }
                if (
                    event.key === 'Enter' &&
                    (current.object.block_type !== 'list' || event.shiftKey)
                ) {
                    event.preventDefault();
                    editor?.commands.setHardBreak();
                    return true;
                }
                return false;
            },
            handlePaste: (_view, event) => {
                const text = event.clipboardData?.getData('text/plain');
                if (text === undefined || event.clipboardData?.files.length)
                    return false;
                event.preventDefault();
                editor
                    ?.chain()
                    .command(({ tr }) => {
                        tr.setMeta('boardAction', true);
                        return true;
                    })
                    .insertContent(plainInline(text) as JSONContent[])
                    .run();
                return true;
            },
            handleDrop: () => true,
            handleDOMEvents: {
                compositionstart: () => {
                    callbacks.current.onComposition(true);
                    return false;
                },
                compositionend: () => {
                    callbacks.current.onComposition(false);
                    return false;
                },
            },
        },
        onUpdate: ({ editor: current, transaction }) => {
            if (!transaction.docChanged) return;
            const latest = callbacks.current;
            const next = nativeEditorData(
                latest.object.block_type,
                latest.object.data,
                current.getJSON(),
            );
            if (JSON.stringify(next) === JSON.stringify(latest.object.data))
                return;
            const structural =
                transaction.getMeta('boardAction') ||
                transaction.getMeta('uiEvent') === 'cut' ||
                transaction.steps.some(
                    (step) =>
                        step instanceof AddMarkStep ||
                        step instanceof RemoveMarkStep,
                ) ||
                nativeStructureChanged(
                    latest.object.block_type,
                    latest.object.data,
                    next,
                );
            if (!latest.onChange(next, structural ? 'action' : 'typing'))
                current.commands.setContent(
                    nativeEditorDocument(
                        latest.object.block_type,
                        latest.object.data,
                    ),
                    { emitUpdate: false },
                );
        },
        onSelectionUpdate: ({ transaction }) => {
            if (!transaction.docChanged)
                callbacks.current.onHistoryBoundary?.();
            refresh((value) => value + 1);
        },
        onTransaction: ({ transaction }) => {
            if (transaction.storedMarksSet) refresh((value) => value + 1);
        },
    });
    useEffect(() => {
        if (!editor) return;
        if (appliedResetVersion.current === props.editorResetVersion) return;
        appliedResetVersion.current = props.editorResetVersion;
        //
        // Only explicit history/conversion changes replace the editor. Echoing each typed snapshot can overwrite a newer caret or IME composition.
        //
        const desired = nativeEditorDocument(
            props.object.block_type,
            props.object.data,
        );
        const current = nativeEditorData(
            props.object.block_type,
            props.object.data,
            editor.getJSON(),
        );
        if (JSON.stringify(current) !== JSON.stringify(props.object.data)) {
            const { anchor, head } = editor.state.selection;
            editor.commands.setContent(desired, { emitUpdate: false });
            const limit = editor.state.doc.content.size;
            editor.view.dispatch(
                editor.state.tr.setSelection(
                    TextSelection.between(
                        editor.state.doc.resolve(Math.min(anchor, limit)),
                        editor.state.doc.resolve(Math.min(head, limit)),
                    ),
                ),
            );
        }
    }, [
        editor,
        props.editorResetVersion,
        props.object.data,
        props.object.block_type,
    ]);
    useEffect(() => {
        editor?.setEditable(!props.readOnly, false);
        editor?.view.dom
            .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
            .forEach((checkbox) => {
                checkbox.disabled = props.readOnly;
            });
    }, [editor, props.readOnly]);
    useLayoutEffect(() => {
        if (!editor || callbacks.current.readOnly) return;
        const point = callbacks.current.editPoint?.current;
        if (callbacks.current.editPoint)
            callbacks.current.editPoint.current = null;
        const position = point
            ? editor.view.posAtCoords({ left: point.x, top: point.y })
            : null;
        const selection = position
            ? TextSelection.near(editor.state.doc.resolve(position.pos))
            : callbacks.current.object.block_type === 'table'
              ? Selection.atStart(editor.state.doc)
              : Selection.atEnd(editor.state.doc);
        //
        // The first keystroke must reach this editor; stacking animation-frame focus calls leaves the canvas active after edit entry.
        //
        editor.view.dispatch(editor.state.tr.setSelection(selection));
        editor.view.focus();
    }, [editor]);
    useEffect(() => {
        setToolbar(
            document.getElementById(`board-formatting-${props.boardId}`),
        );
        return () => callbacks.current.onComposition(false);
    }, [props.boardId]);
    return (
        <div data-board-editor data-board-native-editor>
            {editor && (
                <BoardSelectionFormatting
                    editor={editor}
                    disabled={props.readOnly}
                />
            )}
            {editor && <BoardWritingMenu {...props} editor={editor} />}
            {editor &&
                toolbar &&
                createPortal(
                    <>
                        {props.object.block_type === 'list' && (
                            <select
                                aria-label="List style"
                                disabled={props.readOnly}
                                value={props.object.data.list_style}
                                onChange={(event) => {
                                    props.onChange(
                                        {
                                            ...props.object.data,
                                            list_style: event.target.value as
                                                | 'bullet'
                                                | 'ordered'
                                                | 'check',
                                        },
                                        'action',
                                    );
                                }}
                            >
                                <option value="bullet">Bullets</option>
                                <option value="ordered">Numbers</option>
                                <option value="check">Checklist</option>
                            </select>
                        )}
                        {props.object.block_type === 'table' && (
                            <div className="board-table-actions">
                                <button
                                    type="button"
                                    disabled={
                                        props.readOnly ||
                                        props.object.data.rows!.length >= 100
                                    }
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus(undefined, {
                                                scrollIntoView: false,
                                            })
                                            .addRowAfter()
                                            .run()
                                    }
                                >
                                    + Row
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        props.readOnly ||
                                        props.object.data.rows![0].length >= 30
                                    }
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus(undefined, {
                                                scrollIntoView: false,
                                            })
                                            .addColumnAfter()
                                            .run()
                                    }
                                >
                                    + Column
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        props.readOnly ||
                                        props.object.data.rows!.length <= 1
                                    }
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus(undefined, {
                                                scrollIntoView: false,
                                            })
                                            .deleteRow()
                                            .run()
                                    }
                                >
                                    Remove row
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        props.readOnly ||
                                        props.object.data.rows![0].length <= 1
                                    }
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus(undefined, {
                                                scrollIntoView: false,
                                            })
                                            .deleteColumn()
                                            .run()
                                    }
                                >
                                    Remove column
                                </button>
                            </div>
                        )}
                    </>,
                    toolbar,
                )}
            <EditorContent editor={editor} />
        </div>
    );
}
