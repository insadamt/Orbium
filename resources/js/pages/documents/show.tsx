import { usePage } from '@inertiajs/react';
import { DocumentTabContext } from '@/components/navigation/document-tab-context';
import {
    DocumentPage,
    type DocumentPageProps,
} from '@/components/documents/document-page';

export default function ShowDocument() {
    const page = usePage<DocumentPageProps>();
    const props = page.props;
    if (window.self === window.top) return null;

    return (
        <DocumentTabContext.Provider
            value={{ tabId: '', active: true, url: page.url }}
        >
            <DocumentPage
                key={`${props.workspace.id}:${props.node.id}`}
                workspace={props.workspace}
                node={props.node}
                savedDocument={props.document}
                databaseProperties={props.databaseProperties}
                databaseValues={props.databaseValues}
                mentionCandidates={props.mentionCandidates}
                databaseFiles={props.databaseFiles}
            />
        </DocumentTabContext.Provider>
    );
}
