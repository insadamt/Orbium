import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Eye, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { measureEditorWork } from '@/lib/editor-performance';
import { instantiateMermaidSvg } from './mermaid-preview-renderer';
import {
    applyMermaidPreviewDimensions,
    clearMermaidPreviewDimensions,
} from './mermaid-preview-layout';
import { createMermaidPreviewControls } from './mermaid-preview-controls';
import type { MermaidPreviewSession } from './mermaid-preview-session';

export default function MermaidView({
    node,
    updateAttributes,
    session,
}: NodeViewProps & { session: MermaidPreviewSession }) {
    const source = String(node.attrs.source ?? '');
    const container = useRef<HTMLDivElement>(null);
    const diagram = useRef<HTMLDivElement>(null);
    const previewToolbar = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLTextAreaElement>(null);
    const [editing, setEditing] = useState(false);
    const [sourceDraft, setSourceDraft] = useState(source);

    useEffect(() => setSourceDraft(source), [source]);
    useEffect(() => {
        if (editing) input.current?.focus();
        session.refresh();
    }, [editing, session]);

    useEffect(() => {
        const element = container.current;
        const output = diagram.current;
        if (!element || !output) return;
        let active = true;
        const controls = createMermaidPreviewControls();
        previewToolbar.current?.append(controls.button);
        output.textContent = 'Preparing diagram…';
        output.removeAttribute('role');
        const unregister = session.register(
            source,
            element,
            ({ preview, dimensions, error }) => {
                if (!active) return;
                if (error) {
                    controls.update();
                    clearMermaidPreviewDimensions(output);
                    output.textContent = error;
                    output.setAttribute('role', 'alert');
                } else if (dimensions) {
                    applyMermaidPreviewDimensions(output, dimensions);
                } else if (preview) {
                    controls.update(preview);
                    output.removeAttribute('role');
                    measureEditorWork('mermaid.svg-mount', () => {
                        output.innerHTML = instantiateMermaidSvg(preview);
                    });
                }
            },
        );
        return () => {
            active = false;
            controls.destroy();
            unregister();
        };
    }, [source, session]);

    return (
        <NodeViewWrapper
            className="orbium-mermaid mermaid-inline-block my-4"
            data-drag-handle
            dir={node.attrs.dir}
            contentEditable={false}
        >
            <div
                ref={container}
                data-mermaid=""
                data-mermaid-editing={String(editing)}
            >
                <div className="mermaid-inline-toolbar mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Mermaid</span>
                    <div
                        ref={previewToolbar}
                        className="mermaid-inline-actions"
                    >
                        <div
                            role="group"
                            aria-label="Mermaid mode"
                            className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5"
                        >
                            <button
                                type="button"
                                aria-pressed={editing}
                                onClick={() => setEditing(true)}
                                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${editing ? 'bg-background text-foreground shadow-sm' : 'hover:bg-accent hover:text-foreground'}`}
                            >
                                <Pencil size={13} aria-hidden="true" /> Edit
                            </button>
                            <button
                                type="button"
                                aria-pressed={!editing}
                                onClick={() => setEditing(false)}
                                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${!editing ? 'bg-background text-foreground shadow-sm' : 'hover:bg-accent hover:text-foreground'}`}
                            >
                                <Eye size={14} aria-hidden="true" /> Preview
                            </button>
                        </div>
                    </div>
                </div>
                <textarea
                    ref={input}
                    aria-label="Mermaid source"
                    value={sourceDraft}
                    hidden={!editing}
                    onChange={(event) => {
                        setSourceDraft(event.target.value);
                        updateAttributes({ source: event.target.value });
                    }}
                    rows={6}
                    dir="ltr"
                    className="w-full rounded-md bg-muted p-3 font-mono text-sm"
                />
                <div
                    ref={diagram}
                    data-mermaid-preview=""
                    hidden={editing}
                    className="overflow-auto [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                    style={{ minHeight: 100 }}
                />
            </div>
        </NodeViewWrapper>
    );
}
