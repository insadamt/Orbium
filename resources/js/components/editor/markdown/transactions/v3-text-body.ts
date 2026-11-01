// Summary: Reads explicit text bodies and preserves presentation around intentional type changes; depends on V3 directive spans and the existing presentation serializer, never neighboring Markdown blocks.
import type { OrbiumMetadata } from '../dialect/metadata';
import { serializeOrbiumBlock } from '../dialect/metadata';
import { readCalloutSource } from '../dialect/callout-source';
import type { V3BlockType } from '../structure/v3-contract';
import type { V3Block } from '../structure/v3-structure-types';
import type { V3DocumentIndex } from '../structure/v3-document-index';
import type { EditorState } from '@codemirror/state';
import { V3OperationError } from './v3-transaction-types';
import { markdownSourceParser } from '../interactions/markdown-source-parser';

export type V3TextBody = {
    type: V3BlockType;
    content: string;
    contentFrom: number;
    metadata: OrbiumMetadata | null;
    leading: string;
    trailing: string;
};

export function isV3TextType(type: V3BlockType) {
    return /^(paragraph|heading-[1-6]|bullet-list|numbered-list|checklist|quote|callout)$/.test(
        type,
    );
}

export function readV3TextBody(
    context: {
        state: Pick<EditorState, 'doc' | 'sliceDoc'>;
        index: V3DocumentIndex;
    },
    block: V3Block,
): V3TextBody {
    if (!isV3TextType(block.type))
        throw new V3OperationError(
            'opaque-body',
            'This operation cannot flatten an opaque rich block.',
        );
    const directives = context.index.structure.directives.filter(
        (entry) => entry.blockId === block.id,
    );
    let contentFrom = block.bodyFrom;
    let contentTo = block.bodyTo;
    let metadata: OrbiumMetadata | null = null;
    let leading = '';
    let trailing = '';
    if (directives.length) {
        const wrapper = directives[0];
        if (
            directives.length !== 1 ||
            !['block', 'empty'].includes(wrapper.metadata.kind) ||
            /[^ \t\n]/.test(
                context.state.sliceDoc(block.bodyFrom, wrapper.from),
            ) ||
            /[^ \t\n]/.test(context.state.sliceDoc(wrapper.to, block.bodyTo))
        )
            throw new V3OperationError(
                'opaque-body',
                'Nested or rich presentation requires a dedicated lossless conversion.',
            );
        metadata = wrapper.metadata as OrbiumMetadata;
        leading = context.state.sliceDoc(block.bodyFrom, wrapper.from);
        contentFrom = wrapper.bodyFrom;
        contentTo = wrapper.bodyTo;
        if (
            contentTo > contentFrom &&
            context.state.sliceDoc(contentTo - 1, contentTo) === '\n'
        )
            contentTo--;
        trailing = context.state.sliceDoc(
            context.state.doc.lineAt(wrapper.bodyTo).to,
            block.bodyTo,
        );
    } else {
        const raw = context.state.sliceDoc(contentFrom, contentTo);
        trailing = /\n*$/.exec(raw)![0];
        contentTo -= trailing.length;
    }
    return {
        type: block.type,
        content: context.state.sliceDoc(contentFrom, contentTo),
        contentFrom,
        metadata,
        leading,
        trailing,
    };
}

export function writeV3TextBody(
    model: V3TextBody,
    content: string,
    type: V3BlockType = model.type,
) {
    let body = content;
    if (model.metadata) {
        const metadata = {
            ...model.metadata,
            kind: content.trim() ? 'block' : 'empty',
        };
        if (metadata.align && !/^(paragraph|heading-[1-6]|callout)$/.test(type))
            throw new V3OperationError(
                'incompatible-presentation',
                'Clear alignment explicitly before converting this block to that type.',
            );
        if (type !== 'numbered-list') delete metadata.listType;
        body = serializeOrbiumBlock(metadata, content);
    }
    return `${model.leading}${body}${model.trailing}`;
}

