import type { MarkdownLimits } from '../markdown-api';
import { markdownSourceParser } from './markdown-source-parser';
import { csrfToken, documentUrl } from '../../editor-api';

export type MarkdownTransferContext = {
    workspaceId: number;
    nodeId: number;
    limits: MarkdownLimits;
};

export function validateMarkdownTransfer(
    source: string,
    limits: MarkdownLimits,
) {
    if (source.includes('\0'))
        throw new Error('Markdown must not contain NUL bytes.');
    const encoder = new TextEncoder();
    if (encoder.encode(source).length > limits.source_bytes)
        throw new Error('Markdown exceeds the document source limit.');
    for (const line of source.split('\n'))
        if (encoder.encode(line).length > limits.line_bytes)
            throw new Error('A Markdown line exceeds the complexity limit.');
}

export function prepareMarkdownImport(input: string) {
    const source = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const replacements: { from: number; to: number; insert: string }[] = [];
    markdownSourceParser.parse(source).iterate({
        enter(node) {
            if (['FencedCode', 'CodeBlock', 'InlineCode'].includes(node.name))
                return false;
            if (node.name !== 'Image') return;
            const destination = node.node.getChild('URL');
            const url =
                destination &&
                source
                    .slice(destination.from, destination.to)
                    .replace(/^<|>$/g, '');
            if (url?.startsWith('orbium:attachment/')) return false;
            const text = source.slice(node.from, node.to);
            const fence = '`'.repeat(
                Math.max(
                    1,
                    ...[...text.matchAll(/`+/g)].map(
                        (match) => match[0].length + 1,
                    ),
                ),
            );
            replacements.push({
                from: node.from,
                to: node.to,
                insert: `${fence}${text}${fence}`,
            });
            return false;
        },
    });
    let result = source;
    for (const replacement of replacements.reverse())
        result =
            result.slice(0, replacement.from) +
            replacement.insert +
            result.slice(replacement.to);
    return result;
}

export async function inspectMarkdownImport(
    source: string,
    context: MarkdownTransferContext,
    signal: AbortSignal,
) {
    validateMarkdownTransfer(source, context.limits);
    const response = await fetch(
        `${documentUrl(context.workspaceId, context.nodeId)}/markdown/inspect`,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({
                markdown: source,
                content_format_version: 2,
            }),
            signal,
        },
    );
    const result = (await response.json()) as {
        markdown?: string;
        message?: string;
        errors?: Record<string, string[]>;
    };
    if (!response.ok)
        throw new Error(
            result.errors?.markdown?.[0] ??
                result.message ??
                'Could not validate this Markdown import.',
        );
    if (typeof result.markdown !== 'string')
        throw new Error('The server returned an invalid import response.');
    return result.markdown;
}

export function serializeOnlineMarkdown(
    source: string,
    context: MarkdownTransferContext,
) {
    const changes: { from: number; to: number; destination: string }[] = [];
    markdownSourceParser.parse(source).iterate({
        enter(node) {
            if (
                [
                    'FencedCode',
                    'CodeBlock',
                    'InlineCode',
                    'OrbiumMath',
                    'OrbiumInlineMath',
                    'OrbiumMathBlock',
                ].includes(node.name)
            )
                return false;
            if (node.name !== 'URL') return;
            const raw = source.slice(node.from, node.to);
            const match = /^<?orbium:(node|attachment)\/([1-9]\d*)>?$/.exec(
                raw,
            );
            if (!match) return;
            const path =
                match[1] === 'node'
                    ? `/workspaces/${context.workspaceId}/nodes/${match[2]}`
                    : `${documentUrl(context.workspaceId, context.nodeId)}/attachments/${match[2]}`;
            changes.push({
                from: node.from,
                to: node.to,
                destination: `${raw.startsWith('<') ? '<' : ''}${window.location.origin}${path}${raw.endsWith('>') ? '>' : ''}`,
            });
        },
    });
    let result = source;
    for (const change of changes.reverse())
        result =
            result.slice(0, change.from) +
            change.destination +
            result.slice(change.to);
    return result;
}
