# Boards — Repair text-toolbar ownership and unstable animation

2026-10-19. Boards phase-4 manual review.

## Findings and changes

Source inspection found that the priority effect queried `editor.view.dom.closest('.board-stage')` during child layout effects and returned without subscribing if the editor DOM was not yet attached by EditorContent. This allows text formatting to appear while block controls remain visible. The camera observer used the same early ancestor lookup, so it could also miss the world element. Priority now resolves its toolbar from the mounted Board formatting slot, independently of editor attachment. Overlay anchoring uses that stable Board stage for canvas/world geometry and camera observation. Board identity is passed explicitly through native formatting and writing-menu surfaces.

Removed cloned exit snapshots and scale/translation animations. They could keep outgoing block controls visually present during text formatting and sample changing bounds during an animation. Board toolbars now fade on their actual surfaces; discrete display transitions permit hide/show fades where supported. Text selection hides block controls immediately. Ending editing unmounts text controls immediately, with no lingering copy. Priority cleanup restores block controls. Reduced motion removes fades; ordinary Document toolbar defaults remain unchanged.

No backend, data format, migration or dependency changes. No commits created. No automated tests written or run, per user instructions. Findings are from source inspection; live browser reproduction/visual acceptance is not claimed.

## Actual validation

- Targeted `vp fmt`: passed for all seven changed source files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 643 formatted files and 538 linted files without warnings/errors.
- `npm run build`: passed, exit 0; built in 16.68s. Existing mixed-import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.

Logs: `/tmp/orbium-toolbar-stability-types.log`, `/tmp/orbium-toolbar-stability-lint.log`, `/tmp/orbium-toolbar-stability-build.log`.

An initial TypeScript pass caught a missing Board ID prop in the writing-menu surface while adapting the anchor; the prop was wired explicitly before final verification.

## Exact manual checklist

1. Reload a Board and enter a multiline text block for the first time. Select a word on the first line, then on the last line. Expected: the block toolbar hides immediately whenever text is selected, regardless of overlap; only text formatting is available.
2. Drag a selection forward/backward across lines, collapse it with an arrow/click and repeat rapidly. Expected: stable toolbar geometry, no scaled/jumping copies and block controls restored after deselection. Apply Bold/Italic/Link: the selection remains usable and block controls remain hidden.
3. With text selected, pan and zoom to 50%, 100% and 200%. Expected: text controls follow the camera at readable screen size; moving them offscreen does not restore block controls while selection remains.
4. Finish editing with Escape or Ctrl/Cmd+Enter while text is selected. Re-enter and switch to another block. Expected: text controls disappear with editing, block controls return and no closing copy remains over the canvas or next block.
5. Repeat selection/formatting in a list and table; at a collapsed caret, open Ctrl/Cmd+K and dismiss it. Expected: native text/link controls own visibility while active; block controls return afterward. Type `/` in an eligible text block: writing commands stay anchored when the camera changes.
6. Repeat near canvas edges, in a narrow window, light/dark and Normal/Frosted appearances. Enable reduced motion. Expected: bounded controls, no animation-related positional drift and immediate visibility changes under reduced motion.

## Limits and stop gate

CSS hide/show fades depend on discrete-display transition support; older browsers may hide immediately. Editor unmount and text-priority suppression intentionally remove controls immediately, preserving one active toolbar. Manual visual/focus acceptance remains pending. Remain in phase-4 review; no later phase started.

## Commit suggestion

`fix(boards): stabilize text toolbar lifecycle and selection priority`
