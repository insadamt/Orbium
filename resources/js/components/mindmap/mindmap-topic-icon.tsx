import { inlineIconColorStyle } from '@/components/inline-icons/inline-icon-color';
import { useLayoutEffect, useRef } from 'react';
import { createBuiltinIcon } from '@/components/inline-icons/icon-glyph-loader';
export function MindMapTopicIcon({
    name,
    color,
}: {
    name?: string;
    color?: string;
}) {
    const host = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        if (!name) return;
        const glyph = createBuiltinIcon(name);
        if (glyph) host.current?.replaceChildren(glyph);
    }, [name]);
    return name ? (
        <span
            ref={host}
            className="mindmap-topic-icon"
            style={{ color: inlineIconColorStyle(color) }}
            aria-hidden="true"
        />
    ) : null;
}
