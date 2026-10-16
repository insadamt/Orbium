import { useDocumentTab } from '@/components/navigation/document-tab-context';
import { useEffect, useRef } from 'react';
import { createAttachmentPlayer } from './attachment-player';

export function AttachmentPreview({
    url,
    name,
    mime,
}: {
    url: string;
    name: string;
    mime: string;
}) {
    const { visible } = useDocumentTab();
    const visibility = useRef(visible);
    visibility.current = visible;
    const playerRef = useRef<ReturnType<typeof createAttachmentPlayer>>(null);
    const host = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const player = createAttachmentPlayer({
            url,
            name,
            mime,
            isVisible: () => visibility.current,
        });
        playerRef.current = player;
        if (player) host.current?.append(player.root);
        return () => player?.destroy();
    }, [url, name, mime]);
    useEffect(() => {
        if (!visible) playerRef.current?.pause();
    }, [visible]);
    return <div className="w-full min-w-0" ref={host} />;
}
