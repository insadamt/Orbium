import { Head, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import EditorStyleDialog from '@/components/editor/styles/editor-style-dialog';
import { customizedBlockCount } from '@/components/editor/styles/style-workspace-options';
import {
    blockStyleTypes,
    normalizeEditorStyles,
    type EditorStyles,
} from '@/components/editor/styles/block-style-types';

export default function EditorStylesSettings() {
    const { editorStyles } = usePage<{ editorStyles: EditorStyles | null }>()
        .props;
    const customizeButton = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const [notice, setNotice] = useState('');
    const saved = normalizeEditorStyles(editorStyles);
    const overrides = blockStyleTypes.filter(([type]) =>
        saved.overrides[type]?.trim(),
    ).length;

    const customized = customizedBlockCount(saved);

    return (
        <div className="max-w-[680px] space-y-6">
            <Head title="Editor styles" />
            <Heading
                variant="small"
                title="Editor styles"
                description="Design your document blocks once, then use the same theme across all your documents."
            />
            <section
                className="editor-style-summary"
                aria-label="Saved editor theme"
            >
                <div>
                    <h2>Your document theme</h2>
                    <p>
                        {saved.enabled ? 'Enabled' : 'Disabled'} ·{' '}
                        {saved.stylesheet.trim()
                            ? 'Custom base stylesheet'
                            : 'Default base styles'}
                    </p>
                    <p>
                        {customized} customized block{' '}
                        {customized === 1 ? 'type' : 'types'} · {overrides}{' '}
                        {overrides === 1 ? 'override' : 'overrides'}
                    </p>
                </div>
                <Button
                    ref={customizeButton}
                    onClick={() => {
                        setNotice('');
                        setOpen(true);
                    }}
                >
                    Customize styles
                </Button>
            </section>
            <p className="text-sm text-muted-foreground">
                Import or write CSS, fine-tune individual blocks, and preview
                before applying. Export your theme to share it.
            </p>
            {notice && (
                <p role="status" className="text-sm text-muted-foreground">
                    {notice}
                </p>
            )}
            {open && (
                <EditorStyleDialog
                    saved={saved}
                    onRestoreFocus={() => customizeButton.current?.focus()}
                    onClose={() => setOpen(false)}
                    onApplied={() => {
                        setOpen(false);
                        setNotice(
                            'Editor styles saved for all your documents.',
                        );
                    }}
                />
            )}
        </div>
    );
}

EditorStylesSettings.layout = {
    breadcrumbs: [{ title: 'Editor styles', href: '/settings/editor-styles' }],
};
