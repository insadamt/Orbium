// Summary: Normalizes external Markdown into explicit blocks and encodes scoped internal clipboard data; depends on the existing Markdown parser and strict V3 structure validation, never active import/save paths.
import { expandV3ImportedReferences } from './v3-import-references';
import { markdownBodyParser as markdownSourceParser } from '../interactions/markdown-source-parser';
import { EditorState } from '@codemirror/state';
import { readRichBlock } from '../rich/read-rich-block';
import { completeV3BlockSource } from '../transactions/v3-source-edits';
import {
    createV3Identity,
    v3Contract,
    type V3BlockType,
} from '../structure/v3-contract';
import { parseV3Structure } from '../structure/v3-structure-parser';
import { V3OperationError } from '../transactions/v3-transaction-types';
import { serializeV3Columns } from '../columns/v3/v3-column-model';

export const v3ClipboardMime = 'application/x-orbium-v3-blocks+json';

export function normalizeV3PastedMarkdown(
    input: string,
    allowColumns = true,
): {
    source: string;
    inline: string | null;
} {
    const normalized = input.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
    const source = expandV3ImportedReferences(normalized);
    if (new TextEncoder().encode(source).length > v3Contract.limits.sourceBytes)
        throw new V3OperationError(
            'paste-too-large',
            'The pasted source exceeds the document source limit.',
        );
    const blocks: { type: V3BlockType; body: string; serialized?: string }[] =
        [];
    const sourceState = EditorState.create({ doc: source });
    let ordinaryParagraph = false;
    for (
        let node = markdownSourceParser.parse(source).topNode.firstChild;
        node;
        node = node.nextSibling
    ) {
        const body = source.slice(node.from, node.to);
        ordinaryParagraph = node.name === 'Paragraph';
        if (node.name === 'BulletList') {
            const groups: { type: V3BlockType; body: string }[] = [];
            for (const item of node.getChildren('ListItem')) {
                const itemBody = source.slice(item.from, item.to);
                const itemType = /^[-+*][ \t]+\[[ xX]\](?:[ \t]|$)/.test(
                    itemBody,
                )
                    ? 'checklist'
                    : 'bullet-list';
                const group = groups.at(-1);
                if (group?.type === itemType) group.body += `\n${itemBody}`;
                else groups.push({ type: itemType, body: itemBody });
            }
            blocks.push(...groups);
            continue;
        }
        let type: V3BlockType = 'paragraph';
        const heading = /^(?:ATX|Setext)Heading([1-6])$/.exec(node.name);
        if (heading) type = `heading-${heading[1]}` as V3BlockType;
        else if (node.name === 'OrderedList') type = 'numbered-list';
        else if (node.name === 'Blockquote')
            type = /^>\s*\[!/.test(body) ? 'callout' : 'quote';
        else if (node.name === 'HorizontalRule') type = 'divider';
        else if (node.name === 'Table') type = 'table';
        else if (/^(FencedCode|CodeBlock)$/.test(node.name))
            type = /^\s*[`~]{3,}mermaid\b/.test(body) ? 'mermaid' : 'code';
        else if (node.name === 'OrbiumMathBlock') type = 'math';
        else if (node.name === 'OrbiumDirective') {
            const rich = readRichBlock(sourceState, node);
            if (rich?.kind === 'columns' && rich.columns) {
                if (!allowColumns)
                    throw new V3OperationError(
                        'nested-columns',
                        'Nested column Markdown is not supported.',
                    );
                const columns = rich.columns.bodies.map((body) => ({
                    id: createV3Identity(),
                    source:
                        normalizeV3PastedMarkdown(body, false).source ||
                        completeV3BlockSource(
                            { id: createV3Identity(), type: 'paragraph' },
                            '\n',
                        ),
                }));
                blocks.push({
                    type: 'columns',
                    body: '',
                    serialized: serializeV3Columns({
                        id: createV3Identity(),
                        columns,
                        widths: rich.columns.widths,
                    }),
                });
                continue;
            }
            if (
                rich &&
                [
                    'code',
                    'table',
                    'image',
                    'math',
                    'mindmap',
                    'callout',
                ].includes(rich.kind)
            )
                type = rich.kind as V3BlockType;
        }
        //
        // External text never grants structural authority to header-looking prose; literal fenced payloads remain byte-for-byte bodies.
        //
        const escapedBody =
            type === 'paragraph'
                ? body.replace(/^\+\+block(?=\s)/gm, '\\++block')
                : body;
        blocks.push({ type, body: escapedBody });
    }
    if (!blocks.length) return { source: '', inline: source };
    const inline =
        blocks.length === 1 &&
        blocks[0].type === 'paragraph' &&
        ordinaryParagraph
            ? source.replace(/^\+\+block(?=\s)/gm, '\\++block')
            : null;
    return {
        inline,
        source: blocks
            .map(
                (block) =>
                    block.serialized ??
                    completeV3BlockSource(
                        { id: createV3Identity(), type: block.type },
                        `${block.body}\n\n`,
                    ),
            )
            .join(''),
    };
}

export function encodeV3Clipboard(request: { source: string; scope: string }) {
    return JSON.stringify({
        version: 3,
        scope: request.scope,
        source: request.source,
    });
}

export function decodeV3Clipboard(request: {
    value: string;
    scope: string;
}): string {
    if (request.value.length > v3Contract.limits.sourceBytes * 6)
        throw new V3OperationError(
            'paste-too-large',
            'The clipboard payload exceeds the source limit.',
        );
    let payload: unknown;
    try {
        payload = JSON.parse(request.value);
    } catch {
        throw new V3OperationError(
            'invalid-clipboard',
            'The internal clipboard payload is invalid JSON.',
        );
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        throw new V3OperationError(
            'invalid-clipboard',
            'Expected an internal block clipboard object.',
        );
    const record = payload as Record<string, unknown>;
    if (
        record.version !== 3 ||
        record.scope !== request.scope ||
        typeof record.source !== 'string'
    )
        throw new V3OperationError(
            'clipboard-scope',
            'Internal blocks belong to another document scope. Use the authorized transfer adapter.',
        );
    const parsed = parseV3Structure(record.source);
    if (parsed.diagnostics.length || !parsed.blocks.length)
        throw new V3OperationError(
            'invalid-clipboard',
            'The internal clipboard source is not a valid V3 block range.',
        );
    return record.source;
}
