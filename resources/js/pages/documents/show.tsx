import { usePage } from '@inertiajs/react';
import {
    DocumentPage,
    type DocumentPageProps,
} from '@/components/documents/document-page';

export default function ShowDocument() {
    const props = usePage<DocumentPageProps>().props;
    if (window.self === window.top) return null;

    return (
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
    );
}
