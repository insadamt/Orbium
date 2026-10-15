import { ArrowUpRight, ExternalLink, Trash2 } from 'lucide-react';
import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { openLocation } from '@/components/navigation/tab-navigation';
import { PositionedMenu } from '@/components/ui/positioned-menu';
import * as Menu from '@/components/ui/dropdown-menu';
import type { DatabaseDocument } from './types';

type ContextTarget = {
    document: DatabaseDocument;
    x: number;
    y: number;
    returnFocusTo: HTMLElement;
};

type Options = {
    workspaceId: number;
    onTrashDocument: (document: DatabaseDocument) => void;
};

function isEditingText(target: EventTarget | null) {
    return (
        target instanceof Element &&
        Boolean(target.closest('input, textarea, [contenteditable="true"]'))
    );
}

export function useDatabaseDocumentContextMenu({
    workspaceId,
    onTrashDocument,
}: Options) {
    const [target, setTarget] = useState<ContextTarget | null>(null);

    function closeMenu() {
        setTarget(null);
    }

    function openContextMenu(
        event: MouseEvent<HTMLElement>,
        document: DatabaseDocument,
    ) {
        if (isEditingText(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        setTarget({
            document,
            x: event.clientX,
            y: event.clientY,
            returnFocusTo:
                event.currentTarget.querySelector<HTMLElement>(
                    'a[href], button',
                ) ?? event.currentTarget,
        });
    }

    function openKeyboardContextMenu(
        event: KeyboardEvent<HTMLElement>,
        document: DatabaseDocument,
    ) {
        if (
            isEditingText(event.target) ||
            !(
                event.key === 'ContextMenu' ||
                (event.shiftKey && event.key === 'F10')
            )
        )
            return;
        event.preventDefault();
        event.stopPropagation();
        const focusTarget =
            event.target instanceof HTMLElement
                ? event.target
                : event.currentTarget;
        const bounds = focusTarget.getBoundingClientRect();
        setTarget({
            document,
            x: bounds.left + 16,
            y: bounds.bottom,
            returnFocusTo: focusTarget,
        });
    }

    function openDocument(newTab: boolean) {
        if (!target) return;
        closeMenu();
        openLocation(
            `/workspaces/${workspaceId}/documents/${target.document.id}`,
            newTab,
        );
    }

    const contextMenu =
        target &&
        createPortal(
            <PositionedMenu
                key={`${target.document.id}:${target.x}:${target.y}`}
                position={target}
                label={`Actions for ${target.document.title}`}
                onClose={closeMenu}
                returnFocusTo={target.returnFocusTo}
            >
                <Menu.Item onSelect={() => openDocument(false)}>
                    <ArrowUpRight size={16} />
                    Open document
                </Menu.Item>
                <Menu.Item onSelect={() => openDocument(true)}>
                    <ExternalLink size={16} />
                    Open in new tab
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                    variant="destructive"
                    onSelect={() => {
                        closeMenu();
                        onTrashDocument(target.document);
                    }}
                >
                    <Trash2 size={16} />
                    Move to Trash
                </Menu.Item>
            </PositionedMenu>,
            document.body,
        );

    return { contextMenu, openContextMenu, openKeyboardContextMenu };
}
