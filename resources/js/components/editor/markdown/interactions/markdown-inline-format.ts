import { escapeUnbalancedSpanBrackets } from './markdown-span-source';
import { isolateHistory } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { markdownNodeAt } from '../markdown-syntax';
import { readOrbiumMetadata, type OrbiumMetadata } from '../dialect/metadata';
import { paragraphSplitDelimiters } from '../preview/markdown-paragraph-split';

export function inlineFormattingRange(
    view: Pick<EditorView, 'state' | 'compositionStarted'>,
) {
    const range = view.state.selection.main;
    if (
        range.empty ||
        view.compositionStarted ||
        !view.state.facet(EditorView.editable)
    )
        return null;
    const fromNode = markdownNodeAt(view.state, range.from + 1);
    const toNode = markdownNodeAt(view.state, range.to - 1);
    const forbidden = new Set([
        'FencedCode',
        'CodeBlock',
        'CodeInfo',
        'URL',
        'LinkReference',
        'OrbiumMetadata',
        'OrbiumHeader',
        'OrbiumClose',
        'HTMLBlock',
        'OrbiumMath',
        'OrbiumInlineMath',
        'OrbiumMathBlock',
    ]);
    for (const node of [fromNode, toNode]) {
        for (
            let current: SyntaxNode | null = node;
            current;
            current = current.parent
        )
            if (forbidden.has(current.name)) return null;
    }
    if (
        view.state.doc.lineAt(range.from).number !==
        view.state.doc.lineAt(range.to - 1).number
    )
        return null;
    for (const position of [range.from, range.to]) {
        for (
            let node: SyntaxNode | null = markdownNodeAt(view.state, position);
            node;
            node = node.parent
        ) {
            if (
                ![
                    'StrongEmphasis',
                    'Emphasis',
                    'Strikethrough',
                    'InlineCode',
                    'Link',
                    'OrbiumSpan',
                ].includes(node.name)
            )
                continue;
            const marks = node.getChildren(
                node.name === 'InlineCode'
                    ? 'CodeMark'
                    : node.name === 'Strikethrough'
                      ? 'StrikethroughMark'
                      : node.name === 'OrbiumSpan'
                        ? 'OrbiumSpanMark'
                        : node.name === 'Link'
                          ? 'LinkMark'
                          : 'EmphasisMark',
            );
            const start = marks[0]?.to ?? node.from;
            const end =
                node.name === 'Link'
                    ? (marks.find(
                          (mark) =>
                              view.state.sliceDoc(mark.from, mark.to) === ']',
                      )?.from ?? node.to)
                    : (marks.at(-1)?.from ?? node.to);
            const entirelyInside = range.from >= start && range.to <= end;
            const entirelyOutside =
                range.from <= node.from && range.to >= node.to;
            if (!entirelyInside && !entirelyOutside) return null;
        }
    }
    return { from: range.from, to: range.to };
}

function replaceInline(
    view: EditorView,
    from: number,
    to: number,
    source: string,
    start: number,
    end: number,
) {
    view.dispatch({
        changes: { from, to, insert: source },
        selection: { anchor: from + start, head: from + end },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.format',
    });
    view.focus();
}

