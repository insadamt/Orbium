import { isValidTextColor } from '@/components/editor/text-color';
import { safeBoardLink } from '../board-block-data';
import type { BoardInline, BoardObject } from '../board-types';

function prepareInlineContent(content: BoardInline[]) {
    const fragment = document.createDocumentFragment();
    for (const inline of content) {
        if (inline.type === 'hardBreak') {
            fragment.append(document.createElement('br'));
            continue;
        }
        let node: Node = document.createTextNode(inline.text ?? '');
        for (const mark of inline.marks ?? []) {
            let wrapper: HTMLElement | undefined;
            const tags = {
                bold: 'strong',
                italic: 'em',
                underline: 'u',
                strike: 's',
                code: 'code',
            } as const;
            if (mark.type in tags)
                wrapper = document.createElement(
                    tags[mark.type as keyof typeof tags],
                );
            if (
                mark.type === 'link' &&
                mark.attrs?.href &&
                safeBoardLink(mark.attrs.href)
            ) {
                const link = document.createElement('a');
                link.href = mark.attrs.href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.dataset.boardInteractive = '';
                wrapper = link;
            }
            if (
                mark.type === 'textColor' &&
                mark.attrs?.color &&
                isValidTextColor(mark.attrs.color)
            ) {
                const color = mark.attrs.color;
                wrapper = document.createElement('span');
                wrapper.dataset.textColor = color;
                wrapper.style.color = color.startsWith('preset:')
                    ? `var(--editor-text-color-${color.slice(7)})`
                    : color;
            }
            if (wrapper) {
                wrapper.append(node);
                node = wrapper;
            }
        }
        fragment.append(node);
    }
    return fragment;
}

export function supportsPreparedBoardText(object: BoardObject) {
    return ['text', 'heading', 'list', 'quote', 'callout'].includes(
        object.block_type,
    );
}

export function prepareBoardText(object: BoardObject): HTMLElement {
    const { data, block_type: kind } = object;
    const surface = document.createElement('div');
    if (kind === 'list') {
        surface.className = 'board-list';
        surface.dataset.listStyle = data.list_style;
        for (const [index, item] of (data.items ?? []).entries()) {
            const row = document.createElement('div');
            row.className = 'board-list-item';
            row.style.paddingInlineStart = `${item.indent * 20}px`;
            if (data.list_style === 'check') {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = item.checked;
                checkbox.dataset.boardInteractive = '';
                checkbox.dataset.instantCheckIndex = String(index);
                checkbox.setAttribute(
                    'aria-label',
                    `Complete item ${index + 1}`,
                );
                row.append(checkbox);
            } else {
                const marker = document.createElement('span');
                marker.className = 'board-list-marker';
                marker.setAttribute('aria-hidden', 'true');
                marker.textContent =
                    data.list_style === 'ordered' ? `${index + 1}.` : '•';
                row.append(marker);
            }
            const content = document.createElement('div');
            content.className = 'board-list-content';
            content.append(prepareInlineContent(item.content));
            row.append(content);
            surface.append(row);
        }
        return surface;
    }
    surface.className = `board-writing board-writing-${kind}${kind === 'heading' ? ` cm-md-heading-${data.level}` : kind === 'quote' ? ' cm-md-quote' : kind === 'callout' ? ' editor-callout' : ''}`;
    if (data.level) surface.dataset.level = String(data.level);
    surface.dir = data.dir ?? 'auto';
    surface.style.textAlign = data.align ?? '';
    if (data.content?.length)
        surface.append(prepareInlineContent(data.content));
    else {
        const placeholder = document.createElement('span');
        placeholder.className = 'board-text-placeholder';
        placeholder.textContent = 'Double-click to write';
        surface.append(placeholder);
    }
    return surface;
}
