import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CopyButton } from '@/components/animate-ui/components/buttons/copy';

function CodeCopyButton({ readCode }: { readCode: () => string }) {
    const [status, setStatus] = useState('');
    return (
        <>
            <CopyButton
                type="button"
                content={readCode}
                variant="ghost"
                size="xs"
                delay={1500}
                aria-label="Copy code"
                title="Copy code"
                onCopiedChange={(copied) => setStatus(copied ? 'Copied' : '')}
                onClick={() => setStatus('')}
                onCopyError={() =>
                    setStatus(
                        'Copy failed. Select the code and copy it manually.',
                    )
                }
            />
            <span role="status" className="text-xs">
                {status}
            </span>
        </>
    );
}

export function mountCodeCopyButton(
    toolbar: HTMLElement,
    readCode: () => string,
) {
    const host = document.createElement('span');
    host.className = 'inline-flex items-center gap-1.5';
    toolbar.append(host);
    const root = createRoot(host);
    root.render(<CodeCopyButton readCode={readCode} />);
    return {
        destroy() {
            host.remove();
            queueMicrotask(() => root.unmount());
        },
    };
}
