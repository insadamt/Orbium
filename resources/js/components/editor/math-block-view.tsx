import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Eye, Pencil } from 'lucide-react';
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
            className="orbium-math my-4 rounded-xl border border-border p-4"
            dir={node.attrs.dir}
            contentEditable={false}
        >
            <div ref={previewContainer}>
                <div
                    className="mb-2 flex items-center justify-between text-xs text-muted-foreground"
                    contentEditable={false}
                >
                    <span>Math</span>
                    <div
                        role="group"
                        aria-label="Math mode"
                        className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5"
                    >
                        <button
                            type="button"
                            aria-pressed={isEditing}
                            onClick={() => setIsEditing(true)}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-ring ${isEditing ? 'bg-background text-foreground shadow-sm' : 'hover:bg-accent hover:text-foreground'}`}
                        >
                            <Pencil size={13} aria-hidden="true" /> Edit
                        </button>
                        <button
                            type="button"
                            aria-pressed={!isEditing}
                            onClick={() => setIsEditing(false)}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-ring ${!isEditing ? 'bg-background text-foreground shadow-sm' : 'hover:bg-accent hover:text-foreground'}`}
                        >
                            <Eye size={14} aria-hidden="true" /> Preview
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
                        className="w-full rounded-md bg-muted p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                ) : !activated ? (
                    <p className="min-h-12 text-sm text-muted-foreground">
                        Rendering equation…
                    </p>
                ) : renderedMath.error ? (
                    <p role="alert" className="text-sm text-destructive">
                        Equation could not be rendered. Edit the source to fix
                        it.
                    </p>
                ) : (
                    <div
                        className="overflow-auto py-2"
                        dangerouslySetInnerHTML={{ __html: renderedMath.html }}
                    />
                )}
            </div>
        </NodeViewWrapper>
    );
}
