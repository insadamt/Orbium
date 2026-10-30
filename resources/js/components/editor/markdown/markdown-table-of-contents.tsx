// Summary: Extracts and navigates every Document H1/H2, including column bodies; depends on the Markdown source parser, mounted column position mapping and shared outline motion.
import { resolveColumnDocumentPosition } from './columns/column-position';
import { readOrbiumMetadata } from './dialect/metadata';
import {
    outlineReadingTop,
    subscribeOutlineScrolling,
} from '../outline-reading-position';
import {
    animateHeadingNavigation,
    headingScrollDestination,
} from '../outline-navigation-motion';
import { useMemo } from 'react';
import { Compartment, type Text } from '@codemirror/state';
import { EditorView, ViewPlugin } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import {
    TableOfContents,
    type DocumentHeading,
    type DocumentOutline,
} from '../table-of-contents';
import { markdownSourceParser } from './interactions/markdown-source-parser';
import { logicalMarkdownText } from './interactions/markdown-logical-text';
import { readEditableMarkdownPresentation } from './interactions/markdown-editable-presentation';

function readMarkdownHeadings(view: EditorView): DocumentHeading[] {
    const source = view.state.doc;
    const headings: DocumentHeading[] = [];
    const visit = (node: SyntaxNode) => {
        if (
            /^(?:FencedCode|CodeBlock|HTMLBlock|OrbiumMathBlock|OrbiumUnclosed)$/.test(
                node.name,
            )
        )
            return;
        if (node.name === 'OrbiumDirective') {
            const presentation = readEditableMarkdownPresentation(
                view.state,
                node,
            );
            if (presentation) visit(presentation.body);
            else {
                const header = node.getChild('OrbiumHeader');
                const text =
                    header && source.sliceString(header.from, header.to);
                const metadata =
                    text &&
                    readOrbiumMetadata(text.slice(text.indexOf('{')).trimEnd());
                const body = node.getChild('Document');
                if (
                    metadata &&
                    ['columns', 'column'].includes(String(metadata.kind)) &&
                    body
                )
                    visit(body);
            }
            return;
        }
        const heading = /^(?:ATX|Setext)Heading([1-2])$/.exec(node.name);
        if (heading) {
            headings.push({
                position: node.from,
                level: Number(heading[1]) as DocumentHeading['level'],
                label:
                    logicalMarkdownText(source.slice(node.from, node.to))
                        .text.trim()
                        .replace(/\s+/g, ' ') || 'Untitled heading',
            });
            return;
        }
        for (let child = node.firstChild; child; child = child.nextSibling)
            visit(child);
    };
    // The viewport syntax tree may be incomplete; the outline needs every heading.
    visit(markdownSourceParser.parse(source.toString()).topNode);
    return headings;
}

export function MarkdownTableOfContents({
    view,
    updates,
}: {
    view: EditorView | null;
    updates: Compartment;
}) {
    const outline = useMemo<DocumentOutline | null>(() => {
        if (!view) return null;
        let source: Text | null = null;
        let headings: DocumentHeading[] = [];
        return {
            readHeadings() {
                if (source !== view.state.doc) {
                    headings = readMarkdownHeadings(view);
                    source = view.state.doc;
                }
                return headings;
            },
            readReadingPosition() {
                return view.lineBlockAtHeight(
                    Math.max(0, outlineReadingTop(view.dom) - view.documentTop),
                ).from;
            },
            subscribeToScrolling: (refresh) =>
                subscribeOutlineScrolling(view.dom, refresh),
            subscribe(refresh) {
                let disposed = false;
                view.dispatch({
                    effects: updates.reconfigure(
                        ViewPlugin.define(() => ({
                            update(update) {
                                if (update.docChanged || update.selectionSet)
                                    refresh();
                            },
                            destroy() {
                                disposed = true;
                            },
                        })),
                    ),
                });
                return () => {
                    if (!disposed)
                        view.dispatch({ effects: updates.reconfigure([]) });
                };
            },
            navigateToHeading(heading) {
                return animateHeadingNavigation({
                    editorElement: view.dom,
                    measureDestination(navigate) {
                        const column = resolveColumnDocumentPosition(
                            view,
                            heading.position,
                        );
                        const targetView = column?.view ?? view;
                        const position = column?.position ?? heading.position;
                        targetView.dispatch({
                            selection: { anchor: position },
                        });
                        targetView.focus();
                        // Measure without revealing: a preliminary scroll paints a flash before the tween.
                        view.requestMeasure({
                            read() {
                                const headingTop =
                                    targetView.coordsAtPos(position)?.top ??
                                    view.documentTop +
                                        view.lineBlockAt(heading.position).top;
                                return headingScrollDestination(
                                    view.dom,
                                    headingTop,
                                );
                            },
                            write: navigate,
                        });
                    },
                });
            },
        };
    }, [view, updates]);
    return <TableOfContents outline={outline} />;
}
