import { createContext, useContext } from 'react';
import type { Text } from '@codemirror/state';
import type { Node } from '@tiptap/pm/model';

export type HostedDocumentSession = {
    status: 'saved' | 'unsaved' | 'saving' | 'error';
    error: string;
    navigationNotice: string;
    readOnly: boolean;
    queueSave: (snapshot: Text | Node) => void;
    saveNow: () => Promise<void>;
    setBusy: (operation: string, active: boolean) => void;
    setComposing: (active: boolean) => void;
    isOperationPending: () => boolean;
};
export const HostedDocumentSessionContext =
    createContext<HostedDocumentSession | null>(null);
export function useHostedDocumentSession() {
    return useContext(HostedDocumentSessionContext);
}
