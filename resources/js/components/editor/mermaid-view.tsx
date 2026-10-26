import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { RichBlockIcon } from './ui/rich-block-icon';
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
        controls.button.className = 'attachment-action';
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
            className="orbium-mermaid attachment-player orbium-rich-card my-4"
            data-drag-handle
            dir={node.attrs.dir}
            contentEditable={false}
        >
            <div
                ref={container}
                data-mermaid=""
                data-mermaid-editing={String(editing)}
            >
                <div className="attachment-heading orbium-rich-card-heading">
                    <span className="attachment-type-icon">
                        <RichBlockIcon name="diagram" />
                    </span>
                    <div className="attachment-identity">
                        <div className="attachment-title">Mermaid</div>
                        <span className="attachment-description">Diagram</span>
                    </div>
                    <div ref={previewToolbar} className="attachment-actions">
                        <div
                            role="group"
                            aria-label="Mermaid mode"
                            className="attachment-actions"
                        >
                            <button
                                type="button"
                                aria-label="Edit Mermaid source"
                                title="Edit Mermaid source"
                                aria-pressed={editing}
                                onClick={() => setEditing(true)}
                                className="attachment-action"
                            >
                                <RichBlockIcon name="edit" size={17} />
                            </button>
                            <button
                                type="button"
                                aria-label="Preview Mermaid"
                                title="Preview Mermaid"
                                aria-pressed={!editing}
                                onClick={() => setEditing(false)}
                                className="attachment-action"
                            >
                                <RichBlockIcon name="preview" size={17} />
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
                    className="orbium-rich-card-source font-mono text-sm"
                />
                <div
                    ref={diagram}
                    data-mermaid-preview=""
                    hidden={editing}
                    className="orbium-rich-card-content overflow-auto [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                    style={{ minHeight: 100 }}
                />
            </div>
        </NodeViewWrapper>
    );
}