export function formatMarkdownSelection(
    view: EditorView,
    delimiter: '**' | '*' | '~~' | '`',
) {
    const range = inlineFormattingRange(view);
    if (!range) return;
    const before = view.state.sliceDoc(
        Math.max(0, range.from - delimiter.length),
        range.from,
    );
    const after = view.state.sliceDoc(range.to, range.to + delimiter.length);
    let content = view.state.sliceDoc(range.from, range.to);
    const expectedNode =
        delimiter === '**'
            ? 'StrongEmphasis'
            : delimiter === '*'
              ? 'Emphasis'
              : delimiter === '~~'
                ? 'Strikethrough'
                : 'InlineCode';
    let enclosing = markdownNodeAt(view.state, range.from + 1);
    while (enclosing.parent && enclosing.name !== expectedNode)
        enclosing = enclosing.parent;
    const markerName =
        delimiter === '`'
            ? 'CodeMark'
            : delimiter === '~~'
              ? 'StrikethroughMark'
              : 'EmphasisMark';
    const markers =
        enclosing.name === expectedNode
            ? enclosing.getChildren(markerName)
            : [];
    const insideMatchingMark =
        markers.length >= 2 &&
        markers[0].to === range.from &&
        markers.at(-1)!.from === range.to;
    if (
        markers.length >= 2 &&
        range.from >= markers[0].to &&
        range.to <= markers.at(-1)!.from &&
        !insideMatchingMark
    ) {
        const start = markers[0];
        const end = markers.at(-1)!;
        const inner = paragraphSplitDelimiters(view.state, enclosing);
        const prefixText =
            view.state.sliceDoc(start.to, range.from) + inner.closing;
        const suffixText =
            inner.opening + view.state.sliceDoc(range.to, end.from);
        const opening = view.state.sliceDoc(start.from, start.to);
        const closing = view.state.sliceDoc(end.from, end.to);
        function retainFormatting(text: string) {
            const leading = text.match(/^\s*/)?.[0] ?? '';
            const trailing = text.match(/\s*$/)?.[0] ?? '';
            return text.trim()
                ? `${leading}${opening}${text.slice(leading.length, text.length - trailing.length)}${closing}${trailing}`
                : text;
        }
        const prefix = retainFormatting(prefixText);
        const suffix = retainFormatting(suffixText);
        const selected = inner.opening + content + inner.closing;
        replaceInline(
            view,
            enclosing.from,
            enclosing.to,
            prefix + selected + suffix,
            prefix.length + inner.opening.length,
            prefix.length + inner.opening.length + content.length,
        );
        return;
    }
    if (before === delimiter && after === delimiter && insideMatchingMark) {
        replaceInline(
            view,
            range.from - delimiter.length,
            range.to + delimiter.length,
            content,
            0,
            content.length,
        );
        return;
    }
    if (
        content.startsWith(delimiter) &&
        content.endsWith(delimiter) &&
        content.length > delimiter.length * 2 &&
        markers[0]?.from === range.from &&
        markers.at(-1)?.to === range.to &&
        view.state.sliceDoc(markers[0].from, markers[0].to) === delimiter
    ) {
        content = content.slice(delimiter.length, -delimiter.length);
        replaceInline(view, range.from, range.to, content, 0, content.length);
        return;
    }
    const fence =
        delimiter === '`'
            ? '`'.repeat(
                  Math.max(
                      1,
                      ...[...content.matchAll(/`+/g)].map(
                          (match) => match[0].length + 1,
                      ),
                  ),
              )
            : delimiter;
    const padding =
        delimiter === '`' && (content.startsWith('`') || content.endsWith('`'))
            ? ' '
            : '';
    const leading = delimiter === '`' ? '' : (content.match(/^\s*/)?.[0] ?? '');
    const trailing =
        delimiter === '`' ? '' : (content.match(/\s*$/)?.[0] ?? '');
    if (leading.length + trailing.length >= content.length) return;
    content = content.slice(leading.length, content.length - trailing.length);
    const prefix = leading + fence + padding;
    replaceInline(
        view,
        range.from,
        range.to,
        `${prefix}${content}${padding}${fence}${trailing}`,
        prefix.length,
        prefix.length + content.length,
    );
}

export function setMarkdownInlineMetadata(
    view: EditorView,
    patch: { color?: string | null; underline?: boolean },
) {
    const range = inlineFormattingRange(view);
    if (!range) return;
    let from = range.from,
        to = range.to;
    let content = view.state.sliceDoc(from, to);
    let metadata: OrbiumMetadata = {};
    for (
        let node: SyntaxNode | null = markdownNodeAt(view.state, from + 1);
        node;
        node = node.parent
    ) {
        if (node.name !== 'OrbiumSpan') continue;
        const marks = node.getChildren('OrbiumSpanMark');
        const json = node.getChild('OrbiumMetadata');
        if (!json || marks.length !== 2) break;
        if (
            (from === marks[0].to && to === marks[1].from) ||
            (from === node.from && to === node.to)
        ) {
            metadata =
                readOrbiumMetadata(
                    view.state.sliceDoc(json.from, json.to),
                    'inline',
                ) ?? {};
            content = view.state.sliceDoc(marks[0].to, marks[1].from);
            from = node.from;
            to = node.to;
        }
        break;
    }
    if ('color' in patch) {
        if (patch.color) metadata.color = patch.color;
        else delete metadata.color;
    }
    if ('underline' in patch) {
        if (metadata.underline) delete metadata.underline;
        else metadata.underline = true;
    }
    if (!Object.keys(metadata).length)
        replaceInline(view, from, to, content, 0, content.length);
    else {
        content = escapeUnbalancedSpanBrackets(content);
        replaceInline(
            view,
            from,
            to,
            `:orbium[${content}]${JSON.stringify(metadata)}`,
            8,
            8 + content.length,
        );
    }
}

export function setMarkdownLink(view: EditorView, destination: string | null) {
    const range = inlineFormattingRange(view);
    if (!range) return;
    let from = range.from,
        to = range.to;
    let content = view.state.sliceDoc(from, to);
    for (
        let node: SyntaxNode | null = markdownNodeAt(view.state, from + 1);
        node;
        node = node.parent
    ) {
        if (node.name !== 'Link') continue;
        const marks = node.getChildren('LinkMark');
        const closer = marks.find(
            (mark) => view.state.sliceDoc(mark.from, mark.to) === ']',
        );
        if (
            marks[0] &&
            closer &&
            ((from === marks[0].to && to === closer.from) ||
                (from === node.from && to === node.to))
        ) {
            from = node.from;
            to = node.to;
            content = view.state.sliceDoc(marks[0].to, closer.from);
        }
        break;
    }
    if (!destination) {
        replaceInline(view, from, to, content, 0, content.length);
        return;
    }
    if (
        !/^(https?:\/\/|mailto:)/i.test(destination) ||
        /[\s<>\\]/.test(destination)
    )
        throw new Error('Use an HTTP, HTTPS or mailto link without spaces.');
    const url = new URL(destination);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol))
        throw new Error('Unsupported link.');
    replaceInline(
        view,
        from,
        to,
        `[${content}](<${url.href}>)`,
        1,
        content.length + 1,
    );
}
