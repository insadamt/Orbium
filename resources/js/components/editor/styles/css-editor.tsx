import { useEffect, useRef } from 'react';
import { Compartment, EditorState } from '@codemirror/state';
import {
    EditorView,
    lineNumbers,
    highlightActiveLine,
    keymap,
} from '@codemirror/view';
import { css } from '@codemirror/lang-css';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import { lintGutter, lintKeymap, setDiagnostics } from '@codemirror/lint';
import { tags } from '@lezer/highlight';
import { useAppearance } from '@/hooks/use-appearance';
import type { EditorStyles } from './block-style-types';
import type { StyleDiagnostic, StyleSource } from './style-diagnostics';
import { styleSourceLabel } from './style-workspace-options';

export type EditorJumpRequest = { id: number; diagnostic: StyleDiagnostic };
type Props = {
    styles: EditorStyles;
    source: StyleSource;
    diagnostics: StyleDiagnostic[];
    disabled: boolean;
    jumpRequest: EditorJumpRequest | null;
    onChange: (source: StyleSource, text: string) => void;
};
type SourceSession = {
    state: EditorState;
    scrollTop: number;
    scrollLeft: number;
};

function sourceText(styles: EditorStyles, source: StyleSource): string {
    return source === 'base'
        ? styles.stylesheet
        : (styles.overrides[source] ?? '');
}

function highlighting(dark: boolean) {
    return [
        EditorView.theme(
            {
                '&': {
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '13px',
                    height: '100%',
                },
                '.cm-scroller': { overflow: 'auto', fontFamily: 'monospace' },
                '.cm-gutters': {
                    backgroundColor: 'var(--background)',
                    color: 'var(--muted-foreground)',
                    border: 'none',
                },
                '.cm-content': {
                    caretColor: 'var(--foreground)',
                    padding: '12px 0',
                },
                '.cm-activeLine, .cm-activeLineGutter': {
                    backgroundColor: 'var(--muted)',
                },
                '.cm-tooltip': {
                    backgroundColor: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                    borderColor: 'var(--border)',
                },
                '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
                '&.cm-focused .cm-selectionBackground, .cm-selectionBackground':
                    { backgroundColor: dark ? '#ffffff25' : '#00000018' },
            },
            { dark },
        ),
        syntaxHighlighting(
            HighlightStyle.define([
                { tag: tags.comment, color: dark ? '#a3a3a3' : '#666666' },
                {
                    tag: [tags.keyword, tags.propertyName],
                    color: dark ? '#a9c7ff' : '#24529b',
                },
                {
                    tag: [tags.string, tags.color],
                    color: dark ? '#a6dcae' : '#286a37',
                },
                {
                    tag: [tags.number, tags.unit],
                    color: dark ? '#efbc8d' : '#8a4b13',
                },
                {
                    tag: [tags.className, tags.variableName],
                    color: dark ? '#d9b8ed' : '#753798',
                },
            ]),
        ),
    ];
}

