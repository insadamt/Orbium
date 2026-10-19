import { Fragment } from 'react';
import { safeBoardLink } from './board-block-data';
import type { BoardInline } from './board-types';

export function BoardInlinePreview({ content }: { content: BoardInline[] }) {
    return (
        <>
            {content.map((node, index) => {
                if (node.type === 'hardBreak') return <br key={index} />;
                let output = <Fragment>{node.text}</Fragment>;
                for (const mark of node.marks ?? []) {
                    if (mark.type === 'bold')
                        output = <strong>{output}</strong>;
                    if (mark.type === 'italic') output = <em>{output}</em>;
                    if (mark.type === 'underline') output = <u>{output}</u>;
                    if (mark.type === 'strike') output = <s>{output}</s>;
                    if (mark.type === 'code') output = <code>{output}</code>;
                    if (
                        mark.type === 'link' &&
                        mark.attrs &&
                        safeBoardLink(mark.attrs.href)
                    )
                        output = (
                            <a
                                data-board-interactive
                                href={mark.attrs.href}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {output}
                            </a>
                        );
                }
                return <Fragment key={index}>{output}</Fragment>;
            })}
        </>
    );
}
