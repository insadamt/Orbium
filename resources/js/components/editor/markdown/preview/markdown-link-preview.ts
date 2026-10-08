import { markdownReferenceDestination } from '../interactions/markdown-reference-links';
import { router } from '@inertiajs/react';
import type { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { documentUrl } from '../../editor-api';

export type MarkdownLinkContext = { workspaceId: number; nodeId: number };

function hasUrlControlCharacters(source: string): boolean {
    for (const character of source) {
        const code = character.charCodeAt(0);
        if (code <= 31 || code === 127) return true;
    }
    return false;
}

export function markdownLinkDestination(
    state: EditorState,
    node: SyntaxNode,
    context: MarkdownLinkContext,
): string | null {
    const destination = node.getChild('URL');
    const raw = destination
        ? state.sliceDoc(destination.from, destination.to)
        : markdownReferenceDestination(state, node);
    if (raw === null) return null;
    const source = raw
        .replace(/^<|>$/g, '')
        .replace(/\\([\\`*_{}[\]()#+.!<>-])/g, '$1');
    const mention = /^orbium:node\/([1-9]\d*)$/.exec(source);
    if (mention)
        return `/workspaces/${context.workspaceId}/nodes/${mention[1]}`;
    const attachment = /^orbium:attachment\/([1-9]\d*)$/.exec(source);
    if (attachment)
        return `${documentUrl(context.workspaceId, context.nodeId)}/attachments/${attachment[1]}`;
    if (hasUrlControlCharacters(source) || /&(?:#\w+|\w+);/.test(source))
        return null;
    try {
        const url = new URL(source, window.location.origin);
        if (
            /^[a-z][a-z0-9+.-]*:/i.test(source) &&
            !/^(?:https?:\/\/|mailto:)/i.test(source)
        )
            return null;
        return ['http:', 'https:', 'mailto:'].includes(url.protocol)
            ? url.href
            : null;
    } catch {
        return null;
    }
}

export function openMarkdownPreviewLink(
    event: MouseEvent,
    link: HTMLAnchorElement,
) {
    event.preventDefault();
    if (
        link.dataset.orbiumMention === 'true' &&
        !event.ctrlKey &&
        !event.metaKey
    ) {
        router.visit(new URL(link.href).pathname);
        return true;
    }
    if (event.ctrlKey || event.metaKey || event.detail === 0) {
        window.open(link.href, '_blank', 'noopener,noreferrer');
        return true;
    }
    return false;
}

export const markdownLinkNavigation = EditorView.domEventHandlers({
    click(event) {
        if (!(event.target instanceof Element)) return false;
        const link = event.target.closest<HTMLAnchorElement>(
            'a[data-orbium-preview-link]',
        );
        return link ? openMarkdownPreviewLink(event, link) : false;
    },
});
