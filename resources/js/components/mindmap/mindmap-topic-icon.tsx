import { useLayoutEffect, useRef } from 'react';
import { createBuiltinIcon } from '@/components/inline-icons/icon-glyph-loader';
export function MindMapTopicIcon({ name }: { name?: string }) {
    const host = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        if (!name) return;
        const glyph = createBuiltinIcon(name);
        if (glyph) host.current?.replaceChildren(glyph);
    }, [name]);
    return name ? (
        <span ref={host} className="mindmap-topic-icon" aria-hidden="true" />
    ) : null;
}
