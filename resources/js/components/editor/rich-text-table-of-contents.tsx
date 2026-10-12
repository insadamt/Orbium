import {
    outlineReadingTop,
    subscribeOutlineScrolling,
} from './outline-reading-position';
import {
    animateHeadingNavigation,
    scrollOutlineTargetIntoView,
} from './outline-navigation-motion';
import { useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import {
    TableOfContents,
    type DocumentHeading,
    type DocumentOutline,
} from './table-of-contents';

export function RichTextTableOfContents({ editor }: { editor: Editor | null }) {
    const outline = useMemo<DocumentOutline | null>(() => {
        if (!editor) return null;
        let snapshot: Node | null = null;
        let headings: DocumentHeading[] = [];
        return {
            readHeadings() {
                if (snapshot !== editor.state.doc) {
                    snapshot = editor.state.doc;
                    headings = [];
                    snapshot.descendants((node, position) => {
                        const level = Number(node.attrs.level);
                        if (
                            node.type.name === 'heading' &&
                            [1, 2].includes(level)
                        )
                            headings.push({
                                position,
                                level: level as DocumentHeading['level'],
                                label:
                                    node.textContent.trim() ||
                                    'Untitled heading',
                            });
                    });
                }
                return headings;
            },
            readReadingPosition() {
                const top = outlineReadingTop(editor.view.dom);
                let start = 0,
                    end = headings.length - 1,
                    position = 0;
                while (start <= end) {
                    const middle = Math.floor((start + end) / 2);
                    const target = editor.view.nodeDOM(
                        headings[middle].position,
                    );
                    if (
                        target instanceof HTMLElement &&
                        target.getBoundingClientRect().top <= top
                    ) {
                        position = headings[middle].position;
                        start = middle + 1;
                    } else end = middle - 1;
                }
                return position;
            },
            subscribeToScrolling: (refresh) =>
                subscribeOutlineScrolling(editor.view.dom, refresh),
            subscribe(refresh) {
                editor.on('update', refresh);
                editor.on('selectionUpdate', refresh);
                return () => {
                    editor.off('update', refresh);
                    editor.off('selectionUpdate', refresh);
                };
            },
            navigateToHeading(heading) {
                return animateHeadingNavigation({
                    editorElement: editor.view.dom,
                    revealHeading() {
                        editor.commands.setTextSelection(heading.position + 1);
                        editor.commands.focus(undefined, {
                            scrollIntoView: false,
                        });
                        const target = editor.view.nodeDOM(heading.position);
                        if (!(target instanceof HTMLElement)) return;
                        scrollOutlineTargetIntoView(target);
                    },
                });
            },
        };
    }, [editor]);
    return <TableOfContents outline={outline} />;
}
