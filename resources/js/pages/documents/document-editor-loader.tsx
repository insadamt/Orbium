import { Component, lazy, Suspense, type ReactNode } from 'react';
import type { EditorDocument } from '@/components/editor/editor-api';
import type { SavedMermaidPreviews } from '@/components/editor/use-mermaid-cache-preparation';
import DocumentOpeningPreview from './document-opening-preview';

type Props = {
    workspaceId: number;
    nodeId: number;
    title: string;
    content: EditorDocument;
    revision: number;
    cachedMermaidPreviews: SavedMermaidPreviews;
};

const DocumentEditor = lazy(
    () => import('@/components/editor/document-editor'),
);

class EditorLoadBoundary extends Component<
    { children: ReactNode; content: EditorDocument },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (this.state.failed)
            return (
                <div>
                    <DocumentOpeningPreview content={this.props.content} />
                    <p role="alert" className="mt-4 text-sm text-destructive">
                        The editor could not load. Check your connection and
                        reload this page.
                    </p>
                    <button
                        type="button"
                        className="mt-2 text-sm underline"
                        onClick={() => window.location.reload()}
                    >
                        Reload page
                    </button>
                </div>
            );
        return this.props.children;
    }
}

export default function DocumentEditorLoader(props: Props) {
    return (
        <EditorLoadBoundary content={props.content}>
            <Suspense
                fallback={<DocumentOpeningPreview content={props.content} />}
            >
                <DocumentEditor {...props} />
            </Suspense>
        </EditorLoadBoundary>
    );
}
