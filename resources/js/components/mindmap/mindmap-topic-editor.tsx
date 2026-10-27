import { MindMapInlineIcons } from './mindmap-inline-icons';
import { useMindMapOwner } from './mindmap-owner-context';
import { createInlineIconNode } from '@/components/inline-icons/inline-icon-node';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextSelection } from '@tiptap/pm/state';
import { ReplaceStep } from '@tiptap/pm/transform';
import Placeholder from '@tiptap/extension-placeholder';
import type { JSONContent } from '@tiptap/core';
import { TextColor } from '@/components/editor/text-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
    mindMapTopicDocument,
    normalizeMindMapDocument,
} from './mindmap-topic-document';
import { MindMapCallout, useMindMapWritingMenu } from './mindmap-writing-menu';
import './mindmap-topic-document.css';
import { MindMapTextToolbar } from './mindmap-text-toolbar';
import type { MindMapTopic } from './mindmap-data';

type Props = {
    topic: MindMapTopic;
    onChange: (content: JSONContent, typing: boolean) => boolean;
    onComposition: (active: boolean) => void;
    onFinish: () => void;
};
export function MindMapTopicEditor(props: Props) {
    const owner = useMindMapOwner();
    const callbacks = useRef(props);
    callbacks.current = props;
    const editor = useEditor({
        extensions: [
            TextColor,
            createInlineIconNode(
                owner?.workspaceId ?? 0,
                owner?.nodeId ?? 0,
                owner?.kind,
            ),
            Placeholder.configure({
                placeholder: 'Type / for blocks or : for icons',
            }),
            TaskList,
            TaskItem.configure({ nested: true }),
            MindMapCallout,
            StarterKit.configure({
                undoRedo: false,
                heading: { levels: [1, 2, 3] },
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
        ],
        content: mindMapTopicDocument(props.topic),
        editorProps: {
            attributes: {
                class: 'mindmap-topic-writing',
                'aria-label': 'Topic text',
                role: 'textbox',
                'aria-multiline': 'true',
                dir: 'auto',
            },
            handleDOMEvents: {
                compositionstart: () => {
                    callbacks.current.onComposition(true);
                    return false;
                },
                compositionend: () => {
                    callbacks.current.onComposition(false);
                    return false;
                },
                blur: () => {
                    callbacks.current.onComposition(false);
                    return false;
                },
            },
            handleDrop: () => true,
        },
        onUpdate: ({ editor: current, transaction }) => {
            if (
                !callbacks.current.onChange(
                    normalizeMindMapDocument(current.getJSON()),
                    !transaction.getMeta('boardAction') &&
                        !['paste', 'cut'].includes(
                            transaction.getMeta('uiEvent'),
                        ) &&
                        transaction.steps.every(
                            (step) =>
                                step instanceof ReplaceStep &&
                                Array.from(
                                    { length: step.slice.content.childCount },
                                    (_, index) =>
                                        step.slice.content.child(index),
                                ).every((node) => node.isInline),
                        ),
                )
            ) {
                //
                // Rejected limits/conflicts must restore accepted text instead of leaving unsaved editor-only content.
                //
                queueMicrotask(() => {
                    if (!current.isDestroyed)
                        current.commands.setContent(
                            mindMapTopicDocument(callbacks.current.topic),
                            { emitUpdate: false },
                        );
                });
            }
        },
    });
    const writingMenu = useMindMapWritingMenu(editor);
    useLayoutEffect(() => {
        if (!editor) return;
        editor.commands.selectAll();
        editor.view.focus();
    }, [editor]);
    useLayoutEffect(() => {
        if (!editor) return;
        const content = mindMapTopicDocument(props.topic);
        if (
            JSON.stringify(normalizeMindMapDocument(editor.getJSON())) ===
            JSON.stringify(content)
        )
            return;
        const { anchor, head } = editor.state.selection;
        editor.commands.setContent(content, {
            emitUpdate: false,
        });
        const limit = editor.state.doc.content.size;
        editor.view.dispatch(
            editor.state.tr.setSelection(
                TextSelection.between(
                    editor.state.doc.resolve(Math.min(anchor, limit)),
                    editor.state.doc.resolve(Math.min(head, limit)),
                ),
            ),
        );
    }, [editor, props.topic]);
    useEffect(() => () => callbacks.current.onComposition(false), []);
    return (
        <div
            className="mindmap-topic-content mindmap-topic-editor"
            data-topic-measure
            data-mindmap-topic-editor
            onKeyDownCapture={(event) => {
                if (!event.currentTarget.contains(event.target as Node)) return;
                if (writingMenu.onKeyDown(event)) return;
                if (
                    (event.key === 'Escape' ||
                        (event.key === 'Enter' &&
                            (event.ctrlKey || event.metaKey))) &&
                    !event.nativeEvent.isComposing &&
                    !editor?.view.composing
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    props.onFinish();
                } else if (
                    event.key === 'Tab' &&
                    editor &&
                    !event.nativeEvent.isComposing &&
                    !editor.view.composing &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.altKey
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    const item = editor.isActive('taskItem')
                        ? 'taskItem'
                        : 'listItem';
                    if (event.shiftKey) editor.commands.liftListItem(item);
                    else editor.commands.sinkListItem(item);
                }
            }}
        >
            <EditorContent editor={editor} />
            {writingMenu.popup}
            {editor && <MindMapInlineIcons editor={editor} />}
            {editor && (
                <MindMapTextToolbar editor={editor} onFinish={props.onFinish} />
            )}
        </div>
    );
}
