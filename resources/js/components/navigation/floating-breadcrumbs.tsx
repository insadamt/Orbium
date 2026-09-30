import { Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import type { BreadcrumbItem } from '@/types';

export function FloatingBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    const pathRef = useRef<HTMLOListElement>(null);
    const pathKey = JSON.stringify(items);
    useEffect(() => {
        if (pathRef.current)
            pathRef.current.scrollLeft = pathRef.current.scrollWidth;
    }, [pathKey]);

    if (items.length === 0) return null;

    return (
        <nav
            className="floating-breadcrumbs floating-surface"
            aria-label="Current path"
        >
            <ol ref={pathRef}>
                {items.map((item, index) => {
                    const isCurrent = index === items.length - 1;
                    return (
                        <li key={`${item.title}-${index}`}>
                            {index > 0 && (
                                <span
                                    className="floating-breadcrumb-separator"
                                    aria-hidden="true"
                                >
                                    /
                                </span>
                            )}
                            {isCurrent ? (
                                <span aria-current="page" title={item.title}>
                                    {item.title}
                                </span>
                            ) : (
                                <Link href={item.href} title={item.title}>
                                    {item.title}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
