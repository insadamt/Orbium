Summary: Records the repair for visible inline formatting metadata after deleting text; depends on shared Live Preview installation, the pre-edit Markdown syntax tree and sequential deletion transactions.

# Stage-6 review: empty inline formatting

## Findings and implementation

The screenshot shows an empty inline color wrapper, `:orbium[]{"color":"preset:teal"}`. The dialect intentionally does not parse spans with empty content, so the orphaned wrapper becomes visible prose after the final formatted character is deleted.

An existing transaction filter removed these wrappers in embedded writing commands, but those commands are not installed in the active V3 document owner or its V3 column projections. Extracted that filter into `markdown-empty-formatting-spans.ts` and installed it through `markdownLivePreview`, which all those surfaces already use. Embedded inputs retain the cleanup through their existing Live Preview installation, without installing the filter twice.

Deletion and wrapper cleanup share selection mapping and undo history. Partial deletion keeps formatting around surviving text. Source mode remains raw source editing. No persistence format change or migration; no commit created. Already-saved literal remnants are not rewritten automatically.

## Actual checks

- Focused formatter/linter on all three changed source files: passed.
- `npm run types:check`: passed.
- `npm run build`: passed, with chunk-size, mixed static/dynamic import and plugin-timing warnings.
- `git diff --check`: passed.
- No automated tests or browser automation written or run. Runtime interaction acceptance remains manual.

## Manual checklist

1. Create a paragraph, type a word, select it and apply teal text color. Delete its final characters with Backspace. Expected: a normal empty writing block, with no visible `:orbium` or JSON text.
2. Repeat with Delete, Ctrl+Backspace and selecting the whole colored word followed by Backspace. Expected: the emptied formatting wrapper disappears with the content.
3. Color only part of a sentence, then delete that part. Expected: surrounding uncolored text remains intact. Delete only part of the colored word: surviving letters retain their color.
4. Undo and redo the final-character deletion. Expected: one undo restores the text and color together; redo removes them without revealing metadata.
5. Repeat with underlined text, in a V3 column, a table cell and a Board-hosted Document. Expected: the same cleanup and normal caret behavior in each focused writing surface.
6. Save and reload after deleting formatted text. Expected: no formatting fragment appears and newly typed text saves normally.

## Suggested commit

`fix(editor): clean empty inline formatting in live preview`

Remain in stage-6 manual review.
