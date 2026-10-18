import type { createAttachmentPlayer } from '@/components/media/attachment-player';
import type { RichContext } from './rich-model';

type Player = NonNullable<ReturnType<typeof createAttachmentPlayer>>;
export type TransferredMediaPlayer = {
    attachmentId: string;
    take: () => Player | null;
};
const mountedPlayers = new WeakMap<HTMLElement, TransferredMediaPlayer>();
const incomingPlayers = new WeakMap<RichContext, TransferredMediaPlayer[]>();
const incomingRanges = new WeakMap<RichContext, { from: number; to: number }>();

export function registerTransferableMediaPlayer(
    root: HTMLElement,
    transfer: TransferredMediaPlayer,
) {
    mountedPlayers.set(root, transfer);
    return () => mountedPlayers.delete(root);
}

export function collectTransferableMediaPlayers(root: HTMLElement | null) {
    if (!root) return [];
    return [
        root,
        ...root.querySelectorAll<HTMLElement>('.attachment-player'),
    ].flatMap((element) => {
        const player = mountedPlayers.get(element);
        return player ? [player] : [];
    });
}

export function stageTransferredMediaPlayers(
    context: RichContext,
    players: TransferredMediaPlayer[],
    range: { from: number; to: number },
) {
    const staged = players.flatMap((candidate) => {
        const player = candidate.take();
        if (!player) return [];
        let available: Player | null = player;
        return [
            {
                attachmentId: candidate.attachmentId,
                take: () => {
                    const result = available;
                    available = null;
                    return result;
                },
            },
        ];
    });
    incomingPlayers.set(context, staged);
    incomingRanges.set(context, range);
    return () => {
        if (incomingPlayers.get(context) === staged) {
            incomingPlayers.delete(context);
            incomingRanges.delete(context);
        }
        for (const candidate of staged) candidate.take()?.destroy();
    };
}

export function claimTransferredMediaPlayer(
    context: RichContext,
    attachmentId: string,
    root: HTMLElement,
) {
    const range = incomingRanges.get(context);
    const position = Number(
        root.closest<HTMLElement>('[data-rich-from]')?.dataset.richFrom,
    );
    if (
        !range ||
        !Number.isFinite(position) ||
        position < range.from ||
        position > range.to
    )
        return null;
    const incoming = incomingPlayers.get(context);
    const index =
        incoming?.findIndex(
            (candidate) => candidate.attachmentId === attachmentId,
        ) ?? -1;
    if (!incoming || index < 0) return null;
    return incoming.splice(index, 1)[0].take();
}
