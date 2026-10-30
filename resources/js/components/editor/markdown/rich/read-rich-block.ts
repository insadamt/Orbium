// Summary: Maps parsed Markdown to rich blocks, keeping columns in canonical source; depends on the dialect metadata reader and Lezer AST.
import { readColumns } from '../columns/column-source';
import { missingReferenceKind } from '../preview/missing-reference-dialog';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { readOrbiumMetadata } from '../dialect/metadata';
import { readCalloutSource } from '../dialect/callout-source';
import type { RichBlock, RichTable } from './rich-model';
import { readRichTable } from './rich-table-source';

function model(
    state: EditorState,
    node: SyntaxNode,
    kind: RichBlock['kind'],
    contentFrom = node.from,
    contentTo = node.to,
): RichBlock {
    return {
        kind,
        from: node.from,
        to: node.to,
        source: state.sliceDoc(node.from, node.to),
        contentFrom,
        contentTo,
        content: state.sliceDoc(contentFrom, contentTo),
        metadata: {},
        presentation: {},
    };
}

function tableModel(
    state: EditorState,
    node: SyntaxNode,
    table: RichTable | null,
): RichBlock | null {
    return table ? { ...model(state, node, 'table'), table } : null;
}

export function readRichBlock(
    state: EditorState,
    node: SyntaxNode,
    depth = 0,
): RichBlock | null {
    if (depth > 32) return null;
    if (node.name === 'FencedCode') {
        const marks = node.getChildren('CodeMark');
        if (marks.length < 2) return null;
        const firstLine = state.doc.lineAt(marks[0].from);
        const closingLine = state.doc.lineAt(marks.at(-1)!.from);
        if (firstLine.number === closingLine.number) return null;
        const languageInfo = state
            .sliceDoc(
                node.getChild('CodeInfo')?.from ?? marks[0].to,
                node.getChild('CodeInfo')?.to ?? marks[0].to,
            )
            .trim();
        const language = languageInfo.split(/\s+/)[0];
        const from = Math.min(firstLine.to + 1, closingLine.from);
        const to = Math.max(from, closingLine.from - 1);
        const indentation = /^ {0,3}$/.test(
            firstLine.text.slice(0, node.from - firstLine.from),
        )
            ? node.from - firstLine.from
            : 0;
        const content = node
            .getChildren('CodeText')
            .map((text) =>
                state.sliceDoc(
                    Math.max(from, text.from),
                    Math.max(from, Math.min(to, text.to)),
                ),
            )
            .join('')
            .split('\n')
            .map((line) => line.replace(new RegExp(`^ {0,${indentation}}`), ''))
            .join('\n');
        return {
            ...model(
                state,
                node,
                language.toLowerCase() === 'mermaid' ? 'mermaid' : 'code',
                from,
                to,
            ),
            content,
            language,
            languageInfo,
        };
    }
    if (node.name === 'OrbiumMathBlock') {
        const header = node.getChild('OrbiumHeader');
        const close = node.getChild('OrbiumClose');
        if (!header || !close) return null;
        const from = Math.min(header.to + 1, close.from);
        return model(state, node, 'math', from, Math.max(from, close.from - 1));
    }
    if (node.name === 'OrbiumMath')
        return model(state, node, 'inline-math', node.from + 1, node.to - 1);
    if (node.name === 'OrbiumInlineMath') {
        const metadata = readOrbiumMetadata(
            state.sliceDoc(node.from + 12, node.to),
            'inline-math',
        );
        return metadata
            ? {
                  ...model(state, node, 'inline-math'),
                  content: String(metadata.latex),
                  metadata,
              }
            : null;
    }
    if (node.name === 'Table')
        return tableModel(state, node, readRichTable(state, node, false));
    if (node.name === 'OrbiumDirective') {
        const header = node.getChild('OrbiumHeader');
        const close = node.getChild('OrbiumClose');
        if (!header || !close) return null;
        const headerSource = state.sliceDoc(header.from, header.to);
        const json = headerSource.slice(headerSource.indexOf('{')).trimEnd();
        const metadata = readOrbiumMetadata(json);
        if (!metadata) return null;
        const body = node.getChild('Document');
        const children: SyntaxNode[] = [];
        for (let child = body?.firstChild; child; child = child.nextSibling)
            children.push(child);
        const contentFrom = Math.min(header.to + 1, close.from);
        const base = {
            ...model(
                state,
                node,
                'metadata',
                contentFrom,
                Math.max(contentFrom, close.from - 1),
            ),
            metadata,
        };
        if (metadata.kind === 'columns') {
            const columns = readColumns(base.source);
            return columns ? { ...base, kind: 'columns', columns } : null;
        }
        if (metadata.kind === 'mindmap' && !children.length)
            return { ...base, kind: 'mindmap' };
        if (metadata.kind === 'math' && !children.length)
            return { ...base, kind: 'math', content: String(metadata.latex) };
        if (metadata.kind === 'empty' && !children.length)
            return { ...base, kind: 'empty', presentation: metadata };
        if (metadata.kind === 'table')
            return tableModel(state, node, readRichTable(state, node, true));
        if (metadata.kind === 'block' && children.length === 1) {
            const inner = readRichBlock(state, children[0], depth + 1);
            if (
                metadata.align &&
                !/^(?:Paragraph|(?:ATX|Setext)Heading[1-6])$/.test(
                    children[0].name,
                ) &&
                inner?.kind !== 'callout'
            )
                return null;
            if (metadata.listType && children[0].name !== 'OrderedList')
                return null;
            if (
                ['dividerColor', 'dividerThickness', 'dividerStyle'].some(
                    (key) => key in metadata,
                ) &&
                children[0].name !== 'HorizontalRule'
            )
                return null;
            return inner
                ? {
                      ...inner,
                      from: base.from,
                      to: base.to,
                      source: base.source,
                      presentation: metadata,
                      wrappers: [metadata, ...(inner.wrappers ?? [])],
                  }
                : { ...base, presentation: metadata };
        }
        if (metadata.kind === 'image' && children.length === 1) {
            const inner = readRichBlock(state, children[0], depth + 1);
            return inner?.kind === 'image'
                ? {
                      ...inner,
                      from: base.from,
                      to: base.to,
                      source: base.source,
                      metadata,
                  }
                : null;
        }
        if (
            metadata.kind === 'code' &&
            children.length === 1 &&
            children[0].name === 'FencedCode'
        ) {
            const inner = readRichBlock(state, children[0], depth + 1);
            return inner
                ? {
                      ...inner,
                      kind: 'code',
                      from: base.from,
                      to: base.to,
                      source: base.source,
                      metadata,
                  }
                : null;
        }
        return null;
    }
    if (node.name === 'Blockquote') {
        const source = state.sliceDoc(node.from, node.to);
        const callout = readCalloutSource(source);
        if (!callout) return null;
        return {
            ...model(state, node, 'callout'),
            content: callout.content,
            label: callout.title || callout.type.toUpperCase(),
            metadata: { type: callout.type, folding: callout.folding },
        };
    }
    if (node.name === 'Paragraph') {
        const child = node.firstChild;
        if (
            !child ||
            child.nextSibling ||
            !['Image', 'Link'].includes(child.name) ||
            state.sliceDoc(node.from, child.from).trim() ||
            state.sliceDoc(child.to, node.to).trim()
        )
            return null;
        const destination = child.getChild('URL');
        if (!destination) return null;
        const url = state
            .sliceDoc(destination.from, destination.to)
            .replace(/^<|>$/g, '');
        const attachment = /^orbium:attachment\/([1-9]\d*)$/.exec(url);
        const missing = missingReferenceKind(url);
        if (!attachment && missing !== 'image' && missing !== 'file')
            return null;
        const source = state.sliceDoc(child.from, child.to);
        const labelStart = source.indexOf('[') + 1;
        const labelEnd =
            child
                .getChildren('LinkMark')
                .find((mark) => state.sliceDoc(mark.from, mark.to) === ']')
                ?.from ?? destination.from - 2;
        return {
            ...model(state, node, child.name === 'Image' ? 'image' : 'file'),
            attachmentId: attachment?.[1],
            missingReference:
                missing === 'image' || missing === 'file' ? missing : undefined,
            labelSource: state.sliceDoc(child.from + labelStart, labelEnd),
            label: state
                .sliceDoc(child.from + labelStart, labelEnd)
                .replace(/\\([\\`*_{}[\]()#+.!<>:=-])/g, '$1'),
        };
    }
    return null;
}
