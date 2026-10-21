# Board CPU follow-up — unresolved thermal review

2026-10-21. The user reports the preceding preview-reuse change made no observable
difference and CPU/temperature still spike. This is negative acceptance feedback;
neither that pass nor this follow-up establishes a measured thermal improvement.
Continue the existing Board phase-4 review.

## Changes and evidence

- Source inspection showed native plain tables exported to Markdown, parsed the
  table, then instantiated/parser-processed each individual cell through
  `renderRichBody` on every mount. Native rows with no marks and no `table_source`
  now append literal text/hard breaks into the same Document-style table DOM.
  Each 8 × 4 stress table avoids its table parse plus 32 cell parses. This is an
  operation-count observation, not a timing result. Marked/source-backed rich
  tables preserve their existing path, editing and shared fullscreen control.
- Automatic height observation no longer depends on `object.height` or the whole
  immutable `data` object. It therefore avoids disconnect/re-observe/immediate
  measurement after its own derived writes and every content update. Actual
  content resize, width, scale, kind, editing mode and blocked-state transitions
  still trigger the required measurement. Derived sizing still adds no history.
- Scheduler selection scans once for the best runnable job rather than allocating,
  filtering and sorting a full list on every dispatch. Priority, aging, lane
  limits and FIFO tie-breaking remain. Input deferral uses 16ms retries within
  the existing 120ms bound instead of zero-delay polling.
- Pending Board preview jobs pause while the browser document is hidden and
  resume on visibility. Already-running work may complete; this does not promise
  that all app/browser activity stops in the background.
- Reusing a Mermaid result no longer repeats its complete SVG color rewriting.
  A WeakMap retains the color-adapted string while its prepared preview survives.
  Fresh instance IDs and live theme CSS variables remain. The prepared-cache byte
  budgets estimate their stored strings, not total browser/DOM/weak-cache memory.

## Runtime investigation and comparison setup

- `public/hot` currently points to `http://[::1]:5173`: the ordinary local app uses
  development assets even after `npm run build`. This is not proof that development
  overhead explains the reported spikes.
- Desktop tools could list the Helium window showing the stress Board, but window
  focus failed and screenshot capture was unavailable. No gesture or foreground
  Performance trace was captured. An aggregate browser process CPU read while
  Codex was focused cannot be attributed to this Board and is excluded from
  performance acceptance. No temperature measurement was collected.
- Started a temporary local PHP server on `127.0.0.1:8001`, using the same app and
  data with a temporary router that overrides only Vite's hot-file lookup for
  that server. The ordinary server, `.env`, `public/hot` and source settings stay
  intact. This is a built-frontend comparison, not a production backend deployment.
- Read the comparison login page: HTTP 200, script URLs under `/build/assets/`.
  No browser acceptance is inferred from reading that page.
- [Open the same stress Board with built assets](http://localhost:8001/workspaces/1/boards/154).
  Sign in normally if necessary. The temporary server must remain running.
  Router: `/tmp/orbium-built-frontend-router.php`; process is the task's PHP server
  session. To restart it locally:

  ```bash
  php -S 127.0.0.1:8001 -t public /tmp/orbium-built-frontend-router.php
  ```

  Run from the project root. The temporary router is not committed application
  configuration and may disappear when temporary files are cleaned.

## Actual checks

- Changed-source `vp fmt`: passed.
- `npm run lint`: passed; 680 formatted files, 572 linted files, no warnings/errors.
- `npm run types:check`: final run passed (exit 0). An initial nullable-table
  diagnostic was corrected before the final run.
- `npm run build`: final run passed (15.95 seconds). Existing large chunks,
  mixed static/dynamic imports and plugin timing warnings remain.
- Temporary router PHP syntax: passed.
- `git diff --check`: passed.
- Changed source files remain under 500 lines. No automated tests written/run.

## Manual checklist and required next evidence

1. Open the built-frontend link at the same viewport, theme and 100% Board zoom.
   Pan/zoom along the same route used on port 8000. Expect the same content and
   controls; record whether the original delay/CPU spike persists. Do not infer
   thermal resolution from a faster-looking interaction or one run.
2. On a native plain table, check first-row headers, literal Markdown characters,
   empty cells, hard breaks and fullscreen. Enter editing, format a cell, insert
   rows, finish, undo/redo, wait for Saved and reload. Expect preserved content and
   ordinary rich behavior after the table acquires Document source.
3. Type until a paragraph wraps, then delete back to one line. Side-resize, corner
   scale, edit formulas/diagrams and zoom. Expect height growth/shrinkage and tight
   selection borders with no extra sizing history steps.
4. While a region has pending previews, switch to another browser tab and return.
   Expect pending Board jobs to resume and no stuck surfaces. In-flight work can
   finish in the background. Check that original Document editing still saves.
5. Revisit a prepared diagram, open fullscreen and switch theme. Expect fresh SVG
   IDs/working controls and correct colors on both Board and standalone Documents.
6. If the CPU spike remains, open DevTools → Performance, record the actual bad
   pan/zoom/arrival interaction for about ten seconds, stop and save the recording.
   Also capture a separate ten-second foreground idle recording after content has
   settled. Keep build, scene, viewport and background settings the same. Share
   the saved recordings for attribution of scripting versus layout/paint/raster.

Further structural/media-quality changes require that foreground evidence. The
optional question about whether spikes occur during pan/zoom, initial appearance
or foreground idle remains useful context; no answer was assumed as a measurement.

## Commit suggestion

`perf(boards): remove repeated parsing and preview scheduling work`
