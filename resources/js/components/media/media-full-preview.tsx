import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

type MediaFullPreviewOptions = {
    content: HTMLElement;
    trigger: HTMLElement;
    title: string;
    onClose: () => void;
    afterRelocate: () => void;
};

function MediaFullPreview({
    options,
    dispose,
}: {
    options: MediaFullPreviewOptions;
    dispose: () => void;
}) {
    const [open, setOpen] = useState(true);
    const viewport = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        options.content.dataset.expanded = 'true';
        viewport.current?.append(options.content);
        options.afterRelocate();
    }, [options]);
    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal container={document.body}>
                <Dialog.Overlay className="mermaid-full-overlay" />
                <Dialog.Content
                    className="mermaid-full-dialog attachment-full-dialog"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        dispose();
                    }}
                >
                    <header className="mermaid-full-header">
                        <Dialog.Title className="mermaid-full-title">
                            {options.title}
                        </Dialog.Title>
                        <Dialog.Description className="sr-only">
                            Media preview. Escape to close and return to the
                            document.
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="mermaid-full-close"
                                aria-label="Close media preview"
                            >
                                <X size={19} />
                            </button>
                        </Dialog.Close>
                    </header>
                    <div className="attachment-full-stage" ref={viewport} />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export function openMediaFullPreview(options: MediaFullPreviewOptions) {
    const placeholder = document.createElement('div');
    placeholder.style.height = `${options.content.getBoundingClientRect().height}px`;
    options.content.before(placeholder);
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    let disposed = false;
    const dispose = () => {
        if (disposed) return;
        disposed = true;
        delete options.content.dataset.expanded;
        placeholder.replaceWith(options.content);
        options.afterRelocate();
        options.onClose();
        queueMicrotask(() => {
            root.unmount();
            host.remove();
            if (options.trigger.isConnected)
                options.trigger.focus({ preventScroll: true });
        });
    };
    flushSync(() =>
        root.render(<MediaFullPreview options={options} dispose={dispose} />),
    );
    return dispose;
}
