import { useLayoutEffect, useRef } from 'react';
import type { ContentOwnerKind } from '@/components/editor/editor-api';
import type { InlineIconAttributes } from './inline-icon-data';
import { createInlineIconElement } from './inline-icon-dom';

export function InlineIconPreview({
    attrs,
    workspaceId = 0,
    nodeId = 0,
    ownerKind,
    color,
}: {
    attrs: InlineIconAttributes;
    workspaceId?: number;
    nodeId?: number;
    ownerKind?: ContentOwnerKind;
    color?: string;
}) {
    const host = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        const choice =
            attrs.kind === 'custom'
                ? {
                      kind: 'custom' as const,
                      label: attrs.label,
                      attachmentId: attrs.attachmentId!,
                  }
                : {
                      kind: 'builtin' as const,
                      label: attrs.label,
                      name: attrs.name!,
                      color,
                  };
        host.current?.replaceChildren(
            createInlineIconElement(choice, { workspaceId, nodeId, ownerKind }),
        );
    }, [attrs, workspaceId, nodeId, ownerKind, color]);
    return <span ref={host}>{attrs.label}</span>;
}
