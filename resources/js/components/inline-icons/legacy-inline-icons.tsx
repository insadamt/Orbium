import type { Editor } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import { useIconRecents } from './use-icon-recents';
import { announceInsertedIcon } from './icon-preferences';
import { router } from '@inertiajs/react';
import { InlineIconPicker } from './inline-icon-picker';
import { iconPickerEvent } from './markdown-icon-widget';
import { legacyIconAnchor, legacyIconAttributes } from './inline-icon-node';
import { inlineIconLabel, type InlineIconChoice } from './icon-catalog';
import { uploadAttachment } from '@/components/editor/editor-api';
import { useHostedDocumentSession } from '@/components/editor/hosted-document-session';
import { useDocumentTab } from '@/components/navigation/document-tab-context';

export function LegacyInlineIcons({
    editor,
    workspaceId,
    nodeId,
}: {
    editor: Editor | null;
    workspaceId: number;
    nodeId: number;
}) {
    const [query, setQuery] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [host, setHost] = useState<HTMLElement | null>(null);
    const busy = useRef(false);
    const mounted = useRef(true);
    const fileInput = useRef<HTMLInputElement>(null);
    const hosted = useHostedDocumentSession();
    const { tabId } = useDocumentTab();
    useIconRecents(host, workspaceId);

    useEffect(() => {
        if (!editor) return;
        let frame = 0;
        const attach = () => {
            if (editor.isDestroyed) return;
            if (editor.isInitialized) setHost(editor.view.dom);
            else frame = requestAnimationFrame(attach);
        };
        attach();
        return () => cancelAnimationFrame(frame);
    }, [editor]);

    useEffect(() => {
        if (!editor || !host) return;
        const open = (event: Event) => {
            if (
                !editor.isEditable ||
                editor.view.composing ||
                busy.current ||
                hosted?.readOnly
            )
                return;
            const { from, to } = editor.state.selection;
            editor.view.dispatch(
                editor.state.tr.setMeta(legacyIconAnchor, {
                    from,
                    to,
                    source: JSON.stringify(
                        editor.state.doc.slice(from, to).toJSON(),
                    ),
                }),
            );
            setError('');
            setQuery(
                (event as CustomEvent<{ query?: string }>).detail.query ?? '',
            );
        };
        host.addEventListener(iconPickerEvent, open);
        return () => host.removeEventListener(iconPickerEvent, open);
    }, [editor, host, hosted?.readOnly]);

    useEffect(() => {
        mounted.current = true;
        const guard = (event: Event) => {
            if (
                !busy.current ||
                (event.type === 'orbium:before-tab-close' &&
                    (event as CustomEvent<{ tabId: string }>).detail.tabId !==
                        tabId)
            )
                return;
            event.preventDefault();
            setError(
                'Wait for the icon upload to finish before leaving this document.',
            );
        };
        const removeGuard = router.on('before', () => {
            if (busy.current) return false;
        });
        const events = [
            'beforeunload',
            'orbium:before-page-leave',
            'orbium:before-tab-close',
        ];
        events.forEach((name) => window.addEventListener(name, guard));
        return () => {
            mounted.current = false;
            removeGuard();
            events.forEach((name) => window.removeEventListener(name, guard));
        };
    }, [tabId]);

    function clearAnchor() {
        if (editor && !editor.isDestroyed)
            editor.view.dispatch(
                editor.state.tr.setMeta(legacyIconAnchor, null),
            );
    }
    function choose(choice: InlineIconChoice) {
        if (
            !editor ||
            editor.isDestroyed ||
            !editor.isEditable ||
            editor.view.composing ||
            hosted?.readOnly
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
                'The insertion text changed. Open the icon picker again at the desired position.',
            );
            setQuery(null);
            clearAnchor();
            return;
        }
        editor
            .chain()
            .focus()
            .insertContentAt(
                { from: anchor.from, to: anchor.to },
                choice.kind === 'emoji'
                    ? { type: 'text', text: choice.value }
                    : {
                          type: 'inlineIcon',
                          attrs: legacyIconAttributes(choice),
                      },
            )
            .run();
        clearAnchor();
        setQuery(null);
        announceInsertedIcon(editor.view.dom, choice);
    }
    async function upload(file: File) {
        if (
            busy.current ||
            !editor ||
            editor.isDestroyed ||
            !editor.isEditable ||
            hosted?.readOnly
        )
            return;
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
        hosted?.setBusy('upload', true);
        setError('');
        try {
            const attachment = await uploadAttachment(
                workspaceId,
                nodeId,
                file,
            );
            if (mounted.current)
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
            hosted?.setBusy('upload', false);
        }
    }
    return (
        <>
            {error && (
                <p role="alert" className="mb-2 text-sm text-destructive">
                    {error}
                </p>
            )}
            {uploading && (
                <p role="status" className="mb-2 text-sm text-muted-foreground">
                    Uploading icon…
                </p>
            )}
            {query !== null && (
                <InlineIconPicker
                    workspaceId={workspaceId}
                    nodeId={nodeId}
                    initialQuery={query}
                    busy={uploading}
                    error={error}
                    onReturnFocus={() => {
                        if (editor && !editor.isDestroyed)
                            editor.commands.focus();
                    }}
                    onChoose={(choice) => {
                        if (!busy.current) choose(choice);
                    }}
                    onUpload={() => {
                        if (!busy.current) fileInput.current?.click();
                    }}
                    onClose={() => {
                        if (busy.current) return;
                        setQuery(null);
                        clearAnchor();
                        editor?.commands.focus();
                    }}
                />
            )}
            <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                aria-label="Upload custom inline icon"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                    event.target.value = '';
                }}
            />
        </>
    );
}
