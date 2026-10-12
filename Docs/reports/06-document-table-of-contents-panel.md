# Editor review — Contents side panel

Date: 2026-10-12. Changes requested during the current editor review; no phase advancement.

This side-panel presentation was superseded by the user's full-document outline and animation request. See [the animated outline report](06-document-table-of-contents-motion.md) for current behavior and checks.

## Changes

- Replaced the popup menu with a compact, sticky right-side navigation panel in both editor formats. Selecting headings keeps the panel open and focuses the document.
- Removed all visible H1/H2/H3 badges and the heading count. Hierarchy uses increasing indentation, stronger top-level titles and section spacing. Long titles wrap; RTL text retains automatic direction. The caret's section has a slim active marker.
- At an editor width of at least 640 px, the panel initially opens in a 196 px side column with a 24 px gap. Narrow split panes/mobile start collapsed and open a bounded panel over the document's right edge. Its Close button and Contents toggle restore the full writing area.
- The panel sticks 96 px below the viewport top and has an independently scrolling list. Both visible split panes may retain panels; activating the other pane does not close the first panel. Hidden documents suspend outline updates, preserving their explicit show/hide choice until the editor is destroyed.
- Buttons support Tab/Enter, arrow keys and Home/End. Escape while focus is inside the panel closes it and returns focus to Contents. Clicking outside keeps the side panel open.
- Reused the existing heading extraction, snapshot cache, 150 ms debounce and pane navigation. No dependencies, data migrations or format changes. No automated tests, commit or push.

## Validation

- Targeted `npx vp fmt`: passed for all six revised/new source and CSS files.
- Final `npm run types:check`: passed.
- Final `npm run lint`: passed; all 374 checked files correctly formatted, 306 linted with no warnings/errors.
- Final `npm run build`: passed in 8.67 seconds; existing chunk-size and ineffective-dynamic-import warnings remain. Output: `/tmp/orbium-toc-panel-build.log`.
- `git diff --check`: passed, including documentation.
- Modified/new feature source files remain below 500 lines.

Automated tests were neither written nor run. Browser/visual acceptance is pending the manual review below.

## Manual checklist

1. **Wide document:** Reload a document with three heading levels in an editor area at least 640 px wide. Expected: Contents is visible on the right; no H1/H2/H3 prefixes or count. Main sections have stronger text, child headings are indented, and a long title wraps.
2. **Navigation:** Select several headings, including one far below the viewport and a duplicate title. Expected: the correct heading appears below the floating controls, the editor receives focus, the panel remains open, and the active marker updates after the debounce.
3. **Sticky/list scrolling:** Scroll a long document and a long outline list. Expected: the panel stays below floating controls while within the editor area; the outline scrolls internally and does not move the other pane at its boundaries.
4. **Hide/show:** Use Close and then Contents. Expected: hiding restores the writing width and reopening restores the panel. Click into the editor or outside the panel. Expected: the panel remains visible. Change headings while it is open; expected: labels/order update after roughly 150 ms without a manual reopen.
5. **Keyboard:** Tab to a heading, use Up/Down, Home/End and Enter. Expected: focus moves through headings and Enter navigates while retaining the panel. Reopen/focus the panel and press Escape. Expected: the panel closes and Contents receives focus. Normal editor arrow keys/Escape retain their existing behavior.
6. **Narrow split panes:** Open two different documents in split mode. Expected: narrow editors start collapsed. Open each Contents panel; it overlays only its own document's right edge and stays within the pane. Navigate in one pane; expected: only that pane scrolls, with no headings from the other document. Close the overlay to continue writing with full width.
7. **Retained state:** Keep both split panels open and activate each pane. Expected: neither panel disappears merely because the other pane is active. Switch to a different tab and back; expected: the former tab's explicit show/hide state returns, without an orphan surface on the other tab. Exit split mode and resize; expected: the panel switches between reserved-column and overlay layouts.
8. **Appearance:** Compare light/dark, Normal/Frosted, RTL labels and a mobile-sized viewport. Expected: readable text, clear indentation/active marker, contained wrapped titles, reachable Close button and no horizontal page overflow.
9. **Editor formats/source:** Repeat basic navigation in a legacy JSON/Tiptap document if available and in Markdown Source/Preview. Expected: matching panel behavior, real headings only, correct destinations and unchanged document content. Save edits and reload; expected: headings rebuild from saved content. Show/hide preference itself is not persisted across reloads.

## Limitations

- Narrow layouts intentionally overlay part of the document while the panel is open; Close restores unobstructed writing.
- Current-section highlighting follows the caret, not scroll position. Heading extraction still parses a changed full Markdown snapshot while the panel is visible.
- Interactive/visual correctness has not been established by browser checks in this pass.

## Suggested commit

`feat(editor): present document contents in a compact side panel`

Remain in the current editor review and wait for manual feedback before the next phase.
