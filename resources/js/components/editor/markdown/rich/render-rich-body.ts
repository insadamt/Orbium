import { mountPlayfulTaskCheckbox } from '../../playful-task-checkbox';
import { mountNestedMedia } from './nested-media-preview';
import { applyMarkdownDividerAppearance } from '../preview/markdown-divider-appearance';
import { EditorState } from '@codemirror/state';
import { markdownLanguage } from '@codemirror/lang-markdown';
import type { MarkdownParser } from '@lezer/markdown';
import type { SyntaxNode } from '@lezer/common';
import { orbiumMarkdownDialect } from '../dialect/markdown-dialect';
import { readOrbiumMetadata, type OrbiumMetadata } from '../dialect/metadata';
import {
    markdownLinkDestination,
    openMarkdownPreviewLink,
    isMarkdownPageDestination,
} from '../preview/markdown-link-preview';
import { createMermaidPreviewControls } from '../../mermaid-preview-controls';
import { instantiateMermaidSvg } from '../../mermaid-preview-renderer';
import { applyMermaidPreviewDimensions } from '../../mermaid-preview-layout';
import type { RichBlock, RichContext } from './rich-model';
import { readRichBlock } from './read-rich-block';
import { renderMath } from './math-preview';
import { element } from './widget-controls';
import { mountCodePreview } from './code-preview';

const parser = (markdownLanguage.parser as MarkdownParser).configure(
    orbiumMarkdownDialect,
);
const hiddenMarks = new Set([
    'HeaderMark',
    'QuoteMark',
    'ListMark',
    'EmphasisMark',
    'StrikethroughMark',
    'CodeMark',
    'OrbiumSpanMark',
    'OrbiumMetadata',
    'OrbiumHeader',
    'OrbiumClose',
]);
const tags: Record<string, keyof HTMLElementTagNameMap> = {
    Paragraph: 'p',
    Task: 'div',
    StrongEmphasis: 'strong',
    Emphasis: 'em',
    Strikethrough: 's',
    InlineCode: 'code',
    BulletList: 'ul',
    OrderedList: 'ol',
    ListItem: 'li',
    Blockquote: 'blockquote',
    ATXHeading1: 'h1',
    ATXHeading2: 'h2',
    ATXHeading3: 'h3',
    ATXHeading4: 'h4',
    ATXHeading5: 'h5',
    ATXHeading6: 'h6',
    SetextHeading1: 'h1',
    SetextHeading2: 'h2',
};

