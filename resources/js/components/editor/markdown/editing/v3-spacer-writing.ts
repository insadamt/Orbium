// Summary: Turns text entered in an empty spacer into checked writable content; depends on Markdown paste normalization and owner operations to preserve identity for ordinary text without admitting text into saved spacers.
import { normalizeV3PastedMarkdown } from './v3-paste-source';
import type { V3BlockOperation } from '../transactions/v3-transaction-types';

export function v3SpacerWritingOperation(
    blockId: string,
    text: string,
): V3BlockOperation | null {
    if (!text) return null;
    const normalized = normalizeV3PastedMarkdown(text);
    //
    // A first # or > keystroke is still a paragraph draft; normal typing shortcuts decide its type when the user adds the next space.
    //
    const inline = text.length === 1 ? text : normalized.inline;
    if (inline !== null)
        return {
            kind: 'replace-block',
            blockId,
            type: 'paragraph',
            body: inline,
            caret: inline.length,
            motion: 'none',
        };
    //
    // A pasted heading, list or multiple paragraphs needs explicit types rather than an invalid paragraph body.
    //
    return normalized.source
        ? {
              kind: 'paste-blocks',
              blockIds: [blockId],
              source: normalized.source,
              motion: 'none',
          }
        : null;
}
