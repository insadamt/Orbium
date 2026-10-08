import { StateEffect } from '@codemirror/state';
import type { Tree } from '@lezer/common';

export const refreshRichBlocks = StateEffect.define<{
    from: number;
    to: number;
    tree: Tree;
}>();
export const toggleRichSource = StateEffect.define<{
    from: number;
    open: boolean;
}>();

export const revealRichSource = StateEffect.define<number>();
