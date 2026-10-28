import iconData from './data/icons.json';
import emojiData from './data/emoji.json';
export { createBuiltinIcon } from './icon-glyph-loader';
export { default as iconCatalogManifest } from './data/manifest.json';

export type InlineIconChoice =
    | { kind: 'emoji'; value: string; label: string }
    | { kind: 'builtin'; name: string; label: string; color?: string }
    | { kind: 'custom'; attachmentId: number; label: string };
export type IconFamily = 'emoji' | 'lucide' | 'brands';
export type CatalogIcon = {
    choice: InlineIconChoice;
    family: IconFamily;
    group: string;
    search: string;
    tones: number[];
};
export type BuiltinIconMetadata = {
    label: string;
    group: string;
    family: 'lucide' | 'brands';
    aliases?: string;
    pack: string;
};
export const builtinIconMetadata: Record<string, BuiltinIconMetadata> =
    iconData as Record<string, BuiltinIconMetadata>;

export function inlineIconLabel(name: string): string {
    return (
        Array.from(name, (character) => {
            const code = character.codePointAt(0)!;
            return code < 32 || code === 127 ? ' ' : character;
        })
            .slice(0, 160)
            .join('')
            .trim() || 'Custom icon'
    );
}

export function normalizeIconSearch(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[_\-:]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function emojiAliases(label: string): string {
    const matches: string[] = [];
    if (/smil|grin|laugh|joy|beaming/.test(label))
        matches.push('happy smile lol');
    if (/heart|kiss/.test(label)) matches.push('love');
    if (/check mark/.test(label)) matches.push('done complete yes tick');
    if (/thumbs up/.test(label)) matches.push('thumbsup +1 yes like');
    if (/thumbs down/.test(label)) matches.push('thumbsdown -1 no dislike');
    if (/party|confetti|celebration/.test(label))
        matches.push('celebrate birthday');
    if (/face with tears|crying/.test(label)) matches.push('sad cry');
    if (/red circle/.test(label)) matches.push('red dot');
    if (/light bulb/.test(label)) matches.push('lightbulb idea');
    if (/fire/.test(label)) matches.push('hot flame');
    if (/hundred points/.test(label)) matches.push('100 perfect score');
    return matches.join(' ');
}

export const emojiIcons: InlineIconChoice[] = emojiData.map(
    ({ value, label }) => ({ kind: 'emoji', value, label }),
);
export const builtinChoices: InlineIconChoice[] = Object.entries(
    builtinIconMetadata,
).map(([name, metadata]) => ({ kind: 'builtin', name, label: metadata.label }));
export const iconCatalog: CatalogIcon[] = [
    ...emojiData.map((item, index): CatalogIcon => ({
        choice: emojiIcons[index],
        family: 'emoji',
        group: item.group,
        tones: item.tones,
        search: normalizeIconSearch(
            `${item.value} ${item.label} ${item.subgroup} ${emojiAliases(item.label)}`,
        ),
    })),
    ...Object.entries(builtinIconMetadata).map(
        ([name, metadata], index): CatalogIcon => ({
            choice: builtinChoices[index],
            family: metadata.family,
            group: metadata.group,
            tones: [],
            search: normalizeIconSearch(
                `${name.replace(/^brand-/, '')} ${metadata.label} ${metadata.aliases ?? ''}`,
            ),
        }),
    ),
];

export function isBuiltinIcon(name: unknown): name is string {
    return typeof name === 'string' && Object.hasOwn(builtinIconMetadata, name);
}

export function iconChoiceKey(choice: InlineIconChoice): string {
    return `${choice.kind}:${choice.kind === 'emoji' ? choice.value : choice.kind === 'builtin' ? choice.name : choice.attachmentId}`;
}

export function matchesIconSearch(search: string, query: string): boolean {
    const normalized = normalizeIconSearch(query);
    return (
        normalized.split(' ').every((term) => search.includes(term)) ||
        search.replaceAll(' ', '').includes(normalized.replaceAll(' ', ''))
    );
}

export function iconPickerSearchQuery(query: string): string {
    return /^icons?$/i.test(query.trim()) ? '' : query;
}

export function findInlineIcons(query: string): InlineIconChoice[] {
    if (query && !iconPickerSearchQuery(query)) return [];
    const normalized = normalizeIconSearch(query);
    return iconCatalog
        .filter((icon) => matchesIconSearch(icon.search, normalized))
        .map((icon) => {
            const label = normalizeIconSearch(icon.choice.label);
            return {
                choice: icon.choice,
                rank:
                    label === normalized
                        ? 0
                        : label.startsWith(normalized)
                          ? 1
                          : 2,
            };
        })
        .sort((left, right) => left.rank - right.rank)
        .map((match) => match.choice);
}

const emojiValues = new Set(emojiData.map((icon) => icon.value));
export function isCatalogEmoji(value: unknown): value is string {
    return typeof value === 'string' && emojiValues.has(value);
}
