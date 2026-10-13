import {
    missingReferenceKind,
    showMissingReferenceDialog,
} from './missing-reference-dialog';
import {
    checkReferenceAvailability,
    referenceAvailabilityRequest,
} from './reference-availability';
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
    if (missingReferenceKind(source)) return source;
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

export function isMarkdownPageDestination(destination: string): boolean {
    return (
        missingReferenceKind(destination) === 'page' ||
        (destination.startsWith('/workspaces/') &&
            !destination.includes('/attachments/'))
    );
}

export function openMarkdownPreviewLink(
    event: MouseEvent,
    link: HTMLAnchorElement,
) {
    event.preventDefault();
    const href = link.href;
    const missing = missingReferenceKind(new URL(href).hash);
    if (missing) {
        showMissingReferenceDialog(
            link.ownerDocument,
            missing,
            link.textContent ?? '',
        );
        return true;
    }
    const isPage = link.dataset.orbiumMention === 'true';
    const shouldOpen =
        isPage || event.ctrlKey || event.metaKey || event.detail === 0;
    if (!shouldOpen) return false;
    const origin = window.location.origin;
    if (!referenceAvailabilityRequest(href, origin)) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return true;
    }
    const newTab = event.ctrlKey || event.metaKey;
    const tab = newTab ? window.open('about:blank', '_blank') : null;
    if (tab) tab.opener = null;
    void checkReferenceAvailability(href, origin)
        .then((available) => {
            if (!available) {
                tab?.close();
                showMissingReferenceDialog(
                    link.ownerDocument,
                    isPage ? 'page' : 'file',
                    link.textContent ?? '',
                );
                return;
            }
            if (newTab) {
                if (tab) tab.location.replace(href);
            } else if (isPage) router.visit(new URL(href).pathname);
            else window.open(href, '_blank', 'noopener,noreferrer');
        })
        .catch((failure: unknown) => {
            tab?.close();
            showMissingReferenceDialog(
                link.ownerDocument,
                isPage ? 'page' : 'file',
                '',
                {
                    title: 'Could not open this item',
                    message:
                        failure instanceof Error
                            ? failure.message
                            : 'Please try again.',
                },
            );
        });
    return true;
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
