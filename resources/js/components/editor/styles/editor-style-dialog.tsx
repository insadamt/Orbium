import * as Dialog from '@radix-ui/react-dialog';
import { Check, Copy, Download, RotateCcw, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { EditorStyles } from './block-style-types';
import CssEditor, { type EditorJumpRequest } from './css-editor';
import type { StyleDiagnostic, StyleSource } from './style-diagnostics';
import StyleHelp from './style-help';
import StyleNavigation from './style-navigation';
import StylePreviewPanel from './style-preview-panel';
import { exampleSource, styleSourceLabel } from './style-workspace-options';
import { useStyleDraft } from './use-style-draft';

type Props = {
    saved: EditorStyles;
    onClose: () => void;
    onApplied: () => void;
    onRestoreFocus: () => void;
};

export default function EditorStyleDialog({
    saved,
    onClose,
    onApplied,
    onRestoreFocus,
}: Props) {
    const draft = useStyleDraft(saved, onApplied);
    const [source, setSource] = useState<StyleSource>('base');
    const [previewMode, setPreviewMode] = useState<'focused' | 'full'>('full');
    const [smallScreenTab, setSmallScreenTab] = useState<'editor' | 'preview'>(
        'editor',
    );
    const [discardPrompt, setDiscardPrompt] = useState(false);
    const [jumpRequest, setJumpRequest] = useState<EditorJumpRequest | null>(
        null,
    );
    const [copyStatus, setCopyStatus] = useState('');
    const importInput = useRef<HTMLInputElement>(null);
    const diagnostics = draft.preview.validation.diagnostics;
    const text =
        source === 'base'
            ? draft.form.data.stylesheet
            : (draft.form.data.overrides[source] ?? '');
    const selector =
        source === 'base' ? 'All document blocks' : `.orbium-${source}`;
    const sourceDescription =
        source === 'base'
            ? 'Complete CSS rules for the whole theme'
            : text.trim()
              ? 'Custom override · takes priority over base styles'
              : 'Inherits base styles · add declarations to override';

    function chooseSource(next: StyleSource) {
        setSource(next);
        setPreviewMode(next === 'base' ? 'full' : 'focused');
        setCopyStatus('');
    }

    function requestClose() {
        if (draft.busy) return;
        if (draft.form.isDirty) setDiscardPrompt(true);
        else onClose();
    }

    function jumpToError(diagnostic: StyleDiagnostic) {
        chooseSource(diagnostic.source);
        setSmallScreenTab('editor');
        setJumpRequest({ id: (jumpRequest?.id ?? 0) + 1, diagnostic });
    }

    async function copySelector() {
        try {
            await navigator.clipboard.writeText(selector);
            setCopyStatus('Copied');
        } catch {
            setCopyStatus(
                'Could not copy. Select and copy the selector manually.',
            );
        }
    }

    function errorLine(diagnostic: StyleDiagnostic): number {
        const content =
            diagnostic.source === 'base'
                ? draft.form.data.stylesheet
                : (draft.form.data.overrides[diagnostic.source] ?? '');
        return content.slice(0, diagnostic.from).split('\n').length;
    }

    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open) requestClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="editor-style-overlay" />
                <Dialog.Content
                    className="editor-style-dialog"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        onRestoreFocus();
                    }}
                    aria-describedby="editor-style-description"
                    onInteractOutside={(event) => event.preventDefault()}
                >
                    <header className="editor-style-dialog-header">
                        <div>
                            <Dialog.Title>Editor styles</Dialog.Title>
                            <Dialog.Description id="editor-style-description">
                                Customize your document blocks. Changes stay in
                                preview until you apply.
                            </Dialog.Description>
                        </div>
                        <button
                            type="button"
                            className="editor-style-icon-button"
                            aria-label="Close editor styles"
                            disabled={draft.busy}
                            onClick={requestClose}
                        >
                            <X size={18} />
                        </button>
                    </header>
                    <div className="editor-style-toolbar">
                        <div className="editor-style-toolbar-actions">
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={draft.busy}
                                onClick={() => importInput.current?.click()}
                            >
                                <Upload size={15} />
                                Import
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={draft.busy}
                                onClick={draft.exportCss}
                            >
                                <Download size={15} />
                                Export
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={draft.busy}
                                onClick={draft.resetTheme}
                            >
                                <RotateCcw size={15} />
                                Reset theme
                            </Button>
                        </div>
                        <div className="editor-style-enable">
                            Custom styles
                            <label className="appearance-switch">
                                <input
                                    type="checkbox"
                                    checked={draft.form.data.enabled}
                                    disabled={draft.busy}
                                    onChange={(event) =>
                                        draft.changeEnabled(
                                            event.target.checked,
                                        )
                                    }
                                    aria-label="Enable custom styles"
                                />
                                <span aria-hidden="true" />
                            </label>
                        </div>
                        <input
                            ref={importInput}
                            className="sr-only"
                            type="file"
                            accept=".css,text/css"
                            aria-label="Import editor theme"
                            disabled={draft.busy}
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = '';
                                if (file)
                                    void draft
                                        .importCss(file)
                                        .then((imported) => {
                                            if (imported) chooseSource('base');
                                        });
                            }}
                        />
                    </div>
                    <div
                        className="editor-style-workspace"
                        data-active-tab={smallScreenTab}
                    >
                        <StyleNavigation
                            source={source}
                            styles={draft.form.data}
                            diagnostics={diagnostics}
                            onSelect={chooseSource}
                        />
                        <div
                            className="editor-style-mobile-tabs"
                            role="tablist"
                            aria-label="Workspace view"
                        >
                            <button
                                id="style-editor-tab"
                                type="button"
                                role="tab"
                                aria-selected={smallScreenTab === 'editor'}
                                aria-controls="style-editor-panel"
                                tabIndex={smallScreenTab === 'editor' ? 0 : -1}
                                onClick={() => setSmallScreenTab('editor')}
                                onKeyDown={(event) => {
                                    if (
                                        [
                                            'ArrowLeft',
                                            'ArrowRight',
                                            'End',
                                        ].includes(event.key)
                                    ) {
                                        event.preventDefault();
                                        setSmallScreenTab('preview');
                                        document
                                            .getElementById('style-preview-tab')
                                            ?.focus();
                                    }
                                }}
                            >
                                Editor
                            </button>
                            <button
                                id="style-preview-tab"
                                type="button"
                                role="tab"
                                aria-selected={smallScreenTab === 'preview'}
                                aria-controls="style-preview-panel"
                                tabIndex={smallScreenTab === 'preview' ? 0 : -1}
                                onClick={() => setSmallScreenTab('preview')}
                                onKeyDown={(event) => {
                                    if (
                                        [
                                            'ArrowLeft',
                                            'ArrowRight',
                                            'Home',
                                        ].includes(event.key)
                                    ) {
                                        event.preventDefault();
                                        setSmallScreenTab('editor');
                                        document
                                            .getElementById('style-editor-tab')
                                            ?.focus();
                                    }
                                }}
                            >
                                Preview
                            </button>
                        </div>
                        <section
                            className="editor-style-editor-panel"
                            id="style-editor-panel"
                            role="tabpanel"
                            aria-labelledby="style-editor-tab"
                            aria-label="CSS editor"
                        >
                            <div className="editor-style-editor-heading">
                                <div>
                                    <h3>{styleSourceLabel(source)}</h3>
                                    <p>{sourceDescription}</p>
                                </div>
                                {source !== 'base' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={draft.busy || !text}
                                        onClick={() =>
                                            draft.changeSource(source, '')
                                        }
                                    >
                                        Clear override
                                    </Button>
                                )}
                            </div>
                            <div className="editor-style-selector">
                                <code>{selector}</code>
                                {source !== 'base' && (
                                    <button
                                        type="button"
                                        aria-label="Copy block selector"
                                        onClick={() => void copySelector()}
                                    >
                                        {copyStatus === 'Copied' ? (
                                            <Check size={14} />
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                    </button>
                                )}
                                <span role="status">{copyStatus}</span>
                            </div>
                            {!text.trim() && (
                                <div className="editor-style-empty">
                                    <span>
                                        {source === 'base'
                                            ? 'Start with a rule or import a CSS theme.'
                                            : 'This block uses your base theme.'}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={draft.busy}
                                        onClick={() =>
                                            draft.changeSource(
                                                source,
                                                exampleSource(source),
                                            )
                                        }
                                    >
                                        Insert example
                                    </button>
                                </div>
                            )}
                            <CssEditor
                                styles={draft.form.data}
                                source={source}
                                diagnostics={diagnostics}
                                disabled={draft.busy}
                                jumpRequest={jumpRequest}
                                onChange={draft.changeSource}
                            />
                            {diagnostics.length > 0 && (
                                <div
                                    className="editor-style-diagnostics"
                                    aria-live="polite"
                                >
                                    <p>
                                        {diagnostics.length} CSS{' '}
                                        {diagnostics.length === 1
                                            ? 'error'
                                            : 'errors'}
                                    </p>
                                    {diagnostics.map((diagnostic, index) => (
                                        <button
                                            type="button"
                                            key={`${diagnostic.source}-${index}`}
                                            onClick={() =>
                                                jumpToError(diagnostic)
                                            }
                                        >
                                            {styleSourceLabel(
                                                diagnostic.source,
                                            )}{' '}
                                            · line {errorLine(diagnostic)}:{' '}
                                            {diagnostic.message}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <StyleHelp />
                        </section>
                        <StylePreviewPanel
                            source={source}
                            mode={previewMode}
                            onModeChange={setPreviewMode}
                            enabled={draft.form.data.enabled}
                            invalid={draft.preview.validation.css === null}
                            css={draft.preview.lastValidCss}
                        />
                    </div>
                    <footer className="editor-style-dialog-footer">
                        <div className="editor-style-feedback">
                            <span role="status">{draft.status}</span>
                            {draft.notice && (
                                <p role="status">{draft.notice}</p>
                            )}
                            {draft.operationError && (
                                <p role="alert">{draft.operationError}</p>
                            )}
                            {Object.values(draft.form.errors).map(
                                (error, index) => (
                                    <p role="alert" key={index}>
                                        {error}
                                    </p>
                                ),
                            )}
                        </div>
                        <div className="editor-style-footer-actions">
                            <Button
                                variant="outline"
                                disabled={draft.busy}
                                onClick={requestClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={
                                    draft.busy ||
                                    !draft.form.isDirty ||
                                    (draft.form.data.enabled &&
                                        diagnostics.length > 0)
                                }
                                onClick={draft.applyStyles}
                            >
                                {draft.form.processing ? 'Applying…' : 'Apply'}
                            </Button>
                        </div>
                    </footer>
                    <Dialog.Root
                        open={discardPrompt}
                        onOpenChange={setDiscardPrompt}
                    >
                        <Dialog.Portal>
                            <Dialog.Overlay className="editor-style-discard-overlay" />
                            <Dialog.Content
                                className="editor-style-discard"
                                aria-describedby="discard-style-description"
                            >
                                <Dialog.Title>Discard changes?</Dialog.Title>
                                <Dialog.Description id="discard-style-description">
                                    Your saved theme will stay unchanged.
                                </Dialog.Description>
                                <div>
                                    <Button
                                        variant="outline"
                                        autoFocus
                                        onClick={() => setDiscardPrompt(false)}
                                    >
                                        Keep editing
                                    </Button>
                                    <Button onClick={onClose}>
                                        Discard changes
                                    </Button>
                                </div>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
