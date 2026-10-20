# Callout alignment and supported conversion options

Date: 2026-10-20. Status: implemented; manual acceptance pending.

## Findings and changes

The Markdown block menu and mutation handler restricted alignment to paragraphs
and headings. The rich reader and server validator also rejected alignment
wrappers around callouts. All four now support callouts, using the existing
presentation metadata and inherited alignment for title, preview and body editor.
Ordinary quotes retain their existing restrictions.

The shared menu now accepts explicit conversion targets and hides its conversion
submenu when there are none. Markdown menus and conversion commands use the same
capability rules: attachment paragraphs, Mermaid fences and other unsupported
blocks cannot fall through to text conversion just because their syntax nodes
resemble text/code. The current type is omitted from targets. Legacy menus also
restrict conversion to the existing supported writing/code block types.

No migrations or new metadata fields. Server validation now accepts existing
alignment metadata around callouts, so deploy frontend and backend together.
No commit created; no later phase started.

## Validation

- `npm run lint`: passed (formatting and lint).
- `npm run types:check`: passed.
- `npm run build`: passed, with mixed static/dynamic import, large chunk and plugin timing warnings.
- `./vendor/bin/pint --test app/Services/Markdown/OrbiumStructureValidator.php`: passed.
- `php -l app/Services/Markdown/OrbiumStructureValidator.php`: passed.
- `git diff --check`: passed.
- No automated tests written or run, as requested. Manual browser acceptance remains pending.

## Manual checklist

1. In a Markdown Document, insert `/callout` and type two lines of text.
   Open its block menu → Text alignment → Center. Expected: alignment is enabled
   and the callout text centers without changing its outer card width.
2. Select Right, then Left. Expected: the title/body align accordingly. Click
   into the callout and continue typing. Expected: the alignment persists while
   editing and after clicking outside.
3. In Source mode, add a titled folded callout (`> [!WARNING]- Review this`
   followed by `> Check this`), then return to Live Preview. Set its alignment
   to Right, expand it and edit. Expected: title/body align right and the title,
   folding and body remain intact.
4. Undo/redo the alignment change. Expected: the prior/new alignments return.
   Wait for autosave, reload. Expected: alignment and content persist without a
   save validation error.
5. Open menus on a paragraph, heading, bullet/numbered list, checklist, ordinary
   quote, callout and plain fenced code. Expected: supported conversions appear;
   the selected block's existing type is absent from the target list.
6. Convert a right-aligned callout to Text, then undo. Expected: the text retains
   alignment; undo restores the aligned callout. Convert to a list or Quote.
   Expected: the conversion succeeds with the target's supported presentation.
7. Open block menus on an image, uploaded file/audio/video/PDF, table, Mermaid,
   math block and divider. Expected: no conversion submenu; applicable move,
   duplicate, copy, direction and delete actions remain available.
8. Check paragraph/heading alignment. Expected: Left/Center/Right still work.
   If legacy JSON Documents are available, check writing/code menus and rich
   block menus there too: supported writing targets only, with none on rich blocks.

## Commit suggestion

`fix(editor): align callouts and restrict block conversion options`
