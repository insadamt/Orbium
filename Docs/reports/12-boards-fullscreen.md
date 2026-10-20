# Boards review — Animated fullscreen

Date: 2026-10-20. Phase 4 remains in manual review.

## Implemented

The Board heading has an accessible Enter fullscreen / Exit fullscreen button.
The existing page expands to the browser content viewport over 320ms and returns
to its normal position over 260ms, using GSAP geometry animation without scaling
text or reparenting editors. Reduced motion skips animation and finishes an active
transition if the preference changes. Rapid toggles cancel the previous transition.

The title, creation/history toolbar, Board options, save status and canvas controls
remain visible. Camera, selection, native editors and linked Document sessions stay
mounted. Covered shell siblings become inert, and body scrolling is restored after
exit or page teardown. Existing portaled pickers, dialogs and menus remain usable.
Escape exits from within the Board after existing editors/tools/gestures have had
their normal dismissal opportunity. Text inputs, composition, menus/dialogs and
native media fullscreen retain their own Escape behavior.

Viewport changes update fullscreen bounds. Normal page height measurement pauses
while expanded and runs immediately after restoring the page, avoiding a stale
fullscreen height after resizing. This is optional; Boards still open normally.

No dependencies, backend changes, migrations or persistent format changes.
Existing unrelated uncommitted work is preserved. No commits created.

## Validation

- Targeted `vp fmt` and final `vp fmt --check`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 657 formatted files and no warnings/errors in 550 linted files.
- `npm run build`: passed. Existing large-chunk and mixed static/dynamic Document import warnings remain. Output: `/tmp/orbium-board-fullscreen-build.log`.
- `git diff --check`: passed.
- No automated tests written or run, per project instructions. Browser/visual acceptance remains pending user testing.

## Manual test checklist

1. Open a populated Board. Click Enter fullscreen beside the title, then Exit
   fullscreen. Expected: smooth expansion/contraction, no text scaling, title and
   tools remain reachable, and normal app navigation returns after exit. Browser
   tabs/address bars remain visible.
2. Pan and zoom; select an object. Toggle fullscreen twice. Expected: camera,
   selection, object geometry and history remain intact; newly exposed objects
   render and contextual controls stay within the canvas.
3. Edit native text and type a sentence. Toggle using the heading button, continue
   typing, then exit, finish editing and wait for Saved. Reload. Repeat with a
   linked Document. Expected: typed content remains and persists to its original
   destination; fullscreen changes do not create content history entries.
4. Enter fullscreen and focus the canvas. Press Escape. Expected: exit animation.
   Repeat with a placement tool, an active drag, native editing and a linked editor.
   Expected: the existing interaction cancels/finishes first; fullscreen remains
   until another eligible Escape or the explicit exit button. Upload/composition
   guards continue protecting editing.
5. In fullscreen, open Add, Board options/details, linked-page picker, text
   formatting and a table/media fullscreen preview. Expected: overlays remain
   clickable above the Board. Escape closes the active overlay first.
6. Toggle rapidly several times, including while the animation is running.
   Expected: motion reverses cleanly; no duplicate canvas, stuck page, inert
   navigation or scroll lock after leaving fullscreen.
7. Resize the browser while expanded; repeat at 390px width, short landscape,
   light/dark and frosted appearance. Exit after resizing. Expected: fullscreen
   tracks available space, toolbar controls wrap, and normal Board height restores.
8. Enable reduced motion, then enter/exit fullscreen. Also enable it during an
   animation. Expected: changes complete immediately without expansion movement.
9. Enter fullscreen and Tab through controls. Expected: covered app controls are
   skipped; Board controls and open dialogs remain usable. Exit and navigate to
   another page, including through a linked card. Expected: normal navigation,
   keyboard access and page scrolling are restored, with existing save guards.

## Commit message suggestions

- `feat(boards): add animated fullscreen mode`
- `feat(boards): preserve live editors during fullscreen transitions`

## Limits and stop gate

Fullscreen covers the browser content viewport; it does not invoke native browser
fullscreen. Visual behavior and manual acceptance remain unverified. No later
Board/Mind Map phase started; await manual review within phase 4.

