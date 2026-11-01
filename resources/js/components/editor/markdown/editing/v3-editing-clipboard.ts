// Summary: Resolves selected block clipboard payloads and paste commands without exposing structural headers; depends on owner-local selection, scoped native clipboard data and V3 paste normalization.
import type { EditorState } from '@codemirror/state';
import { v3StructureField } from '../structure/v3-structure-state';
import {
    consecutiveV3Blocks,
    sourceV3Range,
} from '../transactions/v3-source-edits';
import type { V3BlockOperation } from '../transactions/v3-transaction-types';
import { V3OperationError } from '../transactions/v3-transaction-types';
import { isV3TextType } from '../transactions/v3-text-body';
import { v3BlockSelectionField } from './v3-block-selection';
import {
    decodeV3Clipboard,
    encodeV3Clipboard,
    normalizeV3PastedMarkdown,
    v3ClipboardMime,
} from './v3-paste-source';

export function selectedV3BlockClipboard(
    state: EditorState,
    scope: string,
    blockIds?: readonly string[],
) {
    const index = state.field(v3StructureField).current;
    const selected = blockIds ?? state.field(v3BlockSelectionField)?.ids;
    if (!selected?.length) return null;
    const blocks = consecutiveV3Blocks(
        {
            state,
            index,
            allocateIdentity: () => {
                throw new Error('Clipboard reads never allocate identities.');
            },
        },
        selected,
    );
    const range = sourceV3Range(blocks);
    const source = state.sliceDoc(range.from, range.to);
    const removals = [
        ...index.structure.blocks
            .filter((block) => block.from >= range.from && block.to <= range.to)
            .map((block) => ({ from: block.from, to: block.bodyFrom })),
        ...index.structure.directives
            .filter(
                (directive) =>
                    directive.from >= range.from &&
                    directive.to <= range.to &&
                    ['columns', 'column'].includes(directive.metadata.kind),
            )
            .flatMap((directive) => [
                { from: directive.from, to: directive.bodyFrom },
                { from: directive.bodyTo, to: directive.to },
            ]),
    ].sort((left, right) => right.from - left.from);
    let plain = source;
    for (const span of removals)
        plain =
            plain.slice(0, span.from - range.from) +
            plain.slice(span.to - range.from);
    return {
        source,
        plain,
        native: encodeV3Clipboard({ source, scope }),
        ids: selected,
    };
}

export function resolveV3PasteOperation(request: {
    state: EditorState;
    text: string;
    native?: string;
    scope: string;
}): V3BlockOperation | null {
    const { state } = request;
    const normalized = request.native
        ? {
              source: decodeV3Clipboard({
                  value: request.native,
                  scope: request.scope,
              }),
              inline: null,
          }
        : normalizeV3PastedMarkdown(request.text);
    const selected = state.field(v3BlockSelectionField)?.ids;
    if (selected?.length) {
        if (!normalized.source) return null;
        return {
            kind: 'paste-blocks',
            blockIds: selected,
            source: normalized.source,
        };
    }
    const selection = state.selection.main;
    const index = state.field(v3StructureField).current;
    const block = index.blockAt(selection.head);
    if (!block && index.valid && !index.structure.blocks.length)
        return normalized.source
            ? {
                  kind: 'paste-at',
                  target: { parentId: null },
                  source: normalized.source,
              }
            : null;
    if (!block)
        throw new V3OperationError(
            'missing-paste-target',
            'Focus an editable block or select complete blocks before pasting.',
        );
    if (!isV3TextType(block.type) && normalized.source) {
        const next = index.neighbor(block.id, 1);
        return {
            kind: 'paste-at',
            target: {
                parentId: block.parentId,
                ...(next ? { beforeId: next.id } : {}),
            },
            source: normalized.source,
        };
    }
    if (normalized.inline !== null)
        return {
            kind: 'edit-text',
            blockId: block.id,
            from: selection.from,
            to: selection.to,
            insert: normalized.inline,
        };
    return {
        kind: 'paste',
        blockId: block.id,
        from: selection.from,
        to: selection.to,
        source: normalized.source,
    };
}

export { v3ClipboardMime };

export function readV3PlainTextSelection(state: EditorState) {
    const index = state.field(v3StructureField).current;
    const selection = state.selection.main;
    const spans = [
        ...index.structure.blocks.map((block) => ({
            from: block.from,
            to: block.bodyFrom,
        })),
        ...index.structure.directives
            .filter((directive) =>
                ['columns', 'column'].includes(directive.metadata.kind),
            )
            .flatMap((directive) => [
                { from: directive.from, to: directive.bodyFrom },
                { from: directive.bodyTo, to: directive.to },
            ]),
    ]
        .filter((span) => span.from < selection.to && span.to > selection.from)
        .sort((left, right) => right.from - left.from);
    let plain = state.sliceDoc(selection.from, selection.to);
    for (const span of spans) {
        const from = Math.max(span.from, selection.from) - selection.from;
        const to = Math.min(span.to, selection.to) - selection.from;
        plain = plain.slice(0, from) + plain.slice(to);
    }
    return { plain, containsStructure: spans.length > 0 };
}
