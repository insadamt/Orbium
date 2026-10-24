import { createContext } from 'react';

export const BoardPageInsertionContext = createContext<{
    insertDocument: (targetId: number, sourceObjectId: string) => boolean;
} | null>(null);
