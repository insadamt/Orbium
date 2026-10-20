import {
    MoreHorizontal,
    Upload,
    Download,
    Code2,
    RotateCw,
    Check,
} from 'lucide-react';
import * as DropdownMenu from '@/components/ui/dropdown-menu';
import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
    HostedDocumentControlsHostContext,
    HostedDocumentActionsContext,
} from '../../hosted-document-session';

type MarkdownEditorControlsProps = {
    status: 'saved' | 'saving' | 'error' | 'unsaved';
    livePreview: boolean;
    disabled: boolean;
    importing: boolean;
    onRetry: () => void;
    onTogglePreview: () => void;
    onImport: () => void;
    onExport: () => void;
    tableOfContents: ReactNode;
};

export function MarkdownEditorControls(props: MarkdownEditorControlsProps) {
    const controlsHost = useContext(HostedDocumentControlsHostContext);
    const hostedActions = useContext(HostedDocumentActionsContext);
    const actions = [
        ...(hostedActions
            ? [
                  {
                      icon: Check,
                      label: 'Finish editing',
                      run: hostedActions.finish,
                      disabled:
                          props.status === 'saving' ||
                          props.status === 'unsaved' ||
                          props.importing,
                  },
                  {
                      icon: RotateCw,
                      label: 'Refresh linked page',
                      run: hostedActions.refresh,
                      disabled: props.importing,
                  },
              ]
            : []),
        {
            icon: Upload,
            label: 'Import document…',
            run: props.onImport,
            disabled: props.disabled || props.importing,
        },
        {
            icon: Download,
            label: 'Export…',
            run: props.onExport,
            disabled: props.disabled,
        },
        {
            icon: Code2,
            label: props.livePreview ? 'Markdown source' : 'Live Preview',
            run: props.onTogglePreview,
            disabled: false,
        },
    ];
    const controls = (
        <div
            className={`${controlsHost ? '' : 'mb-7 '}flex items-center justify-between gap-3 text-xs text-muted-foreground`}
        >
            <div
                className={
                    controlsHost && props.status === 'saved'
                        ? 'sr-only'
                        : 'flex items-center gap-2'
                }
            >
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
                    <button className="underline" onClick={props.onRetry}>
                        Retry
                    </button>
                )}
            </div>
            {props.tableOfContents}
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        type="button"
                        aria-label="Document actions"
                        className="rounded-lg p-2 hover:bg-accent"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="glass-surface z-50 min-w-56 rounded-xl border border-border p-1 shadow-xl"
                >
                    {actions.map((action) => (
                        <DropdownMenu.Item
                            key={action.label}
                            disabled={action.disabled}
                            onSelect={action.run}
                            className="cursor-pointer rounded px-3 py-2 text-sm outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent"
                        >
                            <action.icon size={16} /> {action.label}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
    );
    return controlsHost ? createPortal(controls, controlsHost) : controls;
}
