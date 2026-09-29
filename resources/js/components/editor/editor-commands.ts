import type { Editor } from '@tiptap/core';

export type BlockCommand = {
    label: string;
    search: string;
    run: (editor: Editor) => void;
};

export const blockCommands: BlockCommand[] = [
    {
        label: 'Text',
        search: 'paragraph plain',
        run: (editor) => {
            editor.chain().focus().setParagraph().run();
        },
    },
    {
        label: 'Heading 1',
        search: 'h1 title',
        run: (editor) => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
        },
    },
    {
        label: 'Heading 2',
        search: 'h2 subtitle',
        run: (editor) => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
        },
    },
    {
        label: 'Heading 3',
        search: 'h3',
        run: (editor) => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
        },
    },
    {
        label: 'Bullet list',
        search: 'unordered bullet',
        run: (editor) => {
            editor.chain().focus().toggleBulletList().run();
        },
    },
    {
        label: 'Numbered list',
        search: 'ordered number',
        run: (editor) => {
            editor.chain().focus().toggleOrderedList().run();
        },
    },
    {
        label: 'Checklist',
        search: 'task todo checkbox',
        run: (editor) => {
            editor.chain().focus().toggleTaskList().run();
        },
    },
    {
        label: 'Quote',
        search: 'blockquote',
        run: (editor) => {
            editor.chain().focus().toggleBlockquote().run();
        },
    },
    {
        label: 'Callout',
        search: 'note aside',
        run: (editor) => {
            editor
                .chain()
                .focus()
                .insertContent({
                    type: 'callout',
                    content: [{ type: 'paragraph' }],
                })
                .run();
        },
    },
    {
        label: 'Code',
        search: 'code block programming',
        run: (editor) => {
            editor
                .chain()
                .focus()
                .setCodeBlock({ language: 'plaintext' })
                .run();
        },
    },
    {
        label: 'Table',
        search: 'grid',
        run: (editor) => {
            editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
        },
    },
    {
        label: 'Mermaid',
        search: 'diagram flowchart',
        run: (editor) => {
            editor
                .chain()
                .focus()
                .insertContent({
                    type: 'mermaid',
                    attrs: { source: 'graph TD\n  A --> B' },
                })
                .run();
        },
    },
    {
        label: 'Math',
        search: 'equation latex',
        run: (editor) => {
            editor.chain().focus().insertBlockMath({ latex: 'E = mc^2' }).run();
        },
    },
    {
        label: 'Divider',
        search: 'line horizontal rule',
        run: (editor) => {
            editor.chain().focus().setHorizontalRule().run();
        },
    },
];

export function findBlockCommands(query: string): BlockCommand[] {
    const normalized = query.toLowerCase().trim();
    return blockCommands.filter((command) =>
        `${command.label} ${command.search}`.toLowerCase().includes(normalized),
    );
}
