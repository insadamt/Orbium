export type OrbiumMetadata = {
    kind?: string;
    dir?: 'auto' | 'ltr' | 'rtl';
    align?: 'left' | 'center' | 'right';
    alignment?: 'start' | 'left' | 'center' | 'right';
    listType?: '1' | 'a' | 'A' | 'i' | 'I';
    caption?: string;
    latex?: string;
    width?: number;
    color?: string;
    underline?: boolean;
    header?: boolean;
    colspan?: number;
    rowspan?: number;
    colwidth?: number[];
    type?: string;
    folding?: string;
};

export function jsonObjectEnd(source: string, start = 0): number | null {
    if (source.length - start > 131072 || source[start] !== '{') return null;
    const stack: string[] = [];
    let quoted = false;
    let escaped = false;
    for (let index = start; index < source.length; index++) {
        const character = source[index];
        if (quoted) {
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === '"') quoted = false;
            continue;
        }
        if (character === '"') quoted = true;
        else if (character === '{' || character === '[') {
            if (stack.length >= 32) return null;
            stack.push(character);
        } else if (character === '}' || character === ']') {
            const opening = stack.pop();
            if (opening !== (character === '}' ? '{' : '[')) return null;
            if (!stack.length) return index + 1;
        }
    }
    return null;
}

function duplicateKeys(source: string): boolean {
    const keys = new Set<string>();
    let depth = 0;
    for (let index = 0; index < source.length; index++) {
        if (source[index] === '{' || source[index] === '[') depth++;
        else if (source[index] === '}' || source[index] === ']') depth--;
        else if (source[index] === '"') {
            const start = index++;
            while (index < source.length && source[index] !== '"') {
                if (source[index] === '\\') index++;
                index++;
            }
            if (depth === 1 && /^\s*:/.test(source.slice(index + 1))) {
                const key = JSON.parse(
                    source.slice(start, index + 1),
                ) as string;
                if (keys.has(key)) return true;
                keys.add(key);
            }
        }
    }
    return false;
}

const allowedKeys: Record<string, string[]> = {
    inline: ['color', 'underline'],
    block: ['kind', 'dir', 'align', 'listType'],
    image: ['kind', 'caption', 'width', 'alignment'],
    empty: ['kind', 'dir', 'align'],
    math: ['kind', 'latex'],
    code: ['kind'],
    table: ['kind'],
    row: ['kind'],
    cell: ['kind', 'align', 'header', 'colspan', 'rowspan', 'colwidth'],
    'inline-math': ['latex'],
};

export function readOrbiumMetadata(
    source: string,
    inlineKind?: 'inline' | 'inline-math',
): OrbiumMetadata | null {
    try {
        if (jsonObjectEnd(source) !== source.length || duplicateKeys(source))
            return null;
        const metadata = JSON.parse(source) as OrbiumMetadata;
        const kind = inlineKind ?? String(metadata.kind);
        const allowed = allowedKeys[kind];
        if (!allowed || !Object.keys(metadata).length) return null;
        for (const [key, value] of Object.entries(metadata)) {
            if (!allowed.includes(key) || value === null) return null;
            if (typeof value === 'string') {
                for (let index = 0; index < value.length; index++) {
                    const code = value.charCodeAt(index);
                    if (code >= 0xd800 && code <= 0xdbff) {
                        const low = value.charCodeAt(++index);
                        if (!(low >= 0xdc00 && low <= 0xdfff)) return null;
                    } else if (code >= 0xdc00 && code <= 0xdfff) return null;
                }
            }
            switch (key) {
                case 'kind':
                    if (typeof value !== 'string') return null;
                    break;
                case 'dir':
                    if (!['auto', 'ltr', 'rtl'].includes(value as string))
                        return null;
                    break;
                case 'align':
                    if (!['left', 'center', 'right'].includes(value as string))
                        return null;
                    break;
                case 'alignment':
                    if (
                        !['start', 'left', 'center', 'right'].includes(
                            value as string,
                        )
                    )
                        return null;
                    break;
                case 'listType':
                    if (
                        typeof value !== 'string' ||
                        !['1', 'a', 'A', 'i', 'I'].includes(value as string)
                    )
                        return null;
                    break;
                case 'caption':
                case 'latex':
                    if (typeof value !== 'string') return null;
                    break;
                case 'header':
                    if (typeof value !== 'boolean') return null;
                    break;
                case 'underline':
                    if (value !== true) return null;
                    break;
                case 'color':
                    if (
                        typeof value !== 'string' ||
                        !/^(?:#[0-9a-f]{6}|preset:(?:charcoal|gray|red|orange|amber|green|teal|blue|purple|pink))$/.test(
                            value,
                        )
                    )
                        return null;
                    break;
                case 'width':
                case 'colspan':
                case 'rowspan':
                    if (
                        !Number.isInteger(value) ||
                        Number(value) <= 0 ||
                        Number(value) > 2147483647
                    )
                        return null;
                    break;
                case 'colwidth':
                    if (
                        !Array.isArray(value) ||
                        !value.length ||
                        value.some(
                            (width) =>
                                !Number.isInteger(width) ||
                                width < 0 ||
                                width > 2147483647,
                        )
                    )
                        return null;
            }
        }
        if (
            (kind === 'math' || kind === 'inline-math') &&
            typeof metadata.latex !== 'string'
        )
            return null;
        if (
            Array.isArray(metadata.colwidth) &&
            metadata.colwidth.length !== (metadata.colspan ?? 1)
        )
            return null;
        return metadata;
    } catch {
        return null;
    }
}

export function serializeOrbiumBlock(
    metadata: OrbiumMetadata,
    body = '',
): string {
    let length = 3;
    for (const line of body.split('\n')) {
        const colons = /^\s*(:{3,})/.exec(line)?.[1].length ?? 0;
        length = Math.max(length, colons + 1);
    }
    const fence = ':'.repeat(length);
    return `${fence}orbium ${JSON.stringify(metadata)}\n${body ? `${body}\n` : ''}${fence}`;
}
