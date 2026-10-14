# Editor review — Fixed TOC rail position

Date: 2026-10-14. User-reported editor correction; no phase advancement.

## Changes

- Removed vertical positioning based on the visible intersection with document content. That calculation moved the rail as the document's beginning/end entered the viewport.
- The rail host now uses fixed positioning, aligned with the document's right edge and vertically centered in the visible pane below the navbar.
- The host is portaled to its own document body, avoiding scroll-container clipping and ancestor transforms. The document gutter remains reserved.
- Scroll listeners capture nested scrolling and handle both the embedded document and parent viewport for same-origin iframe panes. Listener cleanup follows tab visibility as before.
- Updated the editor documentation. No persisted-data changes, dependencies, commit or push.

## Validation

- Targeted `npx vp fmt`: passed for three source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 435 files correctly formatted, 354 files linted without warnings/errors.
- `npm run build`: passed in 11.81 seconds, with chunk-size and ineffective-dynamic-import warnings. Log: `/tmp/orbium-toc-fixed-build.log`.
- `git diff --check`: passed.

No automated tests were written or run, per the user's instructions. Browser interaction and visual acceptance remain pending manual verification.

## Manual checklist

1. Open a long document with H1/H2 headings. Scroll from the beginning to the middle, then the end and back, including with Page Down/Up. Expected: the rail stays at the same vertical screen position, aligned with the document's right edge; the active mark still follows the reading section.
2. Hover the rail, pin the panel and scroll the document. Select a distant heading. Expected: the rail and panel stay fixed, navigation scrolls the document, and the pinned panel remains open. Close or Escape dismisses the panel.
3. Use a document with enough headings to overflow the rail. Scroll directly over the marks. Expected: the rail's contents scroll independently without moving the document or the rail host.
4. Split two long documents and scroll each independently. Repeat after reloading a split that uses a same-origin iframe pane. Expected: each rail stays fixed within its own pane; heading navigation affects only its document.
5. Resize to narrow and short windows, then switch tabs and return. Expected: rails remain aligned with their documents, panels fit available space below the navbar, and hidden tabs leave no floating rail behind.
6. Open a short document with H1/H2 headings, then one without them. Expected: the short document's rail stays fixed when scrolling is possible; the document without headings has no rail. Check reduced motion as well; navigation and active-mark following remain immediate.

## Suggested commit messages

- `fix(editor): keep TOC rail fixed while scrolling documents`
- `fix(editor): anchor outline rails to pane viewports`

Remain in the current editor review pending manual feedback.

## Follow-up — Exact vertical centering

The user reported continued movement and clarified that the rail must stay vertically centered at the edge. The initial fix still centered inside a calculated area below the navbar and retained an iframe-local host.

- The host now uses CSS `top: 50%` and `translateY(-50%)`, with its natural height. Scroll callbacks never write its vertical position or height.
- Same-origin iframe rails portal into the outer page body so the iframe's scrolling cannot carry the rail. Horizontal coordinates include the iframe offset.
- Available rail/panel height is constrained symmetrically around the viewport midpoint. Rail resizing preserves its center.
- Outside-click and focus handling support the outer document and embedded editor document.

Follow-up checks: targeted formatting, `npm run types:check`, `npm run lint` (435 formatted files; 354 linted files), `npm run build`, and `git diff --check` passed. Build emitted chunk-size, ineffective-dynamic-import and plugin-timing advisories. Log: `/tmp/orbium-toc-centered-build.log`. No automated tests were written or run; manual visual acceptance is pending.

### Follow-up manual checklist

1. Reload a long document and scroll from top to bottom and back. Expected: the center of the rail stays exactly halfway down the browser viewport, at the document's right edge.
2. Pin the panel and select headings while scrolling. Expected: the panel stays centered, navigation works, and the pinned panel remains open.
3. Scroll a long rail directly. Expected: only its internal marks move; its outer position stays fixed.
4. Open two split documents, then reload the split to check iframe-backed panes. Scroll each independently. Expected: neither rail moves vertically with its document; each remains aligned with its own document edge.
5. Resize the window and switch tabs. Expected: the rails recenter only when viewport dimensions change; hidden tabs leave no rail behind. Check hover, keyboard focus, outside-click dismissal and reduced motion.

Suggested commit: `fix(editor): lock TOC rails to the viewport midpoint`
