import { useLayoutEffect, useRef, type RefObject } from 'react';

export function useBoardEditMotion(
    body: RefObject<HTMLElement | null>,
    editing: boolean,
) {
    const previous = useRef(editing);
    useLayoutEffect(() => {
        //
        // Announce edit transitions only; mount/culling and individual keystrokes must not replay an editor entrance.
        //
        if (previous.current !== editing)
            body.current?.dispatchEvent(
                new Event('board-edit-state', { bubbles: true }),
            );
        previous.current = editing;
    }, [body, editing]);
}
