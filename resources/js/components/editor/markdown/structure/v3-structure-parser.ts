// Summary: Scans explicit V3 identities and scoped source ranges without reserializing Markdown; depends on the shared contract, existing directive validation and CodeMirror Text.
import { Text } from '@codemirror/state';
import {
    decodeV3Directive,
    decodeV3Header,
    hasInvalidV3Unicode,
    v3Contract,
} from './v3-contract';
import type { V3ParsedStructure } from './v3-structure-types';

type OpenDirective = {
    index: number;
    columnIndex?: number;
    layoutIndex?: number;
};
type LiteralFence = { marker: string; length: number; from: number };
const utf8 = new TextEncoder();

// ============================================================
// Structural scan
// ============================================================

export function parseV3Structure(input: string | Text): V3ParsedStructure {
    const source = typeof input === 'string' ? input : input.toString();
    const result: V3ParsedStructure = {
        offsetUnit: 'utf-16',
        sourceLength: source.length,
        sourceBytes: utf8.encode(source).length,
        blocks: [],
        columns: [],
        directives: [],
        diagnostics: [],
    };
    const fail = (
        code: string,
        message: string,
        from = 0,
        to = from,
        line = 1,
    ) => {
        if (result.diagnostics.length < v3Contract.limits.diagnostics)
            result.diagnostics.push({ code, message, from, to, line });
    };
    if (
        result.sourceBytes > v3Contract.limits.sourceBytes ||
        hasInvalidV3Unicode(source) ||
        /[\0\r]/.test(source)
    ) {
        fail(
            'invalid-source',
            'V3 source must be LF-only Unicode without NUL bytes and at most 2 MiB.',
        );
        return result;
    }
    const document =
        typeof input === 'string' ? Text.of(source.split('\n')) : input;
    if (document.lines > v3Contract.limits.lines) {
        fail('source-limit', 'V3 source exceeds the 100,000 line limit.');
        return result;
    }
    const identities = new Set<string>();
    const siblingCounts = new Map<string | null, number>();
    const stack: OpenDirective[] = [];
    const columnCounts = new Map<number, number>();
    let current: number | null = null;
    let layout: number | null = null;
    let literal: LiteralFence | null = null;
    const finishedLayouts = new Set<number>();

    function finishBlock(to: number) {
        if (current === null) return;
        const block = result.blocks[current];
        block.to = block.bodyTo = to;
        if (block.type === 'columns' && !finishedLayouts.has(current))
            fail(
                'missing-layout',
                'A columns block needs one complete columns directive.',
                block.from,
                block.headerTo,
                document.lineAt(block.from).number,
            );
        current = null;
    }

    function claimIdentity(id: string, from: number, to: number, line: number) {
        if (identities.has(id))
            fail(
                'duplicate-id',
                `Duplicate block/column ID: ${id}.`,
                from,
                to,
                line,
            );
        identities.add(id);
    }

    for (let number = 1; number <= document.lines; number++) {
        const line = document.line(number);
        const next = Math.min(document.length, line.to + 1);
        const issue = (code: string, message: string) =>
            fail(code, message, line.from, line.to, number);
        if (utf8.encode(line.text).length > v3Contract.limits.lineBytes) {
            issue('line-limit', 'A V3 source line exceeds 128 KiB.');
            return result;
        }
        const codeFence = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)$/.exec(line.text);
        if (literal) {
            if (
                literal.marker === '$'
                    ? /^ {0,3}\$\$[ \t]*$/.test(line.text)
                    : codeFence &&
                      codeFence[1][0] === literal.marker &&
                      codeFence[1].length >= literal.length &&
                      /^[ \t]*$/.test(codeFence[2])
            )
                literal = null;
            continue;
        }
        const top = stack.at(-1);
        const directive = top && result.directives[top.index];
        const structuralScope =
            !directive ||
            directive.metadata.kind === 'column' ||
            directive.metadata.kind === 'columns';
        if (
            /^ {0,3}\+\+(?:block|endblock)\b/.test(line.text) &&
            structuralScope
        ) {
            if (directive?.metadata.kind === 'columns') {
                issue(
                    'invalid-parent',
                    'Blocks in a layout must belong to a column.',
                );
                continue;
            }
            finishBlock(line.from);
            try {
                const header = decodeV3Header(line.text);
                if (result.blocks.length >= v3Contract.limits.blocks) {
                    issue(
                        'block-limit',
                        'V3 block count exceeds the structural limit.',
                    );
                    return result;
                }
                claimIdentity(header.id, line.from, line.to, number);
                const parentId =
                    top?.columnIndex === undefined
                        ? null
                        : result.columns[top.columnIndex].id;
                if (header.type === 'columns' && parentId !== null)
                    issue(
                        'nested-columns',
                        'Nested columns are not supported.',
                    );
                const order = siblingCounts.get(parentId) ?? 0;
                siblingCounts.set(parentId, order + 1);
                current = result.blocks.length;
                result.blocks.push({
                    ...header,
                    parentId,
                    order,
                    from: line.from,
                    headerTo: line.to,
                    bodyFrom: next,
                    bodyTo: next,
                    to: next,
                });
            } catch (error) {
                issue(
                    'invalid-header',
                    error instanceof Error
                        ? error.message
                        : 'Invalid block header.',
                );
            }
            continue;
        }
        const opening = /^ {0,3}(:{3,})orbium\b([^\r\n]*)$/.exec(line.text);
        const closing = /^ {0,3}(:{3,})[ \t]*$/.exec(line.text);
        if (closing && directive && closing[1].length === directive.fence) {
            directive.bodyTo = line.from;
            directive.to = next;
            stack.pop();
            if (top?.columnIndex !== undefined) {
                finishBlock(line.from);
                const column = result.columns[top.columnIndex];
                column.bodyTo = line.from;
                column.to = next;
            }
            if (top?.layoutIndex !== undefined) {
                const block = result.blocks[top.layoutIndex];
                block.bodyTo = line.to;
                block.to = next;
                const count = columnCounts.get(top.layoutIndex) ?? 0;
                if (count !== (directive.metadata.widths as number[]).length)
                    issue(
                        'column-count',
                        'Column count must match the saved widths.',
                    );
                finishedLayouts.add(top.layoutIndex);
                layout = current = null;
            }
            continue;
        }
        if (opening) {
            try {
                const metadata = decodeV3Directive(
                    opening[2].replace(/^[ \t]+|[ \t]+$/g, ''),
                );
                const fence = opening[1].length;
                if (
                    stack.length >= v3Contract.limits.depth ||
                    (directive && fence >= directive.fence)
                )
                    throw new Error(
                        'Directive fences must decrease inside a container and stay within the nesting limit.',
                    );
                const owner: number | null = current ?? layout;
                if (owner === null)
                    throw new Error(
                        'An Orbium directive needs an owning block.',
                    );
                const entry: OpenDirective = {
                    index: result.directives.length,
                };
                if (metadata.kind === 'columns') {
                    if (
                        layout !== null ||
                        stack.length ||
                        result.blocks[owner].type !== 'columns' ||
                        finishedLayouts.has(owner)
                    )
                        throw new Error(
                            'Only a root columns block can own a columns directive.',
                        );
                    if (
                        /[^ \t\n]/.test(
                            document.sliceString(
                                result.blocks[owner].bodyFrom,
                                line.from,
                            ),
                        )
                    )
                        throw new Error(
                            'A columns body must start with its layout directive.',
                        );
                    entry.layoutIndex = owner;
                    layout = owner;
                    current = null;
                } else if (metadata.kind === 'column') {
                    if (
                        directive?.metadata.kind !== 'columns' ||
                        layout === null
                    )
                        throw new Error(
                            'A column must be a direct child of a columns layout.',
                        );
                    const id = metadata.id as string;
                    const order = columnCounts.get(layout) ?? 0;
                    if (order >= 3)
                        throw new Error(
                            'A layout supports at most three columns.',
                        );
                    claimIdentity(id, line.from, line.to, number);
                    entry.columnIndex = result.columns.length;
                    const layoutId = result.blocks[layout].id;
                    columnCounts.set(layout, order + 1);
                    result.columns.push({
                        id,
                        layoutId,
                        order,
                        from: line.from,
                        headerTo: line.to,
                        bodyFrom: next,
                        bodyTo: next,
                        to: next,
                    });
                    current = null;
                } else if (
                    current === null ||
                    result.blocks[current].type === 'columns'
                ) {
                    throw new Error(
                        'Presentation and rich directives need an ordinary owning block.',
                    );
                }
                result.directives.push({
                    blockId: result.blocks[owner].id,
                    fence,
                    metadata,
                    from: line.from,
                    headerTo: line.to,
                    bodyFrom: next,
                    bodyTo: next,
                    to: next,
                });
                stack.push(entry);
            } catch (error) {
                issue(
                    'invalid-directive',
                    error instanceof Error
                        ? error.message
                        : 'Invalid directive.',
                );
            }
            continue;
        }
        if (/[^ \t]/.test(line.text) && current === null)
            issue(
                'unowned-content',
                'Content must belong to an explicit block; layouts may contain only column directives.',
            );
        if (
            current !== null &&
            result.blocks[current].type === 'columns' &&
            /[^ \t]/.test(line.text)
        )
            issue(
                'invalid-layout-body',
                'A columns block may contain only its columns directive.',
            );
        if (
            codeFence &&
            !(codeFence[1][0] === '`' && codeFence[2].includes('`'))
        )
            literal = {
                marker: codeFence[1][0],
                length: codeFence[1].length,
                from: line.from,
            };
        else if (/^ {0,3}\$\$[ \t]*$/.test(line.text))
            literal = { marker: '$', length: 2, from: line.from };
    }
    finishBlock(document.length);
    for (const entry of stack) {
        const directive = result.directives[entry.index];
        fail(
            'unclosed-directive',
            'An Orbium directive is not closed.',
            directive.from,
            directive.headerTo,
            document.lineAt(directive.from).number,
        );
    }
    if (literal)
        fail(
            'unclosed-literal',
            'A literal code/math fence is not closed.',
            literal.from,
            document.lineAt(literal.from).to,
            document.lineAt(literal.from).number,
        );
    return result;
}
