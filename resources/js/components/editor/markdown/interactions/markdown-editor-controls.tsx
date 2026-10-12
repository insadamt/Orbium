import {
    Code2,
    Download,
    FileUp,
    FileInput,
    Search,
    ChevronDown,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';

type MarkdownEditorControlsProps = {
    status: 'saved' | 'saving' | 'error' | 'unsaved';
    livePreview: boolean;
    disabled: boolean;
    empty: boolean;
    importing: boolean;
    onRetry: () => void;
    onTogglePreview: () => void;
    onFind: () => void;
    onUpload: () => void;
    onImport: () => void;
    onExport: (online: boolean) => void;
    tableOfContents: ReactNode;
};

export function MarkdownEditorControls(props: MarkdownEditorControlsProps) {
    return (
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
                <span role="status">
                    {props.status === 'saved'
                        ? 'Saved'
                        : props.status === 'saving'
                          ? 'Saving…'
                          : props.status === 'error'
                            ? 'Save failed'
                            : 'Unsaved changes'}
                </span>
                {props.status === 'error' && (
                    <button
                        type="button"
                        className="underline"
                        onClick={props.onRetry}
                    >
                        Retry
                    </button>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
                {props.tableOfContents}
                {props.empty && (
                    <button
                        type="button"
                        disabled={props.disabled || props.importing}
                        className="flex items-center gap-1 rounded p-1 hover:bg-accent disabled:opacity-50"
                        onClick={props.onImport}
                    >
                        <FileInput size={16} />
                        {props.importing ? 'Importing…' : 'Import Markdown'}
                    </button>
                )}
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        disabled={props.disabled}
                        onClick={() => props.onExport(true)}
                        className="flex items-center gap-1 rounded p-1 hover:bg-accent disabled:opacity-50"
                    >
                        <Download size={16} /> Export Markdown
                    </button>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                type="button"
                                disabled={props.disabled}
                                aria-label="Export options"
                                className="flex items-center gap-1 rounded p-1 hover:bg-accent disabled:opacity-50"
                            >
                                <ChevronDown size={14} />
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                align="end"
                                sideOffset={6}
                                className="glass-surface z-50 min-w-56 rounded-xl border border-border p-1 shadow-xl"
                            >
                                <DropdownMenu.Item
                                    className="cursor-pointer rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent"
                                    onSelect={() => props.onExport(false)}
                                >
                                    Keep Orbium references
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    className="cursor-pointer rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent"
                                    onSelect={() => props.onExport(true)}
                                >
                                    Use links to this installation
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>
                <button
                    type="button"
                    onClick={props.onFind}
                    aria-label="Find in document"
                    className="rounded p-1 hover:bg-accent"
                >
                    <Search size={16} />
                </button>
                <button
                    type="button"
                    disabled={props.disabled}
                    className="flex items-center gap-1 rounded p-1 hover:bg-accent disabled:opacity-50"
                    onClick={props.onUpload}
                >
                    <FileUp size={16} />
                    Add file
                </button>
                <button
                    type="button"
                    aria-label={
                        props.livePreview
                            ? 'Switch to Markdown source'
                            : 'Switch to Live Preview'
                    }
                    title={
                        props.livePreview ? 'Markdown source' : 'Live Preview'
                    }
                    aria-pressed={!props.livePreview}
                    className="rounded p-1 hover:bg-accent"
                    onClick={props.onTogglePreview}
                >
                    <Code2 size={16} />
                </button>
            </div>
        </div>
    );
}
