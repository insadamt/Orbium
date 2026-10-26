import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { RichBlockIcon } from './ui/rich-block-icon';
import { useEffect, useRef, useState } from 'react';
import type { EditorActivityController } from './editor-activity-controller';
import { useMathPreview } from './use-math-preview';
import { usePreviewActivation } from './use-preview-activation';

export default function MathBlockView({
    node,
    updateAttributes,
    activityController,
}: NodeViewProps & { activityController: EditorActivityController }) {
    const { previewContainer, activated } =
        usePreviewActivation(activityController);
    const [isEditing, setIsEditing] = useState(false);
    const sourceInput = useRef<HTMLTextAreaElement>(null);
    const latex = String(node.attrs.latex ?? '');
    const [latexDraft, setLatexDraft] = useState(latex);
    useEffect(() => {
        if (!isEditing) setLatexDraft(latex);
    }, [latex, isEditing]);
    const { active, preview } = useMathPreview({
        latex,
        displayMode: true,
        activated,
        activityController,
    });
    const renderedMath = preview;

    useEffect(() => {
        if (isEditing && active) sourceInput.current?.focus();
    }, [isEditing, active]);

    return (
        <NodeViewWrapper
            className="orbium-math attachment-player orbium-rich-card my-4"
            dir={node.attrs.dir}
            contentEditable={false}
        >
            <div ref={previewContainer}>
                <div
                    className="attachment-heading orbium-rich-card-heading"
                    contentEditable={false}
                >
                    <span className="attachment-type-icon">
                        <RichBlockIcon name="math" />
                    </span>
                    <div className="attachment-identity">
                        <div className="attachment-title">Math</div>
                        <span className="attachment-description">Equation</span>
                    </div>
                    <div
                        role="group"
                        aria-label="Math mode"
                        className="attachment-actions"
                    >
                        <button
                            type="button"
                            aria-label="Edit Math source"
                            title="Edit Math source"
                            aria-pressed={isEditing}
                            onClick={() => setIsEditing(true)}
                            className="attachment-action"
                        >
                            <RichBlockIcon name="edit" size={17} />
                        </button>
                        <button
                            type="button"
                            aria-label="Preview Math"
                            title="Preview Math"
                            aria-pressed={!isEditing}
                            onClick={() => setIsEditing(false)}
                            className="attachment-action"
                        >
                            <RichBlockIcon name="preview" size={17} />
                        </button>
                    </div>
                </div>
                {isEditing ? (
                    <textarea
                        ref={sourceInput}
                        aria-label="Math source"
                        value={latexDraft}
                        onChange={(event) => {
                            setLatexDraft(event.target.value);
                            updateAttributes({ latex: event.target.value });
                        }}
                        rows={4}
                        dir="ltr"
                        className="orbium-rich-card-source font-mono text-sm outline-none"
                    />
                ) : !activated ? (
                    <p className="orbium-rich-card-content min-h-12 text-sm text-muted-foreground">
                        Rendering equation…
                    </p>
                ) : renderedMath.error ? (
                    <p role="alert" className="text-sm text-destructive">
                        Equation could not be rendered. Edit the source to fix
                        it.
                    </p>
                ) : (
                    <div
                        className="orbium-rich-card-content overflow-auto"
                        dangerouslySetInnerHTML={{ __html: renderedMath.html }}
                    />
                )}
            </div>
        </NodeViewWrapper>
    );
}
