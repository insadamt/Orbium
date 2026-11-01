// Summary: Encodes/decodes native V3 files losslessly after LF/BOM normalization; depends on explicit structure validation and the shared file/saved-version contract.
import {
    decodeV3Object,
    hasInvalidV3Unicode,
    requireV3Keys,
    v3Contract,
} from './v3-contract';
import { V3DocumentIndex } from './v3-document-index';
import { parseV3Structure } from './v3-structure-parser';

export function requireValidV3Structure(source: string): V3DocumentIndex {
    const index = new V3DocumentIndex(parseV3Structure(source));
    if (!index.valid) {
        const diagnostic = index.structure.diagnostics[0];
        throw new Error(
            `${diagnostic.message} (source line ${diagnostic.line})`,
        );
    }
    return index;
}

function validateTitle(title: unknown): asserts title is string {
    if (
        typeof title !== 'string' ||
        !title.trim() ||
        Array.from(title).length > 255 ||
        /[\0\r\n]/.test(title) ||
        hasInvalidV3Unicode(title)
    )
        throw new Error(
            'The document title must contain 1–255 Unicode characters without line breaks or NUL bytes.',
        );
}

export function encodeV3DocumentFile(title: string, source: string): string {
    validateTitle(title);
    requireValidV3Structure(source);
    return `<!-- orbium-document ${JSON.stringify({ version: v3Contract.fileVersion, title })} -->\n${source}`;
}

export function decodeV3DocumentFile(file: string) {
    const normalized = file.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const newline = normalized.indexOf('\n');
    if (newline < 0 || newline > v3Contract.limits.lineBytes)
        throw new Error(
            'A native V3 document needs a bounded format header followed by a newline.',
        );
    const match = /^<!-- orbium-document (\{[^\r\n]*\}) -->$/.exec(
        normalized.slice(0, newline),
    );
    if (!match)
        throw new Error(
            'The native V3 document envelope is missing or malformed.',
        );
    const metadata = decodeV3Object(match[1]);
    requireV3Keys(metadata, ['version', 'title']);
    if (metadata.version !== v3Contract.fileVersion)
        throw new Error(
            'This file is not a supported V3 document. Historical development files are not converted.',
        );
    validateTitle(metadata.title);
    const source = normalized.slice(newline + 1);
    return {
        title: metadata.title,
        source,
        contentFormatVersion: v3Contract.contentFormatVersion,
        index: requireValidV3Structure(source),
    };
}
