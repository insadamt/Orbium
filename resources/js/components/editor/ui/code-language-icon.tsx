import { useLayoutEffect, useRef } from 'react';
import { createCodeLanguageIcon } from '../code-language-icons';

export function CodeLanguageIcon({ language }: { language: string }) {
    const host = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        host.current?.replaceChildren(createCodeLanguageIcon(language));
    }, [language]);
    return (
        <span
            ref={host}
            className="rich-code-language-icon"
            aria-hidden="true"
        />
    );
}
