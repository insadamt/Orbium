import { Plugin, PluginKey } from '@tiptap/pm/state';
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import type { EditorView } from '@codemirror/view';
import {
    useHostedDocumentSession,
    type HostedDocumentSession,
} from './hosted-document-session';

function useHostedComposition(
    host: HTMLElement | null,
    session: HostedDocumentSession | null,
) {
    const setComposing = session?.setComposing;
    useEffect(() => {
        if (!host || !setComposing) return;
        const start = () => setComposing(true);
        const end = () => setComposing(false);
        host.addEventListener('compositionstart', start, true);
        host.addEventListener('compositionend', end, true);
        return () => {
            end();
            host.removeEventListener('compositionstart', start, true);
            host.removeEventListener('compositionend', end, true);
        };
    }, [host, setComposing]);
}
export function useHostedLegacyDocument(editor: Editor | null) {
    const session = useHostedDocumentSession();
    const currentSession = useRef(session);
    currentSession.current = session;
    const [host, setHost] = useState<HTMLElement | null>(null);
    useEffect(() => {
        if (!editor || !session) return;
        let frame = 0;
        const attach = () => {
            if (editor.isDestroyed) return;
            if (editor.isInitialized) setHost(editor.view.dom);
            else frame = requestAnimationFrame(attach);
        };
        attach();
        return () => cancelAnimationFrame(frame);
    }, [editor, Boolean(session)]);
    useHostedComposition(host, session);
    useEffect(() => {
        if (!session || !host || !editor || editor.isDestroyed) return;
        const key = new PluginKey('hostedDocumentReadOnly');
        editor.registerPlugin(
            new Plugin({
                key,
                filterTransaction: (transaction) =>
                    !transaction.docChanged ||
                    !currentSession.current?.readOnly ||
                    Boolean(currentSession.current?.isOperationPending()),
            }),
        );
        return () => {
            if (!editor.isDestroyed) editor.unregisterPlugin(key);
        };
    }, [editor, host, Boolean(session)]);
    useLayoutEffect(() => {
        if (session && host && editor && !editor.isDestroyed)
            editor.setEditable(!session.readOnly);
    }, [editor, host, session?.readOnly]);
    return session;
}
export function useHostedMarkdownDocument(
    view: EditorView | null,
    uploading: boolean,
    importing: boolean,
) {
    const session = useHostedDocumentSession();
    useHostedComposition(view?.dom ?? null, session);
    const setBusy = session?.setBusy;
    useEffect(() => {
        setBusy?.('upload', uploading);
        return () => setBusy?.('upload', false);
    }, [uploading, setBusy]);
    useEffect(() => {
        setBusy?.('import', importing);
        return () => setBusy?.('import', false);
    }, [importing, setBusy]);
    return session;
}
