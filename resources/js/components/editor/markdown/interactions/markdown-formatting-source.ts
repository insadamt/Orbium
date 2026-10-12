import type { EditorState, Text } from '@codemirror/state';
import type { Tree } from '@lezer/common';
import { markdownSourceParser } from './markdown-source-parser';

const formattingTrees = new WeakMap<Text, Tree>();

export function markdownFormattingTree(state: EditorState): Tree {
    const existing = formattingTrees.get(state.doc);
    if (existing) return existing;
    const tree = markdownSourceParser.parse(state.doc.toString());
    formattingTrees.set(state.doc, tree);
    return tree;
}
