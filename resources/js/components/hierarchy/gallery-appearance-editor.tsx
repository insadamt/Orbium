import { coverRatios, type GalleryAppearance } from './cover-presentation';

export function GalleryAppearanceEditor({
    value,
    onChange,
}: {
    value: GalleryAppearance;
    onChange: (value: GalleryAppearance) => void;
}) {
    return (
        <div className="space-y-4 text-sm">
            <fieldset className="space-y-2">
                <legend className="mb-2 font-medium">Layout</legend>
                <div className="grid grid-cols-2 gap-2">
                    {(['natural', 'uniform'] as const).map((layout) => (
                        <button
                            key={layout}
                            type="button"
                            aria-pressed={value.layout === layout}
                            onClick={() => onChange({ ...value, layout })}
                            className={`rounded-lg border px-3 py-2 capitalize ${value.layout === layout ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/50'}`}
                        >
                            {layout === 'natural'
                                ? 'Natural masonry'
                                : 'Uniform cards'}
                        </button>
                    ))}
                </div>
            </fieldset>
            {value.layout === 'uniform' && (
                <>
                    <fieldset>
                        <legend className="mb-2 font-medium">Card ratio</legend>
                        <div className="grid grid-cols-3 gap-2">
                            {coverRatios.map((ratio) => (
                                <button
                                    key={ratio}
                                    type="button"
                                    aria-pressed={value.ratio === ratio}
                                    onClick={() =>
                                        onChange({ ...value, ratio })
                                    }
                                    className={`rounded-lg border px-3 py-2 ${value.ratio === ratio ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/50'}`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend className="mb-2 font-medium">Image fit</legend>
                        <div className="grid grid-cols-2 gap-2">
                            {(['contain', 'crop'] as const).map((fit) => (
                                <button
                                    key={fit}
                                    type="button"
                                    aria-pressed={value.fit === fit}
                                    onClick={() => onChange({ ...value, fit })}
                                    className={`rounded-lg border px-3 py-2 ${value.fit === fit ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/50'}`}
                                >
                                    {fit === 'contain'
                                        ? 'Show whole'
                                        : 'Crop to fill'}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                </>
            )}
        </div>
    );
}
