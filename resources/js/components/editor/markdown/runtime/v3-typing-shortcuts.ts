// Summary: Publishes Markdown prefix shortcuts as explicit stable-ID type changes; depends on owner transactions so typing a heading/list never leaves a paragraph with an inferred saved type.
import { EditorView } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import { dispatchV3ProductOperation } from './v3-product-commands';
import type { V3BlockType } from '../structure/v3-contract';
import { readV3EditableText } from '../editing/v3-editable-text';
import { writeV3TextBody } from '../transactions/v3-text-body';

export function v3TypingShortcuts(onNotice: (message: string) => void) {
    return EditorView.inputHandler.of((view, from, to, text) => {
        if (view.composing || view.compositionStarted || from !== to)
            return false;
        const block = view.state.field(v3StructureField).current.blockAt(from);
        if (!block || !['paragraph', 'bullet-list'].includes(block.type))
            return false;
        const index = view.state.field(v3StructureField).current;
        const editable = readV3EditableText(view.state, index, block);
        const line = view.state.doc.lineAt(from);
        if (from !== line.to || line.from < editable.from) return false;
        const linePrefix = view.state.sliceDoc(line.from, from);
        if (
            block.type === 'paragraph' &&
            (((text === '`' || text === '~') &&
                new RegExp(`^ {0,3}${text}{2}$`).test(linePrefix)) ||
                (text === '$' && /^ {0,3}\$$/.test(linePrefix)) ||
                (text === ' ' &&
                    /^ {0,3}\+\+(?:block|endblock)$/.test(linePrefix)))
        ) {
            //
            // Keep the visible opening as paragraph prose until Enter can publish a complete fence without an invalid intermediate owner source.
            //
            const indent = /^ */.exec(linePrefix)![0];
            try {
                view.dispatch({
                    changes: [
                        { from: line.from + indent.length, insert: '\\' },
                        { from, to, insert: text },
                    ],
                    selection: { anchor: from + 1 + text.length },
                    userEvent: 'input.type',
                });
            } catch (error) {
                onNotice(
                    error instanceof Error
                        ? error.message
                        : 'Could not begin a code fence.',
                );
            }
            return true;
        }
        if (line.from !== editable.from) return false;
        if (text !== ' ') return false;
        const prefix = `${line.text} `;
        const heading = /^(#{1,6}) $/.exec(prefix);
        let type: V3BlockType | null = heading
            ? (`heading-${heading[1].length}` as V3BlockType)
            : null;
        if (/^[-+*] $/.test(prefix)) type = 'bullet-list';
        if (/^\d+[.)] $/.test(prefix)) type = 'numbered-list';
        if (/^[-+*] \[[ xX]\] $/.test(prefix)) type = 'checklist';
        if (prefix === '> ') type = 'quote';
        if (!type || type === block.type) return false;
        try {
            dispatchV3ProductOperation(view, {
                kind: 'replace-block',
                blockId: block.id,
                type,
                body: writeV3TextBody(
                    editable.model,
                    prefix +
                        view.state.sliceDoc(
                            to,
                            editable.model.contentFrom +
                                editable.model.content.length,
                        ),
                    type,
                ),
                caret: editable.model.metadata ? undefined : prefix.length,
            });
        } catch (error) {
            onNotice(
                error instanceof Error
                    ? error.message
                    : 'Could not change the block type.',
            );
        }
        return true;
    });
}
