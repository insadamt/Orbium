# M5 review — Mermaid readiness and layout while scrolling

Date: 2026-10-09. Branch: `editor/codemirror-markdown`. Status: implementation complete; user scroll/visual validation pending. Remain in the current M4/M5 editor review. No later phase started.

## Finding

Code inspection found that CodeMirror only registered Mermaid sources when their widget DOM was created. Sources beyond the rendered viewport had no preview job, even though the shared Mermaid session used a larger preparation window. Removing the widget unsubscribed its last element and deleted its preview entry; returning to it could repeat the cache lookup and sanitization. Rich widgets also inherited CodeMirror's unknown-height estimate, so unseen diagrams could change the editor height as they appeared. These are code findings, not measured browser timings.

## Changes

- A dedicated CodeMirror plugin discovers Mermaid sources in background ranges of 8,000 characters, using an 8 ms syntax-parser budget per attempt. Scanning waits 140 ms after edits, pauses for composition/hidden or inactive editors, and cancels timers, idle work, listeners and size observation when destroyed.
- Discovered top-level diagrams receive direct block decorations before their DOM is needed. Nested fenced sources can be prepared without adding overlapping top-level decorations. Literal code directives remain code.
- The document-scoped registry retains prepared SVGs and dimensions across widget removal. A newly mounted widget immediately receives its sanitized preview and dimensions. Completed scans release sources absent from the current scan when they have no mounted subscribers; destroying the document session clears everything.
- Distant jobs can prepare in the background. Visible/nearby jobs retain priority, four concurrent cache lookups and a single local Mermaid render. Background local renders still wait for the scroll and editing pauses. Existing session activity guards, sanitization, per-instance SVG IDs and persistence authorization remain in use.
- Diagram widgets supply responsive height estimates from known SVG dimensions and the measured editor width. Prepared notifications and width changes rebuild estimates through a coalesced frame. Mermaid block margins were removed to follow CodeMirror's block-widget layout contract. Inline height reservation remains responsive.

## Library choice and limits

Reused installed CodeMirror, Mermaid and DOMPurify; no dependency added. Reviewed the official [CodeMirror widget API](https://codemirror.net/docs/ref/#view.WidgetType) and [viewport/update-cycle guide](https://codemirror.net/docs/guide/#viewport). CodeMirror supplies deferred widget DOM, height estimation and measurement scheduling. Our integration must discover sources and provide dimensions; a new observer/rendering library would not solve that missing integration.

An uncached SVG's exact height is unknown until Mermaid finishes. Immediate distant jumps and exceptionally slow diagrams can still show a loading state and first-size adjustment. Widget estimates include the current default frame/toolbar dimensions; custom CSS can alter actual height. Nested diagrams get source preparation where recognized, but their enclosing table/callout layout does not receive independent diagram height estimates. Preparing all document sources uses more document-scoped memory/work than preparing only mounted sources. Rendering remains on the main thread; no FPS or zero-shift guarantee is claimed.

## Validation

- Targeted `vp fmt`: passed.
- `npm run types:check`: passed on the final code.
- `npm run lint`: passed; 356 files correctly formatted, 290 linted without warnings/errors.
- `npm run build`: passed; final build completed in 8.27 seconds. Existing large-chunk and ineffective-dynamic-import warnings remain; the build also reported plugin timing information.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. No PHP changes; PHP checks were not run. No browser interaction or scroll-performance measurement was performed. New/modified source files stay below 500 lines.
- Type checking initially caught an accessor override error; the final widget uses an accessor backed by a captured height estimate and passes.

## Manual test checklist

1. Hard reload the application to load the new build. Open the document where the problem occurred in Live Preview. Start ordinary continuous scrolling once the editor appears. Expected: diagrams prepare ahead of their widget DOM; normally reached prepared diagrams appear with reserved space instead of expanding from a 100 px loading box. Record any diagram that still appears late and whether this is its first render.
2. Scroll several screens past a tall diagram, then return to it twice. Expected: its preview and responsive dimensions survive widget removal; revisiting does not briefly show “Rendering diagram…” or repeat preparation merely because it left the viewport.
3. Reopen the document after its previews have been saved, then scroll down and back. Expected: saved previews prepare without a local Mermaid render and return immediately when their widgets remount.
4. Narrow and widen the browser, then scroll to a previously prepared tall diagram. Expected: diagram fits the available width, shows its full height and remains aligned with following text. Repeat with account editor CSS enabled, noting that custom frame/toolbar spacing can affect estimates.
5. In a disposable document, add a valid Mermaid source, change it to a taller graph, wait for Saved, reload, and undo/redo another edit. Expected: displayed source, dimensions and full preview match the current graph; content and history remain intact. Enter invalid Mermaid, then repair it. Expected: source is preserved, error is readable and valid preview recovers.
6. Switch Source/Live Preview and switch to another tab while preparation is pending, then return. Expected: no stale widget updates or console errors; preparation resumes in the active editor. Type continuously and use IME composition while diagrams are pending. Expected: source scanning waits after edits and rendering retains the existing interaction guards.
7. Put the same source in two diagrams and open each full preview; include a diagram in a supported callout/table and a literal code directive containing Mermaid text. Expected: duplicate SVG IDs remain independent, recognized nested diagrams render, and literal code stays code. Nested container height estimation remains a limitation.
8. Immediately drag the scrollbar to a distant, newly authored complex diagram. Expected: destination preparation takes priority; first uncached rendering may still take time and discover a new height. Scroll away and back after completion. Expected: the prepared preview is reused without the initial loading cycle.

## Commits and stop gate

No commit, push or merge performed. Suggested commit: `fix(editor): prepare Mermaid diagrams before scrolling into view`.

Await the user's manual review; no next migration phase started.
