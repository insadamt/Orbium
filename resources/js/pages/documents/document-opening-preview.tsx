import { markEditorPerformance } from '@/lib/editor-performance';
import { useEffect, type ReactNode } from 'react';
import type { EditorDocument } from '@/components/editor/editor-api';

const visibleBlockLimit = 18;
const visibleTextLimit = 700;

function openingText(node: EditorDocument, limit = visibleTextLimit): string {
    if (limit <= 0) return '';
    if (node.type === 'hardBreak') return '\n';
    if (node.type === 'mention')
        return typeof node.attrs?.label === 'string'
            ? node.attrs.label.slice(0, limit)
            : '';
    if (node.text) return node.text.slice(0, limit);

    let text = '';
    for (const child of node.content ?? []) {
        text += openingText(child, limit - text.length);
        if (text.length >= limit) break;
    }
    return text;
}

function openingBlock(block: EditorDocument, index: number): ReactNode {
    const text = openingText(block) || '\u00a0';
    const direction = block.attrs?.dir === 'rtl' ? 'rtl' : 'ltr';

    switch (block.type) {
        case 'heading': {
            const level = Number(block.attrs?.level);
            if (level === 1)
                return (
                    <h1 key={index} dir={direction}>
                        {text}
                    </h1>
                );
            if (level === 2)
                return (
                    <h2 key={index} dir={direction}>
                        {text}
                    </h2>
                );
            return (
                <h3 key={index} dir={direction}>
                    {text}
                </h3>
            );
        }
        case 'horizontalRule':
            return <hr key={index} />;
        case 'codeBlock':
            return (
                <pre key={index} dir="ltr">
                    <code>{text}</code>
                </pre>
            );
        case 'blockquote':
            return (
                <blockquote key={index} dir={direction}>
                    {text}
                </blockquote>
            );
        case 'bulletList':
        case 'orderedList': {
            const items = (block.content ?? [])
                .slice(0, 4)
                .map((item, itemIndex) => (
                    <li key={itemIndex}>{openingText(item)}</li>
                ));
            return block.type === 'bulletList' ? (
                <ul key={index} dir={direction}>
                    {items}
                </ul>
            ) : (
                <ol key={index} dir={direction}>
                    {items}
                </ol>
            );
        }
        default:
            return (
                <p key={index} dir={direction}>
                    {text}
                </p>
            );
    }
}

export default function DocumentOpeningPreview({
    content,
}: {
    content: EditorDocument;
}) {
    useEffect(() => {
        markEditorPerformance('opening-preview.mounted', { once: true });
    }, []);
    return (
        <div className="orbium-editor min-h-[45vh]" aria-busy="true">
            {(content.content ?? [])
                .slice(0, visibleBlockLimit)
                .map(openingBlock)}
        </div>
    );
}
