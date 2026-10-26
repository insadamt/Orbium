import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LayoutTemplate, Check, X } from 'lucide-react';
import { mindMapTemplates, type MindMapLayoutId } from './mindmap-templates';
import { MindMapTemplatePreview } from './mindmap-template-preview';
import './mindmap-templates.css';

export function MindMapTemplatePicker({
    layout = 'balanced',
    onChoose,
}: {
    layout?: MindMapLayoutId;
    onChoose: (layout: MindMapLayoutId) => boolean;
}) {
    const [open, setOpen] = useState(false);
    const host = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const selected = layout === 'timeline-vertical' ? 'timeline' : layout;
    const current = mindMapTemplates.find(
        (template) => template.id === selected,
    )!;
    function close() {
        setOpen(false);
        trigger.current?.focus({ preventScroll: true });
    }
    function choose(next: MindMapLayoutId) {
        if (next === layout || onChoose(next)) close();
    }
    useLayoutEffect(() => {
        if (!open) return;
        const surface = panel.current;
        const option = surface?.querySelector<HTMLButtonElement>(
            '[aria-pressed="true"]',
        );
        option?.focus({ preventScroll: true });
        if (
            surface &&
            option &&
            option.offsetTop + option.offsetHeight > surface.clientHeight
        )
            surface.scrollTop =
                option.offsetTop + option.offsetHeight - surface.clientHeight;
    }, [open]);
    useEffect(() => {
        if (!open) return;
        const dismiss = (event: PointerEvent) => {
            if (!host.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', dismiss);
        return () => document.removeEventListener('pointerdown', dismiss);
    }, [open]);
    return (
        <div ref={host} className="mindmap-template-picker">
            <button
                ref={trigger}
                type="button"
                className="mindmap-template-trigger"
                aria-label={`Templates: ${current.name}${layout === 'timeline-vertical' ? ', vertical' : ''}`}
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                <LayoutTemplate size={17} /> <span>Templates</span>
            </button>
            {open && (
                <div
                    ref={panel}
                    className="mindmap-template-panel"
                    data-mindmap-template-panel
                    role="region"
                    aria-label="Mind Map templates"
                    onKeyDown={(event) => {
                        if (
                            event.key === 'Escape' &&
                            !event.nativeEvent.isComposing
                        ) {
                            event.preventDefault();
                            event.stopPropagation();
                            close();
                        }
                    }}
                >
                    <div className="mindmap-template-heading">
                        <span>Choose a layout</span>
                        <button
                            type="button"
                            aria-label="Close templates"
                            onClick={close}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="mindmap-template-grid">
                        {mindMapTemplates.map((template) => (
                            <button
                                key={template.id}
                                type="button"
                                className="mindmap-template-card"
                                aria-pressed={selected === template.id}
                                title={template.description}
                                onClick={() =>
                                    choose(
                                        template.id === 'timeline' &&
                                            selected === 'timeline'
                                            ? layout
                                            : template.id,
                                    )
                                }
                            >
                                <MindMapTemplatePreview
                                    layout={
                                        template.id === 'timeline' &&
                                        selected === 'timeline'
                                            ? layout
                                            : template.id
                                    }
                                />
                                <span>
                                    {template.name}
                                    {selected === template.id && (
                                        <Check size={13} aria-hidden="true" />
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                    {selected === 'timeline' && (
                        <div
                            className="mindmap-timeline-direction"
                            role="group"
                            aria-label="Timeline direction"
                        >
                            <span>Direction</span>
                            <button
                                type="button"
                                aria-pressed={layout === 'timeline'}
                                onClick={() => choose('timeline')}
                            >
                                Horizontal
                            </button>
                            <button
                                type="button"
                                aria-pressed={layout === 'timeline-vertical'}
                                onClick={() => choose('timeline-vertical')}
                            >
                                Vertical
                            </button>
                        </div>
                    )}
                    <p>Switch layouts while keeping your content.</p>
                </div>
            )}
        </div>
    );
}
