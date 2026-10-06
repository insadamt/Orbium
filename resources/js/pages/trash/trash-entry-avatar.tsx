import { Database, FileText, Folder } from 'lucide-react';
import type { TrashEntry } from './trash-types';

export function TrashEntryAvatar({
    type,
    title,
}: Pick<TrashEntry, 'type' | 'title'>) {
    const Icon =
        type === 'folder' ? Folder : type === 'database' ? Database : FileText;
    return (
        <span
            className="workspace-manager-avatar trash-avatar"
            aria-hidden="true"
            title={type}
        >
            {type === 'workspace' ? (
                title.slice(0, 1).toLocaleUpperCase()
            ) : (
                <Icon size={20} strokeWidth={1.6} />
            )}
        </span>
    );
}
