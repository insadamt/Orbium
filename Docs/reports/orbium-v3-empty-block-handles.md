Summary: Records the six-dot handle repair for empty V3 blocks; depends on legacy separator gates, scoped block identity, handle selection and spacer focus routing.

# Empty-block six-dot handles — 2026-11-01

The user reports that the six-dot handle does not work on empty blocks. The preceding repair corrected empty-row geometry but missed control admission and selection/focus paths. This remains stage-6 review. Findings are source-based; no browser reproduction was performed.

## Cause and repair

- The shared `isStructuralMarkdownSeparator` heuristic classified an empty body after a nonempty identity header as a legacy Markdown separator. Gutter hover, remeasurement, context menus and keyboard menu admission all consult this gate, so real empty V3 blocks could lose their controls. Valid V3-owned positions now bypass it using the existing index, without copying block bodies.
- Preview pointer selection had a second legacy rule for the final blank line, which could reject an actual final empty V3 paragraph. It now uses the same identity distinction; legacy documents retain their previous separator rules.
- Empty-paragraph hover now resolves `data-v3-empty-block-id` from its line or frame before generic DOM hit testing. The existing spacer ID path remains. Both paths verify editor ownership, including columns.
- Handle selection ends at the selected body's end, which can be the next sibling's header. The spacer focus helper previously skipped only ranges containing multiple IDs; a single-block selection could therefore focus/select the following spacer. It now skips every active handle selection. Direct clicks in spacer inputs retain their existing native writing behavior.
- Active gutter targets, the keyboard block menu, select-block and block-move shortcuts now prefer the selected head ID over a raw selection endpoint. Menu copy/duplicate/delete/move actions continue using their existing checked owner operations and selected IDs.

No block type, persisted format, Enter behavior, CSS spacing, dependency, backend or migration changes were made. Existing working content, unsupported conversion boundaries and read-only/owner guards retain their existing behavior. Prior uncommitted work was preserved; no staging or commits were performed.

## Checks actually run

- Changed-file formatting/lint: passed for the seven changed TypeScript files.
- `npm run types:check`: passed.
- `npm run build`: passed, with existing chunk-size, mixed-import and plugin-timing warnings.
- `npm run lint`: fails on the same 16 existing formatting files elsewhere; no unrelated formatting cleanup was made.
- `git diff --check` and changed-file summary/whitespace inspection: passed. No new source files were added. The gutter remains an existing file above 500 lines; this repair makes only focused changes to its target selection.
- No PHP files changed; PHP checks were not repeated.
- No automated tests, fixture runners, Playwright, browser automation or interactive verification was performed. Manual checks below remain unchecked.

## Manual checklist

Reload the updated application and use a disposable V3 Document.

- [ ] **Empty paragraph between blocks:** Create an empty paragraph between two text blocks using the plus control or Source. Hover both its writing line and its padding; expect its own six-dot handle. Click the handle; expect the block menu to remain open. Delete the empty block and undo; expect only that block to be removed/restored.
- [ ] **Spacer before another spacer:** Press Enter several times to create blank spacers. Hover the first spacer, click its six-dot handle, and choose Duplicate or Delete. Expect that spacer to be affected, without focus/selection jumping into the next spacer. Repeat Copy and Move up/down; neighboring text must remain intact.
- [ ] **First and final blank blocks:** Repeat handle/menu actions on a first blank block and a final empty writing paragraph. Click the final row and type; expect the actual row to accept text rather than pointer selection being rejected.
- [ ] **Range selection:** Shift-click handles across several blocks including blanks. Expect a consecutive selected range. Copy/delete and undo it; expect the chosen range to remain the target, with no automatic spacer-input focus.
- [ ] **Keyboard controls:** With an empty block selected, press Ctrl/Cmd+Shift+M. Expect that block's menu. Press Escape, then Alt+Shift+Up/Down; expect the selected block/range to move rather than the following sibling. Ctrl/Cmd+Shift+A should keep the intended block selected. Respect any operating-system interception of these shortcuts.
- [ ] **Columns:** Repeat empty paragraph/spacer handle clicks, menu actions and drag within each column. Expect local controls and the correct child block, without selecting the outer layout or another column. Test a blank block immediately before a rich code/image block.
- [ ] **Direct writing and legacy guards:** After closing a menu, directly click an untouched spacer and type. Expect normal promotion into text. Confirm ordinary text-block handles still work and read-only surfaces do not allow edits. If a supported legacy editing surface is available, its separator-only rows must retain their existing behavior.
- [ ] **Persistence:** Save, reload and verify the chosen duplicate/deletion/move. Undo/redo before reload should preserve block order and text without affecting unrelated blocks.

## Commit message suggestions

- `fix(editor): enable six-dot handles on empty blocks`
- `fix(editor): preserve blank block selection across handle actions`

No commits were created. Remain at stage-6 manual review.
