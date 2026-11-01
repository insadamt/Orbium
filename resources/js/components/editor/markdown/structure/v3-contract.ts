// Summary: Reads the shared V3 contract and strictly decodes structural metadata without changing source; depends on the JSON contract and existing Orbium presentation validators.
import contract from '@/lib/editor-v3-contract.json';
import { readOrbiumMetadata } from '../dialect/metadata';

export const v3Contract = contract;
export type V3BlockType = keyof typeof contract.blockTypes;
export type V3Header = { id: string; type: V3BlockType };
export type V3DirectiveMetadata = Record<string, unknown> & { kind: string };
const identityPattern = new RegExp(contract.idPattern);

export function isV3Identity(value: unknown): value is string {
    return (
        typeof value === 'string' && identityPattern.exec(value)?.[0] === value
    );
}

export function isV3BlockType(value: unknown): value is V3BlockType {
    return (
        typeof value === 'string' && Object.hasOwn(contract.blockTypes, value)
    );
}

export function hasInvalidV3Unicode(source: string): boolean {
    for (let index = 0; index < source.length; index++) {
        const code = source.charCodeAt(index);
        if (code >= 0xd800 && code <= 0xdbff) {
            const low = source.charCodeAt(++index);
            if (!(low >= 0xdc00 && low <= 0xdfff)) return true;
        } else if (code >= 0xdc00 && code <= 0xdfff) return true;
    }
    return false;
}

export function decodeV3Object(source: string): Record<string, unknown> {
    if (hasInvalidV3Unicode(source))
        throw new Error('Invalid Unicode in metadata.');
    const value: unknown = JSON.parse(source);
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Structural metadata must be a JSON object.');
    const keys = new Set<string>();
    let depth = 0;
    for (let index = 0; index < source.length; index++) {
        const character = source[index];
        if (character === '{' || character === '[') {
            if (++depth > contract.limits.depth)
                throw new Error('Metadata is nested too deeply.');
        } else if (character === '}' || character === ']') depth--;
        else if (character === '"') {
            const start = index++;
            while (index < source.length && source[index] !== '"') {
                if (source[index] === '\\') index++;
                index++;
            }
            const spelling = source.slice(start, index + 1);
            const decoded: string = JSON.parse(spelling);
            if (hasInvalidV3Unicode(decoded))
                throw new Error('Invalid Unicode in metadata.');
            if (depth === 1 && /^[ \t]*:/.test(source.slice(index + 1))) {
                if (keys.has(decoded))
                    throw new Error('Duplicate metadata keys are not allowed.');
                keys.add(decoded);
            }
        }
    }
    return value as Record<string, unknown>;
}

export function requireV3Keys(value: Record<string, unknown>, keys: string[]) {
    if (
        Object.keys(value).length !== keys.length ||
        keys.some((key) => !Object.hasOwn(value, key))
    )
        throw new Error(
            `Expected exactly these metadata keys: ${keys.join(', ')}.`,
        );
}

export function decodeV3Header(line: string): V3Header {
    const match = /^\+\+block (\{[^\r\n]*\})\+\+[ \t]*$/.exec(line);
    if (!match)
        throw new Error(
            'Expected ++block {"id":"…","type":"…"}++ on one line.',
        );
    const metadata = decodeV3Object(match[1]);
    requireV3Keys(metadata, ['id', 'type']);
    if (!isV3Identity(metadata.id))
        throw new Error(
            'Block IDs require 1–128 ASCII letters, digits, underscores or hyphens, starting with a letter or digit.',
        );
    if (!isV3BlockType(metadata.type))
        throw new Error('Unknown V3 block type.');
    return { id: metadata.id, type: metadata.type };
}

export function decodeV3Directive(json: string): V3DirectiveMetadata {
    const metadata = decodeV3Object(json);
    if (metadata.kind === 'column') {
        requireV3Keys(metadata, ['kind', 'id']);
        if (!isV3Identity(metadata.id))
            throw new Error('A column needs a valid persistent ID.');
    } else if (!readOrbiumMetadata(json)) {
        throw new Error('Invalid Orbium directive metadata.');
    }
    return metadata as V3DirectiveMetadata;
}

export function createV3Identity(): string {
    //
    // Weak/random fallbacks could silently collide in copied or moved structures.
    //
    return crypto.randomUUID();
}

export function encodeV3Header(header: V3Header): string {
    const source = `++block ${JSON.stringify(header)}++`;
    decodeV3Header(source);
    return source;
}
