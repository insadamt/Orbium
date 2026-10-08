import { Component, lazy, Suspense, type ReactNode } from 'react';
import type { MarkdownEditorProps } from '@/components/editor/markdown/markdown-editor';
import {
    markEditorPerformance,
    measureEditorAsync,
} from '@/lib/editor-performance';

const MarkdownEditor = lazy(() => {
    markEditorPerformance('codemirror.dynamic-import-started');
    return measureEditorAsync(
        'codemirror.module-load',
        () => import('@/components/editor/markdown/markdown-editor'),
    );
});

export function MarkdownOpeningPreview() {
    return (
        <p role="status" className="py-6 text-sm text-muted-foreground">
            Opening Markdown editor…
        </p>
    );
}

class MarkdownLoadBoundary extends Component<
    { children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        if (this.state.failed)
            return (
                <p role="alert" className="py-6 text-sm text-destructive">
                    The Markdown editor could not load. Reload this page to try
                    again.
                </p>
            );
        return this.props.children;
    }
}

export default function MarkdownEditorLoader(props: MarkdownEditorProps) {
    return (
        <MarkdownLoadBoundary>
            <Suspense fallback={<MarkdownOpeningPreview />}>
                <MarkdownEditor {...props} />
            </Suspense>
        </MarkdownLoadBoundary>
    );
}
