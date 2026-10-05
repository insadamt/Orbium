import { Component, lazy, Suspense, useRef, type ReactNode } from 'react';
import {
    markEditorPerformance,
    resetOpeningPreviewPerformance,
    measureEditorAsync,
} from '@/lib/editor-performance';
import type { EditorDocument } from '@/components/editor/editor-api';
import DocumentOpeningPreview from './document-opening-preview';

type Props = {
    workspaceId: number;
    nodeId: number;
    title: string;
    content: EditorDocument;
    revision: number;
};

const DocumentEditor = lazy(() => {
    markEditorPerformance('editor.dynamic-import-started');
    return measureEditorAsync(
        'editor.module-load',
        () => import('@/components/editor/document-editor'),
    ).then((module) => {
        markEditorPerformance('editor.module-loaded');
        return module;
    });
});

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
    const available = useRef(false);
    if (!available.current) {
        available.current = true;
        resetOpeningPreviewPerformance();
        markEditorPerformance(
            `document.${props.nodeId}.route-content-available`,
        );
    }
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