export function paragraphV3Content(model: V3TextBody) {
    const heading = /^heading-([1-6])$/.exec(model.type);
    if (heading) {
        const prefix = new RegExp(`^ {0,3}#{${heading[1]}}(?:[ \\t]+|$)`);
        const node = markdownSourceParser.parse(model.content).topNode
            .firstChild;
        if (node?.name === `ATXHeading${heading[1]}`) {
            const closing = node.getChildren('HeaderMark').at(1);
            const source = closing
                ? model.content.slice(0, closing.from) +
                  model.content.slice(closing.to)
                : model.content;
            return source.replace(prefix, '');
        }
        if (node?.name === `SetextHeading${heading[1]}`) {
            const marker = node.getChild('HeaderMark');
            if (marker) {
                const from = model.content.lastIndexOf('\n', marker.from);
                const end = model.content.indexOf('\n', marker.to);
                if (from >= 0)
                    return (
                        model.content.slice(0, from) +
                        (end < 0 ? '' : model.content.slice(end))
                    );
            }
        }
        return model.content.replace(prefix, '');
    }
    if (model.type === 'quote')
        return model.content.replace(/^ {0,3}>[ \t]?/gm, '');
    if (model.type === 'callout') {
        const callout = readCalloutSource(model.content);
        if (!callout)
            throw new V3OperationError(
                'invalid-callout',
                'A callout needs its existing lossless source representation.',
            );
        return [callout.title, callout.content]
            .filter((part) => part !== '')
            .join('\n');
    }
    //
    // Escaping only list markers keeps every nested item and readable checkbox state instead of stripping later items/meaning.
    //
    if (/^(bullet-list|numbered-list|checklist)$/.test(model.type))
        return model.content.replace(
            /^([ \t]*)([-+*]|[0-9]+[.)])(?=[ \t])/gm,
            (_match, indent: string, marker: string) =>
                `${indent}${marker.length === 1 ? `\\${marker}` : `${marker.slice(0, -1)}\\${marker.slice(-1)}`}`,
        );
    return model.content;
}

export function convertV3Content(model: V3TextBody, type: V3BlockType) {
    if (!isV3TextType(type) || type === 'callout')
        throw new V3OperationError(
            'dedicated-conversion-required',
            'That rich conversion needs a dedicated source-preserving adapter.',
        );
    if (model.type === type) return model.content;
    let opaqueContent = false;
    markdownSourceParser.parse(model.content).iterate({
        enter({ node }) {
            if (
                /^(FencedCode|CodeBlock|Table|HTMLBlock|OrbiumDirective|OrbiumMathBlock|OrbiumUnclosed|LinkReference)$/.test(
                    node.name,
                ) ||
                (node.name === 'InlineCode' &&
                    model.content.slice(node.from, node.to).includes('\n'))
            )
                opaqueContent = true;
        },
    });
    if (opaqueContent)
        throw new V3OperationError(
            'dedicated-conversion-required',
            'This text block contains nested opaque data that requires a dedicated lossless conversion.',
        );
    const paragraph = paragraphV3Content(model);
    if (type === 'paragraph') return paragraph;
    const heading = /^heading-([1-6])$/.exec(type);
    if (heading) return `${'#'.repeat(Number(heading[1]))} ${paragraph}`;
    if (type === 'quote')
        return paragraph
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n');
    const counters = new Map<string, number>();
    const fromList = /^(bullet-list|numbered-list|checklist)$/.test(model.type);
    return paragraph
        .split('\n')
        .map((line) => {
            const marker = fromList
                ? /^([ \t]*)(?:\\[-+*]|[0-9]+\\[.)])[ \t]+(.*)$/.exec(line)
                : null;
            if (fromList && !marker) return line;
            const indent = marker?.[1] ?? '';
            let body = marker?.[2] ?? line;
            if (fromList && type === 'checklist')
                body = body.replace(/^\\(?=\[[ xX]\](?:[ \t]|$))/, '');
            if (type === 'checklist')
                return `${indent}- ${/^\[[ xX]\](?:[ \t]|$)/.test(body) ? '' : '[ ] '}${body}`;
            if (/^\[[ xX]\](?:[ \t]|$)/.test(body)) body = `\\${body}`;
            if (type === 'bullet-list') return `${indent}- ${body}`;
            for (const level of counters.keys())
                if (level.length > indent.length) counters.delete(level);
            const ordinal = (counters.get(indent) ?? 0) + 1;
            counters.set(indent, ordinal);
            return `${indent}${ordinal}. ${body}`;
        })
        .join('\n');
}