export function applyInlineMetadata(
    target: HTMLElement,
    metadata: OrbiumMetadata,
) {
    if (metadata.underline) target.style.textDecoration = 'underline';
    const color = String(metadata.color ?? '');
    if (color.startsWith('preset:'))
        target.style.color = `var(--editor-text-color-${color.slice(7)})`;
    else if (/^#[0-9a-f]{6}$/.test(color)) target.style.color = color;
}

export function renderRichBody(
    output: HTMLElement,
    source: string,
    context: RichContext,
    measure: () => void,
    depth = 0,
): () => void {
    if (depth >= 32 || source.length > 131072) {
        output.textContent = source;
        return () => {};
    }
    const state = EditorState.create({ doc: source });
    const tree = parser.parse(source);
    const disposals: (() => void)[] = [];
    let destroyed = false;
    function renderChildren(
        parent: HTMLElement,
        node: SyntaxNode,
        includeGaps = true,
        from = node.from,
        to = node.to,
    ) {
        let position = from;
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.from < from || child.to > to) continue;
            if (includeGaps && child.from > position)
                parent.append(
                    document.createTextNode(source.slice(position, child.from)),
                );
            const previousChild = parent.lastElementChild;
            renderNode(parent, child);
            //
            // Linked-page previews expose source positions so editing can anchor the same block despite different layout heights.
            //
            if (
                context.documentSourceRanges &&
                depth === 0 &&
                parent === output
            ) {
                let rendered = previousChild
                    ? previousChild.nextElementSibling
                    : parent.firstElementChild;
                while (rendered) {
                    rendered.setAttribute(
                        'data-document-from',
                        String(child.from),
                    );
                    rendered.setAttribute('data-document-to', String(child.to));
                    rendered = rendered.nextElementSibling;
                }
            }
            position = child.to;
        }
        if (includeGaps && position < to)
            parent.append(document.createTextNode(source.slice(position, to)));
    }
    function renderBlockContents(
        target: HTMLElement,
        block: RichBlock,
        node: SyntaxNode,
    ) {
        if (block.kind === 'inline-math' || block.kind === 'math') {
            renderMath(target, {
                context,
                latex: block.content,
                displayMode: block.kind === 'math',
            });
            return;
        }
        if (block.kind === 'mermaid') {
            const controls = createMermaidPreviewControls();
            target.before(controls.button);
            disposals.push(() => controls.destroy());
            target.dataset.mermaidPreview = '';
            target.textContent = 'Rendering diagram…';
            target.className = 'overflow-auto [&>svg]:w-full';
            disposals.push(
                context.mermaid.register(
                    block.content,
                    target,
                    ({ preview, dimensions, error }) => {
                        if (destroyed) return;
                        if (preview) {
                            controls.update(preview);
                            target.innerHTML = instantiateMermaidSvg(preview);
                        } else if (error) {
                            controls.update();
                            target.textContent =
                                'Diagram could not be rendered. Edit this block to fix the source.';
                        } else if (dimensions)
                            applyMermaidPreviewDimensions(target, dimensions);
                        measure();
                    },
                ),
            );
            return;
        }
        if (block.kind === 'code') {
            if (context.ownerKind === 'board') {
                disposals.push(mountCodePreview(target, block));
                return;
            }
            const pre = element('pre');
            const code = element('code', '', block.content);
            pre.append(code);
            target.append(pre);
            return;
        }
        if (block.kind === 'empty') {
            target.append(element('p', 'min-h-7'));
            return;
        }
        if (block.kind === 'image' || block.kind === 'file') {
            disposals.push(mountNestedMedia(target, block, context, measure));
            return;
        }
        if (block.kind === 'table' && block.table) {
            const table = element('table', 'orbium-table w-full');
            const body = element('tbody');
            table.append(body);
            target.append(table);
            for (const row of block.table.rows) {
                const tr = element('tr');
                body.append(tr);
                for (const cell of row) {
                    const td = element(cell.metadata.header ? 'th' : 'td');
                    td.colSpan = Number(cell.metadata.colspan ?? 1);
                    td.rowSpan = Number(cell.metadata.rowspan ?? 1);
                    td.style.textAlign = String(cell.metadata.align ?? '');
                    tr.append(td);
                    disposals.push(
                        renderRichBody(
                            td,
                            cell.source,
                            context,
                            measure,
                            depth + 1,
                        ),
                    );
                }
            }
            return;
        }
        if (block.kind === 'callout') {
            target.className =
                'orbium-callout rounded-xl border border-border p-4';
            target.append(element('div', 'mb-2 font-medium', block.label));
            const calloutBody = element('div');
            target.append(calloutBody);
            disposals.push(
                renderRichBody(
                    calloutBody,
                    block.content,
                    context,
                    measure,
                    depth + 1,
                ),
            );
            return;
        }
        if (block.kind === 'metadata') {
            const documentNode = node.getChild('Document');
            if (documentNode) {
                renderChildren(target, documentNode, false);
                const divider =
                    target.querySelector<HTMLElement>('.cm-md-divider');
                if (divider)
                    applyMarkdownDividerAppearance(divider, block.presentation);
                if (block.presentation.listType)
                    target
                        .querySelector('ol')
                        ?.setAttribute(
                            'type',
                            String(block.presentation.listType),
                        );
            }
            return;
        }
    }
    function renderNode(parent: HTMLElement, node: SyntaxNode) {
        const block = readRichBlock(state, node);
        if (block) {
            const target = element(
                block.kind === 'inline-math' ? 'span' : 'div',
            );
            parent.append(target);
            if (block.presentation.dir)
                target.dir = String(block.presentation.dir);
            if (block.presentation.align)
                target.style.textAlign = String(block.presentation.align);
            const deferred =
                context.schedulePreview &&
                ['image', 'file', 'table', 'math', 'mermaid'].includes(
                    block.kind,
                );
            if (deferred) {
                //
                // Keep readable text immediate while expensive embedded surfaces share the Board's bounded input-aware queue.
                //
                target.textContent =
                    block.kind === 'math' || block.kind === 'mermaid'
                        ? block.content
                        : `Loading ${block.kind} preview…`;
                disposals.push(
                    context.schedulePreview!(target, () => {
                        if (destroyed) return;
                        renderBlockContents(target, block, node);
                        measure();
                    }),
                );
            } else renderBlockContents(target, block, node);
            return;
        }
        if (hiddenMarks.has(node.name)) return;
        if (node.name === 'Document') {
            renderChildren(parent, node, false);
            return;
        }
        if (node.name === 'HorizontalRule') {
            const divider = element('span', 'orbium-divider cm-md-divider');
            divider.setAttribute('role', 'separator');
            parent.append(divider);
            return;
        }
        if (node.name === 'HardBreak') {
            parent.append(element('br'));
            return;
        }
        if (node.name === 'Escape') {
            parent.append(
                document.createTextNode(source.slice(node.from + 1, node.to)),
            );
            return;
        }
        if (node.name === 'Entity') {
            const decoder = element('textarea');
            decoder.innerHTML = source.slice(node.from, node.to);
            parent.append(document.createTextNode(decoder.value));
            return;
        }
        if (node.name === 'OrbiumSpan') {
            const metadataNode = node.getChild('OrbiumMetadata');
            const metadata =
                metadataNode &&
                readOrbiumMetadata(
                    source.slice(metadataNode.from, metadataNode.to),
                    'inline',
                );
            if (!metadata) {
                parent.append(
                    document.createTextNode(source.slice(node.from, node.to)),
                );
                return;
            }
            const span = element('span');
            applyInlineMetadata(span, metadata);
            parent.append(span);
            renderChildren(span, node);
            return;
        }
        if (node.name === 'Link' || node.name === 'Autolink') {
            const url = markdownLinkDestination(state, node, context);
            const link = element(url ? 'a' : 'span', 'cm-md-link');
            if (url && link instanceof HTMLAnchorElement) {
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.dataset.orbiumPreviewLink = '';
                link.dataset.orbiumMention = isMarkdownPageDestination(url)
                    ? 'true'
                    : 'false';
                if (link.dataset.orbiumMention === 'true') {
                    link.classList.add(
                        'editor-mention',
                        'editor-mention-button',
                    );
                    link.contentEditable = 'false';
                    link.tabIndex = 0;
                    link.setAttribute('role', 'button');
                    link.title =
                        'Open page · Ctrl/Cmd+click to open in a new tab';
                    link.addEventListener('mousedown', (event) =>
                        event.preventDefault(),
                    );
                    link.addEventListener('keydown', (event) => {
                        if (
                            event.altKey ||
                            (event.key !== 'Enter' &&
                                (event.key !== ' ' ||
                                    event.ctrlKey ||
                                    event.metaKey))
                        )
                            return;
                        event.stopPropagation();
                        openMarkdownPreviewLink(event, link);
                    });
                }
                link.addEventListener('click', (event) => {
                    event.stopPropagation();
                    openMarkdownPreviewLink(event, link);
                });
            }
            const marks = node.getChildren('LinkMark');
            const opening = marks[0];
            const closing = marks.find((mark) => mark.from > node.from);
            const from = opening?.to ?? node.from;
            const to = closing?.from ?? node.getChild('URL')?.to ?? node.to;
            renderChildren(link, node, true, from, to);
            parent.append(link);
            return;
        }
        if (node.name === 'TaskMarker') {
            const checkbox = element('input');
            checkbox.type = 'checkbox';
            checkbox.checked = /x/i.test(source.slice(node.from, node.to));
            checkbox.disabled = true;
            parent.append(checkbox);
            checkbox.setAttribute(
                'aria-label',
                checkbox.checked ? 'Completed task' : 'Incomplete task',
            );
            mountPlayfulTaskCheckbox(checkbox);
            return;
        }
        const tag = tags[node.name];
        if (!tag) {
            parent.append(
                document.createTextNode(source.slice(node.from, node.to)),
            );
            return;
        }
        const child = element(tag);
        if (tag === 'p') child.className = 'orbium-paragraph';
        else if (/^h[1-6]$/.test(tag))
            child.className = `orbium-heading-${tag.slice(1)}`;
        else if (tag === 'ul') {
            const taskList = node
                .getChildren('ListItem')
                .some((item) => item.getChild('Task'));
            child.className = taskList
                ? 'orbium-checklist'
                : 'orbium-bullet-list';
            if (taskList) child.dataset.type = 'taskList';
        } else if (tag === 'ol') {
            child.className = 'orbium-ordered-list';
            const start = /^\s*(\d+)[.)] /.exec(
                source.slice(node.from, node.to),
            )?.[1];
            if (start) (child as HTMLOListElement).start = Number(start);
        } else if (tag === 'blockquote') child.className = 'orbium-quote';
        parent.append(child);
        if (node.name === 'InlineCode')
            child.textContent = source
                .slice(node.from, node.to)
                .replace(/^`+|`+$/g, '')
                .replace(/\n/g, ' ');
        else
            renderChildren(
                child,
                node,
                ![
                    'BulletList',
                    'OrderedList',
                    'ListItem',
                    'Blockquote',
                ].includes(node.name),
            );
    }
    output.replaceChildren();
    renderNode(output, tree.topNode);
    return () => {
        destroyed = true;
        disposals.forEach((dispose) => dispose());
    };
}
