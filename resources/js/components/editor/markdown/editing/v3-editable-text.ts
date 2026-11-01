// Summary: Resolves text-only editing limits without treating headers or wrapper closes as content; depends on the V3 index and presentation-aware body reader.
import type { EditorState } from '@codemirror/state';
import type { V3DocumentIndex } from '../structure/v3-document-index';
import type { V3Block } from '../structure/v3-structure-types';
import { readV3TextBody } from '../transactions/v3-text-body';
import { V3OperationError } from '../transactions/v3-transaction-types';

export function readV3EditableText(
    state: EditorState,
    index: V3DocumentIndex,
    block: V3Block,
) {
    const model = readV3TextBody({ state, index }, block);
    //
    // A raw body's trailing newlines include editable empty lines; a wrapper's trailing newlines are outside its closing fence.
    //
    const end = model.metadata
        ? model.contentFrom + model.content.length
        : block.bodyTo;
    return { model, from: model.contentFrom, to: end };
}

export function requireV3TextRange(request: {
    state: EditorState;
    index: V3DocumentIndex;
    block: V3Block;
    from: number;
    to: number;
}) {
    const text = readV3EditableText(
        request.state,
        request.index,
        request.block,
    );
    if (
        !Number.isInteger(request.from) ||
        !Number.isInteger(request.to) ||
        request.from < text.from ||
        request.to < request.from ||
        request.to > text.to
    )
        throw new V3OperationError(
            'protected-text-range',
            'Select text inside a single editable block body.',
        );
    return text;
}