## Follow-up correction — Canvas header and exit blink

The user requested that the title and navigation/tools sit inside the fullscreen
Board and reported a blink on exit. The existing heading now becomes an overlay
inside the edge-to-edge canvas. Its title, tools, options and exit action retain
the same mounted controls. The measured heading height, page padding and canvas
corners interpolate with the fullscreen transition, restoring the ordinary heading
row as the Board contracts. Expanded save/error notices are offset below the header.

Source review identified the page's `island-arrive` opacity animation restarting
when fullscreen restored the original `animation` style. A persistent visited
attribute now suppresses that arrival animation after the first fullscreen use.
Scrollbar space is retained during the scroll lock to avoid shifting the return
position. Browser confirmation of the reported blink fix remains pending.

Validation for this correction:

- Targeted `npx vp fmt`: passed for both modified source files.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed; 657 formatted files, no warnings/errors in 550 linted files.
- `npm run build`: passed (exit 0); existing large-chunk and mixed static/dynamic import warnings remain. Log: `/tmp/orbium-board-fullscreen-refinement-build.log`.
- `git diff --check`: passed.
- No automated tests written or run. No commits, migrations or persistent changes.

Manual checks for the correction:

1. Enter fullscreen on a populated Board. Expected: canvas/grid extends to the
   viewport edges; title, Board tools, options and exit control float inside it.
2. Exit using the button, then repeat using Escape from the idle canvas. Expected:
   heading space and canvas margins return smoothly, with no opacity blink after
   the transition finishes. Repeat at least five times.
3. Toggle rapidly during entry/exit. Expected: transitions reverse cleanly and no
   header duplication, invisible page, inert navigation or scroll lock remains.
4. Repeat at a narrow width where the title/tools wrap; resize while expanded,
   then exit. Expected: measured heading space matches the wrapped normal row,
   and controls remain reachable in both modes.
5. Edit native text and a linked Document across fullscreen toggles, then save and
   reload. Expected: drafts, original Document edits and camera remain intact.
6. Check light/dark/frosted appearance and reduced motion. Expected: readable
   floating controls and immediate geometry changes with reduced motion. Trigger
   a save error while expanded: the recovery notice appears below the heading.
7. On a short window with a page scrollbar, enter/exit and navigate away.
   Expected: return position stays stable and ordinary scrolling/navigation work.

Suggested commit: `fix(boards): embed fullscreen controls and prevent exit blink`.
Remain in phase-4 manual review; no later phase started.

## Follow-up styling — Separate floating controls

The fullscreen title and tools now use separate floating panels instead of one
full-width heading backdrop. Each surface has rounded corners, a subtle inset
border, shadow and backdrop blur. The title is bounded to 360px, the toolbar
aligns right, and exit/options retain individual 40px controls and hover/focus
states. Narrow screens keep the existing wrap. Transparent gaps pass pointer
input to the underlying canvas. Depth, tint and title padding follow the current
fullscreen transition progress. No editor/session or persistent changes.

Validation: targeted formatting, TypeScript, lint (657 formatted files; 550 linted
without warnings/errors), production build and whitespace checks passed. Build
warnings remain for chunk sizes, mixed static/dynamic imports and plugin timings.
Build log: `/tmp/orbium-board-floating-fullscreen-build.log`. No automated tests
written or run; manual visual verification is pending. No commit created.

Manual checklist:

1. Enter fullscreen. Expected: separate floating title, toolbar and action
   surfaces with visible canvas between them; no full-width header background.
2. Drag over an empty gap between title/tools. Expected: normal canvas panning;
   clicking title/tools still edits the title or invokes the intended action.
3. Hover and keyboard-focus exit/options; open Add/options. Expected: clear focus
   and hover feedback; menus/tooltips remain usable above the floating panels.
4. Repeat in light/dark/frosted appearance and at 390px width. Expected: readable
   surfaces, wrapped controls and no horizontal overflow.
5. Enter/exit repeatedly and enable reduced motion. Expected: surfaces follow
   the existing transition, normal heading returns, and no exit blink reappears.

Suggested commit: `style(boards): float fullscreen title and controls`.
Phase-4 manual review remains active; no later phase started.
