import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '../navigation/navigation-dialog';
import {
    documentFilename,
    downloadDocument,
    encodeOrbie,
    type TransferFormat,
} from './document-format';
import { transferRequest } from './transfer-api';
import {
    generateOfficeExport,
    type OfficeExportOptions,
} from './office-export';
import { OfficeExportPageOptions } from './office-export-options';

type Asset = {
    id: number;
    original_name: string;
    purpose: string;
    size_bytes: number;
};
type TransferDocument = {
    id: number;
    title: string;
    source: string;
    plain: string;
    single: string;
    diagrams: Record<string, string>;
    attachments: Asset[];
};
export function ExportDialog({
    workspaceId,
    nodeId,
    source,
    onClose,
}: {
    workspaceId: number;
    nodeId: number;
    source?: string;
    onClose: () => void;
}) {
    const [documents, setDocuments] = useState<TransferDocument[]>([]);
    const [format, setFormat] = useState<
        TransferFormat | OfficeExportOptions['format']
    >('orbie');
    const [pageOptions, setPageOptions] = useState<
        Omit<OfficeExportOptions, 'format'>
    >({ paper: 'a4', orientation: 'portrait', page_numbers: false });
    const officeFormat = format === 'docx' || format === 'pdf';
    const [packageMode, setPackageMode] = useState(false);
    const [images, setImages] = useState(true);
    const [files, setFiles] = useState(true);
    const [related, setRelated] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        void transferRequest(
            `/workspaces/${workspaceId}/documents/${nodeId}/transfer-data`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source }),
                signal: controller.signal,
            },
        )
            .then((response) => response.json())
            .then((data: { documents: TransferDocument[] }) =>
                setDocuments(data.documents),
            )
            .catch((failure: Error) => {
                if (!controller.signal.aborted) setError(failure.message);
            });
        return () => controller.abort();
    }, [workspaceId, nodeId, source]);
    const selected = related ? documents : documents.slice(0, 1);
    const assets = selected.flatMap((document) => document.attachments);
    const includedAssets = assets.filter((asset) =>
        asset.purpose === 'image' ? images : files,
    );
    async function exportDocument() {
        if (!documents.length || busy) return;
        setBusy(true);
        setError('');
        try {
            if (officeFormat) {
                const main = documents[0];
                const file = await generateOfficeExport({
                    workspaceId,
                    nodeId,
                    source: main.source,
                    diagrams: main.diagrams,
                    options: { ...pageOptions, format },
                });
                downloadDocument(documentFilename(main.title, format), file);
            } else if (!packageMode) {
                const main = documents[0];
                const body =
                    format === 'orbie'
                        ? encodeOrbie(main.title, main.single)
                        : main.plain;
                downloadDocument(documentFilename(main.title, format), body);
            } else {
                const assetIds = new Set(
                    includedAssets.map((asset) => asset.id),
                );
                const rows = selected.map((document) => ({
                    id: document.id,
                    source: document.source,
                }));
                const response = await transferRequest(
                    `/workspaces/${workspaceId}/document-packages/export`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            format,
                            documents: rows,
                            attachment_ids: [...assetIds],
                        }),
                    },
                );
                downloadDocument(
                    documentFilename(documents[0].title, 'zip'),
                    await response.blob(),
                );
            }
            onClose();
        } catch (failure) {
            setError(
                failure instanceof Error ? failure.message : 'Export failed.',
            );
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
                onEscapeKeyDown={(event) => {
                    if (busy) event.preventDefault();
                }}
                onPointerDownOutside={(event) => {
                    if (busy) event.preventDefault();
                }}
            >
                <DialogTitle>Export document</DialogTitle>
                <div className="flex gap-2" aria-label="Export scope">
                    <button
                        className={buttonClass}
                        aria-pressed={!packageMode}
                        disabled={busy}
                        onClick={() => setPackageMode(false)}
                    >
                        Single document
                    </button>
                    <button
                        className={buttonClass}
                        aria-pressed={packageMode}
                        disabled={busy}
                        onClick={() => {
                            setPackageMode(true);
                            if (officeFormat) setFormat('orbie');
                        }}
                    >
                        Package
                    </button>
                </div>
                <label className="text-sm">
                    Document format
                    <select
                        className="mt-1 block w-full rounded-lg border bg-background p-2"
                        value={format}
                        disabled={busy}
                        onChange={(event) =>
                            setFormat(event.target.value as typeof format)
                        }
                    >
                        <option value="orbie">Orbium (.orbie)</option>
                        <option value="md">Markdown (.md)</option>
                        {!packageMode && (
                            <option value="docx">Word document (.docx)</option>
                        )}
                        {!packageMode && (
                            <option value="pdf">PDF (.pdf)</option>
                        )}
                    </select>
                </label>
                <p className="text-xs text-muted-foreground">
                    {officeFormat
                        ? 'Clean document layout with standard typography, white pages, and 1-inch margins.'
                        : format === 'orbie'
                          ? 'Preserves Orbium document formatting.'
                          : 'Standard Markdown. Orbium presentation formatting is omitted.'}
                </p>
                {officeFormat && (
                    <OfficeExportPageOptions
                        value={pageOptions}
                        onChange={setPageOptions}
                        disabled={busy}
                    />
                )}
                {packageMode && (
                    <fieldset
                        disabled={busy}
                        className="flex flex-col gap-3 text-sm"
                    >
                        <legend className="mb-2">Include in package</legend>
                        {[
                            {
                                label: 'images',
                                count: assets.filter(
                                    (asset) => asset.purpose === 'image',
                                ).length,
                                value: images,
                                change: setImages,
                            },
                            {
                                label: 'files',
                                count: assets.filter(
                                    (asset) => asset.purpose !== 'image',
                                ).length,
                                value: files,
                                change: setFiles,
                            },
                            {
                                label: 'related documents',
                                count: Math.max(0, documents.length - 1),
                                value: related,
                                change: setRelated,
                            },
                        ].map((option) => (
                            <label
                                key={option.label}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={option.value}
                                    disabled={!option.count}
                                    onChange={(event) =>
                                        option.change(event.target.checked)
                                    }
                                />
                                Include {option.label} ({option.count})
                            </label>
                        ))}
                    </fieldset>
                )}
                <p className="text-xs text-muted-foreground">
                    {documents.length
                        ? documentFilename(
                              documents[0].title,
                              packageMode ? 'zip' : format,
                          )
                        : 'Loading document…'}
                    {packageMode && documents.length > 0
                        ? ` · ${selected.length} documents · ${Math.round(includedAssets.reduce((total, asset) => total + asset.size_bytes, 0) / 1024)} KB of assets`
                        : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                    {officeFormat
                        ? 'Images and diagrams are embedded. Files and page mentions remain links to Orbium and may require sign-in. Covers, properties, and editor themes are omitted.'
                        : packageMode
                          ? 'Excluded references remain links to this installation. Related documents include direct mentions only.'
                          : 'Images, files, and related pages are not included. Use Package to include them.'}
                </p>
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <button
                        className={buttonClass}
                        disabled={busy}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                        disabled={busy || !documents.length}
                        onClick={() => void exportDocument()}
                    >
                        {busy
                            ? 'Preparing export…'
                            : packageMode
                              ? 'Export package'
                              : 'Export document'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
