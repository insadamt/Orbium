import { useCallback, useRef, useState } from 'react';
export function useBoardResourceLocks() {
    const owners = useRef(new Set<string>());
    const lockedRef = useRef(false);
    const [locked, setLocked] = useState(false);
    const update = useCallback((owner: string, active: boolean) => {
        if (active) owners.current.add(owner);
        else owners.current.delete(owner);
        lockedRef.current = owners.current.size > 0;
        setLocked(lockedRef.current);
    }, []);
    const setCreationLocked = useCallback(
        (active: boolean) => update('creation', active),
        [update],
    );
    const isDocumentLocked = useCallback(
        () => [...owners.current].some((owner) => owner !== 'creation'),
        [],
    );
    return {
        lockedRef,
        locked,
        setCardLocked: update,
        setCreationLocked,
        isDocumentLocked,
    };
}
