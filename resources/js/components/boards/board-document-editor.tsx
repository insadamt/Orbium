import { useState } from 'react';
import MarkdownEditorLoader from '@/components/editor/markdown/markdown-editor-loader';
import DocumentEditorLoader from '@/pages/documents/document-editor-loader';
import { DocumentTabContext } from '@/components/navigation/document-tab-context';
import { HostedDocumentSessionContext } from '@/components/editor/hosted-document-session';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { useBoardDocumentSession } from './use-board-document-session';
import { fetchResourceDocument } from './board-resource-api';
import type {
    ResourceDocument,
    ResourceLocation,
} from './board-resource-types';

export function BoardDocumentEditor({
    location,
    snapshot,
    onLockedChange,
    onReload,
}: {
    location: ResourceLocation;
    snapshot: ResourceDocument;
    onLockedChange: (locked: boolean) => void;
    onReload: (snapshot: ResourceDocument) => void;
}) {
    const session = useBoardDocumentSession(location, snapshot, onLockedChange);
    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reloadError, setReloadError] = useState('');
    const document = session.document;
    return (
        <div className="board-document-editor" data-board-editor>
            <p className="board-document-hint">
                Editing the original Document. Its content is shared with every
                reference.
            </p>
            {(session.runtime.error ||
                session.storageWarning ||
                reloadError) && (
                <div role="alert" className="board-document-error">
                    <p>
                        {[
                            session.runtime.error,
                            session.storageWarning,
                            reloadError,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    </p>
                    <div className="board-field-actions">
                        <button type="button" onClick={session.download}>
                            Download local Document draft
                        </button>
                        <button
                            type="button"
                            disabled={session.isBusy()}
                            onClick={() => setConfirm(true)}
                        >
                            Load latest Document
                        </button>
                    </div>
                </div>
            )}
            <DocumentTabContext.Provider
                value={{
                    tabId: location.tabId,
                    active: true,
                    visible: true,
                    url: `/workspaces/${location.workspaceId}/documents/${location.targetId}`,
                }}
            >
                <HostedDocumentSessionContext.Provider value={session.runtime}>
                    {document.content_format_version === 2 ? (
                        <MarkdownEditorLoader
                            title={document.title}
                            workspaceId={location.workspaceId}
                            nodeId={document.id}
                            markdown={document.markdown}
                            revision={document.revision}
                            limits={document.markdown_limits}
                        />
                    ) : (
                        <DocumentEditorLoader
                            workspaceId={location.workspaceId}
                            nodeId={document.id}
                            title={document.title}
                            content={document.content}
                            revision={document.revision}
                        />
                    )}
                </HostedDocumentSessionContext.Provider>
            </DocumentTabContext.Provider>
            <Dialog
                open={confirm}
                onOpenChange={(value) => {
                    if (!loading) setConfirm(value);
                }}
            >
                <DialogContent
                    onEscapeKeyDown={(event) => {
                        if (loading) event.preventDefault();
                    }}
                    onPointerDownOutside={(event) => {
                        if (loading) event.preventDefault();
                    }}
                >
                    <DialogTitle>Load the latest Document?</DialogTitle>
                    <p className="text-sm">
                        This replaces this card's unsaved Document edits with
                        the original's current saved content. Download the draft
                        first to keep it.
                    </p>
                    <div className="board-field-actions">
                        <button type="button" onClick={session.download}>
                            Download draft
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setConfirm(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={loading || session.isBusy()}
                            onClick={async () => {
                                setLoading(true);
                                session.runtime.setBusy('reload', true);
                                setReloadError('');
                                try {
                                    const latest = await fetchResourceDocument(
                                        location,
                                        location.targetId,
                                    );
                                    session.clearDraft();
                                    onReload(latest);
                                } catch (failure) {
                                    setReloadError(
                                        failure instanceof Error
                                            ? failure.message
                                            : 'Could not load the latest Document.',
                                    );
                                } finally {
                                    session.runtime.setBusy('reload', false);
                                    setLoading(false);
                                }
                            }}
                        >
                            {loading ? 'Loading…' : 'Load latest'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
