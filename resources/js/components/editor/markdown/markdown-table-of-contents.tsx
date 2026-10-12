import {
    outlineReadingTop,
    subscribeOutlineScrolling,
} from '../outline-reading-position';
import {
    animateHeadingNavigation,
    outlineScrollOwner,
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
                    revealHeading() {
                        view.dispatch({
                            selection: { anchor: heading.position },
                            effects: EditorView.scrollIntoView(
                                heading.position,
                                {
                                    y: 'start',
                                    yMargin: 96,
                                },
                            ),
                        });
                        view.focus();
                        const owner = outlineScrollOwner(view.dom);
                        const frame = window.frameElement as HTMLElement | null;
                        if (
                            frame &&
                            owner.ownerDocument !== view.dom.ownerDocument
                        )
                            view.requestMeasure({
                                read() {
                                    return (
                                        view.coordsAtPos(heading.position)
                                            ?.top ??
                                        view.documentTop +
                                            view.lineBlockAt(heading.position)
                                                .top
                                    );
                                },
                                write(top) {
                                    owner.scrollTop +=
                                        frame.getBoundingClientRect().top +
                                        top -
                                        owner.getBoundingClientRect().top -
                                        96;
                                },
                            });
                    },
                });
            },
        };
    }, [view, updates]);
    return <TableOfContents outline={outline} />;
}
