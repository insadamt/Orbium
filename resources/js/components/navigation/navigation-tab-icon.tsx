import { Database, FileText, Folder, Home, Settings2 } from 'lucide-react';
import type { Location } from './navigation-store';

const tabIcons = {
    document: FileText,
    database: Database,
    settings: Settings2,
    workspace: Home,
};

export function NavigationTabIcon({ entry }: { entry: Location }) {
    if (entry.iconUrl)
        return (
            <img
                src={entry.iconUrl}
                alt=""
                className="size-4 shrink-0 rounded-sm object-cover"
            />
        );
    if (entry.icon)
        return (
            <span
                aria-hidden="true"
                className="shrink-0 text-base leading-none"
            >
                {entry.icon}
            </span>
        );
    const Icon = entry.url.includes('/nodes/') ? Folder : tabIcons[entry.kind];
    return <Icon size={15} className="shrink-0" aria-hidden="true" />;
}
