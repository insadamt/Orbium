import { Check, LoaderCircle } from 'lucide-react';
const stages = [
    'Verifying package',
    'Creating documents',
    'Importing images and files',
    'Connecting references',
    'Import complete',
];
export function ImportProgress({ stage }: { stage: string }) {
    const active = stages.findIndex((label) => stage.startsWith(label));
    return (
        <ol
            className="flex flex-col gap-4 py-5"
            aria-label="Import progress"
            aria-live="polite"
        >
            {stages.map((label, index) => (
                <li
                    key={label}
                    className={`flex items-center gap-3 text-sm ${index > active ? 'text-muted-foreground' : ''}`}
                >
                    {index < active || active === stages.length - 1 ? (
                        <Check size={16} aria-hidden />
                    ) : index === active ? (
                        <LoaderCircle
                            size={16}
                            className="animate-spin motion-reduce:animate-none"
                            aria-hidden
                        />
                    ) : (
                        <span
                            className="h-4 w-4 rounded-full border"
                            aria-hidden
                        />
                    )}
                    {index === active ? stage : label}
                </li>
            ))}
        </ol>
    );
}
