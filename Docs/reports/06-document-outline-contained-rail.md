# Editor review — Contained document outline rail

Date: 2026-10-12. User-requested refinement within the current editor review; no phase advancement.

## Changes

- The rail host is now mounted inside the document layout rather than portaled to the page body. It follows the document surface's right edge in single-document and split views.
- A 36px gutter reserves space beside document content for the rail.
- The rail displays a portion of long outlines in a container capped at 180px, reduced further when the viewport has less room. All H1/H2 marks remain available through internal scrolling.
- Existing wheel/touch containment, active-section following, hover preview, pinning and heading navigation remain in place.
- Positioning uses the visible intersection of the document and its viewport/pane. The rail stays inside document bounds while scrolling and resizing, including same-origin iframe panes. The expanded panel width also follows the document width.
- Updated the editor documentation. No dependencies, persisted-data changes, automated tests, commit or push.

## Validation

- Targeted `npx vp fmt`: passed for the three revised source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 378 files correctly formatted, 310 linted without warnings/errors.
- `npm run build`: passed in 8.18 seconds. Existing large-chunk and ineffective-dynamic-import warnings remain. Log: `/tmp/orbium-toc-contained-build.log`.
- `git diff --check`: passed.

No automated tests were written or run, per repository instructions. Visual and interaction acceptance is pending user manual testing. Other working-tree changes were preserved.

## Manual checklist

1. Open a long document with at least 40 H1/H2 headings. Expected: the rail sits beside content inside the document surface; it is at most 180px tall and shows only part of the outline. Scroll over the rail with the wheel or touch. Expected: the remaining marks become reachable without scrolling the document.
2. Move the pointer back to document content and scroll from the beginning to the end, then back. Expected: the rail stays attached to the document and its current-section mark follows into the visible rail portion. The rail stays below the navbar.
3. Hover the rail, pin the panel, select a distant heading, then close it. Expected: heading titles remain available, navigation reaches the selected heading, and the panel fits inside the document width. Editing and document scroll position remain usable after closing.
4. Split two different long documents. Scroll each separately and scroll each rail directly. Expected: both rails sit inside their respective document surfaces; marks, active-section following and navigation affect only their own document. Repeat with a document/database split; expected: only the document has a rail.
5. Reload a saved split that loads a same-origin iframe document pane. Scroll and resize it, then select a heading. Expected: the rail remains attached to that document, stays within the visible pane, and navigation scrolls only that pane.
6. Resize to narrow and short windows; try a document with a cover and one with few/no headings. Expected: no content/rail overlap or horizontal overflow; the rail shrinks for short viewports and stays within document bounds. The panel controls remain reachable, and the empty state still works.
7. Enable reduced motion. Scroll the document and navigate from the panel. Expected: active-mark following and heading navigation use immediate movement.

## Suggested commit messages

- `fix(editor): contain outline scrolling within document surfaces`
- `feat(editor): attach compact outline rails to document layouts`

Remain in the current editor review pending manual feedback.
