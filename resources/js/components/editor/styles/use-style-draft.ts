import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    defaultEditorStyles,
    exportEditorStyles,
    normalizeEditorStyles,
    type EditorStyles,
} from './block-style-types';
import { validateEditorStyleDraft } from './compile-editor-styles';
import type { StyleSource } from './style-diagnostics';

const previewScope = '[data-style-preview]';

export function useStyleDraft(saved: EditorStyles, onApplied: () => void) {
    const { auth } = usePage().props;
    const form = useForm<EditorStyles>(saved);
    const [preview, setPreview] = useState(() => {
        const validation = validateEditorStyleDraft(saved, previewScope);
        return { validation, lastValidCss: validation.css ?? '' };
    });
    const [operationError, setOperationError] = useState('');
    const [notice, setNotice] = useState('');
    const [importing, setImporting] = useState(false);
    const importGeneration = useRef(0);
    const busy = form.processing || importing;

    useEffect(() => {
        const timer = setTimeout(() => {
            const validation = validateEditorStyleDraft(
                form.data,
                previewScope,
            );
            setPreview((previous) => ({
                validation,
                lastValidCss: validation.css ?? previous.lastValidCss,
            }));
        }, 150);
        return () => clearTimeout(timer);
    }, [form.data]);
    useEffect(
        () => () => {
            importGeneration.current += 1;
        },
        [],
    );

    function clearFeedback() {
        setOperationError('');
        setNotice('');
        form.clearErrors();
    }

    function changeSource(source: StyleSource, text: string) {
        if (busy) return;
        clearFeedback();
        if (source === 'base') form.setData('stylesheet', text);
        else
            form.setData('overrides', {
                ...form.data.overrides,
                [source]: text,
            });
    }

    function changeEnabled(enabled: boolean) {
        if (busy) return;
        clearFeedback();
        form.setData('enabled', enabled);
    }

    function resetTheme() {
        if (busy) return;
        clearFeedback();
        form.setData(normalizeEditorStyles(defaultEditorStyles));
        setNotice('Theme reset in preview. Apply to save the reset.');
    }

    function validateNow() {
        const validation = validateEditorStyleDraft(form.data, previewScope);
        setPreview((previous) => ({
            validation,
            lastValidCss: validation.css ?? previous.lastValidCss,
        }));
        return validation;
    }

    async function importCss(file: File) {
        if (busy) return false;
        clearFeedback();
        const generation = ++importGeneration.current;
        setImporting(true);
        try {
            if (!file.name.toLowerCase().endsWith('.css'))
                throw new Error('Choose a .css file.');
            if (file.size > 50000)
                throw new Error('CSS files must be at most 50 KB.');
            const stylesheet = await file.text();
            const imported = normalizeEditorStyles({
                enabled: form.data.enabled,
                stylesheet,
                overrides: {},
            });
            const validation = validateEditorStyleDraft(imported, previewScope);
            if (validation.css === null)
                throw new Error(validation.diagnostics[0].message);
            if (generation !== importGeneration.current) return false;
            form.setData(imported);
            setPreview({ validation, lastValidCss: validation.css });
            setNotice(
                'Imported into the draft. Previous block overrides cleared. Apply to save.',
            );
            return true;
        } catch (error) {
            if (generation === importGeneration.current)
                setOperationError(
                    error instanceof Error
                        ? error.message
                        : 'Could not import CSS.',
                );
            return false;
        } finally {
            if (generation === importGeneration.current) setImporting(false);
        }
    }

    function exportCss() {
        if (busy) return;
        clearFeedback();
        const validation = validateNow();
        if (validation.css === null) {
            setOperationError('Fix CSS errors before exporting.');
            return;
        }
        const url = URL.createObjectURL(
            new Blob([exportEditorStyles(form.data)], { type: 'text/css' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = 'orbium-editor-theme.css';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice('Exported the current draft, including block overrides.');
    }

    function applyStyles() {
        if (busy || !form.isDirty) return;
        clearFeedback();
        const validation = validateNow();
        if (form.data.enabled && validation.css === null) return;
        const submitted = form.data;
        form.put('/settings/editor-styles', {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults(submitted);
                if (typeof BroadcastChannel !== 'undefined') {
                    const channel = new BroadcastChannel(
                        `orbium-editor-styles-${auth.user.id}`,
                    );
                    channel.postMessage('saved');
                    channel.close();
                }
                onApplied();
            },
            onError: () =>
                setOperationError(
                    'Could not apply styles. Your draft is still here.',
                ),
        });
    }

    const status = form.processing
        ? 'Applying…'
        : importing
          ? 'Importing…'
          : operationError || Object.keys(form.errors).length
            ? 'Action failed'
            : form.isDirty
              ? 'Unsaved changes'
              : 'No changes';
    return {
        form,
        busy,
        preview,
        status,
        notice,
        operationError,
        changeSource,
        changeEnabled,
        resetTheme,
        importCss,
        exportCss,
        applyStyles,
    };
}
