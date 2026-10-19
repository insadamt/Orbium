# Boards — Floating toolbar motion and shared Select

2026-10-19. Boards phase-4 manual review; explicitly requested by the user.

## Implemented

- Board block and native text toolbars enter with a 180ms eased opacity/rise/scale effect, beginning after positioning. Hide, text-priority changes and editor teardown receive a short 120ms fade/downward settle.
- Live controls hide or unmount immediately. A temporary inert, aria-hidden visual snapshot completes the exit without holding editor focus, intercepting clicks or retaining active controls. IDs and Board editor markers are stripped from snapshots. Exits clean themselves up after completion/cancellation; reopening cancels the same toolbar's earlier exit. Reduced motion skips effects and cancels active motion, including closing snapshots.
- The shared toolbar highlight accepts a motion installer so Boards can use the new lifecycle while ordinary Document toolbars retain their existing default. Hover-highlight travel and divider continuity remain shared.
- Replaced the native list-style select with `AppSelect`: the same trigger/menu appearance, selected-value checks and keyboard/pointer behavior used elsewhere in the app. The trigger participates in the toolbar highlight and retains compact sizing with coarse-pointer targets. Existing code-language controls already use AppSelect; no native Board selects remain.

No backend, persistent data, migration or dependency changes. No commits created. No automated tests written or run, per user instructions. Live visual/interaction acceptance remains pending.

## Actual validation

- Targeted `vp fmt`: passed for the changed source files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 643 files formatted and 538 files linted without warnings/errors.
- `npm run build`: passed, exit 0; built in 14.07s. Existing mixed static/dynamic import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed. New motion source is 150 lines; the native editor remains 358 lines.

Logs: `/tmp/orbium-toolbar-motion-select-types.log`, `/tmp/orbium-toolbar-motion-select-lint.log`, `/tmp/orbium-toolbar-motion-select-build.log`. PHP/migration checks do not apply to this frontend-only change.

## Exact manual checklist

1. Select a block near the canvas center, then deselect. Expected: the toolbar fades/rises in after positioning, then fades out briefly instead of disappearing abruptly. Pan/zoom while selected: it follows the block without replaying entrance on every movement.
2. Enter a multiline text block; select text on different lines. Expected: text formatting enters smoothly, block controls immediately stop responding and fade out. Collapse selection: text formatting fades out and block controls return. Repeat with text toolbars above/below the selection near canvas edges.
3. With text selected, press Escape or Ctrl/Cmd+Enter to finish editing. Expected: the text toolbar fades out despite editor teardown, block controls return and the outgoing visual cannot receive clicks or keyboard focus. Rapidly select/deselect and switch blocks; wait a moment. Expected: no stranded toolbar copies, stale opacity or missing controls.
4. Edit a list, open List style and choose Bullets, Numbers and Checklist. Expected: the app's styled menu appears with a check beside the current value; the chosen style updates and the label matches. Navigate with keyboard arrows/Enter and dismiss with Escape. Expected: the select closes correctly and list content remains editable. Change style, wait for Saved and reload: the choice persists.
5. Open the list select near canvas edges, in a narrow window and with a touch pointer. Expected: viewport-bounded menu, readable labels and usable hit targets. Hover between list style and neighboring toolbar controls: the moving highlight remains continuous.
6. Repeat representative opening/closing in light/dark and Normal/Frosted appearances. Enable OS reduced motion before opening, and while motion is active. Expected: immediate toolbar visibility changes with no remaining animated exit surface. Also open text/image toolbars in a standalone Document: existing default behavior remains.
7. Navigate away while a Board toolbar is visible, then return. Expected: outgoing visuals disappear after the brief exit; no stale toolbar remains over the next page and the Board can be edited normally.

## Known limits

Exits are brief visual snapshots, so their content is static during the fade. Browser visual review is required for motion feel, rapid transitions, focus and touch behavior; successful static checks do not establish these results.

## Commit suggestions

- `style(boards): smooth floating toolbar entrance and exit`
- `fix(boards): use shared app select for list styles`

Remain in Boards phase-4 manual review. No later phase started.
