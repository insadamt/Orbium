import type { DocumentPageProps } from './document-page';
import MarkdownEditorLoader, {
    MarkdownOpeningPreview,
} from '@/components/editor/markdown/markdown-editor-loader';
import DocumentOpeningPreview from '@/pages/documents/document-opening-preview';
import DocumentEditorLoader from '@/pages/documents/document-editor-loader';

type Props = {
    workspaceId: number;
    documentId: number;
    title: string;
    document: DocumentPageProps['document'];
    previewOnly: boolean;
};

export default function DocumentContent({
    workspaceId,
    documentId,
    title,
    document,
    previewOnly,
}: Props) {
    return (
        <>
            {document.content_format_version === 2 ? (
                previewOnly ? (
                    <MarkdownOpeningPreview />
                ) : (
                    <MarkdownEditorLoader
                        title={title}
                        workspaceId={workspaceId}
                        nodeId={documentId}
                        markdown={document.markdown}
                        revision={document.revision}
                        limits={document.markdown_limits}
                    />
                )
            ) : previewOnly ? (
                <DocumentOpeningPreview content={document.content} />
            ) : (
                <DocumentEditorLoader
                    workspaceId={workspaceId}
                    nodeId={documentId}
                    title={title}
                    content={document.content}
                    revision={document.revision}
                />
            )}
        </>
    );
}
