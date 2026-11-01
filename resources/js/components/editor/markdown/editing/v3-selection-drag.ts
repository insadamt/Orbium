// Summary: Captures an ordered handle selection for the existing drag controller to consume without writing source; depends on owner-local selection and stale-state guards, deferring cross-column cleanup to stage 5.
import type { EditorState } from '@codemirror/state';
import { v3StructureField } from '../structure/v3-structure-state';
import {
    consecutiveV3Blocks,
    sourceV3Range,
} from '../transactions/v3-source-edits';
import {
    V3OperationError,
    type V3InsertionTarget,
    type V3BlockOperation,
} from '../transactions/v3-transaction-types';
import { v3BlockSelectionField } from './v3-block-selection';

export function captureV3SelectionDrag(request: {
    owner: object;
    state: EditorState;
    grabbedId: string;
}) {
    const index = request.state.field(v3StructureField).current;
    const selection = request.state.field(v3BlockSelectionField);
    const ids = selection?.ids.includes(request.grabbedId)
        ? [...selection.ids]
        : [request.grabbedId];
    const blocks = consecutiveV3Blocks(
        {
            state: request.state,
            index,
            allocateIdentity: () => {
                throw new Error('Drag capture never allocates identities.');
            },
        },
        ids,
    );
    return {
        ids,
        range: sourceV3Range(blocks),
        createMove(current: {
            owner: object;
            state: EditorState;
            target: V3InsertionTarget;
        }): V3BlockOperation {
            if (
                current.owner !== request.owner ||
                current.state !== request.state
            )
                throw new V3OperationError(
                    'stale-drag-selection',
                    'The owning document changed during this drag. Cancel and drag again.',
                );
            return { kind: 'move', blockIds: ids, target: current.target };
        },
    };
}
