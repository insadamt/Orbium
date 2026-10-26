import { useLayoutEffect, useRef } from 'react';
import { widgetIcon } from '../markdown/rich/widget-icons';

type IconName = Parameters<typeof widgetIcon>[0];

export function RichBlockIcon({
    name,
    size = 20,
}: {
    name: IconName;
    size?: number;
}) {
    const host = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        //
        // React and imperative editor widgets must use identical SVGs instead of drifting between icon families.
        //
        host.current?.replaceChildren(widgetIcon(name, size));
    }, [name, size]);
    return <span ref={host} className="rich-block-glyph" aria-hidden="true" />;
}
