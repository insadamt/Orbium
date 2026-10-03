import {
    NodeViewContent,
    NodeViewWrapper,
    type NodeViewProps,
} from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import LanguageIcon from './language-icon';
import { codeLanguages, normalizeCodeLanguage } from './code-languages';

export default function CodeBlockView({ editor, getPos, node }: NodeViewProps) {
    const language = normalizeCodeLanguage(
        String(node.attrs.language || 'plaintext'),
    );
    const languageOptions = codeLanguages.includes(language)
        ? codeLanguages
        : [...codeLanguages, language];
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

    function selectLanguage(selectedLanguage: string) {
        const position = getPos();
        if (typeof position !== 'number') return;

        editor
            .chain()
            .setTextSelection(position + 1)
            .updateAttributes('codeBlock', { language: selectedLanguage })
            .run();
    }

    return (
        <NodeViewWrapper
            className="my-5 overflow-hidden rounded-xl border border-border bg-muted"
            dir={node.attrs.dir}
        >
            <div
                contentEditable={false}
                className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground"
            >
                <div className="flex items-center gap-2">
                    <LanguageIcon language={language} />
                    <div className="relative flex items-center">
                        <select
                            aria-label="Code language"
                            value={language}
                            onChange={(event) =>
                                selectLanguage(event.currentTarget.value)
                            }
                            className="min-h-7 cursor-pointer appearance-none rounded border-0 bg-transparent py-1 pr-6 pl-2 text-xs text-foreground uppercase outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {languageOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            aria-hidden="true"
                            className="pointer-events-none absolute right-1"
                        />
                    </div>
                </div>
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
            <pre dir="ltr" className="!m-0 !rounded-none !border-0">
                <NodeViewContent<'code'> as="code" />
            </pre>
        </NodeViewWrapper>
    );
}
