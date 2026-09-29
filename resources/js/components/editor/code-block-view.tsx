import {
    NodeViewContent,
    NodeViewWrapper,
    type NodeViewProps,
} from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import LanguageIcon from './language-icon';

const languages = [
    'plaintext',
    'php',
    'javascript',
    'typescript',
    'python',
    'rust',
    'go',
    'java',
    'c',
    'cpp',
    'csharp',
    'html',
    'css',
    'sql',
    'bash',
    'json',
    'yaml',
];

export default function CodeBlockView({
    node,
    updateAttributes,
}: NodeViewProps) {
    const language = String(node.attrs.language || 'plaintext');
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
        'idle',
    );
    const resetStatusTimeout = useRef<number | null>(null);

    useEffect(
        () => () => {
            if (resetStatusTimeout.current !== null)
                window.clearTimeout(resetStatusTimeout.current);
        },
        [],
    );

    function showCopyStatus(status: 'copied' | 'failed') {
        if (resetStatusTimeout.current !== null)
            window.clearTimeout(resetStatusTimeout.current);
        setCopyStatus(status);
        resetStatusTimeout.current = window.setTimeout(() => {
            setCopyStatus('idle');
            resetStatusTimeout.current = null;
        }, 1500);
    }

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(node.textContent);
            showCopyStatus('copied');
        } catch {
            showCopyStatus('failed');
        }
    }

    return (
        <NodeViewWrapper className="my-5 overflow-hidden rounded-xl border border-border bg-muted">
            <div
                contentEditable={false}
                className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground"
            >
                <label className="flex items-center gap-2">
                    <LanguageIcon language={language} />
                    <select
                        aria-label="Code language"
                        value={language}
                        onChange={(event) =>
                            updateAttributes({ language: event.target.value })
                        }
                        className="bg-transparent uppercase outline-none"
                    >
                        {languages.map((name) => (
                            <option key={name} value={name}>
                                {name.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="rounded px-2 py-1 hover:bg-accent"
                    aria-live="polite"
                >
                    {copyStatus === 'copied'
                        ? 'Copied'
                        : copyStatus === 'failed'
                          ? 'Copy failed'
                          : 'Copy'}
                </button>
            </div>
            <pre className="!m-0 !rounded-none !border-0">
                <NodeViewContent<'code'> as="code" />
            </pre>
        </NodeViewWrapper>
    );
}
