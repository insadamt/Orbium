import {
    readFile,
    readdir,
    mkdir,
    writeFile,
    copyFile,
    rm,
} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as brands from 'simple-icons';

const root = fileURLToPath(new URL('../../', import.meta.url));
const target = path.join(root, 'resources/js/components/inline-icons/data');
const lucideDirectory = path.join(
    root,
    'node_modules/lucide-react/dist/esm/icons',
);
const readJson = async (file) =>
    JSON.parse(await readFile(path.join(root, file), 'utf8'));
const writeJson = async (name, value) =>
    writeFile(path.join(target, name), `${JSON.stringify(value)}\n`);
const catalog = {};
const packs = new Map();
const familySizes = new Map();

function storeGlyph(name, glyph) {
    const family = name.startsWith('brand-') ? 'brands' : 'lucide';
    const count = familySizes.get(family) ?? 0;
    const pack = `${family}-${Math.floor(count / 128)}`;
    familySizes.set(family, count + 1);
    if (!packs.has(pack)) packs.set(pack, {});
    packs.get(pack)[name] = glyph;
    return pack;
}

async function readLucideGlyph(name) {
    const source = await readFile(
        path.join(lucideDirectory, `${name}.js`),
        'utf8',
    );
    const definition = /const __iconNode = ([\s\S]*?);\n/.exec(source);
    if (definition) {
        //
        // Evaluate only the installed package's generated array, never uploaded or remote scripts.
        //
        return vm
            .runInNewContext(definition[1], {}, { timeout: 1000 })
            .map(([tag, attributes]) => [
                tag,
                Object.fromEntries(
                    Object.entries(attributes).filter(([key]) => key !== 'key'),
                ),
            ]);
    }
    const alias = /export \{ default \} from '\.\/([\w-]+)\.js'/.exec(source);
    if (alias) return readLucideGlyph(alias[1]);
    throw new Error(`Unsupported Lucide asset: ${name}`);
}

const iconGroups = [
    ['Arrows', /arrow|chevron|corner|move-|undo|redo/],
    ['Files', /file|folder|archive|clipboard|book|notebook/],
    [
        'Editing',
        /text|type|align|list|heading|bold|italic|underline|pencil|pen-|eraser|paint|palette|highlighter|scissors/,
    ],
    [
        'Media',
        /image|camera|video|film|music|audio|volume|play|pause|mic|headphone|speaker/,
    ],
    [
        'Devices',
        /monitor|laptop|phone|tablet|keyboard|mouse|printer|server|database|cpu|wifi|bluetooth|battery|plug|cable|computer|terminal|code/,
    ],
    [
        'People',
        /user|person|people|contact|hand|accessibility|baby|smile|frown|laugh|angry|annoyed|meh/,
    ],
    [
        'Nature',
        /sun|moon|cloud|snow|rain|wind|flower|leaf|tree|sprout|mountain|waves|flame|bug|bird|fish|cat|dog|rabbit|turtle|squirrel/,
    ],
    [
        'Travel',
        /car|bus|train|tram|plane|ship|boat|bike|truck|rocket|map|navigation|compass|route|tent|luggage/,
    ],
    [
        'Food',
        /apple|banana|cherry|grape|citrus|carrot|salad|sandwich|soup|pizza|beef|egg|croissant|cake|cookie|candy|coffee|cup|beer|wine|utensils/,
    ],
    [
        'Shapes',
        /circle|square|triangle|rectangle|polygon|hexagon|octagon|diamond|pentagon|shapes/,
    ],
    [
        'Commerce',
        /shopping|store|wallet|credit|banknote|coins|dollar|euro|pound|yen|receipt|briefcase|chart/,
    ],
];
const categoryFor = (name) =>
    iconGroups.find(([, expression]) => expression.test(name))?.[0] ??
    'Interface';

for (const file of (await readdir(lucideDirectory))
    .filter((name) => name.endsWith('.js') && name !== 'index.js')
    .sort()) {
    const name = file.slice(0, -3);
    const glyph = await readLucideGlyph(name);
    catalog[name] = {
        label: name.replaceAll('-', ' '),
        group: categoryFor(name),
        family: 'lucide',
        pack: storeGlyph(name, glyph),
    };
}

