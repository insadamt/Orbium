// Summary: Converts between literal code and text without activating code-looking references or deleting authored source; depends on safe fences, explicit body readers and the existing rich code parser.
import { EditorState } from '@codemirror/state';
import type { V3BlockType } from '../structure/v3-contract';
import type { V3Block } from '../structure/v3-structure-types';
import type { V3OperationContext } from './v3-transaction-types';
import { V3OperationError } from './v3-transaction-types';
import {
    readV3TextBody,
    paragraphV3Content,
    convertV3Content,
    writeV3TextBody,
    type V3TextBody,
} from './v3-text-body';
import { fencedCodeSource } from '../rich/code-widget';
import { readRichBlock } from '../rich/read-rich-block';
import { markdownSourceParser } from '../interactions/markdown-source-parser';

export function convertV3CodeBody(
    context: V3OperationContext,
    block: V3Block,
    type: V3BlockType,
): string | null {
    if (type !== 'code' && block.type !== 'code') return null;
    if (type === 'code') {
        const model = readV3TextBody(context, block);
        return writeV3TextBody(
            model,
            fencedCodeSource(paragraphV3Content(model), 'text'),
            type,
        );
    }
    const body = context.state.sliceDoc(block.bodyFrom, block.bodyTo);
    const node = markdownSourceParser.parse(body).topNode.firstChild;
    //
    // Parse with local coordinates so code examples cannot become page/attachment relationships when promoted to prose.
    //
    if (!node)
        throw new V3OperationError(
            'invalid-code',
            'Repair this code block before converting it.',
        );
    // The rich parser needs a real local document for multiline fence coordinates.
    const rich = readRichBlock(createLocalState(body), node);
    if (!rich || !['code', 'mermaid'].includes(rich.kind))
        throw new V3OperationError(
            'invalid-code',
            'Only literal code can use the code conversion.',
        );
    const model: V3TextBody = {
        type: 'paragraph',
        content: rich.content.replace(/[\\`*_{}<>#!|~[\]()+:=-]/g, '\\$&'),
        contentFrom: 0,
        metadata: Object.keys(rich.presentation).length
            ? rich.presentation
            : null,
        leading: '',
        trailing: /\n*$/.exec(body)![0],
    };
    return writeV3TextBody(model, convertV3Content(model, type), type);
}
function createLocalState(body: string) {
    return EditorState.create({ doc: body });
}
