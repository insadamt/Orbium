import { Layers3, Square } from 'lucide-react';
import { revealAppearanceFromCenter } from './appearance-reveal';
import {
    selectSurfaceStyle,
    useSurfaceStyle,
    type SurfaceStyle,
} from './surface-preferences';

const options: {
    style: SurfaceStyle;
    title: string;
    description: string;
    icon: typeof Square;
}[] = [
    {
        style: 'normal',
        title: 'Normal',
        description: 'Solid, calm surfaces',
        icon: Square,
    },
    {
        style: 'frosted',
        title: 'Frosted glass',
        description: 'Translucent panels over your background',
        icon: Layers3,
    },
];

export function SurfaceSettings() {
    const selectedStyle = useSurfaceStyle();

    return (
        <section
            className="space-y-4 border-t border-border pt-6"
            aria-labelledby="surface-heading"
        >
            <div>
                <h2 id="surface-heading" className="text-lg font-medium">
                    Surface style
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Choose how panels look throughout this browser.
                </p>
            </div>
            <div
                className="grid gap-2 sm:grid-cols-2"
                role="group"
                aria-label="Surface style"
            >
                {options.map(({ style, title, description, icon: Icon }) => (
                    <button
                        key={style}
                        type="button"
                        aria-pressed={selectedStyle === style}
                        onClick={() =>
                            revealAppearanceFromCenter(() =>
                                selectSurfaceStyle(style),
                            )
                        }
                        className="appearance-choice flex min-h-16 items-center gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <Icon
                            size={19}
                            aria-hidden="true"
                            className="shrink-0 text-muted-foreground"
                        />
                        <span>
                            <span className="block font-medium">{title}</span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                                {description}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
