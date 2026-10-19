# Boards — Whole-block scaling and automatic growth

2026-10-19. Phase-4 manual review correction, authorized by the user's report that corners still expanded frames and new rows were hidden.

## Implemented

- Ordinary corner dragging uniformly scales every block's complete rendered surface, including table cells/text, code, math, diagrams, internal spacing, media/captions and resource cards. The previous implementation scaled fonts only for writing and left other corners changing the frame.
- Replaced writing-specific font-size multiplication with surface-level CSS zoom. Explicit logical frame dimensions keep wrapping stable when the frame and contents scale together. Pointer preview, cancellation/rejection and committed rendering update the same scale/width/height variables. Resize handles and the camera keep their own zoom behavior.
- Native content observation runs after manual sizing as well as automatic sizing. Manual height is a minimum, allowing added rows, list items, wrapped writing and source content to grow the frame. Resource preview/hosted Document surfaces also grow when their rendered content requires it. The old gate specifically skipped manually sized tables and technical blocks, hiding additions in overflow.
- Height measurement converts logical content dimensions to visual Board units. Fit height uses the same calculation. Image reset accounts for scaled captions.
- Edges retain frame resizing/reflow and image cropping. Shift-corner retains free image-frame resizing. Single-click selection, double-click/Enter editing, snapping, undo/redo, operation locks and the phase boundary remain.

## Commits

None created. Suggested message:

`fix(boards): scale whole blocks and auto-grow added content`

Existing unrelated working-tree changes were preserved.

## Migrations / persistent format changes

No migration, new field or format-version change. Existing optional `text_scale` now applies to the complete surface for all block types, bounded to 0.25–8. Resource validation now permits `target_node_id` plus optional `text_scale`; it still rejects copied content and unrelated metadata. Existing resource references without scale remain valid. `manual_height` is interpreted as a minimum rather than a clipping instruction. Old writing scale values remain readable and now scale spacing along with text.

## Actual checks

| Check | Result |
|---|---|
| Targeted `vp fmt` | Passed |
| Targeted Pint formatting check | Passed |
| `php -l app/Services/Boards/BoardBlockData.php` | Passed |
| `npm run types:check` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0; 637 formatted files and 534 files without warnings/errors |
| `npm run build` | Passed, exit 0; 15.81s |
| `git diff --check` and explicit whitespace scan of changed sources/docs | Passed |
| Source sizes | Changed sources remain below 500 lines |

Build retains existing mixed import, chunk-size and plugin-timing notices. Logs: `/tmp/orbium-board-scale-format.log`, `/tmp/orbium-board-scale-pint.log`, `/tmp/orbium-board-scale-types.log`, `/tmp/orbium-board-scale-lint.log`, `/tmp/orbium-board-scale-build.log`.

No automated tests were written or run. No browser/manual UI verification was performed by the agent. Static checks cannot establish correct pointer/editor behavior with CSS zoom; manual acceptance is required.

## Manual checklist

Use a disposable Board at 100% zoom.

1. **Table corners:** create a table, fill two cells, finish editing, then drag each corner outward/inward. Expected: cell text, cell spacing, rules and table scale together; it should not merely add empty frame area. Opposite corner remains anchored within geometry bounds.
2. **Other corners:** repeat with heading, paragraph, list, callout, code, math, diagram, image/caption and resource card. Expected: the entire block visibly grows/shrinks together; wrapping is stable for uniform scale. Code syntax, controls and captions follow scale. Image Shift-corner retains free-frame cropping.
3. **Rows after manual sizing:** resize a table with a side/corner first. Double-click and add several rows; type multiline cell content. Expected: the bottom edge automatically moves down and new rows remain visible without using Fit height or scrolling the frame. Finish/re-enter editing and repeat.
4. **Other added content:** add list items, paragraph lines and code lines after manual resizing. Add content while editing a linked Document card. Expected: content height grows automatically, preserving current scale and authored content. Existing bounded resource previews remain summaries after finishing linked editing.
5. **Edges and Fit height:** change table/text width using a side; make a taller frame, then add content beyond it. Expected: sides resize/reflow the frame, and content growth can exceed the manual height. Fit height removes extra frame space; removing content from an automatic native frame lets it shrink.
6. **Scaled editing:** scale a table and paragraph to approximately 0.5× and 2×, then double-click a specific cell/word, type and format it. Expected: caret/cell selection matches the clicked position, formatting targets the intended selection, popups remain usable and the camera does not jump. Repeat source-language and media controls.
7. **History and reload:** undo/redo scaling and row insertion separately; wait for Saved and reload. Expected: content, positions, dimensions and whole-block scale restore correctly, without a separate automatic-height undo step. Scaled resource cards save without validation errors.
8. **Canvas zoom:** repeat corners, row insertion and editing at 50% and 200% camera zoom. Expected: block scale and camera zoom compose correctly; all eight resize targets remain usable. If available, repeat representative checks with touch and in other appearance modes.

## Limits and stop gate

- The existing 4000-unit maximum frame size still applies. Extremely long or highly scaled content can reach this cap and require existing overflow access. Horizontal code/media scrolling and image crop frames retain their intentional behavior.
- CSS zoom interaction with rich editors, IME, media, themes and touch still needs the above manual review.
- Remain in phase-4 manual review; no later phase started.
