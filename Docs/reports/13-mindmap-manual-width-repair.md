# Mind Map manual width repair — 2026-10-26

The user again reported being unable to adjust branch width manually. This corrects the existing phase-5 interaction; no later phase is started.

## Findings and changes

Code inspection found that the grip was explicitly omitted while the selected topic's text editor was active. Adding a topic enters text editing immediately, so the resize control was unavailable in that common state. Outside text editing it used a 10-pixel hit area and a 3-pixel visual mark, further reduced by map zoom. No browser reproduction was performed.

- Selected topics now keep their resize grip while text editing. A visible 22-pixel corner control shows a horizontal-arrow icon at the outward bottom corner, clear of the midpoint collapse toggle. Root/right topics use the right corner; left topics use the left corner. The grip does not take focus from an active text editor on pointer down, preserving its caret.
- The dock now exposes **Branch width** with the same horizontal-arrow icon. Its panel accepts an exact integer width from 100 to 800 map pixels. Enter or Apply commits; Reset commits the 180-pixel default. Empty, fractional and out-of-range values fail native field validation. Closing without applying discards the local draft.
- Escape closes the width panel without dismissing the fullscreen editor and restores focus to the dock control. Native input Undo/Redo stays local to the numeric draft; once focus leaves that input, normal owner history handles completed width changes. Width and parent panels are mutually exclusive for a selected topic.
- Numeric edits use the same accepted owner mutation as pointer/keyboard resizing. Reapplying an unchanged value makes no new mutation. Original graph version handling, rich branch bodies, measured height, history, save/conflict and recovery remain. A graph-4 topic stays graph 4 after width changes. No migration/backend/schema changes.
- Read-only/embedded previews remain without editing controls. Native Board viewport size is independent of branch width.

## Actual validation

- `npm run check:fix`: passed formatting/lint.
- `npm run types:check`: passed.
- `npm run lint`: passed; 759 formatted files and 642 source files, no warnings/errors.
- `npm run build`: passed in 20.10 seconds. Existing large-chunk, mixed-import and plugin-timing warnings remain. Log: `/tmp/orbium-width-repair-build.log`.
- `git diff --check`: passed; repeated after this report.
- New panel: 89 lines; topic controls: 194; canvas: 432. Modified source files remain under 500 lines.
- No automated tests, Playwright or browser automation run, per user instructions. PHP checks are not applicable to these frontend-only changes. Actual pointer feel, visual placement and persistence/history remain for manual verification.

## Exact manual checklist

Use disposable maps; repeat primary checks in a native Board and a normal Document, then hosted/legacy Documents where available.

1. **Resize while writing:** open Edit, add a branch and leave its text editor active. Expect a horizontal-arrow grip at the outward bottom corner. Type some text, then drag the grip wider/narrower without pressing Escape first. Expect width and text wrapping to change, automatic height and no canvas pan. Type again: expect the previous caret/selection to be retained. Repeat on the root and a left branch.
2. **Exact width:** with that branch selected or being edited, click **Branch width** in the left dock, type `320` and press Apply. Expect a 320-map-pixel branch, not a resized Board viewport. Enter `240` and press Enter; expect 240. Press Reset; expect 180. Other branches keep their own widths. Text, inline marks, headings/lists and checkbox states remain intact.
3. **Validation and draft:** try empty, `99`, `801` and `250.5`, then Apply. Expect field validation and no saved width change. Type `400`, close with X without applying: expect accepted width unchanged. Reopen: expect the accepted width. Press Escape: expect only the panel to close, fullscreen to remain and focus to return to Branch width. Open Change parent: expect no overlapping width panel.
4. **Undo/Redo and save:** apply an exact width, move focus back to the topic or dock, and use Ctrl/Cmd+Z then Redo. Expect the old/new width and original rich text. A completed grip drag remains one owner action; cancelling a drag with Escape or the owner-history shortcut keeps its original width. Reapply an unchanged numeric value: expect no extra action. Wait for Saved, close, reload and reopen: expect independent widths and structured text preserved.
5. **Local input undo:** modify the width draft and use Ctrl/Cmd+Z/Y while that input is focused. Expect native draft editing only, with no map-width/history change until Apply. Use Tab to reach Apply, Reset and close controls; expect visible focus and usable keyboard navigation.
6. **Grip keyboard/zoom:** leave text editing, focus the grip and use arrows/Shift+arrows/Home/End; expect existing 10/50-pixel steps and 100–800 bounds. Double-click resets to 180. Repeat drags at multiple zoom levels and with a branch that has children; expect attached connectors, automatic height and a clickable collapse toggle. The numeric panel stays unscaled even when a fitted map makes its grip small.
7. **Ownership and regression:** repeat with old plain/inline maps and graph-4 structured topics. Expect accepted widths to preserve graph-4 bodies and owner saves; cancel/open/close should not upgrade older maps. Read-only/embedded maps expose no grip or width panel. Existing slash text editing, topic selection, collapse/reparent, deletion and Board viewport resizing remain usable.

## Commit suggestion

`fix(mindmap): make manual branch width controls accessible`

No staging or commit performed. Pre-existing unrelated work was preserved. This remains phase-5 manual review.