const brandMetadata = await readJson(
    'node_modules/simple-icons/data/simple-icons.json',
);
const brandBySlug = new Map(brandMetadata.map((icon) => [icon.slug, icon]));
for (const icon of Object.values(brands)) {
    if (!icon?.path || !icon.slug) continue;
    const name = `brand-${icon.slug}`;
    const metadata = brandBySlug.get(icon.slug);
    const aliases = Object.values(metadata?.aliases ?? {})
        .flat(Infinity)
        .filter((value) => typeof value === 'string')
        .join(' ');
    catalog[name] = {
        label: icon.title,
        group: /^[a-z]/i.test(icon.title) ? icon.title[0].toUpperCase() : '#',
        family: 'brands',
        aliases,
        pack: storeGlyph(name, [['path', { d: icon.path }]]),
    };
}

const unicodeSource = await readFile(
    path.join(root, 'resources/data/inline-icons/emoji-test.txt'),
    'utf8',
);
if (!unicodeSource.includes('# Version: 18.0'))
    throw new Error('Expected the pinned Emoji 18.0 catalog.');
const emoji = [];
let group = '';
let subgroup = '';
for (const line of unicodeSource.split('\n')) {
    if (line.startsWith('# group: ')) group = line.slice(9).trim();
    if (line.startsWith('# subgroup: ')) subgroup = line.slice(12).trim();
    const match =
        /^([A-F0-9 ]+)\s*;\s*(fully-qualified|component)\s*#\s*(\S+)\s+E[\d.]+\s+(.+)$/.exec(
            line,
        );
    if (!match) continue;
    const codepoints = match[1]
        .trim()
        .split(/\s+/)
        .map((code) => Number.parseInt(code, 16));
    const value = String.fromCodePoint(...codepoints);
    const tones = [
        ...new Set(
            codepoints
                .filter((code) => code >= 0x1f3fb && code <= 0x1f3ff)
                .map((code) => code - 0x1f3fa),
        ),
    ];
    emoji.push({ value, label: match[4], group, subgroup, tones });
}

const lucidePackage = await readJson('node_modules/lucide-react/package.json');
const brandPackage = await readJson('node_modules/simple-icons/package.json');
const originalNames = await readJson(
    'resources/js/components/inline-icons/builtin-icons.json',
);
for (const name of Object.keys(originalNames)) {
    if (!Object.hasOwn(catalog, name))
        throw new Error(`Previously saved icon is missing: ${name}`);
}
await mkdir(path.join(target, 'glyphs'), { recursive: true });
for (const file of await readdir(path.join(target, 'glyphs'))) {
    if (/^(?:brands|lucide)-[a-f0-9]+\.json$/.test(file))
        await rm(path.join(target, 'glyphs', file));
}
await writeJson('icons.json', catalog);
await writeJson('emoji.json', emoji);
for (const [pack, glyphs] of packs)
    await writeJson(`glyphs/${pack}.json`, glyphs);
await writeJson('manifest.json', {
    emojiVersion: '18.0',
    emojiCount: emoji.length,
    emojiSha256: createHash('sha256').update(unicodeSource).digest('hex'),
    lucideVersion: lucidePackage.version,
    lucideCount: Object.values(catalog).filter(
        (icon) => icon.family === 'lucide',
    ).length,
    brandsVersion: brandPackage.version,
    brandsCount: Object.values(catalog).filter(
        (icon) => icon.family === 'brands',
    ).length,
});
await copyFile(
    path.join(root, 'node_modules/simple-icons/LICENSE.md'),
    path.join(root, 'public/third-party/inline-brands-license.txt'),
);
await copyFile(
    path.join(root, 'node_modules/simple-icons/DISCLAIMER.md'),
    path.join(root, 'public/third-party/inline-brands-disclaimer.md'),
);
await copyFile(
    path.join(root, 'node_modules/simple-icons/data/simple-icons.json'),
    path.join(root, 'public/third-party/inline-brands-sources.json'),
);
process.stdout.write(
    `Generated ${emoji.length} emoji, ${Object.values(catalog).filter((icon) => icon.family === 'lucide').length} Lucide icons and ${Object.values(catalog).filter((icon) => icon.family === 'brands').length} brands in ${packs.size} SVG packs.\n`,
);
