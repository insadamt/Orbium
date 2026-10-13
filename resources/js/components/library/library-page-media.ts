import type { Dispatch, SetStateAction } from 'react';
import type { DocumentImageKind } from '@/pages/documents/document-image-crop';
import type { LibraryFile } from './library-api';

type HeaderChanges = {
    icon?: null;
    icon_attachment_id?: number;
    cover_attachment_id?: number;
    cover_aspect_ratio?: '11:3';
};

export async function applyLibraryPageImage({
    file,
    kind,
    saveHeader,
    setSaving,
    onApplied,
}: {
    file: LibraryFile;
    kind: DocumentImageKind;
    saveHeader: (changes: HeaderChanges) => Promise<boolean>;
    setSaving: Dispatch<SetStateAction<boolean>>;
    onApplied: () => void;
}) {
    setSaving(true);
    try {
        const changes: HeaderChanges =
            kind === 'icon'
                ? { icon: null, icon_attachment_id: file.id }
                : { cover_attachment_id: file.id, cover_aspect_ratio: '11:3' };
        if (await saveHeader(changes)) onApplied();
    } finally {
        setSaving(false);
    }
}
