// Summary: Validates and saves canonical Markdown with explicit client capabilities; depends on document limits, CSRF and revision checks.
import { requireValidV3Structure } from './structure/v3-document-file';
import { invalidV3BodyType } from './editing/v3-body-validation';
import { DocumentSaveError } from '../document-save-error';
import type { Text } from '@codemirror/state';
import { csrfToken, documentUrl } from '../editor-api';
import {
    measureEditorAsync,
    measureEditorWork,
} from '@/lib/editor-performance';

export type MarkdownLimits = { source_bytes: number; line_bytes: number };
export type MarkdownSaveRequest = {
    workspaceId: number;
    nodeId: number;
    revision: number;
    source: Text;
    limits: MarkdownLimits;
};

function serializeMarkdown(request: MarkdownSaveRequest): string {
    const markdown = request.source.toString();
    const index = requireValidV3Structure(markdown);
    const invalidBody = invalidV3BodyType(request.source, index);
    if (invalidBody)
        throw new Error(
            `The ${invalidBody.type} block at source line ${request.source.lineAt(invalidBody.from).number} does not match its type. Use its block controls or repair Source mode before saving.`,
        );
    if (
        markdown.includes('\0') ||
        /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
            markdown,
        )
    )
        throw new Error('Markdown must be UTF-8 text without NUL bytes.');
    const encoder = new TextEncoder();
    if (encoder.encode(markdown).length > request.limits.source_bytes)
        throw new Error('Markdown exceeds the 2 MiB source limit.');
    for (let line = 1; line <= request.source.lines; line++) {
        if (
            encoder.encode(request.source.line(line).text).length >
            request.limits.line_bytes
        )
            throw new Error(
                `A Markdown source line exceeds the 128 KiB complexity limit (source line ${line}).`,
            );
    }
    return JSON.stringify({
        markdown,
        revision: request.revision,
        content_format_version: 3,
        editor_features: {
            inline_icons: 2,
            columns: 1,
            stable_blocks: 1,
            spacers: 1,
        },
    });
}

export async function saveMarkdown(
    request: MarkdownSaveRequest,
): Promise<number> {
    const body = measureEditorWork('codemirror.autosave.payload', () =>
        serializeMarkdown(request),
    );
    const response = await measureEditorAsync(
        'codemirror.autosave.request',
        () =>
            fetch(
                `${documentUrl(request.workspaceId, request.nodeId)}/markdown`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body,
                },
            ),
    );
    const result = (await response.json().catch(() => null)) as {
        revision?: number;
        errors?: Record<string, string[]>;
        message?: string;
    } | null;
    if (!response.ok)
        throw new DocumentSaveError(
            result?.errors?.revision?.[0] ??
                result?.errors?.markdown?.[0] ??
                result?.errors?.content_format_version?.[0] ??
                result?.message ??
                'Could not save this document.',
            response.status,
            response.status === 409 ||
                Boolean(
                    result?.errors?.revision ||
                    result?.errors?.content_format_version,
                ),
        );
    if (
        !Number.isSafeInteger(result?.revision) ||
        result?.revision !== request.revision + 1
    )
        throw new Error(
            'The server returned an invalid save response. Reload before saving again.',
        );
    return result.revision;
}
