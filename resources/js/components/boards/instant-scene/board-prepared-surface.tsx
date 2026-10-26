import {
    useCallback,
    useLayoutEffect,
    useRef,
    useSyncExternalStore,
} from 'react';
import { RichBlockIcon } from '@/components/editor/ui/rich-block-icon';
import { instantiateMermaidSvg } from '@/components/editor/mermaid-preview-renderer';
import { createMermaidPreviewControls } from '@/components/editor/mermaid-preview-controls';
import type { BoardContentProps } from '../board-text-block';
import { BoardSourceBlock } from '../board-source-block';
import type { BoardInstantScene } from './board-instant-scene';

export function BoardPreparedSurface(
    props: BoardContentProps & { scene: BoardInstantScene },
) {
    const { scene, object, readOnly } = props;
    const host = useRef<HTMLDivElement>(null);
    const diagramActions = useRef<HTMLDivElement>(null);
    const callbacks = useRef(props);
    callbacks.current = props;
    const subscribe = useCallback(
        (listener: () => void) => scene.subscribe(object.id, listener),
        [scene, object.id],
    );
    const snapshot = useCallback(
        () => scene.version(object.id),
        [scene, object.id],
    );
    const version = useSyncExternalStore(subscribe, snapshot, snapshot);
    useLayoutEffect(() => {
        const output = host.current;
        if (!output) return;
        const visual = scene.prepareVisualForPresentation(object);
        if (object.block_type !== 'mermaid') {
            if (visual?.kind !== 'text') return;
            const template = visual.template.cloneNode(true) as HTMLElement;
            for (const attribute of [
                'class',
                'dir',
                'style',
                'data-level',
                'data-list-style',
            ]) {
                const value = template.getAttribute(attribute);
                if (value === null) output.removeAttribute(attribute);
                else output.setAttribute(attribute, value);
            }
            output.replaceChildren(...template.childNodes);
            return;
        }
        if (!visual) {
            output.textContent = object.data.source ?? '';
            output.dataset.sceneStatus = 'cold';
            return;
        }
        output.dataset.sceneStatus =
            visual.kind === 'error' ? 'error' : 'ready';
        output.replaceChildren();
        if (visual.kind === 'error') {
            output.textContent = visual.message;
            output.setAttribute('role', 'alert');
            return;
        }
        if (visual.kind !== 'diagram') return;
        output.removeAttribute('role');
        const preview = document.createElement('div');
        preview.dataset.mermaidPreview = '';
        //
        // Only the shared sanitized SVG reaches innerHTML; each attachment receives fresh IDs and live theme variables.
        //
        preview.innerHTML = instantiateMermaidSvg(visual.preview);
        const controls = createMermaidPreviewControls();
        controls.update(visual.preview);
        controls.button.className = 'attachment-action';
        diagramActions.current?.append(controls.button);
        output.append(preview);
        return () => controls.destroy();
    }, [
        scene,
        object.id,
        object.data,
        object.width,
        object.block_type,
        version,
    ]);

    useLayoutEffect(() => {
        host.current
            ?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
            .forEach((checkbox) => {
                checkbox.disabled = readOnly;
            });
    }, [readOnly, object.data, object.width, object.block_type, version]);

    useLayoutEffect(() => {
        const output = host.current;
        if (!output || object.block_type !== 'list') return;
        const toggleCheckbox = (event: Event) => {
            const checkbox = event.target;
            if (
                !(checkbox instanceof HTMLInputElement) ||
                checkbox.dataset.instantCheckIndex === undefined
            )
                return;
            const current = callbacks.current;
            const index = Number(checkbox.dataset.instantCheckIndex);
            const items = current.object.data.items;
            if (!items?.[index]) return;
            const accepted =
                !current.readOnly &&
                current.onChange(
                    {
                        ...current.object.data,
                        items: items.map((item, position) =>
                            position === index
                                ? { ...item, checked: checkbox.checked }
                                : item,
                        ),
                    },
                    'action',
                );
            if (!accepted) checkbox.checked = items[index].checked;
        };
        //
        // Prepared inputs are cloned DOM nodes, so their changes must use a native delegated listener rather than React input tracking.
        //
        output.addEventListener('change', toggleCheckbox);
        return () => output.removeEventListener('change', toggleCheckbox);
    }, [object.block_type]);

    if (scene.needsNativeFallback(object))
        return <BoardSourceBlock {...props} />;
    if (object.block_type === 'mermaid')
        return (
            <div
                className="board-source-block board-source-mermaid attachment-player orbium-rich-card"
                data-board-prepared="diagram"
            >
                <div className="attachment-heading orbium-rich-card-heading">
                    <span className="attachment-type-icon">
                        <RichBlockIcon name="diagram" />
                    </span>
                    <div className="attachment-identity">
                        <div className="attachment-title">Mermaid</div>
                        <span className="attachment-description">Diagram</span>
                    </div>
                    <div
                        ref={diagramActions}
                        className="attachment-actions"
                        data-board-interactive
                    >
                        <button
                            type="button"
                            className="attachment-action"
                            aria-label="Edit source"
                            title="Edit source"
                            disabled={readOnly}
                            onClick={props.onStartEditing}
                        >
                            <RichBlockIcon name="edit" size={17} />
                        </button>
                    </div>
                </div>
                <div
                    ref={host}
                    className="board-source-preview orbium-rich-card-content"
                />
            </div>
        );
    return <div ref={host} data-board-prepared="text" />;
}
