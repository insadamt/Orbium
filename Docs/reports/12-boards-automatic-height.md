# Boards — Automatic content height

2026-10-19. Phase-4 manual review correction, approved by the user after the proposal to remove manual height expansion.

## Implemented

- Writing, lists, tables, code, math, diagrams, file/media blocks and resource cards derive height from rendered content. They shrink as well as grow, including when wrapping changes, async content loads, and linked Document editing returns to a bounded preview.
- Removed the saved-height minimum, including legacy `manual_height` values. Intrinsic preview CSS avoids inheriting a saved frame height, which otherwise prevents shrinking. Height measurement keeps the existing 32–4000-unit bounds and overflow access.
- Content blocks expose two width handles and four whole-block scaling corners. Vertical height handles are hidden, height Properties are disabled, and Alt+Up/Down cannot stretch content frames. Side handles and Alt+Left/Right still change width.
- Removed Fit height from selection/context menus and removed its callback plumbing and implementation.
- Math/diagram source textareas follow their source height and cannot be stretched manually. The Board help and sizing Properties describe the new behavior.
- Images keep their saved crop frames, proportions/reset controls, corner scaling and vertical handles. Dividers retain their existing geometry. Neighbors keep their positions when content grows.

## Commits

No commit created. Suggested message:

`feat(boards): size content blocks automatically`

Existing unrelated working-tree changes were preserved.

## Migrations / persistent format changes

None. Optional legacy `manual_height` values remain accepted for compatibility but do not constrain content height; no UI action creates them. The existing queue saves measured height without an independent undo step or clearing redo. Visible old oversized frames can tighten when opened. Resource cards remain live references; target Document persistence is unchanged.

## Actual checks

- Board source formatting: passed.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 638 formatted files, 535 files without warnings/errors.
- `npm run build`: passed, exit 0; 15.34 seconds. Existing mixed-import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.
- Explicit whitespace scan of Board sources/docs and Board source-size checks: passed; TypeScript sources remain below 500 lines.

Logs: `/tmp/orbium-auto-height-types.log`, `/tmp/orbium-auto-height-lint.log`, `/tmp/orbium-auto-height-build.log`.

No automated tests were written or run, per user instructions. No browser/manual UI verification was performed by the agent; the checklist below remains for the user. No PHP files changed.

## Manual checklist

Use a disposable Board, initially at 100% camera zoom.

1. **Writing growth/shrink:** add a paragraph, heading, list and callout. Add several lines/items, then delete them. Expected: each frame grows and shrinks with visible content, including after finishing editing; nearby blocks stay where placed.
2. **Table rows:** add a table, fill multiline cells, insert several rows and then delete rows/text. Expected: height follows content both ways with no hidden new rows below an old manual frame. Width changes rewrap cells and recalculate height.
3. **Width and scale:** select each representative block. Drag west/east handles, then each corner inward/outward. Expected: sides change wrapping; corners scale text, spacing and the complete surface together. North/south handles are absent on content blocks.
4. **Other sizing controls:** open Object properties on a content block. Expected: Width remains editable and Height is disabled. Alt+Left/Right changes width; Alt+Up/Down leaves height unchanged. Check the selection options and right-click menus: Fit height is absent.
5. **Legacy frame:** open an existing Board containing previously stretched text/table/code blocks. Expected: visible content frames tighten automatically; existing text, scale and position remain. Wait for Saved and reload: content and sizing remain correct.
6. **Technical blocks:** add code lines, then remove them. Edit a long math/diagram source, then delete lines and return to preview. Expected: code/source frames grow and shrink; rendered diagrams settle after loading. Source fields have no manual resize grip.
7. **Files and media:** create an empty file block; attach an ordinary file, audio/video and PDF in separate blocks. Add/remove captions and wait for media loading. Expected: block height follows the rendered attachment/player and caption. PDF retains its own viewport/scroll controls.
8. **Resource cards:** link a Document, enter editing, add/remove several paragraphs, wait for its save and finish editing. Expected: frame follows the hosted editor, then shrinks to its bounded summary; original Document edits persist. Refresh a resource and try an unavailable target: no leftover oversized empty frame.
9. **Images:** attach an image, scale using corners, crop using side/vertical handles, then Reset proportions. Expected: image sizing/cropping stays usable and caption/content is intact. Shift-corner retains free-frame cropping.
10. **History and zoom:** resize width/scale, edit content, undo/redo each action and reload after Saved. Repeat representative cases at 50% and 200% camera zoom. Expected: correct content, width and scale; derived height follows without an extra sizing undo step. Selection/caret and handles remain aligned.
11. **Height limit:** paste enough disposable text/code to reach the 4000-unit frame cap. Expected: frame stays bounded and remaining content remains reachable through overflow scrolling.

## Known limitations and stop gate

Automatic growth can overlap neighboring objects because their positions stay fixed. The existing minimum height, maximum size, source/media viewport behavior and bounded resource summaries still apply. Image crop frames and divider geometry remain manually sized. Actual pointer/editor/async behavior needs the manual review above. Remain in phase-4 manual review; no later phase started.
