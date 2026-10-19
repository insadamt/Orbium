import { useEffect, useLayoutEffect, useRef } from 'react';
import { Check, Code2, Pencil, Sigma, Workflow } from 'lucide-react';
import { mountCodeInput } from '@/components/editor/markdown/rich/code-input';
import { mountCodePreview } from '@/components/editor/markdown/rich/code-preview';
import { mountCodeCopyButton } from '@/components/editor/mount-code-copy-button';
import { AppSelect } from '@/components/ui/app-select';
import {
    codeLanguages,
    codeLanguageLabel,
    codeLanguageSearchKeywords,
} from '@/components/editor/code-languages';
import { MermaidPreviewSession } from '@/components/editor/mermaid-preview-session';
import { instantiateMermaidSvg } from '@/components/editor/mermaid-preview-renderer';
import { createMermaidPreviewControls } from '@/components/editor/mermaid-preview-controls';
import { renderMath } from '@/components/editor/markdown/rich/math-preview';
import type { RichContext } from '@/components/editor/markdown/rich/rich-model';
import type { BoardContentProps } from './board-text-block';

export function BoardSourceBlock(props: BoardContentProps) {
    const { object, editing, readOnly } = props;
    const callbacks = useRef(props);
    callbacks.current = props;
    const host = useRef<HTMLDivElement>(null);
    const actions = useRef<HTMLDivElement>(null);
    const input = useRef<ReturnType<typeof mountCodeInput> | null>(null);
    const sourceInput = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        if (!editing || object.block_type === 'code' || readOnly) return;
        const field = sourceInput.current;
        field?.focus({ preventScroll: true });
        field?.setSelectionRange(field.value.length, field.value.length);
    }, [editing, object.block_type, readOnly]);
    useEffect(() => () => callbacks.current.onComposition(false), []);
    const source = object.data.source ?? '';
    const language = object.data.language ?? 'plaintext';
    useLayoutEffect(() => {
        const field = sourceInput.current;
        if (!field || !editing) return;
        //
        // Reset before measuring so deleting source lines can shrink the editor as well as grow it.
        //
        field.style.height = 'auto';
        field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`;
    }, [source, editing, object.width, object.data.text_scale]);
    useEffect(() => {
        if (object.block_type !== 'code' || !actions.current) return;
        const copy = mountCodeCopyButton(
            actions.current,
            () => callbacks.current.object.data.source ?? '',
        );
        return () => copy.destroy();
    }, [object.block_type]);
    useEffect(() => {
        if (object.block_type !== 'code' || !host.current) return;
        const output = host.current;
        output.replaceChildren();
        if (!editing) return;
        const codeInput = mountCodeInput({
            host: output,
            standalone: true,
            source,
            language,
            isVisible: () => true,
            onChange: (next) => {
                const current = callbacks.current;
                if (
                    !current.onChange(
                        { ...current.object.data, source: next },
                        'typing',
                    )
                )
                    queueMicrotask(() =>
                        input.current?.update(
                            callbacks.current.object.data.source ?? '',
                            callbacks.current.object.data.language ??
                                'plaintext',
                            callbacks.current.readOnly,
                        ),
                    );
            },
        });
        input.current = codeInput;
        codeInput.update(source, language, readOnly);
        if (!callbacks.current.readOnly) codeInput.focus();
        return () => {
            callbacks.current.onComposition(false);
            input.current = null;
            codeInput.destroy();
        };
    }, [object.block_type, editing]);
    useEffect(() => {
        if (input.current) input.current.update(source, language, readOnly);
        else if (object.block_type === 'code' && host.current && !editing) {
            host.current.replaceChildren();
            const destroyPreview = mountCodePreview(host.current, {
                kind: 'code',
                source: '',
                content: source,
                language,
                from: 0,
                to: 0,
                contentFrom: 0,
                contentTo: 0,
                metadata: {},
                presentation: {},
            });
            //
            // The document-style heading stays mounted across editing, so the nested renderer must not add another header.
            //
            host.current.firstElementChild?.remove();
            host.current
                .querySelector('pre')
                ?.setAttribute('class', 'board-code-preview-body');
            return destroyPreview;
        }
    }, [source, language, readOnly, editing, object.block_type]);
    useEffect(() => {
        if (object.block_type === 'code' || !host.current) return;
        const output = host.current;
        output.replaceChildren();
        const mermaid = new MermaidPreviewSession(
            props.workspaceId,
            props.boardId,
            'board',
        );
        const context: RichContext = {
            workspaceId: props.workspaceId,
            nodeId: props.boardId,
            ownerKind: 'board',
            mermaid,
            metadata: new Map(),
            isVisible: () => true,
            onUpload: () => {},
        };
        if (object.block_type === 'math')
            renderMath(output, { context, latex: source, displayMode: true });
        let unregister: (() => void) | undefined;
        let controls:
            | ReturnType<typeof createMermaidPreviewControls>
            | undefined;
        if (object.block_type === 'mermaid') {
            const preview = document.createElement('div');
            preview.dataset.mermaidPreview = '';
            preview.textContent = 'Rendering diagram…';
            controls = createMermaidPreviewControls();
            output.append(controls.button, preview);
            unregister = mermaid.register(source, preview, (result) => {
                if (result.preview) {
                    preview.innerHTML = instantiateMermaidSvg(result.preview);
                    controls?.update(result.preview);
                } else if (result.error)
                    preview.textContent =
                        'Diagram could not be rendered. Edit the source to fix it.';
            });
            mermaid.start(output);
        }
        return () => {
            unregister?.();
            controls?.destroy();
            mermaid.destroy();
        };
    }, [source, object.block_type, props.workspaceId, props.boardId]);
    const SourceIcon =
        object.block_type === 'code'
            ? Code2
            : object.block_type === 'math'
              ? Sigma
              : Workflow;
    return (
        <div
            className={`board-source-block board-source-${object.block_type} attachment-player orbium-rich-card`}
            onKeyDownCapture={(event) => {
                if (!event.currentTarget.contains(event.target as Node)) return;
                if (
                    editing &&
                    event.key === 'Enter' &&
                    (event.ctrlKey || event.metaKey) &&
                    !event.nativeEvent.isComposing
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    props.onFinish();
                }
            }}
        >
            <div className="attachment-heading orbium-rich-card-heading">
                <span className="attachment-type-icon">
                    <SourceIcon size={20} />
                </span>
                <div className="attachment-identity">
                    <div className="attachment-title">
                        {object.block_type === 'code' && editing ? (
                            <AppSelect
                                label="Code language"
                                value={language}
                                disabled={readOnly}
                                searchPlaceholder="Search languages…"
                                className="min-h-7 border-0 bg-transparent px-0 py-1 text-xs shadow-none"
                                options={(!codeLanguages.includes(language)
                                    ? [language, ...codeLanguages]
                                    : codeLanguages
                                ).map((value) => ({
                                    value,
                                    label: codeLanguageLabel(value),
                                    searchKeywords:
                                        codeLanguageSearchKeywords(value),
                                }))}
                                onValueChange={(value) =>
                                    props.onChange({
                                        ...object.data,
                                        language: value,
                                    })
                                }
                            />
                        ) : object.block_type === 'code' ? (
                            codeLanguageLabel(language)
                        ) : object.block_type === 'math' ? (
                            'Math'
                        ) : (
                            'Diagram'
                        )}
                    </div>
                    {object.block_type !== 'code' && (
                        <span className="attachment-description">
                            {object.block_type === 'math'
                                ? 'Equation'
                                : 'Mermaid'}
                        </span>
                    )}
                </div>
                <div
                    className="attachment-actions"
                    data-board-interactive
                    ref={actions}
                >
                    <button
                        type="button"
                        className="attachment-action"
                        aria-label={
                            editing ? 'Finish editing source' : 'Edit source'
                        }
                        title={
                            editing ? 'Finish editing source' : 'Edit source'
                        }
                        disabled={readOnly}
                        onClick={
                            editing ? props.onFinish : props.onStartEditing
                        }
                    >
                        {editing ? <Check size={17} /> : <Pencil size={17} />}
                    </button>
                </div>
            </div>
            <div
                ref={host}
                hidden={editing && object.block_type !== 'code'}
                data-board-editor={
                    (editing && object.block_type === 'code') || undefined
                }
                className={`board-source-preview ${object.block_type === 'code' ? 'orbium-rich-card-code' : 'orbium-rich-card-content'}`}
                data-empty={!source}
                data-code={object.block_type === 'code'}
                data-editing={editing}
                onCompositionStart={() => props.onComposition(true)}
                onCompositionEnd={() => props.onComposition(false)}
                onKeyDown={(event) => {
                    if (
                        editing &&
                        (event.key === 'Escape' ||
                            (event.key === 'Enter' &&
                                (event.ctrlKey || event.metaKey))) &&
                        !event.nativeEvent.isComposing
                    ) {
                        event.preventDefault();
                        event.stopPropagation();
                        props.onFinish();
                    }
                }}
            />
            {editing && object.block_type !== 'code' && (
                <textarea
                    ref={sourceInput}
                    data-board-editor
                    aria-label={
                        object.block_type === 'math'
                            ? 'Equation source'
                            : 'Diagram source'
                    }
                    className="board-source-input orbium-rich-card-source"
                    placeholder={
                        object.block_type === 'math'
                            ? 'Write an equation…'
                            : 'Describe your diagram…'
                    }
                    value={source}
                    disabled={readOnly}
                    onCompositionStart={() => props.onComposition(true)}
                    onCompositionEnd={() => props.onComposition(false)}
                    onChange={(event) =>
                        props.onChange(
                            {
                                ...object.data,
                                source: event.target.value,
                            },
                            'typing',
                        )
                    }
                    onKeyDown={(event) => {
                        if (
                            !event.nativeEvent.isComposing &&
                            (event.key === 'Escape' ||
                                (event.key === 'Enter' &&
                                    (event.ctrlKey || event.metaKey)))
                        ) {
                            event.preventDefault();
                            event.stopPropagation();
                            props.onFinish();
                        }
                    }}
                />
            )}
        </div>
    );
}
