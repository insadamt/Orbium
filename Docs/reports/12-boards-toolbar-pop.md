# Boards — Floating toolbar pop

2026-10-19. Requested refinement within Boards phase-4 manual review.

## Implemented

Board block and native text-formatting toolbars pop out from 92% to full size with an eased 180ms fade when opening, and pop in with a 120ms shrink/fade when hidden. Independent CSS scale leaves layout measurements and camera coordinates intact. Text-selection priority still suppresses block controls immediately, with a pop when they return. Reduced motion disables opening and closing transitions.

The change uses the live toolbar surfaces and adds no exit copies, dependencies, backend changes, migrations or persistent-format changes. No commits created; no later phase started.

## Validation

- Targeted `vp fmt`: passed.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0.
- `npm run build`: passed, exit 0; mixed-import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser visual acceptance is pending the manual checks below.

Validation logs: `/tmp/orbium-toolbar-pop-types.log`, `/tmp/orbium-toolbar-pop-lint.log`, `/tmp/orbium-toolbar-pop-build.log`.

## Manual checklist

1. Reload a Board, select a block and click blank canvas. Expected: the block toolbar grows into place on opening and shrinks/fades on closing.
2. Double-click a text block, select a word, then collapse selection with an arrow key. Expected: text formatting pops open, block controls hide immediately, text formatting shrinks closed on deselection and block controls pop back.
3. Repeat selection/deselection quickly, then pan and zoom with a block selected. Expected: no stuck opacity or closing copies; toolbar follows the block without replaying its entrance during camera movement.
4. Select text and use Bold, Link and Done; switch blocks and navigate away. Expected: actions still work, and ending editing/navigation removes controls immediately without lingering copies.
5. Repeat near canvas edges, in narrow windows, light/dark and Normal/Frosted appearances. Expected: toolbar remains bounded and readable without positional drift.
6. Enable OS reduced motion and repeat opening/closing. Expected: immediate visibility changes with no scaling/fading.

## Limits

Animated closing requires discrete-display transition support and a mounted surface. Editor unmount and text-priority suppression remain immediate to preserve the previous toolbar lifecycle repair. This refinement applies to Board floating block/text controls; ordinary Document controls keep their existing motion.

## Commit suggestion

`style(boards): add pop motion to floating toolbars`

Remain in Boards phase-4 manual review.

## Follow-up: collapse before pop correction

The user reported a collapse followed by the pop. Source inspection found two lifecycle gaps: React removes selection-specific buttons during the live surface's exit, and hidden priority/positioning states could continue scale transitions before the toolbar was ready to appear.

The motion installer now records unscaled visible dimensions with a ResizeObserver. Hidden exits retain those dimensions, preventing the shell from collapsing when selection-specific children disappear. The observer and CSS properties are released on teardown. Priority-suppressed and unpositioned states reset immediately to the small invisible state; restoration starts a single opening transition. Camera anchoring remains based on layout dimensions. No copied closing surfaces are introduced.

Follow-up checks: targeted formatting, `npm run types:check`, `npm run lint`, `npm run build` and `git diff --check` passed (exit 0). Build retains mixed-import, chunk-size and plugin-timing notices. Logs: `/tmp/orbium-toolbar-collapse-{types,lint,build}.log`. No automated tests written or run; visual acceptance remains manual.

Manual regression checklist:

1. Select and deselect a text block, image, list and multi-selection. Expected: a single pop on opening; the closing shell keeps its width/height while shrinking, with no narrow intermediate pill.
2. Edit text, select a phrase, then collapse it; repeat quickly and switch blocks. Expected: block controls return with one outward pop, without first contracting visibly; no stale dimensions or lingering copies.
3. Repeat near canvas edges, while panning/zooming and in a narrow window. Expected: stable anchors, correct wrapping and no entrance before positioning.
4. Enable reduced motion and repeat. Expected: immediate visibility changes with no pop or collapse.

Commit suggestion: `fix(boards): prevent floating toolbar collapse during pop transitions`

## Screenshot follow-up: preserve controls during dismissal

The user confirmed the previous correction was insufficient and supplied a screenshot of the More-only strip. The width/height workaround preserved only the shell while React still removed the selected object's controls. That workaround is removed.

The block toolbar now retains its last nonempty selection's object/count/editing presentation when actual selection clears. The closing toolbar keeps its style/identity, Edit/Done and More controls rather than changing to a lone More button. Actual selection still controls visibility and anchoring; the retained surface becomes inert immediately. Reopening uses the current selection before paint, including changes of block type and multi-selection count. Native/hosted editor lifetimes and text-priority behavior remain unchanged. Retained presentation is local UI state, with no persistent or Board-history writes.

Validation for this correction: targeted formatting, `npm run types:check`, `npm run lint`, `npm run build` and `git diff --check` passed, exit 0. Existing mixed-import, chunk-size and plugin-timing build notices remain. Logs: `/tmp/orbium-toolbar-content-{types,lint,build}.log`. No automated tests written or run. The screenshot was inspected, but live browser reproduction is unavailable; manual visual acceptance remains required.

Manual checklist:

1. Select a text block and click blank canvas. Expected: the complete toolbar shrinks/fades together; no More-only intermediate strip.
2. Repeat for heading, image, divider, list/table and multi-selection. Expected: each closing surface retains its own controls/count through dismissal.
3. Quickly deselect/reselect, then select a different block type. Expected: current controls on opening, no previous block's controls flashing, no collapsed pill.
4. Enter editing, clear selection/finish editing, and select/collapse text. Expected: text-priority suppression remains immediate and no stranded controls remain. Closing controls cannot receive Tab focus or clicks.
5. Repeat in narrow windows, after pan/zoom, and with reduced motion. Expected: bounded controls; immediate visibility changes with reduced motion.

Commit suggestion: `fix(boards): retain toolbar controls throughout dismissal`
