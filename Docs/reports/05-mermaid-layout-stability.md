# Phase 5 review — stable Mermaid preview height

Date: 2026-10-05. Follow-up to [scroll preparation](05-mermaid-scroll-preparation.md). Remain in Phase 5. No commits created.

## Cause and change

The user reported blocks being pushed while reaching a tall diagram. Unmounted previews reserved only 100 pixels. Browser inspection found a rendered diagram approximately 1,750 pixels tall, so inserting its SVG could significantly expand the document. This is a layout change, separate from the render-duration and scheduling issues in the earlier reports.

Prepared sources now publish their SVG dimensions before mounting. All copies of that source reserve space, including distant copies whose SVG remains unmounted. The output uses responsive CSS `aspect-ratio`, the SVG's intrinsic dimensions, and its existing maximum width. Tall diagrams retain their full height; they are not cropped into a fixed-height viewer. SVG insertion uses the same width/height relationship as its placeholder.

- `mermaid-preview-layout.ts` reads the sanitized SVG's `viewBox`, with positive pixel width/height fallbacks, and applies/removes the responsive reservation. Parsing happens once per prepared source, rather than once per copy. Invalid or unavailable dimensions leave the existing minimum-height fallback.
- `mermaid-preview-entry.ts` defines explicit preview-update and dimension DTOs and a reservation phase.
- `mermaid-preview-session.ts` computes dimensions after sanitization and queues reservation before display. New subscribers reuse known dimensions. Dimensions stay in the document-scoped session; document JSON, cache API payloads, and database schema are unchanged.
- `mermaid-preview-display.ts` publishes reservation to every copy in a scheduled frame before SVG mounting. Selection, dragging, and composition suspension apply to this phase too. Existing source-error behavior remains recoverable.
- `mermaid-preparation-scheduling.ts` schedules reservation and display through animation frames independently of local renders.
- `mermaid-view.tsx` reserves the preview box, preserves its last reservation while a changed source prepares, and clears it on rendering errors. SVG children use responsive block layout.

No new library was added. Reviewed the browser's [CSS aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/aspect-ratio) and [SVG viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox) APIs. These fit this existing SVG rendering workflow; a new layout library would not supply unknown Mermaid dimensions. Existing Mermaid and DOMPurify remain responsible for rendering and sanitization.

## Browser evidence

Read-only review used the existing `test` document, workspace 1/node 58. No source or document text was changed. Before rebuilding, distant unmounted previews had 100-pixel boxes. The rendered tall source occupied 1,750.359375 pixels.

After reloading the production build, all 70 previews eventually received dimension reservations while distant SVGs stayed unmounted. Tall distant copies, including indices 26, 51, and 66, reserved 1,750.359375 pixels. Scrolling into the first two diagrams produced:

| Preview | Reserved, SVG absent | SVG mounted | Height change |
| --- | --- | --- | --- |
| First | 567.59375 px | 567.59375 px | 0 px |
| Second, tall | 1,750.359375 px | 1,750.359375 px | 0 px |

These are actual DOM box measurements at the same browser width. They establish that mounting these prepared SVGs does not expand their preview boxes. They are not a scroll-FPS, full layout-shift trace, or cold-render benchmark.

## Limits

The exact size is unavailable before an uncached source finishes rendering. Its initial reservation can therefore still grow when dimensions first become known, especially on an immediate jump to an unprepared section. Predictive preparation moves that sizing work ahead of arrival during ordinary reading. A source edit that changes intrinsic size also legitimately changes layout. Unsupported dimension metadata retains the 100-pixel fallback.

## Validation

- Targeted `vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 225 files formatted correctly, 164 linted without warnings/errors.
- `npm run build`: passed in 4.97 seconds; existing large-chunk warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. No PHP changed. New source files remain below 500 lines; the session is 498 lines.

## Exact manual checklist

1. Hard reload, open the large document, and scroll normally into a tall diagram. Expected: its space is reserved before the SVG mounts; following blocks do not move downward merely because the SVG appeared.
2. Scroll further into duplicate tall sources, then scroll backward. Expected: distant copies already reserve the same responsive height and display without an insertion-size jump.
3. Narrow and widen the browser window. Expected: placeholder and SVG fit the same available width and proportional height; full tall diagrams remain readable and are not vertically clipped.
4. In a disposable document, change a diagram to a taller valid source, try invalid source, and recover it. Switch Edit/Preview, undo/redo, save, and reload. Expected: source persists, new dimensions follow the valid source, and syntax errors clear obsolete large empty reservations.
5. Create an uncached source and immediately jump to it. Expected: rendering remains independent of editing. Its first size discovery can still change layout; subsequent mounting uses the reserved dimensions. Repeat after caching to verify the ordinary prepared path.
6. Select text across blocks or drag while diagrams are pending, then navigate away and reopen. Expected: scheduled reservations respect interaction suspension and no previous-document updates survive destruction.

Suggested commit: `fix(editor): reserve Mermaid preview height before mounting`
