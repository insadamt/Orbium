import { ImportProgress } from './import-progress';
import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '../navigation/navigation-dialog';
import { decodeDocumentFile } from './document-format';
import { transferRequest } from './transfer-api';
import { prepareMarkdownImport } from '../editor/markdown/interactions/markdown-transfer';

export function ImportDialog({
    workspaceId,
    parentId = null,
    replaceDocument,
    onClose,
}: {
    workspaceId: number;
    parentId?: number | null;
    replaceDocument?: {
        hasContent: () => boolean;
        validate: (source: string) => Promise<string>;
        replace: (source: string) => Promise<void>;
    };
    onClose: () => void;
}) {
    const input = useRef<HTMLInputElement>(null);
    const [packageMode, setPackageMode] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [stage, setStage] = useState('');
    const [error, setError] = useState('');
    const [pending, setPending] = useState<{
        title: string;
        source: string;
    } | null>(null);
    const [result, setResult] = useState<{
        node_id: number;
        documents: number;
        assets: number;
    } | null>(null);
    async function importFile() {
        if (!file || busy) return;
        setBusy(true);
        setError('');
        try {
            if (packageMode) {
                if (!/\.zip$/i.test(file.name))
                    throw new Error(
                        'Choose an Orbium document package (.zip).',
                    );
                setStage('Verifying package');
                const form = new FormData();
                form.append('file', file);
                if (parentId !== null)
                    form.append('parent_id', String(parentId));
                form.append('verify_only', '1');
                await transferRequest(
                    `/workspaces/${workspaceId}/document-packages/import`,
                    { method: 'POST', body: form },
                );
                form.set('verify_only', '0');
                setStage('Creating documents');
                const response = await transferRequest(
                    `/workspaces/${workspaceId}/document-packages/import`,
                    { method: 'POST', body: form },
                );
                const reader = response.body?.getReader();
                if (!reader)
                    throw new Error('The import response was interrupted.');
                const decoder = new TextDecoder();
                let buffer = '';
                let completed = false;
                while (true) {
                    const chunk = await reader.read();
                    buffer += decoder.decode(chunk.value, {
                        stream: !chunk.done,
                    });
                    let end: number;
                    while ((end = buffer.indexOf('\n')) >= 0) {
                        const line = buffer.slice(0, end);
                        buffer = buffer.slice(end + 1);
                        if (!line.trim()) continue;
                        const update = JSON.parse(line) as {
                            stage?: string;
                            error?: string;
                            result?: {
                                node_id: number;
                                documents: number;
                                assets: number;
                            };
                        };
                        if (update.error) throw new Error(update.error);
                        if (update.stage) setStage(update.stage);
                        if (update.result) {
                            completed = true;
                            setResult(update.result);
                            setStage('Import complete');
                        }
                    }
                    if (chunk.done) break;
                }
                if (!completed)
                    throw new Error(
                        'The connection ended before import completion was confirmed. Refresh the folder before retrying.',
                    );
            } else {
                if (!/\.(orbie|md|markdown)$/i.test(file.name))
                    throw new Error('Choose a .orbie or .md document.');
                if (file.size > 2 * 1024 * 1024 + 4096)
                    throw new Error('Documents must be no larger than 2 MB.');
                setStage('Verifying document');
                const decoded = decodeDocumentFile(
                    file.name,
                    new TextDecoder('utf-8', { fatal: true }).decode(
                        await file.arrayBuffer(),
                    ),
                );
                decoded.source = prepareMarkdownImport(decoded.source);
                if (replaceDocument) {
                    decoded.source = await replaceDocument.validate(
                        decoded.source,
                    );
                    if (replaceDocument.hasContent()) setPending(decoded);
                    else {
                        await replaceDocument.replace(decoded.source);
                        onClose();
                    }
                } else {
                    setStage('Creating document');
                    const response = await transferRequest(
                        `/workspaces/${workspaceId}/documents/import`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                parent_id: parentId,
                                title: decoded.title,
                                source: decoded.source,
                            }),
                        },
                    );
                    setResult(await response.json());
                    setStage('Import complete');
                }
            }
        } catch (failure) {
            setError(
                failure instanceof Error ? failure.message : 'Import failed.',
            );
            setStage('');
        } finally {
            setBusy(false);
        }
    }
    const buttonClass =
        'rounded-lg border px-3 py-2 text-sm aria-pressed:bg-accent';
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !busy) onClose();
            }}
        >
            <DialogContent
                className={
                    packageMode && busy
                        ? 'top-1/2 min-h-96 -translate-y-1/2 justify-center'
                        : undefined
                }
                onEscapeKeyDown={(event) => {
                    if (busy) event.preventDefault();
                }}
                onPointerDownOutside={(event) => {
                    if (busy) event.preventDefault();
                }}
            >
                <DialogTitle>
                    {pending
                        ? 'Replace this document’s content?'
                        : result
                          ? 'Import complete'
                          : 'Import'}
                </DialogTitle>
                {pending ? (
                    <>
                        <p className="text-sm">
                            Importing will erase all current content in this
                            document and replace it with{' '}
                            <strong>{file?.name}</strong>. The document title
                            and properties will be kept.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                className={buttonClass}
                                disabled={busy}
                                onClick={() => setPending(null)}
                            >
                                Cancel
                            </button>
                            <button
                                disabled={busy}
                                className="rounded-lg bg-destructive px-4 py-2 text-sm text-white disabled:opacity-50"
                                onClick={async () => {
                                    setBusy(true);
                                    try {
                                        await replaceDocument?.replace(
                                            pending.source,
                                        );
                                        onClose();
                                    } catch (failure) {
                                        setError(
                                            failure instanceof Error
                                                ? failure.message
                                                : 'Replacement failed.',
                                        );
                                        setPending(null);
                                    } finally {
                                        setBusy(false);
                                    }
                                }}
                            >
                                Replace content
                            </button>
                        </div>
                    </>
                ) : result ? (
                    <>
                        <p className="text-sm">
                            Imported {result.documents} document(s) and{' '}
                            {result.assets} image(s)/file(s).
                        </p>
                        <button
                            className={buttonClass}
                            onClick={() => {
                                onClose();
                                router.visit(
                                    `/workspaces/${workspaceId}/documents/${result.node_id}`,
                                );
                            }}
                        >
                            Open main document
                        </button>
                    </>
                ) : packageMode && busy ? (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {file?.name}
                        </p>
                        <ImportProgress stage={stage} />
                    </>
                ) : (
                    <>
                        {!replaceDocument && (
                            <div className="flex gap-2">
                                <button
                                    disabled={busy}
                                    className={buttonClass}
                                    aria-pressed={!packageMode}
                                    onClick={() => {
                                        setPackageMode(false);
                                        setFile(null);
                                        setError('');
                                    }}
                                >
                                    Single document
                                </button>
                                <button
                                    disabled={busy}
                                    className={buttonClass}
                                    aria-pressed={packageMode}
                                    onClick={() => {
                                        setPackageMode(true);
                                        setFile(null);
                                        setError('');
                                    }}
                                >
                                    Whole package
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {replaceDocument
                                ? 'Import into the current document. Existing content requires confirmation before replacement.'
                                : parentId === null
                                  ? 'Destination: current workspace root.'
                                  : 'Destination: current folder.'}
                        </p>
                        <button
                            type="button"
                            disabled={busy}
                            className="rounded-xl border border-dashed p-8 text-center text-sm hover:bg-accent disabled:opacity-50"
                            onClick={() => input.current?.click()}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                                event.preventDefault();
                                if (!busy) {
                                    setFile(
                                        event.dataTransfer.files[0] ?? null,
                                    );
                                    setError('');
                                }
                            }}
                        >
                            {file
                                ? file.name
                                : `Drop ${packageMode ? 'a .zip package' : 'a .orbie or .md document'} here, or choose a file`}
                        </button>
                        <input
                            ref={input}
                            type="file"
                            className="hidden"
                            accept={
                                packageMode ? '.zip' : '.orbie,.md,.markdown'
                            }
                            aria-label="Choose import file"
                            onChange={(event) => {
                                setFile(event.target.files?.[0] ?? null);
                                setError('');
                                event.target.value = '';
                            }}
                        />
                        {packageMode && stage ? (
                            <ImportProgress stage={stage} />
                        ) : (
                            stage && (
                                <p
                                    role="status"
                                    aria-live="polite"
                                    className="text-sm"
                                >
                                    {stage}
                                    {busy ? '…' : ''}
                                </p>
                            )
                        )}
                        <div className="flex justify-end gap-2">
                            <button
                                disabled={busy}
                                className={buttonClass}
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                disabled={busy || !file}
                                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                                onClick={() => void importFile()}
                            >
                                {busy ? 'Importing…' : 'Import'}
                            </button>
                        </div>
                    </>
                )}
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