export default function CssEditor(props: Props) {
    const { resolvedAppearance } = useAppearance();
    const container = useRef<HTMLDivElement>(null);
    const editorView = useRef<EditorView | null>(null);
    const sessions = useRef(new Map<StyleSource, SourceSession>());
    const activeSource = useRef<StyleSource>(props.source);
    const latest = useRef(props);
    const switching = useRef(false);
    const pendingScroll = useRef<{
        source: StyleSource;
        top: number;
        left: number;
    } | null>(null);
    const createState = useRef<((text: string) => EditorState) | null>(null);
    const compartments = useRef({
        theme: new Compartment(),
        readonly: new Compartment(),
        label: new Compartment(),
    });
    useEffect(() => {
        latest.current = props;
    }, [props]);

    function restorePendingScroll(view: EditorView) {
        view.requestMeasure({
            read: () =>
                view.dom.clientHeight > 0 ? pendingScroll.current : null,
            write: (pending) => {
                if (
                    pending &&
                    pending === pendingScroll.current &&
                    pending.source === activeSource.current
                ) {
                    view.scrollDOM.scrollTop = pending.top;
                    view.scrollDOM.scrollLeft = pending.left;
                    pendingScroll.current = null;
                }
            },
        });
    }

    useEffect(() => {
        if (!container.current) return;
        const { theme, readonly, label } = compartments.current;
        const extensions = [
            keymap.of([...defaultKeymap, ...historyKeymap, ...lintKeymap]),
            css(),
            lineNumbers(),
            highlightActiveLine(),
            history(),
            autocompletion(),
            lintGutter(),
            theme.of([]),
            readonly.of([]),
            label.of([]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged && !switching.current)
                    latest.current.onChange(
                        activeSource.current,
                        update.state.doc.toString(),
                    );
            }),
        ];
        createState.current = (doc) => EditorState.create({ doc, extensions });
        const view = new EditorView({
            parent: container.current,
            state: createState.current(
                sourceText(latest.current.styles, latest.current.source),
            ),
        });
        editorView.current = view;
        const observer = new ResizeObserver(() => {
            if (pendingScroll.current) restorePendingScroll(view);
        });
        observer.observe(container.current);
        return () => {
            observer.disconnect();
            view.destroy();
            editorView.current = null;
            sessions.current.clear();
        };
    }, []);

    useEffect(() => {
        const view = editorView.current;
        if (!view) return;
        if (activeSource.current !== props.source) {
            sessions.current.set(activeSource.current, {
                state: view.state,
                scrollTop: view.scrollDOM.scrollTop,
                scrollLeft: view.scrollDOM.scrollLeft,
            });
            const target = sessions.current.get(props.source);
            switching.current = true;
            view.setState(
                target?.state ??
                    createState.current!(
                        sourceText(props.styles, props.source),
                    ),
            );
            activeSource.current = props.source;
            switching.current = false;
            pendingScroll.current = {
                source: props.source,
                top: target?.scrollTop ?? 0,
                left: target?.scrollLeft ?? 0,
            };
            restorePendingScroll(view);
        }
        const text = sourceText(props.styles, props.source);
        if (view.state.doc.toString() !== text) {
            switching.current = true;
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: text },
            });
            switching.current = false;
        }
    }, [props.source, props.styles]);

    useEffect(() => {
        const view = editorView.current;
        if (!view) return;
        view.dispatch({
            effects: compartments.current.theme.reconfigure(
                highlighting(resolvedAppearance === 'dark'),
            ),
        });
    }, [props.source, resolvedAppearance]);

    useEffect(() => {
        const view = editorView.current;
        if (!view) return;
        view.dispatch({
            effects: compartments.current.readonly.reconfigure([
                EditorState.readOnly.of(props.disabled),
                EditorView.editable.of(!props.disabled),
            ]),
        });
    }, [props.source, props.disabled]);

    useEffect(() => {
        const view = editorView.current;
        if (!view) return;
        const diagnostics = props.diagnostics.filter(
            (item) => item.source === props.source,
        );
        view.dispatch({
            effects: compartments.current.label.reconfigure(
                EditorView.contentAttributes.of({
                    'aria-label': `${styleSourceLabel(props.source)} CSS`,
                    'aria-invalid': diagnostics.length ? 'true' : 'false',
                }),
            ),
        });
        view.dispatch(
            setDiagnostics(
                view.state,
                diagnostics.map((diagnostic) => ({
                    ...diagnostic,
                    from: Math.min(view.state.doc.length, diagnostic.from),
                    to: Math.min(view.state.doc.length, diagnostic.to),
                    severity: 'error' as const,
                })),
            ),
        );
    }, [props.source, props.diagnostics]);

    useEffect(() => {
        const request = props.jumpRequest;
        const view = editorView.current;
        if (!request || !view || request.diagnostic.source !== props.source)
            return;
        pendingScroll.current = null;
        const from = Math.min(view.state.doc.length, request.diagnostic.from);
        const to = Math.min(view.state.doc.length, request.diagnostic.to);
        view.dispatch({
            selection: { anchor: from, head: to },
            effects: EditorView.scrollIntoView(from, { y: 'center' }),
        });
        view.focus();
    }, [props.jumpRequest, props.source]);

    return <div ref={container} className="editor-style-code" />;
}
