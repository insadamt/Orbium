import { useEffect, useState } from 'react';
import type { SplitTabs, Tab } from './navigation-store';
import { groupForTab } from './split-group-state';

type RenderedTab = {
    key: string;
    tab: Tab;
    left?: Tab;
    right?: Tab;
    exiting: boolean;
};

function buildRenderedTabs(tabs: Tab[], groups: SplitTabs[]): RenderedTab[] {
    const rendered: RenderedTab[] = [];
    const visited = new Set<string>();
    for (const tab of tabs) {
        if (visited.has(tab.id)) continue;
        const group = groupForTab(groups, tab.id);
        const left = group && tabs.find((item) => item.id === group.leftId);
        const right = group && tabs.find((item) => item.id === group.rightId);
        if (left && right) {
            visited.add(left.id);
            visited.add(right.id);
            rendered.push({
                key: `split-${left.id}-${right.id}`,
                tab,
                left,
                right,
                exiting: false,
            });
        } else {
            rendered.push({ key: tab.id, tab, exiting: false });
        }
    }
    return rendered;
}

function retainExitingTabs(previous: RenderedTab[], current: RenderedTab[]) {
    if (
        typeof window === 'undefined' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
        return current;

    const currentKeys = new Set(current.map((item) => item.key));
    const rendered = [...current];
    previous.forEach((item, index) => {
        if (!currentKeys.has(item.key))
            rendered.splice(Math.min(index, rendered.length), 0, {
                ...item,
                exiting: true,
            });
    });
    return rendered;
}

export function useNavigationTabPresence(tabs: Tab[], groups: SplitTabs[]) {
    const [presence, setPresence] = useState(() => ({
        tabs,
        groups,
        rendered: buildRenderedTabs(tabs, groups),
    }));

    let rendered = presence.rendered;
    if (presence.tabs !== tabs || presence.groups !== groups) {
        rendered = retainExitingTabs(rendered, buildRenderedTabs(tabs, groups));
        setPresence({ tabs, groups, rendered });
    }

    const exitingKeys = JSON.stringify(
        rendered.filter((item) => item.exiting).map((item) => item.key),
    );
    useEffect(() => {
        const keys = new Set<string>(JSON.parse(exitingKeys));
        if (!keys.size) return;
        // A timeout also removes tabs when a hidden page does not run CSS animations.
        const timeout = window.setTimeout(() => {
            setPresence((current) => ({
                ...current,
                rendered: current.rendered.filter(
                    (item) => !item.exiting || !keys.has(item.key),
                ),
            }));
        }, 160);
        return () => window.clearTimeout(timeout);
    }, [exitingKeys]);

    return rendered;
}
