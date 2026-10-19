# Boards — Text formatting owns contextual controls

2026-10-19. Boards phase-4 manual review.

## Changes

The user requested that the block toolbar hide whenever text formatting appears and return after text deselection or finishing editing. Native editor selection transactions now drive that priority directly, replacing rectangle intersection and the focused-block-toolbar exception. A nonempty text selection keeps block controls hidden even if panning moves the text toolbar offscreen. A visible caret-based link toolbar also hides block controls. Collapsing selection and dismissing text/link controls restores block controls; editor teardown clears the marker and listeners.

Visibility preserves block-toolbar dimensions and anchoring. No backend, persistence, migrations or dependencies changed. No commits created. No automated tests written or run. Browser interaction acceptance remains pending.

## Validation

- Targeted `vp fmt`: passed for both changed source files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 642 formatted files, 537 linted files without warnings/errors.
- `npm run build`: passed, exit 0; built in 14.98s. Existing mixed static/dynamic import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.

Logs: `/tmp/orbium-text-toolbar-priority-types.log`, `/tmp/orbium-text-toolbar-priority-lint.log`, `/tmp/orbium-text-toolbar-priority-build.log`. PHP/migration checks do not apply to this frontend-only change.

## Manual checklist

1. Edit a multiline text block and select text on the first line, then the last line where the two toolbars would not overlap. Expected: only text formatting is visible in both cases; block controls hide regardless of distance.
2. Apply bold/italic and open/apply a link while keeping text selected. Expected: selected content receives formatting and the block toolbar remains hidden. Pan/zoom with the selection retained: block controls stay hidden even if text controls leave the visible canvas.
3. Click inside the text to collapse selection or press an arrow key. Expected: text formatting closes and the block toolbar returns above the block. Repeat selection/deselection several times: no stuck hidden state.
4. Select text and press Escape or Ctrl/Cmd+Enter to finish editing. Expected: block controls return, including Edit and More; selecting/editing a different block works normally.
5. At a collapsed caret, open Ctrl/Cmd+K. Expected: block controls hide while the link-formatting toolbar is visible, then return after dismissing link controls with no text selected. Repeat representative steps in a list/table, light/dark appearance and reduced motion.

## Commit suggestion

`fix(boards): hide block controls while text formatting is active`

Remain in Boards phase-4 manual review. No later phase started.
