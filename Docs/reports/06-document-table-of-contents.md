# Editor review — Compact table of contents

Date: 2026-10-12. Implemented within the current M5/editor review; manual acceptance pending.

The menu presentation below was superseded by the user's side-panel request. See [the side-panel report](06-document-table-of-contents-panel.md) for current behavior and manual checks.

## Changes

- Added one compact Contents button to the existing controls in both Markdown/CodeMirror and JSON/Tiptap documents. Rich-text controls can wrap in narrow panes.
- The frosted menu lists H1/H2/H3 in document order, with level badges, indentation, heading count, clipped long labels with full-title tooltips, automatic text direction and an empty-state explanation.
- Arrow keys, Home/End, Enter, typeahead, Escape and outside dismissal use the installed Radix menu. Selecting a heading closes the menu and leaves focus in the editor. Switching active/visible tabs dismisses it.
- Each editor owns its outline. Markdown uses its existing scroll-into-view effect; rich text targets its nearest split scroll pane or the standalone window. The target keeps space for floating page controls.
- Markdown reads the complete source through the installed Orbium parser, so offscreen headings are included. Code/math and non-editable directive bodies are excluded; editable heading direction/alignment wrappers remain supported. Formatting is stripped from labels using the existing logical-text reader. Duplicate titles use source positions as distinct keys.
- The outline caches the document snapshot and subscribes to changes only while open. Refresh is debounced by 150 ms; caret movement reuses cached headings. Subscription and timer cleanup handles dismissal and editor destruction.

No dependencies, migrations, persisted heading IDs, content-format or archive-format changes. No commit or push was made. Pre-existing table toolbar/CSS changes were present before this work and were not edited for this feature.

## Library decision

Reviewed [Tiptap Table of Contents](https://tiptap.dev/docs/editor/extensions/functionality/table-of-contents), [Tocbot](https://github.com/tscanlin/tocbot) and the [CodeMirror APIs](https://codemirror.net/docs/ref/). Tiptap's extension would still require a Markdown implementation; Tocbot depends on rendered DOM headings, while CodeMirror renders a viewport subset. The user selected our own solution, using installed editor parsers and Radix UI without adding a dependency.

## Validation

- Targeted `npx vp fmt`: passed for all six feature source files.
- Final `npm run types:check`: passed.
- Final `npm run lint`: passed; 372 files correctly formatted, 305 linted without warnings or errors.
- Final `npm run build`: passed in 8.80 seconds. Existing large-chunk and ineffective-dynamic-import warnings remain. Build output: `/tmp/orbium-toc-build.log`.
- `git diff --check`: passed, including the report and specification update.
- All six feature source files remain below 500 lines.

The first type check caught use of CodeMirror's private destruction flag. Replaced it with the public ViewPlugin lifecycle; the final type check passed. Automated tests were neither written nor run, as instructed. Browser interaction and visual acceptance are left to the user's manual checklist.

## Manual test checklist

Use a disposable Markdown document first. Repeat core navigation checks in an existing JSON/Tiptap document if available.

1. **Three levels:** Enter `# Overview`, `## Setup`, `### Details`, then another H1, separated by paragraphs. Open Contents. Expected: four entries in source order, correct H1/H2/H3 badges and increasing indentation. Choosing each entry closes the menu, reveals its heading below the floating controls and focuses the editor there.
2. **Keyboard:** Tab to Contents and press Enter. Use arrows, Home/End, type the beginning of a heading label, then Enter. Expected: the correct entry receives focus and navigates. Reopen and press Escape. Expected: the menu closes and focus returns to Contents. Click outside; expected: dismissal without a leftover surface.
3. **Editing and duplicate titles:** Give two headings the same title; choose each separately. Rename, add, move and delete headings, then reopen Contents after each change. Expected: distinct correct destinations and the latest text/order, without stale entries. Undo/redo should update the list too.
4. **Markdown semantics:** Include `## **Bold** [Label](https://example.com)`, a Setext heading using an `===` underline, and `#### Fourth level`. Put `# Fake heading` inside a fenced code block and a `$$` math block. Expected: readable heading labels and the Setext H1; no H4 or literal code/math headings.
5. **Heading presentation:** Use a heading's block menu to set alignment and RTL/LTR direction. Expected: it remains listed and navigation still reaches it; RTL labels read correctly. Empty rich-text headings show Untitled heading. A document without headings shows the explanatory empty state.
6. **Split isolation:** Open two documents with different headings in left/right panes and scroll both. Open the left Contents and select a distant heading. Expected: only the left pane scrolls and its editor receives focus. Repeat on the right. Each menu must list only its own document. Test a database document as well.
7. **Tab lifecycle:** Leave Contents open, activate the other split pane or another tab, then return. Expected: the old menu stays dismissed; reopening has the correct headings. Exit and re-enter split mode; expected: correct targets and no orphan menu.
8. **Preview/source and long documents:** Navigate to an offscreen heading near the end of a long document. Toggle Source and Preview and repeat. Expected: complete heading list in both modes, a correct destination and intact body content. A long list scrolls internally without moving its pane when reaching the menu's boundaries.
9. **Responsive/appearance:** Try narrow split panes, a mobile-sized viewport, light/dark themes and Normal/Frosted surfaces. Add a very long heading. Expected: readable, compact controls; bounded menu, truncated label and full title on hover; no horizontal page overflow.
10. **Caret and persistence:** Place the caret under a different heading and reopen Contents. Expected: that editing section is marked current. Merely scrolling does not change this caret-based marker. Edit the document, wait for Saved and reload. Expected: content persists and Contents rebuilds correctly; navigation itself does not introduce content edits or an undo step.

## Limitations

- This is a compact control menu, not a persistent sidebar or an inserted document block. Its current-section indicator follows the caret, not scrolling.
- The outline intentionally includes only H1–H3, and excludes Markdown non-editable directive bodies.
- A changed long Markdown document requires a complete source parse when the menu is next opened. No matched runtime performance or visual measurements were taken in this pass.
- Manual/browser acceptance remains pending; quality checks do not establish interaction correctness.

## Suggested commit

`feat(editor): add compact table of contents for split documents`

Remain in the current editor review phase; wait for manual feedback before starting another phase.
