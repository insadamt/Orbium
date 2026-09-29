import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';
import DocumentEditor from '@/components/editor/document-editor';
import type { EditorDocument } from '@/components/editor/editor-api';
import {
    attachmentUrl,
    csrfToken,
    documentUrl,
    uploadAttachment,
} from '@/components/editor/editor-api';

type Props = {
    workspace: { id: number; name: string };
    node: {
        id: number;
        title: string;
        icon: string | null;
        parent_id: number | null;
    };
    document: {
        content: EditorDocument;
        revision: number;
        cover_attachment_id: number | null;
    };
};

export default function ShowDocument() {
    const { workspace, node, document: savedDocument } = usePage<Props>().props;

    return (
        <DocumentPage
            key={`${workspace.id}:${node.id}`}
            workspace={workspace}
            node={node}
            savedDocument={savedDocument}
        />
    );
}

function DocumentPage({
    workspace,
    node,
    savedDocument,
}: {
    workspace: Props['workspace'];
    node: Props['node'];
    savedDocument: Props['document'];
}) {
    const [title, setTitle] = useState(node.title);
    const [icon, setIcon] = useState(node.icon ?? '');
    const [coverId, setCoverId] = useState(savedDocument.cover_attachment_id);
    const [headerError, setHeaderError] = useState('');
    const coverInput = useRef<HTMLInputElement>(null);

    async function saveHeader(
        changes: Record<string, unknown>,
    ): Promise<boolean> {
        setHeaderError('');
        try {
            const response = await fetch(
                `${documentUrl(workspace.id, node.id)}/header`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                        Accept: 'application/json',
                    },
                    body: JSON.stringify(changes),
                },
            );
            if (response.ok) return true;
        } catch {}
        setHeaderError('Could not save the document header.');
        return false;
    }

    async function addCover(file: File) {
        try {
            const attachment = await uploadAttachment(
                workspace.id,
                node.id,
                file,
            );
            if (!attachment.mime_type.startsWith('image/')) {
                setHeaderError(
                    'Choose a PNG, JPEG, GIF, or WebP image for the cover.',
                );
                return;
            }
            if (await saveHeader({ cover_attachment_id: attachment.id }))
                setCoverId(attachment.id);
        } catch {
            setHeaderError('Could not upload the cover.');
        }
    }

    return (
        <>
            <Head title={title} />
            <div className="mx-auto max-w-[980px]">
                <Link
                    href={
                        node.parent_id
                            ? `/workspaces/${workspace.id}/nodes/${node.parent_id}`
                            : `/workspaces/${workspace.id}`
                    }
                    className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={16} /> Back to {workspace.name}
                </Link>
                {coverId && (
                    <div className="relative mb-8 overflow-hidden rounded-2xl">
                        <img
                            src={attachmentUrl(workspace.id, node.id, coverId)}
                            alt="Document cover"
                            className="max-h-80 w-full object-cover"
                        />
                    </div>
                )}
                <div className="mx-auto max-w-[780px]">
                    <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <input
                            aria-label="Document icon"
                            value={icon}
                            maxLength={16}
                            onChange={(event) => setIcon(event.target.value)}
                            onBlur={() => {
                                void saveHeader({ icon: icon.trim() || null });
                            }}
                            placeholder="Add icon"
                            className="w-24 rounded-md bg-transparent px-2 py-1 hover:bg-accent focus:bg-accent"
                        />
                        <button
                            type="button"
                            onClick={() => coverInput.current?.click()}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-accent"
                        >
                            <ImagePlus size={14} />{' '}
                            {coverId ? 'Change cover' : 'Add cover'}
                        </button>
                        {coverId && (
                            <button
                                type="button"
                                onClick={() => {
                                    void saveHeader({
                                        cover_attachment_id: null,
                                    }).then((saved) => {
                                        if (saved) setCoverId(null);
                                    });
                                }}
                                className="hover:underline"
                            >
                                Remove cover
                            </button>
                        )}
                        <input
                            ref={coverInput}
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            aria-label="Upload cover"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void addCover(file);
                                event.target.value = '';
                            }}
                        />
                    </div>
                    <input
                        aria-label="Document title"
                        value={title}
                        maxLength={255}
                        onChange={(event) => setTitle(event.target.value)}
                        onBlur={() => {
                            const clean = title.trim();
                            if (clean) {
                                setTitle(clean);
                                void saveHeader({ title: clean });
                            } else {
                                setTitle(node.title);
                            }
                        }}
                        className="mb-8 w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground md:text-5xl"
                        placeholder="Untitled"
                    />
                    {headerError && (
                        <p
                            role="alert"
                            className="mb-5 text-sm text-destructive"
                        >
                            {headerError}
                        </p>
                    )}
                    <DocumentEditor
                        workspaceId={workspace.id}
                        nodeId={node.id}
                        content={savedDocument.content}
                        revision={savedDocument.revision}
                    />
                </div>
            </div>
        </>
    );
}
