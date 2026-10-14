# Editor direction, alignment and preview repair report

Date: 2026-10-14

Phase: editor maintenance for the existing document editor. No next phase started.

## Implemented

- Apply CodeMirror direction and explicit text alignment to rendered lines, alongside presentation wrappers. Leave unformatted alignment available to existing editor styles.
- Update direction and alignment on reused empty-paragraph inputs immediately when their metadata changes.
- Cache inferred direction against both document source and parse tree, avoiding results from an earlier partial parse. Neutral lines also consider preceding explicit direction.
- Refresh Markdown wrappers and rich previews synchronously around the actual edited enclosing blocks, rather than relying on the main selection and a later animation frame. Request a bounded parse before building decorations to reduce incomplete-tree source exposure.
- Preserve rich previews during Find navigation and highlight the selected matching block. Previously, selecting a rich-block search result deliberately removed its preview and exposed its canonical Markdown.
- Keep positioned context menus and submenus in LTR independently of block direction. This shared repair covers Markdown and legacy block menus and table action menus.

## Persistence and commits

No migrations, dependency changes, or persisted content-format changes. Existing direction/alignment metadata remains canonical. No commits created.

Suggested commit message:

`fix(editor): repair block direction, alignment and live preview`

Alternative:

`fix(editor): keep formatting and context menus stable during editing`

## Validation results

- `npm exec -- vp fmt <changed source files>`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; formatting passed, no lint warnings or errors.
- `npm run build`: PASS. Warnings: chunks over 500 kB, ineffective dynamic imports, plugin timings. These warnings concern the existing bundle/module layout.
- `git diff --check`: PASS.
- Automated tests: not written or run, following the repository's manual-validation instruction.
- Browser acceptance: pending the user's manual checks below. Source review and build checks do not establish browser acceptance.

## Manual checklist

1. Open a Markdown document in Live Preview. Create two separate paragraphs: `English sample 123` and `مرحبا بالعالم 123`. On each paragraph, open the block menu → Text direction → Right to left, then Left to right, then Auto.
   - Expected: explicit choices change the paragraph's base direction immediately; Auto follows its first strong character. The other paragraph keeps its own direction.
2. On both paragraphs, select Text alignment → Left, Center, then Right. Repeat on a heading, and repeat alignment after changing direction.
   - Expected: all three alignments visibly take effect immediately; alignment and direction work independently. Long lines remain editable and wrap normally.
3. Add an empty paragraph using the block add control. Apply RTL and Center, reopen its menu and switch to LTR and Right, then type `New paragraph`.
   - Expected: the empty writing input immediately reflects each choice; typing replaces it with editable formatted text without exposing `:::orbium` metadata.
4. Wait for Saved and reload. Recheck the formatted paragraphs and heading. Change their formatting, then Undo and Redo.
   - Expected: saved choices survive reload; Undo/Redo restore both text presentation and metadata without visible wrapper source.
5. Create bold/italic text, a heading, list, quote, table, math block and code block. Change formatting, duplicate/move blocks, paste several separate paragraphs, and Undo/Redo. Repeat near the bottom of a long document and scroll away and back.
   - Expected: valid completed Markdown remains rendered in Live Preview; block headers/closing directives and inline formatting markers do not flash into normal prose. Code stays visible within its code editor/preview.
6. Press Ctrl+F and search for text in a table or code block. Navigate matches with Enter and Shift+Enter, then clear the search.
   - Expected: matching rich blocks stay rendered, the selected matching block is highlighted, navigation scrolls to it, and highlighting clears with the query. Find does not expose raw table/fence/directive source.
7. Open block context menus on LTR and RTL paragraphs, lists and tables. Open Turn into, Text alignment and Text direction submenus. Open table row/column menus. Repeat with a legacy rich-text document if available.
   - Expected: menu labels, icons, submenu arrows and keyboard navigation keep the same LTR interface layout regardless of the selected block's direction. Table move operations continue to follow the table's own visual direction.
8. Use the document Source toggle and rich-block Edit source/Preview controls.
   - Expected: explicit source controls still expose editable source when requested and restore the rendered preview afterward.

## Remaining verification

Manual browser verification is required, particularly for long documents, mixed-language caret movement, and rapid edits during scrolling. Parsing stays bounded to avoid unbounded work on each edit. Invalid or incomplete Markdown and explicitly requested source views can still display literal syntax.

Stop after this repair; await user review before moving to another phase.
