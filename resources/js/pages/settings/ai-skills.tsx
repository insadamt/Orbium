import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownToLine,
    ArrowUpRight,
    FileArchive,
    FileText,
    Layers3,
    Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const bundleContents = [
    {
        icon: Layers3,
        title: 'Every block, explained',
        description:
            'Text, tables, callouts, code, diagrams, math, and media. Ready for your assistant to use.',
    },
    {
        icon: Palette,
        title: 'Colors & styling',
        description:
            'The full color palette, supported effects, and a starter CSS theme for your documents.',
    },
    {
        icon: FileText,
        title: 'Files that work together',
        description:
            'Instructions for .orbie pages and ZIP packages with linked pages, images, and attachments.',
    },
];

const setupSteps = [
    {
        title: 'Give it to your assistant',
        description:
            'Download the ZIP and add the extracted folder to your assistant’s skills. Or attach the ZIP to an assistant that can read it.',
    },
    {
        title: 'Describe what you want',
        description:
            'Ask for a document or linked-page package. Include any images or files you want it to use.',
    },
    {
        title: 'Bring it into Orbium',
        description:
            'Open a workspace or folder’s Import menu. Choose Single document for .orbie, or Whole package for a document ZIP.',
    },
];

export default function AiSkillsSettings() {
    return (
        <div className="space-y-9">
            <Head title="AI skills" />
            <header className="space-y-1">
                <h2 className="text-base font-medium">AI skills</h2>
                <p className="text-sm text-muted-foreground">
                    Help your assistant create content that feels at home in
                    Orbium.
                </p>
            </header>

            <section
                aria-labelledby="document-skill-title"
                className="rounded-2xl bg-muted/50 p-6 sm:p-8"
            >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-background/70">
                            <FileArchive
                                className="size-6"
                                strokeWidth={1.5}
                                aria-hidden="true"
                            />
                        </div>
                        <div className="min-w-0 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                Orbium authoring skill
                            </p>
                            <h3
                                id="document-skill-title"
                                className="text-2xl font-semibold tracking-tight"
                            >
                                From an idea to a document
                            </h3>
                            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                                One bundle with everything your AI needs to
                                create pages, connect ideas, and style your
                                writing.
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 space-y-2 sm:text-center">
                        <Button
                            asChild
                            size="lg"
                            className="w-full rounded-xl sm:w-auto"
                        >
                            <a href="/settings/ai-skills/download" download>
                                <ArrowDownToLine aria-hidden="true" />
                                Download skill ZIP
                            </a>
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            Includes guides, examples & a theme
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid gap-9 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
                <section aria-labelledby="skill-contents-title">
                    <h3
                        id="skill-contents-title"
                        className="mb-5 text-sm font-medium"
                    >
                        Inside the bundle
                    </h3>
                    <ul className="space-y-6">
                        {bundleContents.map(
                            ({ icon: Icon, title, description }) => (
                                <li key={title} className="flex gap-3">
                                    <Icon
                                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium">
                                            {title}
                                        </h4>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {description}
                                        </p>
                                    </div>
                                </li>
                            ),
                        )}
                    </ul>
                </section>

                <section aria-labelledby="skill-setup-title">
                    <h3
                        id="skill-setup-title"
                        className="mb-5 text-sm font-medium"
                    >
                        Start in three steps
                    </h3>
                    <ol className="space-y-5">
                        {setupSteps.map(({ title, description }, index) => (
                            <li key={title} className="flex gap-3">
                                <span
                                    aria-hidden="true"
                                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                                >
                                    {index + 1}
                                </span>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium">
                                        {title}
                                    </h4>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-6 rounded-xl bg-muted/40 p-4">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Try asking
                        </p>
                        <p className="text-sm leading-relaxed">
                            “Use the Orbium skill to create a project guide with
                            a checklist, a diagram, and linked notes.”
                        </p>
                    </div>
                </section>
            </div>

            <footer className="flex flex-col gap-3 border-t border-border/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                    A showcase page and starter theme are included. Import the
                    .orbie example as a single document, and apply the CSS theme
                    in Editor styles.
                </p>
                <Link
                    href="/settings/editor-styles"
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                >
                    Editor styles
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
            </footer>
        </div>
    );
}

AiSkillsSettings.layout = {
    breadcrumbs: [{ title: 'AI skills', href: '/settings/ai-skills' }],
};
