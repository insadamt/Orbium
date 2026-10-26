import iconData from './data/icons.json';

type Glyph = [string, Record<string, string>][];
type GlyphPack = Record<string, Glyph>;
const metadata = iconData as Record<string, { family: string; pack: string }>;
const packLoaders = import.meta.glob<{ default: GlyphPack }>(
    './data/glyphs/*.json',
);
const pendingPacks = new Map<string, Promise<GlyphPack>>();
const warmPacks = new Map<string, GlyphPack>();
const namespace = 'http://www.w3.org/2000/svg';

function loadGlyphPack(pack: string): Promise<GlyphPack> {
    const pending = pendingPacks.get(pack);
    if (pending) return pending;
    const loader = packLoaders[`./data/glyphs/${pack}.json`];
    if (!loader)
        return Promise.reject(
            new Error('Icon assets are unavailable. Reload Orbium.'),
        );
    const request = loader()
        .then((module) => {
            warmPacks.set(pack, module.default);
            return module.default;
        })
        .catch((error: unknown) => {
            pendingPacks.delete(pack);
            throw error;
        });
    pendingPacks.set(pack, request);
    return request;
}

function paintGlyph(svg: SVGSVGElement, glyph: Glyph) {
    const children = glyph.map(([tag, attributes]) => {
        const child = document.createElementNS(namespace, tag);
        for (const [key, value] of Object.entries(attributes))
            child.setAttribute(key, value);
        return child;
    });
    svg.replaceChildren(...children);
    svg.removeAttribute('data-icon-loading');
    svg.removeAttribute('aria-busy');
}

export function createBuiltinIcon(name: string): SVGSVGElement | null {
    if (!Object.hasOwn(metadata, name)) return null;
    const icon = metadata[name];
    if (!icon) return null;
    const svg = document.createElementNS(namespace, 'svg');
    const brand = icon.family === 'brands';
    for (const [key, value] of Object.entries({
        viewBox: '0 0 24 24',
        fill: brand ? 'currentColor' : 'none',
        stroke: brand ? 'none' : 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
    }))
        svg.setAttribute(key, value);
    const warm = warmPacks.get(icon.pack)?.[name];
    if (warm) paintGlyph(svg, warm);
    else {
        //
        // Keep thousands of brand paths out of the editor's initial bundle and paint only mounted cells.
        //
        svg.dataset.iconLoading = '';
        svg.setAttribute('aria-busy', 'true');
        const placeholder = document.createElementNS(namespace, 'circle');
        placeholder.setAttribute('cx', '12');
        placeholder.setAttribute('cy', '12');
        placeholder.setAttribute('r', '4');
        placeholder.setAttribute('fill', 'currentColor');
        svg.append(placeholder);
        void loadGlyphPack(icon.pack)
            .then((pack) => {
                if (pack[name]) paintGlyph(svg, pack[name]);
            })
            .catch(() => {
                svg.dataset.iconUnavailable = '';
                svg.removeAttribute('aria-busy');
            });
    }
    return svg;
}
