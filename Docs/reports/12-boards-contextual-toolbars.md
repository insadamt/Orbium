# Boards — Contextual toolbar positioning and Document styling

2026-10-19. Boards phase-4 manual review. Approved with “okey go ahead” following the toolbar recommendations.

## Implemented

- Removed the editing-only bottom dock: the contextual toolbar now stays centered above the selected block or combined selection bounds with a 14px gap. It falls below when the top lacks space and clamps to available canvas/inspector bounds.
- Observe selected object sizes as well as camera/object styles so content height changes also update the anchor.
- Block and native text-formatting toolbars use the existing Document toolbar surface, reveal animation and moving hover highlight. Contextual controls use compact Document-like spacing, icons and corners; coarse pointers retain 42px targets. Existing tooltips, active states, list/table/media controls, source editing and More actions remain.
- Native text-selection and writing overlays are constrained to the intersection of the canvas and visual viewport, keeping them out of app navigation. Native formatting wraps on narrow canvases.
- An overlapping native text-formatting toolbar temporarily hides the block toolbar using visibility rather than removing its geometry. Collapsing selection restores it. Focused block controls retain focus, and the overlap marker/observers are cleaned up when native editing ends.

No backend, dependency, persistent format, migration or saved geometry changes. This pass shares existing formatting capabilities and presentation; it does not introduce new formatting commands. No commits created.

## Actual validation

- Targeted `vp fmt`: passed.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 642 files formatted, 537 files linted without warnings/errors.
- `npm run build`: passed, exit 0; built in 13.43s after the final narrow-canvas wrapping adjustment. Existing mixed static/dynamic import warnings for image crop, database property header and document editor loader remain, along with large-chunk and plugin-timing notices.
- `git diff --check`: passed.

Logs: `/tmp/orbium-contextual-toolbars-types.log`, `/tmp/orbium-contextual-toolbars-lint.log`, `/tmp/orbium-contextual-toolbars-build.log`.

No automated tests written or run, per user instructions. Browser visual/interaction acceptance remains pending. PHP/migration checks do not apply to this frontend-only change.

## Exact manual checklist

Use a disposable Board with text, heading, list, table, image, code/math/diagram and linked Document blocks.

1. Select a text block near the canvas center. Press Enter or double-click and type. Expected: controls stay centered above the block with a small gap throughout editing; Done/Escape finish editing. Controls no longer jump to the bottom center.
2. Move a block near each canvas edge, including the top. Repeat selecting and editing. Expected: controls move below when necessary, stay within horizontal bounds and remain usable. Open Properties on a wide and narrow window: the existing inspector accommodation/compact hiding behavior remains.
3. Pan and zoom to 50%, 100% and 200%; resize block width and enter enough content to wrap/grow, then delete content. Expected: the toolbar follows the block and its new height while buttons stay the same readable screen size. Multi-select two blocks: controls anchor to their combined bounds.
4. Edit text and highlight the first line, then a lower line. Expected: nearby formatting appears; if it overlaps the block toolbar, block controls disappear without moving the text toolbar. Collapse selection: block controls return. Apply Bold, Italic, Underline, Strike and Code; open/apply/remove a link, including Ctrl/Cmd+K at a caret. Expected: formatting affects the selected text and focus/selection remain usable.
5. Edit a list and change its style. Edit a table and add/remove rows/columns. Edit an image and try caption, crop/reset and Library replacement. Edit technical source and use Done. Expected: existing relevant controls remain in the toolbar above the block, existing limits apply, menus remain usable and controls do not consume block content height.
6. Hover slowly between toolbar controls and across their gaps, then deselect/reselect several times. Expected: one shared moving highlight and a subtle reveal after positioning, with no initial flash at a stale location. Keyboard-tab into controls and open Text style/More; dismiss menus. Expected: visible focus, functioning actions and no unexpected focus loss. Duplicate/delete only disposable blocks.
7. Repeat in light/dark and Normal/Frosted appearances, a narrow window and with OS reduced motion enabled. Expected: Document-like surfaces and readable active states; controls wrap within canvas bounds and animations stop under reduced motion. On touch hardware, controls retain usable targets and overlays stay within the visible canvas when the keyboard opens.
8. Edit a linked Document, finish, wait for Saved and reload. Expected: its original persistence and navigation protection still work. Native content and saved Board geometry remain intact; reopen the original Document to confirm its usual toolbar behavior is unchanged.

## Known limits and stop gate

The block toolbar remains clamped when the selected block is too large or partly offscreen, so it cannot always sit entirely outside the block. On very short canvases, existing scrolling/height bounds still apply. Visual acceptance, touch keyboard behavior and live link/focus interactions require the manual checks above.

Remain in Boards phase-4 review; no later phase started.

## Commit suggestions

- `fix(boards): anchor contextual toolbars above selected blocks`
- `style(boards): match document toolbar surfaces and motion`
