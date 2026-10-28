import { iconPickerSearchQuery } from '@/components/inline-icons/icon-catalog';
import { inlineIconInsertionMarks } from '@/components/inline-icons/inline-icon-node';
import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { router } from '@inertiajs/react';
import { InlineIconPicker } from '@/components/inline-icons/inline-icon-picker';
import {
    legacyIconAnchor,
    legacyIconAttributes,
} from '@/components/inline-icons/inline-icon-node';
import { iconPickerEvent } from '@/components/inline-icons/markdown-icon-widget';
import {
    announceInsertedIcon,
    iconInsertedEvent,
    readIconPreferences,
    rememberIconChoice,
    saveIconPreferences,
} from '@/components/inline-icons/icon-preferences';
import {
    inlineIconLabel,
    type InlineIconChoice,
} from '@/components/inline-icons/icon-catalog';
import { uploadAttachment } from '@/components/editor/editor-api';
import { useMindMapOwner } from './mindmap-owner-context';

export function requestMindMapInlineIcon(
    editor: Editor,
    query = '',
    range?: { from: number; to: number },
) {
    if (!editor.view.composing)
        editor.view.dom.dispatchEvent(
            new CustomEvent(iconPickerEvent, { detail: { query, range } }),
        );
}
export function MindMapInlineIcons({ editor }: { editor: Editor }) {
    const owner = useMindMapOwner();
    const currentOwner = useRef(owner);
    currentOwner.current = owner;
    const [query, setQuery] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [surface, setSurface] = useState<HTMLElement>();
    const busy = useRef(false);
    const mounted = useRef(true);
    const input = useRef<HTMLInputElement>(null);
    //
    // Markdown mounts this editor in a separate React root, so its picker cannot read the page authentication context.
    //
    const scope = `orbium:inline-icons:v1:mindmap:${owner?.workspaceId ?? 0}`;
    useEffect(() => {
        mounted.current = true;
        const host = editor.view.dom;
        setSurface(
            host.closest<HTMLElement>('[data-mindmap-dialog]') ?? undefined,
        );
        const open = (event: Event) => {
            event.stopPropagation();
            if (
                !editor.isEditable ||
                editor.view.composing ||
                editor.isActive('codeBlock') ||
                busy.current ||
                !currentOwner.current
            )
                return;
            const detail = (
                event as CustomEvent<{
                    query?: string;
                    range?: { from: number; to: number };
                }>
            ).detail;
            const range = detail.range ?? editor.state.selection;
            editor.view.dispatch(
                editor.state.tr.setMeta(legacyIconAnchor, {
                    from: range.from,
                    to: range.to,
                    source: JSON.stringify(
                        editor.state.doc.slice(range.from, range.to).toJSON(),
                    ),
                }),
            );
            setError('');
            setQuery(iconPickerSearchQuery(detail.query ?? ''));
        };
        const remember = (event: Event) =>
            saveIconPreferences(
                scope,
                rememberIconChoice(
                    readIconPreferences(scope),
                    (event as CustomEvent<InlineIconChoice>).detail,
                ),
            );
        const preventLeave = (event: Event) => {
            if (!busy.current) return;
            if (
                event.type === 'orbium:before-tab-close' &&
                (event as CustomEvent<{ tabId: string }>).detail.tabId !==
                    currentOwner.current?.tabId
            )
                return;
            event.preventDefault();
            setError(
                'Wait for the icon upload to finish before leaving this map.',
            );
        };
        const removeNavigationGuard = router.on('before', () => {
            if (busy.current) return false;
        });
        host.addEventListener(iconPickerEvent, open);
        host.addEventListener(iconInsertedEvent, remember);
        window.addEventListener('beforeunload', preventLeave);
        window.addEventListener('orbium:before-tab-close', preventLeave);
        window.addEventListener('orbium:before-page-leave', preventLeave);
        return () => {
            mounted.current = false;
            host.removeEventListener(iconPickerEvent, open);
            host.removeEventListener(iconInsertedEvent, remember);
            window.removeEventListener('beforeunload', preventLeave);
            window.removeEventListener('orbium:before-tab-close', preventLeave);
            window.removeEventListener(
                'orbium:before-page-leave',
                preventLeave,
            );
            removeNavigationGuard();
            if (busy.current) currentOwner.current?.onBusy?.(false);
        };
    }, [editor, scope]);
    function clearAnchor() {
        if (!editor.isDestroyed)
            editor.view.dispatch(
                editor.state.tr.setMeta(legacyIconAnchor, null),
            );
    }
    function choose(choice: InlineIconChoice) {
        if (
            !mounted.current ||
            editor.isDestroyed ||
            !editor.isEditable ||
            editor.view.composing
        )
            return;
        const anchor = legacyIconAnchor.getState(editor.state);
        if (
            !anchor ||
            anchor.from > anchor.to ||
            JSON.stringify(
                editor.state.doc.slice(anchor.from, anchor.to).toJSON(),
            ) !== anchor.source
        ) {
            setError(
                'The insertion text changed. Reopen the picker at the desired position.',
            );
            clearAnchor();
            return;
        }
        editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .setMeta('boardAction', true)
            .insertContentAt(
                { from: anchor.from, to: anchor.to },
                choice.kind === 'emoji'
                    ? { type: 'text', text: choice.value }
                    : {
                          type: 'inlineIcon',
                          attrs: legacyIconAttributes(choice),
                          marks: inlineIconInsertionMarks(
                              editor,
                              anchor.from,
                              anchor.to,
                          ),
                      },
            )
            .run();
        clearAnchor();
        setQuery(null);
        announceInsertedIcon(editor.view.dom, choice);
    }
    async function upload(file: File) {
        const target = currentOwner.current;
        if (!target || busy.current || !editor.isEditable) return;
        if (
            !['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
                file.type,
            )
        ) {
            setError('Choose a PNG, JPEG, GIF or WebP icon.');
            return;
        }
        busy.current = true;
        setUploading(true);
        setError('');
        target.onBusy?.(true);
        try {
            const attachment = await uploadAttachment(
                target.workspaceId,
                target.nodeId,
                file,
                target.kind,
            );
            if (mounted.current && !editor.isDestroyed)
                choose({
                    kind: 'custom',
                    attachmentId: attachment.id,
                    label: inlineIconLabel(attachment.name),
                });
        } catch (failure) {
            if (mounted.current)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Could not upload the icon.',
                );
        } finally {
            busy.current = false;
            if (mounted.current) setUploading(false);
            target.onBusy?.(false);
        }
    }
    if (!owner) return null;
    return (
        <div data-mindmap-uploading={uploading || undefined}>
            {query !== null && (
                <InlineIconPicker
                    workspaceId={owner.workspaceId}
                    nodeId={owner.nodeId}
                    ownerKind={owner.kind}
                    portalContainer={surface}
                    preferenceScope={scope}
                    initialQuery={query}
                    busy={uploading}
                    error={error}
                    onChoose={(choice) => {
                        if (!busy.current) choose(choice);
                    }}
                    onUpload={() => input.current?.click()}
                    onClose={() => {
                        if (!busy.current) {
                            setQuery(null);
                            clearAnchor();
                        }
                    }}
                    onReturnFocus={() => {
                        if (!editor.isDestroyed)
                            editor.commands.focus(undefined, {
                                scrollIntoView: false,
                            });
                    }}
                />
            )}
            <input
                ref={input}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                aria-label="Upload inline topic icon"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                    event.target.value = '';
                }}
            />
        </div>
    );
}
