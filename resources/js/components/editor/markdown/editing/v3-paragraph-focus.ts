// Summary: Reuses a compatible following writing paragraph on Enter instead of accumulating unused empty blocks; depends on scoped text models, current selection and normal projection selection forwarding.
import type { EditorView } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import type { V3BlockOperation } from '../transactions/v3-transaction-types';
import { readV3TextBody, writeV3TextBody } from '../transactions/v3-text-body';
import { v3BodyCaretPosition } from './v3-live-selection';

export function focusV3FollowingEmptyParagraph(
    view: EditorView,
    operation: V3BlockOperation,
) {
    if (operation.kind !== 'exit-text' || !view.state.selection.main.empty)
        return false;
    const index = view.state.field(v3StructureField).current;
    const block = index.blockById(operation.blockId);
    if (block?.type !== 'paragraph') return false;
    const next = index.neighbor(block.id, 1);
    if (next?.type !== 'paragraph') return false;
    try {
        const current = readV3TextBody({ state: view.state, index }, block);
        const following = readV3TextBody({ state: view.state, index }, next);
        if (
            following.content.trim() ||
            writeV3TextBody({ ...current, trailing: '\n' }, '') !==
                writeV3TextBody({ ...following, trailing: '\n' }, '')
        )
            return false;
    } catch {
        //
        // An opaque presentation cannot prove a compatible writing target; keep the checked insertion path instead.
        //
        return false;
    }
    view.dispatch({
        selection: { anchor: v3BodyCaretPosition(view.state, index, next) },
        userEvent: 'select.v3.paragraph',
    });
    view.focus();
    return true;
}
