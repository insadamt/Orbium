import { StateEffect, StateField } from '@codemirror/state';

export type MarkdownUploadAnchor = {
    id: string;
    from: number;
    to: number;
    source: string;
};
export const setMarkdownUploadAnchor =
    StateEffect.define<MarkdownUploadAnchor | null>();

export const markdownUploadAnchor =
    StateField.define<MarkdownUploadAnchor | null>({
        create: () => null,
        update(anchor, transaction) {
            if (anchor && transaction.docChanged)
                anchor = {
                    ...anchor,
                    from: transaction.changes.mapPos(anchor.from, 1),
                    to: transaction.changes.mapPos(anchor.to, -1),
                };
            for (const effect of transaction.effects)
                if (effect.is(setMarkdownUploadAnchor)) anchor = effect.value;
            return anchor;
        },
    });
