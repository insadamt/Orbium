# Editor review — Complete H1/H2 outline rail

Date: 2026-10-12. User-requested refinement within the current editor review.

## Changes

- Both Markdown/CodeMirror and JSON/Tiptap outlines now include only H1 and H2. H3–H6 remain unchanged in document content and are excluded from the rail and panel.
- Removed heading sampling and the twenty-mark cap. Every eligible heading has a mark in document order and a title in the panel.
- The rail grows up to its pane's available viewport height. Overflow scrolls inside the rail with consistent mark spacing, hidden scrollbars and contained wheel/touch scrolling.
- When the reading section changes and its mark reaches the visible edge, the rail smoothly scrolls just enough to show it. Following also responds to rail resizing. Only the rail's own scroll position is changed; neighboring panes and the document are not scrolled by this behavior.
- Reduced motion uses immediate rail following. Existing hover/pin/dismiss behavior and reversible panel transitions remain.
- No dependencies, migrations, persisted-content changes, automated tests, commit or push. Existing unrelated working-tree changes remain separate.

## Validation

- Targeted `npx vp fmt`: passed for all five revised/new feature files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 378 files formatted correctly and 310 linted without warnings/errors.
- `npm run build`: passed in 8.59 seconds, with existing chunk-size and ineffective-dynamic-import warnings. Log: `/tmp/orbium-toc-full-rail-build.log`.
- `git diff --check`: passed.

No automated tests were written or run, as requested. Browser/visual acceptance remains pending. Rendering every heading increases DOM size for exceptionally large outlines; no performance improvement is claimed.

## Manual checklist

1. Create a document with H1, H2, H3 and H4 headings. Open the outline. Expected: only H1/H2 titles and corresponding two-length marks appear; document headings themselves are unchanged. Repeat in an available legacy JSON/Tiptap document.
2. Use more than twenty H1/H2 headings, then enough to exceed viewport height (for example 100). Expected: no headings are omitted; rail marks remain evenly spaced, overflow can be scrolled, and every title appears in the panel.
3. Scroll the document slowly from top to bottom, then back up. Expected: current-section emphasis updates and the rail smoothly follows when its active mark approaches either visible edge. Return above the first heading; expected: the rail returns to its beginning.
4. Scroll the rail directly with wheel/touch. Expected: its overflow scrolls without moving the document or neighboring pane. Resume document scrolling into another section; expected: the rail follows that section again.
5. Open two different documents in split mode and scroll/navigate each. Expected: each rail contains its own full H1/H2 outline and follows only its own reading section. Check a restored same-origin iframe pane as well.
6. Resize to a short viewport while reading near the document's end. Expected: the rail fits below the navbar and brings the current mark into view. Hover, pin, select a title and dismiss; expected: prior interactions and smooth transitions still work.
7. Enable reduced motion and repeat reading/rail following. Expected: immediate rail positioning without smooth scroll or geometric reveal effects.
8. Add/remove/rename H1/H2, convert H2 to H3, save and reload. Expected: the outline updates after editing, H3 disappears from it, and saved document content remains correct. A document containing only H3 has the empty outline state.

## Suggested commit

`feat(editor): show complete H1 and H2 outlines with rail following`

Remain in the current editor review pending manual feedback.
