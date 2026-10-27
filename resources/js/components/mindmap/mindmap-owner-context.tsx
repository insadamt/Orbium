import { createContext, useContext } from 'react';
import type { ContentOwnerKind } from '@/components/editor/editor-api';
export type MindMapOwner = {
    workspaceId: number;
    nodeId: number;
    tabId?: string;
    kind: ContentOwnerKind;
    onBusy?: (active: boolean) => void;
};
export const MindMapOwnerContext = createContext<MindMapOwner | undefined>(
    undefined,
);
export function useMindMapOwner() {
    return useContext(MindMapOwnerContext);
}
