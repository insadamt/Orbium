import { InlineIconPreview } from '@/components/inline-icons/inline-icon-preview';
import { Fragment, type ReactNode } from 'react';
import { isValidTextColor } from '@/components/editor/text-color';
import { safeBoardLink } from './board-block-data';
import type { BoardInline } from './board-types';

export function BoardInlinePreview({
    content,
    linksInteractive = true,
    workspaceId,
    nodeId,
}: {
    content: BoardInline[];
    workspaceId?: number;
    nodeId?: number;
    linksInteractive?: boolean;
}) {
    return (
        <>
            {content.map((node, index) => {
                if (node.type === 'hardBreak') return <br key={index} />;
                return (
                    <BoardInlineMarks
                        key={index}
                        marks={node.marks}
                        linksInteractive={linksInteractive}
                    >
                        {node.type === 'inlineIcon' && node.attrs ? (
                            <InlineIconPreview
                                attrs={node.attrs}
                                color={
                                    node.marks?.find(
                                        (mark) => mark.type === 'textColor',
                                    )?.attrs?.color
                                }
                                workspaceId={workspaceId}
                                nodeId={nodeId}
                                ownerKind="board"
                            />
                        ) : (
                            node.text
                        )}
                    </BoardInlineMarks>
                );
            })}
        </>
    );
}

export function BoardInlineMarks({
    marks,
    children,
    linksInteractive = true,
}: {
    marks?: BoardInline['marks'];
    children: ReactNode;
    linksInteractive?: boolean;
}) {
    let output = <Fragment>{children}</Fragment>;
    for (const mark of marks ?? []) {
        if (mark.type === 'bold') output = <strong>{output}</strong>;
        if (mark.type === 'italic') output = <em>{output}</em>;
        if (mark.type === 'underline') output = <u>{output}</u>;
        if (mark.type === 'strike') output = <s>{output}</s>;
        if (mark.type === 'code') output = <code>{output}</code>;
        if (
            mark.type === 'link' &&
            mark.attrs &&
            typeof mark.attrs.href === 'string' &&
            safeBoardLink(mark.attrs.href)
        )
            output = linksInteractive ? (
                <a
                    data-board-interactive
                    href={mark.attrs.href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {output}
                </a>
            ) : (
                <span className="underline">{output}</span>
            );
        if (
            mark.type === 'textColor' &&
            typeof mark.attrs?.color === 'string' &&
            isValidTextColor(mark.attrs.color)
        ) {
            const color = mark.attrs.color;
            output = (
                <span
                    data-text-color={color}
                    style={{
                        color: color.startsWith('preset:')
                            ? `var(--editor-text-color-${color.slice(7)})`
                            : color,
                    }}
                >
                    {output}
                </span>
            );
        }
    }
    return output;
}
