import { useLayoutEffect, useRef } from 'react';
import { createBuiltinIcon, type InlineIconChoice } from './icon-catalog';
import { attachmentUrl } from '@/components/editor/editor-api';

export function InlineIconGlyph({
    choice,
    workspaceId,
    nodeId,
    previewUrl,
}: {
    choice: InlineIconChoice;
    workspaceId: number;
    nodeId: number;
    previewUrl?: string;
}) {
    const host = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        if (choice.kind !== 'builtin') return;
        const icon = createBuiltinIcon(choice.name);
        if (icon) host.current?.replaceChildren(icon);
    }, [choice]);
    if (choice.kind === 'emoji')
        return <span aria-hidden="true">{choice.value}</span>;
    if (choice.kind === 'custom')
        return (
            <img
                className="size-5 object-contain"
                alt=""
                loading="lazy"
                draggable={false}
                src={
                    previewUrl ??
                    attachmentUrl(workspaceId, nodeId, choice.attachmentId)
                }
            />
        );
    return <span ref={host} className="inline-icon-glyph" aria-hidden="true" />;
}
