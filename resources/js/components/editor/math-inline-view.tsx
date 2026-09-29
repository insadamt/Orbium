import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import katex from 'katex';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function MathInlineView({
    node,
    updateAttributes,
}: NodeViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const container = useRef<HTMLSpanElement>(null);
    const sourceInput = useRef<HTMLInputElement>(null);
    const latex = String(node.attrs.latex ?? '');
    const renderedMath = useMemo(() => {
        try {
            return katex.renderToString(latex, {
                throwOnError: true,
                trust: false,
            });
        } catch {
            return null;
        }
    }, [latex]);

    useEffect(() => {
        if (!isEditing) return;
        sourceInput.current?.focus();
        const closeOnOutsideClick = (event: PointerEvent) => {
            if (!container.current?.contains(event.target as Node))
                setIsEditing(false);
        };
        document.addEventListener('pointerdown', closeOnOutsideClick);
        return () =>
            document.removeEventListener('pointerdown', closeOnOutsideClick);
    }, [isEditing]);

    return (
        <NodeViewWrapper
            as="span"
            className="relative inline-block align-baseline"
        >
            <span ref={container} contentEditable={false}>
                <button
                    type="button"
                    aria-label={`Edit inline math: ${latex}`}
                    aria-expanded={isEditing}
                    onClick={() => setIsEditing(true)}
                    className="rounded-sm px-0.5 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                    {renderedMath ? (
                        <span
                            dangerouslySetInnerHTML={{ __html: renderedMath }}
                        />
                    ) : (
                        <span className="font-mono text-sm text-destructive">
                            {latex || 'Math'}
                        </span>
                    )}
                </button>
                {isEditing && (
                    <span className="absolute top-full left-0 z-50 mt-2 w-72 max-w-[80vw] rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-xl">
                        <label className="block text-xs font-medium">
                            Inline math source
                            <input
                                ref={sourceInput}
                                value={latex}
                                onChange={(event) =>
                                    updateAttributes({
                                        latex: event.target.value,
                                    })
                                }
                                onKeyDown={(event) => {
                                    event.stopPropagation();
                                    if (
                                        event.key === 'Enter' ||
                                        event.key === 'Escape'
                                    ) {
                                        event.preventDefault();
                                        setIsEditing(false);
                                    }
                                }}
                                className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </label>
                        {!renderedMath && latex && (
                            <span className="mt-2 block text-xs text-destructive">
                                Equation could not be rendered.
                            </span>
                        )}
                    </span>
                )}
            </span>
        </NodeViewWrapper>
    );
}
