import { useEffect } from 'react';
import type { Editor, EditorEvents } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import { isHistoryTransaction } from '@tiptap/pm/history';
import { animateAlignmentChange } from './alignment-motion';
import { renderedBlockMotionElements } from './block-formatting';

function layoutSignature(node: Node) {
    const signatures: unknown[] = [];
    function include(block: Node) {
        if (block.isBlock)
            signatures.push([
                block.type.name,
                block.attrs.dir,
                block.attrs.directionMode,
                block.attrs.textAlign,
                block.attrs.alignment,
            ]);
    }
    include(node);
    node.descendants(include);
    return JSON.stringify(signatures);
}

export function useHistoryLayoutMotion(editor: Editor | null) {
    useEffect(() => {
        if (!editor) return;
        function beforeHistory({
            transaction,
            nextState,
        }: EditorEvents['beforeTransaction']) {
            if (!isHistoryTransaction(transaction) || !transaction.docChanged)
                return;
            const previousDocument = editor!.state.doc;
            const start = previousDocument.content.findDiffStart(
                nextState.doc.content,
            );
            const end = previousDocument.content.findDiffEnd(
                nextState.doc.content,
            );
            if (start === null || !end) return;
            const positions = new Map<number, number>();
            previousDocument.nodesBetween(
                start,
                Math.max(start, end.a),
                (before, position, parent) => {
                    if (parent !== previousDocument) return false;
                    const mappedPosition = transaction.mapping.map(
                        position,
                        -1,
                    );
                    const after = nextState.doc.nodeAt(mappedPosition);
                    if (
                        after &&
                        before.type === after.type &&
                        before.textContent === after.textContent &&
                        layoutSignature(before) !== layoutSignature(after)
                    )
                        positions.set(position, mappedPosition);
                    return false;
                },
            );
            if (!positions.size) return;
            let updated = false;
            animateAlignmentChange({
                container: editor!.view.dom,
                readElements: () =>
                    Array.from(positions, ([before, after]) =>
                        renderedBlockMotionElements(
                            editor!,
                            updated ? after : before,
                        ),
                    ).flat(),
                applyChange: () => {
                    updated = true;
                },
            });
        }
        editor.on('beforeTransaction', beforeHistory);
        return () => {
            editor.off('beforeTransaction', beforeHistory);
        };
    }, [editor]);
}
