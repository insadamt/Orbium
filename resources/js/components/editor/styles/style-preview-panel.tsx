import { useEffect, useRef } from 'react';
import type { StyleSource } from './style-diagnostics';
import StylePreview from './style-preview';

type Props = {
    source: StyleSource;
    mode: 'focused' | 'full';
    onModeChange: (mode: 'focused' | 'full') => void;
    enabled: boolean;
    invalid: boolean;
    css: string;
};

export default function StylePreviewPanel({
    source,
    mode,
    onModeChange,
    enabled,
    invalid,
    css,
}: Props) {
    const scrollContainer = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollContainer.current) scrollContainer.current.scrollTop = 0;
    }, [source, mode]);
    return (
        <section
            className="editor-style-preview-panel"
            id="style-preview-panel"
            role="tabpanel"
            aria-labelledby="style-preview-tab"
            aria-label="Style preview"
        >
            <div className="editor-style-preview-heading">
                <h3>Preview</h3>
                <div role="group" aria-label="Preview content">
                    <button
                        type="button"
                        aria-pressed={mode === 'focused'}
                        disabled={source === 'base'}
                        onClick={() => onModeChange('focused')}
                    >
                        Selected block
                    </button>
                    <button
                        type="button"
                        aria-pressed={mode === 'full'}
                        onClick={() => onModeChange('full')}
                    >
                        Full document
                    </button>
                </div>
            </div>
            <p className="editor-style-preview-status" role="status">
                {!enabled
                    ? 'Custom styles disabled'
                    : invalid
                      ? 'Showing last valid styles'
                      : 'Live preview · current app theme'}
            </p>
            <div ref={scrollContainer} className="editor-style-preview-scroll">
                <StylePreview
                    css={enabled ? css : ''}
                    selected={
                        mode === 'focused' && source !== 'base'
                            ? source
                            : undefined
                    }
                />
            </div>
            <p className="editor-style-preview-caption">
                Sample media and diagrams. Document content stays unchanged.
            </p>
        </section>
    );
}
