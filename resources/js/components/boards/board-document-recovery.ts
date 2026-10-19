import type { EditorDocument } from '@/components/editor/editor-api';
import type {
    ResourceDocument,
    ResourceLocation,
} from './board-resource-types';
export type DocumentDraft = {
    format_version: 1;
    workspace_id: number;
    node_id: number;
    revision: number;
    content_format_version: 1 | 2;
    markdown?: string;
    content?: EditorDocument;
};
function key(location: ResourceLocation) {
    return `orbium.board-document.${location.workspaceId}.${location.boardId}.${location.targetId}.draft.v1`;
}
export function readDocumentDraft(
    location: ResourceLocation,
    document: ResourceDocument,
): { draft?: DocumentDraft; raw?: string } {
    let raw: string | null = null;
    try {
        raw = sessionStorage.getItem(key(location));
        if (raw === null) return {};
        const draft = JSON.parse(raw) as DocumentDraft;
        if (
            draft.format_version !== 1 ||
            draft.workspace_id !== location.workspaceId ||
            draft.node_id !== document.id ||
            draft.content_format_version !== document.content_format_version ||
            !Number.isSafeInteger(draft.revision) ||
            draft.revision < 0
        )
            return { raw };
        if (
            draft.content_format_version === 2 &&
            (typeof draft.markdown !== 'string' ||
                new TextEncoder().encode(draft.markdown).length >
                    (document.content_format_version === 2
                        ? document.markdown_limits.source_bytes
                        : 2097152))
        )
            return { raw };
        if (
            draft.content_format_version === 1 &&
            (!draft.content ||
                draft.content.type !== 'doc' ||
                new TextEncoder().encode(JSON.stringify(draft.content)).length >
                    1048576)
        )
            return { raw };
        return { draft };
    } catch {
        return raw === null ? {} : { raw };
    }
}
export function writeDocumentDraft(
    location: ResourceLocation,
    draft: DocumentDraft,
) {
    try {
        sessionStorage.setItem(key(location), JSON.stringify(draft));
        return true;
    } catch {
        return false;
    }
}
export function removeDocumentDraft(location: ResourceLocation) {
    try {
        sessionStorage.removeItem(key(location));
    } catch {}
}
export function downloadDocumentDraft(draft: DocumentDraft | string) {
    const url = URL.createObjectURL(
        new Blob(
            [
                typeof draft === 'string'
                    ? draft
                    : JSON.stringify(draft, null, 2),
            ],
            { type: 'application/json' },
        ),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orbium-document-local-draft.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
