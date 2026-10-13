import { markdownLineDirection } from '../interactions/markdown-direction';
import { readEditableMarkdownPresentation } from '../interactions/markdown-editable-presentation';
import { readOrbiumMetadata } from '../dialect/metadata';
import { syntaxTree } from '@codemirror/language';
import type { Range } from '@codemirror/state';
import { Decoration, EditorView, type WidgetType } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { isMarkdownSourceOnlyLine } from '../markdown-syntax';
import {
    markdownLinkDestination,
    isMarkdownPageDestination,
    type MarkdownLinkContext,
} from './markdown-link-preview';
import {
    MarkdownDivider,
    MarkdownDecodedText,
    MarkdownTaskCheckbox,
} from './markdown-preview-widgets';

const opaqueNodes = new Set([
    'OrbiumDirective',
    'OrbiumMathBlock',
    'OrbiumUnclosed',
    'OrbiumMath',
    'OrbiumInlineMath',
    'FencedCode',
    'CodeBlock',
    'HTMLBlock',
    'HTMLTag',
    'Table',
    'LinkReference',
    'Image',
]);
const inlineClasses: Record<string, string> = {
    StrongEmphasis: 'cm-md-strong',
    Emphasis: 'cm-md-emphasis',
    Strikethrough: 'cm-md-strike',
    InlineCode: 'cm-md-inline-code',
};

function children(node: SyntaxNode): SyntaxNode[] {
    const nodes: SyntaxNode[] = [];
    for (let child = node.firstChild; child; child = child.nextSibling)
        nodes.push(child);
    return nodes;
}

