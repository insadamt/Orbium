# Phase 5 review — remaining document scroll stalls

Date: 2026-10-05. Follow-up to [stable preview heights](05-mermaid-layout-stability.md). Remain in Phase 5. No commits created.

## Findings

The existing `test` document (workspace 1/node 58) still incurred layout work when new diagram SVGs were inserted. Reserving diagram heights fixed expansion but did not eliminate style recalculation and synchronous geometry reads.

Two implementation paths contributed:

- Split-pane styling used `html:has(.orbium-embedded-pane) *`, including scrollbar pseudo-elements. This asks the browser to infer frame state from descendants across a large, changing document, even on an ordinary document page. Frame membership is already known by the application.
- After inserting an SVG or publishing reservations, the Mermaid scheduler immediately ranked the remaining jobs with `getBoundingClientRect()`. Reading geometry after a DOM write forces the browser to resolve the pending layout synchronously.

The first diagnostic implementation also rewrote its JSON script after every sample. That amplified forced layout during scrolling. Those initial timings are discarded as a production baseline. Guarding unchanged table-width writes alone did not materially improve that experiment; it is retained only to avoid unnecessary writes.

## Changes

- `app-layout.tsx` sets an explicit `orbium-embedded-document` class on the frame's document root before paint, with cleanup when the layout unmounts. `split-workspace.css` uses that state for the existing transparent background and hidden scrollbars instead of descendant searches from `html`.
- `mermaid-preview-session.ts` waits until the next animation frame before ranking again after reservation or SVG insertion. Intermediate scheduling requests coalesce into that frame, which is cancelled on session destruction. This lets the browser process the write before the next geometry read.
- `mermaid-preparation-priority.ts` extracts and measures the existing ranking flow, keeping the session below 500 lines.
- `table-controls.tsx` measures geometry in profiling builds and avoids setting an unchanged inherited width variable.
- `editor-scroll-performance.ts` records bounded scroll frame intervals and long-animation-frame script/forced-layout timings where supported. `editor-performance.ts` publishes diagnostic DOM only after 250 ms of quiet instead of after every sample. A completed-capture attribute distinguishes settled scroll samples from old output. Profiling remains enabled only in development or an explicit profiling build.

Predictive distance, scroll-direction priority, cached-source reuse, height reservations, interaction suspension, lookup/persistence concurrency limits, and serial local rendering remain as in the preceding Mermaid reports. The added frame introduces a small scheduling delay between insertions to avoid doing layout work within the insertion callback. Document content and cache formats are unchanged.

## Library/API choice

No dependency is needed for this bug. The existing React layout knows whether it is embedded, and the browser already supplies animation-frame scheduling. MDN specifically warns that broad [`:has()` anchors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has#performance_considerations) can require expensive rechecking on DOM mutations. Explicit application state removes that inference here.

The diagnostic uses the browser's [Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames), which can attribute forced style/layout to script callbacks. It reports only long frames and sufficiently long scripts, and availability varies, so support is detected. This is local diagnostic evidence, not an end-user monitoring service or an FPS guarantee.

## Browser observations and limits

Read-only profiling used the actual existing document; no title, source, or document text was edited. The corrected, quiet-output baseline had all 70 previews reserved before the sampled scroll gestures.

| Observed diagnostic | Quiet baseline | Explicit frame CSS | CSS plus deferred ranking |
| --- | --- | --- | --- |
| Forced layout in reported animation callbacks, first section | 75.0–88.6 ms | 19.0–20.7 ms | 9.4 ms |
| Forced layout in reported animation callbacks, next section | 74.3–74.8 ms | 17.3 ms | 10.3 ms |
| Worst measured Mermaid ranking, first / next section | 0.4 / 0.3 ms | 21.0 / 17.6 ms | 2.4 / 2.5 ms |

These are actual callback/work durations from the recorded samples, not equivalent scroll-FPS benchmarks. Browser focus and frame cadence changed during later runs; some later frame intervals approached one second, and preparation was still ongoing at the start of the first changed-build gesture. The callback counts also differed. Do not derive a percentage improvement or smoothness guarantee from this table. The baseline ranking measurement was short because the expensive flush was attributed elsewhere in that callback; it does not imply the baseline avoided forced layout.

The quiet baseline's median frame interval was 16.6–16.7 ms, with occasional 77.6–98.2 ms intervals. The later cadence makes a final before/after frame-interval comparison unsuitable. Foreground manual scrolling is still the acceptance check.

After the final diagnostic gestures, all 70 previews had reservations. The first preview measured 567.59375 px and the tall second preview 1,750.359375 px with their SVGs mounted, matching the prior height-stability review. Full tall diagrams retain their height.

Remaining limits: a new uncached source still needs a non-interruptible Mermaid render; its dimensions are unknown until prepared. The complete ProseMirror document remains mounted. Background tabs can throttle frame scheduling. This change does not virtualize editable content or alter persistence.

## Validation

- Targeted `vp fmt`: passed for all seven changed source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; all 227 files formatted correctly, 166 linted without warnings/errors.
- `./vendor/bin/pint --test`: passed.
- Profiling builds: passed. Final `npm run build`: passed in 6.54 seconds; existing large-chunk warnings remain.
- `git diff --check`: passed.
- Browser reloaded the final normal build; profiling output is absent and the top-level page has no embedded-document root class.

No automated tests written or run, as instructed. All changed source files remain below 500 lines. Split-pane interaction and final foreground scroll feel require the manual checks below.

## Exact manual checklist

1. Hard reload Orbium and open the existing large `test` document. Scroll steadily through several new diagrams, then reverse direction. Expected: content remains responsive, diagrams prepare ahead during ordinary reading, and SVG insertion does not push the following blocks. Repeat a fast scroll to a distant section; an unprepared source may still briefly show its preparing state.
2. Repeat with the browser focused and after switching away and back. Expected: foreground scrolling remains usable and pending diagram work resumes after returning. Judge responsiveness in the foreground; background frame throttling is expected.
3. In a disposable document, edit a Mermaid source, switch Edit/Preview, try invalid syntax, recover it, undo/redo, save, and reload. Expected: source and previews remain correct, errors recover, and height reservations follow the valid source.
4. Select text across blocks and drag a block while diagrams are pending, then navigate away and reopen. Expected: preparation respects the existing interaction suspension, and destroyed sessions do not insert old previews.
5. Split two document/database tabs. Scroll each side independently, switch to another tab, return, and end the split. Expected: pane backgrounds stay transparent, pane scrollbars stay hidden, preserved pages retain their scroll, and the ordinary page scrolls normally after ending the split. Repeat in Normal/Frosted surfaces and Light/Dark modes.
6. Select a table cell, scroll and resize, then use Add row/Add column in a disposable document. Expected: controls remain aligned and functional, including RTL tables and narrow panes.

Suggested commit: `perf(editor): reduce layout work while scrolling diagrams`
