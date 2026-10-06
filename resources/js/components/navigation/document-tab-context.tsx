import { createContext, useContext } from 'react';

export const DocumentTabContext = createContext({
    tabId: '',
    active: true,
    visible: true,
    url: '',
});

export function useDocumentTab() {
    return useContext(DocumentTabContext);
}
