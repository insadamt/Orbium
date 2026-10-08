import { StateEffect } from '@codemirror/state';
import type { Tree } from '@lezer/common';
import type { RichBlock } from './rich-model';

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

export const discoverMermaidBlocks = StateEffect.define<RichBlock[]>();
export const refreshMermaidLayout = StateEffect.define<null>();
