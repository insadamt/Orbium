import './mindmap-topic-document.css';
import type { JSONContent } from '@tiptap/core';
import { MindMapInlinePreview } from './mindmap-inline-preview';
import type { MindMapTopic } from './mindmap-data';
import { mindMapTopicDocument } from './mindmap-topic-document';

export function MindMapTopicPreview({
    topic,
    linksInteractive,
}: {
    topic: MindMapTopic;
    linksInteractive: boolean;
}) {
    function render(node: JSONContent, index: number): React.ReactNode {
        const children = (node.content ?? []).map(render);
        const inline = (
            <MindMapInlinePreview
                content={node.content ?? []}
                linksInteractive={linksInteractive}
            />
        );
        switch (node.type) {
            case 'paragraph':
                return (
                    <p key={index}>
                        {inline}
                        <br hidden={Boolean(node.content?.length)} />
                    </p>
                );
            case 'heading': {
                const Heading = `h${node.attrs?.level ?? 1}` as
                    | 'h1'
                    | 'h2'
                    | 'h3';
                return <Heading key={index}>{inline}</Heading>;
            }
            case 'codeBlock':
                return (
                    <pre key={index}>
                        <code>
                            {(node.content ?? [])
                                .map((child) => child.text)
                                .join('')}
                        </code>
                    </pre>
                );
            case 'bulletList':
                return <ul key={index}>{children}</ul>;
            case 'orderedList':
                return (
                    <ol key={index} start={node.attrs?.start ?? 1}>
                        {children}
                    </ol>
                );
            case 'taskList':
                return (
                    <ul key={index} data-type="taskList">
                        {children}
                    </ul>
                );
            case 'listItem':
                return <li key={index}>{children}</li>;
            case 'taskItem':
                return (
                    <li
                        key={index}
                        data-type="taskItem"
                        data-checked={Boolean(node.attrs?.checked)}
                    >
                        <span
                            className="mindmap-task-check"
                            aria-label={
                                node.attrs?.checked ? 'Checked' : 'Unchecked'
                            }
                        >
                            {node.attrs?.checked ? '✓' : ''}
                        </span>
                        <div>{children}</div>
                    </li>
                );
            case 'blockquote':
                return <blockquote key={index}>{children}</blockquote>;
            case 'callout':
                return (
                    <aside key={index} data-callout>
                        {children}
                    </aside>
                );
            default:
                return null;
        }
    }
    return (
        <div className="mindmap-topic-document">
            {mindMapTopicDocument(topic).content?.map(render)}
        </div>
    );
}
