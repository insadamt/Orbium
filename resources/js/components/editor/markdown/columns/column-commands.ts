// Summary: Publishes column edits through the owning Document's guarded history; depends on rich-block source preservation and the column serializer.
import { isolateHistory } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import type { RichBlock } from '../rich/rich-model';
import { preservePresentation } from '../rich/widget-controls';
import { serializeOrbiumBlock } from '../dialect/metadata';
import { serializeColumns, type ColumnLayout } from './column-source';

export function columnLayoutSource(block: RichBlock, layout: ColumnLayout) {
    return preservePresentation(
        block,
        serializeColumns(layout),
        serializeOrbiumBlock,
    );
}

export function replaceColumnLayout(options: {
    owner: EditorView;
    block: RichBlock;
    layout: ColumnLayout;
    userEvent?: string;
}) {
    const { owner, block, layout, userEvent = 'input.columns' } = options;
    if (
        !owner.dom.isConnected ||
        !owner.state.facet(EditorView.editable) ||
        owner.state.readOnly ||
        owner.compositionStarted ||
        owner.state.sliceDoc(block.from, block.to) !== block.source
    )
        return false;
    const insert = columnLayoutSource(block, layout);
    if (insert === block.source) return true;
    owner.dispatch({
        changes: { from: block.from, to: block.to, insert },
        annotations:
            userEvent.startsWith('input.type') || userEvent.startsWith('delete')
                ? undefined
                : isolateHistory.of('full'),
        userEvent,
    });
    return true;
}