export function buildMarkdownPreview(
    view: EditorView,
    linkContext: MarkdownLinkContext,
) {
    const decorations: Range<Decoration>[] = [];
    const atomicRanges: Range<Decoration>[] = [];
    const lineClasses = new Map<number, Set<string>>();
    const handled = new Set<string>();
    const addLineClass = (position: number, className: string) => {
        const lineStart = view.state.doc.lineAt(position).from;
        const classes = lineClasses.get(lineStart) ?? new Set<string>();
        classes.add(className);
        lineClasses.set(lineStart, classes);
    };
    const addNodeLineClasses = (
        node: SyntaxNode,
        visible: { from: number; to: number },
        className: string,
    ) => {
        let position = view.state.doc.lineAt(
            Math.max(node.from, visible.from),
        ).from;
        const end = Math.min(node.to - 1, visible.to);
        while (position <= end) {
            addLineClass(position, className);
            const lineEnd = view.state.doc.lineAt(position).to;
            if (lineEnd >= end) break;
            position = lineEnd + 1;
        }
    };
    const replaceSyntax = (from: number, to: number, widget?: WidgetType) => {
        if (
            from >= to ||
            view.state.doc.lineAt(from).number !==
                view.state.doc.lineAt(to - 1).number
        )
            return;
        const range = Decoration.replace({ widget }).range(from, to);
        decorations.push(range);
        atomicRanges.push(range);
    };
    const hideInlineMarkers = (node: SyntaxNode, markerName: string) => {
        for (const marker of children(node))
            if (marker.name === markerName)
                replaceSyntax(marker.from, marker.to);
    };

    for (const visible of view.visibleRanges) {
        let position = view.state.doc.lineAt(visible.from).from;
        while (position <= visible.to) {
            const line = view.state.doc.lineAt(position);
            addLineClass(position, 'cm-md-directed');
            if (!line.text.trim() && line.number < view.state.doc.lines)
                addLineClass(position, 'cm-md-separator');
            if (line.to >= visible.to) break;
            position = line.to + 1;
        }
        syntaxTree(view.state).iterate({
            from: visible.from,
            to: visible.to,
            enter(reference) {
                const node = reference.node;
                if (readEditableMarkdownPresentation(view.state, node)) return;
                if (opaqueNodes.has(node.name)) {
                    if (
                        [
                            'FencedCode',
                            'CodeBlock',
                            'Table',
                            'HTMLBlock',
                            'LinkReference',
                        ].includes(node.name)
                    ) {
                        let position = view.state.doc.lineAt(
                            Math.max(node.from, visible.from),
                        ).from;
                        while (position <= Math.min(node.to, visible.to)) {
                            addLineClass(position, 'cm-md-source');
                            const end = view.state.doc.lineAt(position).to;
                            if (end >= node.to || end >= visible.to) break;
                            position = end + 1;
                        }
                    }
                    return false;
                }
                if (node.name === 'Paragraph' || node.name === 'Task') {
                    const firstLine = view.state.doc.lineAt(node.from);
                    if (isMarkdownSourceOnlyLine(firstLine.text)) return false;
                }
                const key = `${node.name}:${node.from}:${node.to}`;
                if (handled.has(key)) return;
                handled.add(key);
                const line = view.state.doc.lineAt(node.from);
                if (isMarkdownSourceOnlyLine(line.text)) return false;
                if (node.name === 'ListItem') {
                    addNodeLineClasses(
                        node,
                        visible,
                        node.getChild('Task')
                            ? 'cm-md-list cm-md-task-line'
                            : 'cm-md-list',
                    );
                }
                const heading = /^(?:ATX|Setext)Heading([1-6])$/.exec(
                    node.name,
                );
                if (heading && /^ {0,3}#{1,6}$/.test(line.text)) return false;
                if (heading) {
                    addNodeLineClasses(
                        node,
                        visible,
                        `cm-md-heading cm-md-heading-${heading[1]} orbium-heading-${heading[1]}`,
                    );
                    if (
                        line.number > 1 &&
                        !view.state.doc.line(line.number - 1).text.trim()
                    )
                        addLineClass(node.from, 'cm-md-after-separator');
                }
                if (node.name === 'HeaderMark') {
                    const tail = view.state.sliceDoc(node.to, line.to);
                    const end =
                        node.to + (tail.match(/^[ \t]+/)?.[0].length ?? 0);
                    replaceSyntax(node.from, end);
                }
                if (node.name === 'QuoteMark') {
                    const end =
                        node.to +
                        (view.state.sliceDoc(node.to, node.to + 1) === ' '
                            ? 1
                            : 0);
                    replaceSyntax(node.from, end);
                }
                if (node.name === 'Escape')
                    replaceSyntax(node.from, node.from + 1);
                if (node.name === 'Entity') {
                    const decoder = document.createElement('textarea');
                    decoder.innerHTML = view.state.sliceDoc(node.from, node.to);
                    replaceSyntax(
                        node.from,
                        node.to,
                        new MarkdownDecodedText(decoder.value),
                    );
                }
                if (node.name === 'ListMark') {
                    addLineClass(node.from, 'cm-md-list');
                    const end =
                        node.to +
                        (view.state.sliceDoc(node.to, node.to + 1) === ' '
                            ? 1
                            : 0);
                    const leading = view.state.sliceDoc(line.from, node.from);
                    replaceSyntax(leading.trim() ? node.from : line.from, end);
                }
                if (node.name === 'TaskMarker') {
                    replaceSyntax(
                        node.from,
                        node.to +
                            (view.state.sliceDoc(node.to, node.to + 1) === ' '
                                ? 1
                                : 0),
                        new MarkdownTaskCheckbox(
                            node.from,
                            /[xX]/.test(
                                view.state.sliceDoc(node.from, node.to),
                            ),
                            !view.state.facet(EditorView.editable),
                        ),
                    );
                }
                if (node.name === 'HorizontalRule') {
                    addLineClass(node.from, 'orbium-divider');
                    let metadata = {};
                    for (
                        let parent = node.parent;
                        parent;
                        parent = parent.parent
                    ) {
                        const presentation = readEditableMarkdownPresentation(
                            view.state,
                            parent,
                        );
                        if (presentation) {
                            metadata = presentation.metadata;
                            break;
                        }
                    }
                    replaceSyntax(
                        node.from,
                        node.to,
                        new MarkdownDivider(metadata),
                    );
                }
                if (inlineClasses[node.name]) {
                    decorations.push(
                        Decoration.mark({
                            class: inlineClasses[node.name],
                        }).range(node.from, node.to),
                    );
                    hideInlineMarkers(
                        node,
                        node.name === 'InlineCode'
                            ? 'CodeMark'
                            : node.name === 'Strikethrough'
                              ? 'StrikethroughMark'
                              : 'EmphasisMark',
                    );
                }
                if (node.name === 'Link' || node.name === 'Autolink') {
                    const destination = markdownLinkDestination(
                        view.state,
                        node,
                        linkContext,
                    );
                    if (!destination) return;
                    if (isMarkdownPageDestination(destination))
                        atomicRanges.push(
                            Decoration.mark({}).range(node.from, node.to),
                        );
                    decorations.push(
                        Decoration.mark({
                            class: isMarkdownPageDestination(destination)
                                ? 'cm-md-link editor-mention editor-mention-button'
                                : 'cm-md-link',
                            tagName: 'a',
                            attributes: {
                                href: destination,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                'data-orbium-preview-link': '',
                                'data-orbium-mention':
                                    isMarkdownPageDestination(destination)
                                        ? 'true'
                                        : 'false',
                                ...(isMarkdownPageDestination(destination)
                                    ? {
                                          contenteditable: 'false',
                                          tabindex: '0',
                                          role: 'button',
                                          'data-orbium-mention-from': String(
                                              node.from,
                                          ),
                                          'data-orbium-mention-to': String(
                                              node.to,
                                          ),
                                      }
                                    : {}),
                                title: isMarkdownPageDestination(destination)
                                    ? 'Open page · Ctrl/Cmd+click to open in a new tab'
                                    : 'Ctrl/Cmd+click to open link',
                            },
                        }).range(node.from, node.to),
                    );
                    const parts = children(node);
                    if (node.name === 'Autolink') {
                        for (const part of parts)
                            if (part.name === 'LinkMark')
                                replaceSyntax(part.from, part.to);
                    } else {
                        const opener = parts[0];
                        const closer = parts.find(
                            (part) =>
                                part.name === 'LinkMark' &&
                                part.from > node.from,
                        );
                        if (opener?.name === 'LinkMark' && closer) {
                            replaceSyntax(opener.from, opener.to);
                            replaceSyntax(closer.from, node.to);
                        }
                    }
                }
                if (node.name === 'OrbiumSpan') {
                    const metadataNode = node.getChild('OrbiumMetadata');
                    const metadata =
                        metadataNode &&
                        readOrbiumMetadata(
                            view.state.sliceDoc(
                                metadataNode.from,
                                metadataNode.to,
                            ),
                            'inline',
                        );
                    if (!metadata) return false;
                    const color = String(metadata.color ?? '');
                    const attributes: Record<string, string> = {};

                    const styles = [
                        metadata.underline ? 'text-decoration:underline' : '',
                        color.startsWith('preset:')
                            ? `color:var(--editor-text-color-${color.slice(7)})`
                            : /^#[0-9a-f]{6}$/.test(color)
                              ? `color:${color}`
                              : '',
                    ]
                        .filter(Boolean)
                        .join(';');
                    if (styles) attributes.style = styles;
                    decorations.push(
                        Decoration.mark({ attributes }).range(
                            node.from,
                            node.to,
                        ),
                    );
                    const markers = node.getChildren('OrbiumSpanMark');
                    const opening = markers[0];
                    const closing = markers.at(-1);
                    if (opening && closing) {
                        replaceSyntax(opening.from, opening.to);
                        // A caret between the bracket and metadata would let typing break the span.
                        replaceSyntax(closing.from, metadataNode!.to);
                    }
                }
                if (node.name === 'InlineCode') return false;
            },
        });
    }
    for (const [from, classes] of lineClasses)
        decorations.push(
            Decoration.line({
                class: [...classes].join(' '),
                attributes: {
                    dir: classes.has('cm-md-source')
                        ? 'ltr'
                        : markdownLineDirection(view.state, from),
                },
            }).range(from),
        );
    return {
        decorations: Decoration.set(decorations, true),
        atomicRanges: Decoration.set(atomicRanges, true),
    };
}
