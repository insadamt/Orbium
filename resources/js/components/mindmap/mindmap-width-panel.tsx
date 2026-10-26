import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { mindMapTopicWidth } from './mindmap-topic-width';

export function MindMapWidthPanel({
    width,
    onCommit,
    onClose,
}: {
    width: number;
    onCommit: (width: number) => boolean;
    onClose: () => void;
}) {
    const [draftWidth, setDraftWidth] = useState(String(width));
    useEffect(() => setDraftWidth(String(width)), [width]);
    function applyWidth(next: number) {
        if (next !== width && !onCommit(next)) {
            setDraftWidth(String(width));
            return;
        }
        setDraftWidth(String(next));
    }
    return (
        <form
            className="mindmap-parent-panel mindmap-width-panel"
            data-mindmap-width-panel
            aria-label="Branch width"
            onSubmit={(event) => {
                event.preventDefault();
                const next = Number(draftWidth);
                if (
                    Number.isInteger(next) &&
                    next >= mindMapTopicWidth.min &&
                    next <= mindMapTopicWidth.max
                )
                    applyWidth(next);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                }
            }}
        >
            <div className="mindmap-parent-heading">
                <span>Branch width</span>
                <button
                    type="button"
                    aria-label="Close branch width"
                    onClick={onClose}
                >
                    <X size={14} />
                </button>
            </div>
            <label className="mindmap-width-field">
                <span>Width in pixels</span>
                <input
                    autoFocus
                    required
                    type="number"
                    min={mindMapTopicWidth.min}
                    max={mindMapTopicWidth.max}
                    step={1}
                    value={draftWidth}
                    onKeyDown={(event) => {
                        //
                        // Draft field undo belongs to the input, not the surrounding map or its owner.
                        //
                        if (event.ctrlKey || event.metaKey)
                            event.stopPropagation();
                    }}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => setDraftWidth(event.target.value)}
                />
            </label>
            <p>100–800 px · Height adjusts to text</p>
            <div className="mindmap-width-actions">
                <button
                    type="button"
                    onClick={() => applyWidth(mindMapTopicWidth.default)}
                >
                    Reset
                </button>
                <button type="submit">Apply</button>
            </div>
        </form>
    );
}
