import { Fragment, useLayoutEffect, useRef } from 'react';
import type { JSONContent } from '@tiptap/core';
import {
    BoardInlineMarks,
    BoardInlinePreview,
} from '@/components/boards/board-inline-text';
import type { BoardInline } from '@/components/boards/board-types';
import { createInlineIconElement } from '@/components/inline-icons/inline-icon-dom';
import { useMindMapOwner } from './mindmap-owner-context';

function PreviewIcon({ node }: { node: JSONContent }) {
    const owner = useMindMapOwner();
    const host = useRef<HTMLSpanElement>(null);
    const { kind, name, attachmentId, label } = node.attrs ?? {};
    const workspaceId = owner?.workspaceId;
    const nodeId = owner?.nodeId;
    const ownerKind = owner?.kind;
    useLayoutEffect(() => {
        if (!label || (kind === 'custom' && !workspaceId)) return;
        const choice =
            kind === 'custom'
                ? {
                      kind: 'custom' as const,
                      attachmentId: attachmentId as number,
                      label: label as string,
                  }
                : {
                      kind: 'builtin' as const,
                      name: name as string,
                      label: label as string,
                  };
        host.current?.replaceChildren(
            createInlineIconElement(choice, {
                workspaceId: workspaceId ?? 0,
                nodeId: nodeId ?? 0,
                ownerKind,
            }),
        );
    }, [kind, name, attachmentId, label, workspaceId, nodeId, ownerKind]);
    return <span ref={host}>{node.attrs?.label}</span>;
}
export function MindMapInlinePreview({
    content,
    linksInteractive,
}: {
    content: JSONContent[];
    linksInteractive: boolean;
}) {
    return (
        <>
            {content.map((node, index) => (
                <Fragment key={index}>
                    {node.type === 'inlineIcon' ? (
                        <BoardInlineMarks
                            marks={node.marks as BoardInline['marks']}
                            linksInteractive={linksInteractive}
                        >
                            <PreviewIcon node={node} />
                        </BoardInlineMarks>
                    ) : (
                        <BoardInlinePreview
                            content={[node as BoardInline]}
                            linksInteractive={linksInteractive}
                        />
                    )}
                </Fragment>
            ))}
        </>
    );
}
