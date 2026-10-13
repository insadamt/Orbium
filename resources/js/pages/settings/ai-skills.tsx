import { Head } from '@inertiajs/react';
import { useState } from 'react';
import orbiumDocumentSkill from '../../../skills/create-orbium-documents/SKILL.md?raw';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';

const skillReferences = import.meta.glob<string>(
    '../../../skills/create-orbium-documents/references/*.md',
    { eager: true, query: '?raw', import: 'default' },
);
const completeSkillInstructions = [
    orbiumDocumentSkill,
    ...Object.entries(skillReferences)
        .sort(([firstPath], [secondPath]) =>
            firstPath.localeCompare(secondPath),
        )
        .map(
            ([path, content]) =>
                `\n\n---\n\nReference: ${path.split('/').pop()}\n\n${content}`,
        ),
].join('\n');

export default function AiSkillsSettings() {
    const [, copyToClipboard] = useClipboard();
    const [notice, setNotice] = useState('');
    const [copying, setCopying] = useState(false);

    async function copyDocumentSkill() {
        setCopying(true);
        const copied = await copyToClipboard(completeSkillInstructions);
        setNotice(
            copied
                ? 'Complete instructions copied. Paste them into your AI assistant.'
                : 'Could not copy. Download the skill ZIP or select and copy the instructions below.',
        );
        setCopying(false);
    }

    return (
        <div className="max-w-[680px] space-y-6">
            <Head title="AI skills" />
            <Heading
                variant="small"
                title="AI skills"
                description="Give your AI assistant the instructions to create documents you can import into Orbium."
            />
            <section
                aria-labelledby="document-skill-title"
                className="space-y-4"
            >
                <div className="space-y-2">
                    <h2 id="document-skill-title" className="font-medium">
                        Create Orbium documents
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Create .orbie pages and ZIP packages with linked pages,
                        images, and files. The complete skill includes blocks,
                        colors, styling effects, CSS themes, examples, and usage
                        instructions.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={() => void copyDocumentSkill()}
                        disabled={copying}
                    >
                        {copying ? 'Copying…' : 'Copy skill'}
                    </Button>
                    <Button variant="outline" asChild>
                        <a href="/settings/ai-skills/download" download>
                            Download skill ZIP
                        </a>
                    </Button>
                </div>
                <p role="status" className="text-sm text-muted-foreground">
                    {notice}
                </p>
                <p className="text-sm text-muted-foreground">
                    Extract the ZIP into your assistant’s skills folder, or
                    attach it to an assistant that can read ZIPs. You can also
                    paste the copied instructions into a chat. Ask it to create
                    an Orbium document or package, then import the result from a
                    workspace or folder’s Import menu.
                </p>
                <p className="text-sm text-muted-foreground">
                    The ZIP contains SKILL.md, block and color references, a
                    ready-to-import showcase, and a CSS theme. Import the
                    showcase as a single document; apply CSS separately in
                    Editor styles. The skill ZIP belongs in your assistant.
                </p>
                <details className="space-y-3">
                    <summary className="cursor-pointer text-sm font-medium">
                        Read skill instructions
                    </summary>
                    <textarea
                        aria-label="Orbium document creation skill"
                        readOnly
                        value={completeSkillInstructions}
                        spellCheck={false}
                        className="h-96 w-full rounded-md border bg-background p-3 font-mono text-xs"
                    />
                </details>
            </section>
        </div>
    );
}

AiSkillsSettings.layout = {
    breadcrumbs: [{ title: 'AI skills', href: '/settings/ai-skills' }],
};
