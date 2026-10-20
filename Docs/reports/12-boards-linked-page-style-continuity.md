# Boards phase 4 — Match linked-page preview and edit styling

## Changed

The preview and editing wrappers used different padding and writing widths; editing
also introduced a 52px gutter, a guidance paragraph, a status/action toolbar and a
different header background. These differences shifted content when editing began.

Both surfaces now share outer padding, the reserved inner gutter, base font size and
line height. Previews participate in saved Document style rules. Placeholder paragraph
styles are scoped to placeholder text so they no longer reset rendered paragraphs.
The Markdown editor's save status, retry and actions menu move into the card header
through a hosted-controls context. Standalone Documents keep their existing toolbar.
The guidance stays available to screen readers without adding visible space; the
header background and solid resource outline stay consistent between modes.

No migrations, persistent content changes or commits. No later phase started.

## Validation

- Targeted formatting/lint: passed.
- `npm run lint`: passed; 653 files formatted and 547 linted.
- `npm run types:check`: passed.
- `npm run build`: passed with large-chunk, mixed-import and plugin-timing warnings.
- `git diff --check`: passed.
- No automated tests written or run. Manual visual acceptance remains pending.

## Manual checklist

1. Open a linked Document with paragraphs and headings; note its left edge and wrapping. Enter/leave editing. Expected: matching font size, line height, outer padding and writing width; no extra guidance/status row pushes the Markdown content down.
2. Repeat while scrolled halfway down a long Document. Expected: retained scroll offset with the same writing-column width in both modes.
3. While editing, hover a block and drag its handle. Expected: controls remain accessible in the reserved gutter and reordering saves to the original.
4. Inspect the header during typing and save. Expected: status updates there; the actions menu still offers import, export and Markdown source/Live Preview. Retry appears after a save error.
5. Switch light/dark themes and apply a saved Document paragraph/heading style. Expected: preview and editor use the same saved theme rules for those block types; header background stays consistent.
6. Resize to a narrow card. Expected: title truncates, header actions remain available and writing width remains the same before/after activation.
7. Open a standalone Document. Expected: its status/actions retain their normal placement above the editor.
8. If a legacy Document is available, enter editing. Expected: shared wrapper padding and gutter remain consistent; legacy controls retain their existing implementation.

## Limits

Preview and editor remain separate existing renderers. Active Markdown syntax,
selection, caret, rich-block editing controls, legacy toolbars and save/error notices
remain editing-specific. This change aligns the surfaces and style scope; it does
not replace either renderer or alter saved content. Browser verification is pending.

Suggested commit: `fix(boards): align linked-page preview and editing styles`
