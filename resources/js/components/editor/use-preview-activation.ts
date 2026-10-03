import { useEffect, useRef, useState } from 'react';

export function usePreviewActivation<
    ElementType extends HTMLElement = HTMLDivElement,
>() {
    const previewContainer = useRef<ElementType>(null);
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        if (activated) return;
        const container = previewContainer.current;
        if (!container || typeof IntersectionObserver === 'undefined') {
            setActivated(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                setActivated(true);
                observer.disconnect();
            },
            { rootMargin: '600px' },
        );
        observer.observe(container);
        return () => observer.disconnect();
    }, [activated]);

    return { previewContainer, activated };
}
