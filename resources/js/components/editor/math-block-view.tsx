import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import katex from 'katex';
import { Eye, Pencil } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function MathBlockView({
    node,
    updateAttributes,
}: NodeViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const sourceInput = useRef<HTMLTextAreaElement>(null);
    const latex = String(node.attrs.latex ?? '');
    const renderedMath = useMemo(() => {
        try {
            return {
                html: katex.renderToString(latex, {
                    displayMode: true,
                    throwOnError: true,
                    trust: false,
                }),
                error: false,
            };
        } catch {
            return { html: '', error: true };
        }
    }, [latex]);

    useEffect(() => {
        if (isEditing) sourceInput.current?.focus();
    }, [isEditing]);

    return (
        <NodeViewWrapper
            className="my-4 rounded-xl border border-border p-4"
            dir={node.attrs.dir}
        >
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
                    value={latex}
                    onChange={(event) =>
                        updateAttributes({ latex: event.target.value })
                    }
                    rows={4}
                    dir="ltr"
                    className="w-full rounded-md bg-muted p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
            ) : renderedMath.error ? (
                <p role="alert" className="text-sm text-destructive">
                    Equation could not be rendered. Edit the source to fix it.
                </p>
            ) : (
                <div
                    className="overflow-auto py-2"
                    dangerouslySetInnerHTML={{ __html: renderedMath.html }}
                />
            )}
        </NodeViewWrapper>
    );
}
