Summary: Records stage-4 editing implementation, actual quality checks and exact user-run manual acceptance; depends on the V3 specification, stage-3 owner transactions and the isolated editing inspectors.

The user approved stage 4 with “okey continue”. Implemented keyboard planners, owner-local consecutive block selection, two-stage Select All, scoped clipboard data, typed multi-block paste, structural ID remapping, protected/hidden live structure and an embedded Shift+Enter owner delegate. Existing transaction integrity, owner history and motion dispatch remain the write boundary. New editing modules are split by responsibility and contain top-of-file purpose/dependency summaries.

The application remains format 2. V3 product activation, existing rich-widget wiring, actual gutter/drag controller wiring, server persistence and visual parity are not claimed. Stage 5 integrates column cleanup/transfers; stage 6 connects existing features and storage. No migration, database writes, staging, commits or automated/browser tests were performed. Stop for stage-4 review before stage 5.

Actual checks

| Check | Actual result |
| --- | --- |
| Targeted `vp check --fix` on editing and transactions | PASS: 22 files, no warnings/lint errors. |
| `npm run types:check` | PASS on final source. |
| `./vendor/bin/pint --test` | PASS. |
| `npm run lint` | FAIL: the same 18 pre-existing formatting files reported at the earlier stages, outside the new V3 modules. No unrelated formatting changes made. |
| `npm run build` | PASS: 5,709 modules, 19.29 seconds. Existing large-chunk, ineffective dynamic import and plugin-timing warnings remain. |
| `git diff --check` | PASS. |
| Static source/document hygiene | PASS: all 22 editing/transaction source files have Summary comments, stay below 500 lines and have no trailing whitespace; stage-4 relative doc links resolve. |

The type checker initially caught a list-group control-flow narrowing error; grouping now uses the previous typed array entry. No automated tests, runtime fixture commands or browser automation were run. Build/type checks do not execute the inactive editor modules. Runtime behavior below is a manual acceptance checklist, not a claim that the agent executed it.

Command logs are under `/tmp/orbium-v3-stage-4-*`; final type/build logs use `final-types.log` and `final-build.log`. The full-lint failures remain the same explorer/navigation/Board/current-editor formatting files listed in the stage-1 baseline report.

Manual review setup

Start the application and its usual Vite development server. Use a fresh console context or reuse previously defined aliases from the earlier stage review. Open the browser developer console on a disposable page and run these setup statements manually. They create isolated editor states and do not save/import documents:

```js
const viteOrigin = new URL(document.querySelector('script[src*="/@vite/client"]').src).origin;
const v3Files = await import(`${viteOrigin}/resources/js/components/editor/markdown/structure/v3-document-file.ts`);
const v3Commands = await import(`${viteOrigin}/resources/js/components/editor/markdown/transactions/v3-transaction-inspection.ts`);
const editingSample = v3Files.decodeV3DocumentFile(await fetch(`${viteOrigin}/Docs/examples/orbium-v3-editing.orbie`).then(response => response.text()));
let review = v3Commands.createV3TransactionInspection(editingSample.source);
const resetReview = () => { review = v3Commands.createV3TransactionInspection(editingSample.source); };
const positionOf = text => review.inspect().source.indexOf(text);
const reviewBlock = id => review.inspect().structure.blocks.find(block => block.id === id);
review.inspect();
```

Expected: valid source, 14 blocks, zero columns, zero undo/redo actions. The duplicate-looking `edit-first` header inside the four-backtick code fence is literal content, not a second identity. Keep this fixture out of the current format-2 import UI.

Manual checklist: owner commands

1. **Universal Shift+Enter:** reset; `review.setSelection(positionOf('Alpha omega.') + 5); review.pressKey('Shift-Enter');`. Inspect source, selection, `createdIds` and history. Expected: the original `edit-first` source is unchanged; one fresh empty paragraph appears between `edit-first` and `edit-second`; caret is in the new paragraph; undo depth is 1. `review.undo(); review.redo();` restores the same new ID. Repeat from offsets 0 and `'Alpha omega.'.length`; the original text never splits. Repeat `review.pressKey('Shift-Enter', 'edit-code')` and `'edit-math'`: literal bodies stay unchanged.
2. **Content-based Enter:** reset; set selection to `positionOf('Alpha omega.') + 'Alpha omega.'.length`. Press `review.pressKey('Enter')`. Expected: one internal newline, same 14 IDs, caret on the empty line. Wait any duration and press Enter again. Expected: one new paragraph after `edit-first`, with its own ID and focus; first block remains. Undo once restores the state after the first Enter; undo again restores original source.
3. **List continuation/exit:** reset; set selection after `'Last bullet'`; press Enter. Expected: `\n- ` inside `edit-bullets`, no new block ID. Press Enter on that empty final item: expected new paragraph after the list, with earlier and nested items retained. Repeat after `'Last task'`: new item uses `[ ]`, the completed/nested states remain; next Enter exits. Repeat after `'Last numbered item'`: the new item starts `3. `. Repeat quote/callout body ends: the next line retains `> `; empty final quote line exits.
4. **Literal embedded Enter contract:** reset; `review.pressKey('Enter', 'edit-code')` and `'edit-math'`. Expected: `handled: false`, no source change from this owner planner. The real inner editor must perform its ordinary newline; verify actual keyboard entry on the mounted review surface below and later existing widget integration. Shift+Enter is handled by the owner in both cases.
5. **Two-step boundary behavior:** reset; set selection to `positionOf('HEADING-TEXT')`; Backspace. Expected: `edit-heading` becomes paragraph with readable heading text, same ID, caret at start and one undo action. Backspace again: merges with `edit-second`, retaining earlier `edit-second` and retiring `edit-heading`. Two undos restore conversion then heading. Repeat with checklist/quote at the visible start; all nested item content and readable checkbox meaning survive. For forward Delete, place caret at heading text end: first action converts with caret still at the end; the next action can merge only with a compatible following paragraph. To review that merge, use the stage-3 `insert` operation to insert a paragraph before `edit-bullets` first.
6. **Empty and opaque boundaries:** reset; focus `reviewBlock('edit-empty').bodyFrom`; Backspace deletes it and focuses the preceding math block without changing its payload. Put caret at the start of `edit-last` and Backspace with a preceding opaque block after removing the empty block: expected `handled: false`, no flattening. Different presentation or ambiguous inline joins must throw a clear error and leave source/history unchanged.
7. **Selection and Select All:** reset; `review.selectBlock('edit-first'); review.selectBlock('edit-heading', true);`. Expected ordered IDs `edit-first`, `edit-second`, `edit-heading`; reverse Shift selection stays ordered. `review.copyBlocks()` returns native data and plain text without actual `++block` headers. Press Delete: exactly those blocks retire in one action; undo restores their exact IDs. Then reset, focus `edit-first`, call `review.selectAll()` twice: first selects its content, second selects all root blocks. Delete leaves one fresh editable empty paragraph; undo restores all original IDs.
8. **Single/multiple paragraph paste:** reset; caret after `Alpha`; `review.pasteText(' inline')`. Expected same block IDs and inline text. Reset; select from `positionOf('Alpha omega.') + 6` to that position plus 5 (the word `omega`); paste `'one\n\ntwo'`. Expected original `edit-first` keeps `Alpha ` and its ID, then separate fresh `one`/`two` paragraphs, then a fresh trailing paragraph containing `.`. Total 17 blocks; other original blocks unchanged. Caret ends in `two`. One undo restores original source and selection; redo uses the same IDs.
9. **Typed paste:** reset, caret after `Alpha`, paste `'- Plain\n- [x] Done\n  - [ ] Nested\n- Another'`. Expected distinct ordered bullet/checklist/bullet blocks; nested checked/unchecked syntax preserved in its owning list. Paste numbered lists, a fenced code sample containing a fake `++block` line, and multiple paragraphs. Expected recognized types, literal fenced payloads, and a valid index. A plain header-looking prose line must be escaped instead of creating a clipboard-supplied structural identity.
10. **Internal copy and metadata:** reset; select `edit-styled` through `edit-code`, copy with `const copied = review.copyBlocks();`, then select `edit-first` alone and `review.pasteText('', copied.native)`. Expected selected target is replaced, original copied blocks remain, pasted types/presentation/code/reference text match; only new structural IDs differ. The code's literal fake header/reference remains verbatim. Undo/redo restores the same assigned IDs. A different scope (`review.pasteText('', copied.native, 'different-document')`) must reject with no source/history change.
11. **Ordered drag contract:** reset; select `edit-first` through `edit-heading`; `const drag = review.captureDrag('edit-second');`. Expected all three ordered IDs. `review.applyPrepared(drag.prepareMove({parentId: null, beforeId: 'edit-last'}))` moves them together, preserving IDs and order; undo restores. Capture again, change selection/source, then call its `prepareMove`: expected stale-drag rejection. This reviews the transfer contract; existing drag visuals are wired in later stages.
12. **Columns and owner guards:** load `Docs/examples/orbium-v3-columns.orbie` through the same codec and create another isolated session. Shift+Enter with `review-left-text` creates a child in `review-left`, following that child; with `review-layout`, creates a root sibling after the layout. Paste multiple paragraphs at a left-child position: all new text blocks stay in `review-left`, right-side bytes unchanged. Selecting across columns rejects. Deleting a final child or moving across scopes rejects with the stage-5 cleanup/transfer message. Read-only, composing, stale prepared transactions and malformed raw source must reject structural commands without partial writes; remove the guard before undoing.

Manual checklist: real keyboard and mode boundary

Mount a disposable review editor (this intentionally shows body Markdown rather than all existing rich widgets):

```js
const v3Editing = await import(`${viteOrigin}/resources/js/components/editor/markdown/editing/v3-editing-inspection.ts`);
const reviewHost = document.createElement('section');
reviewHost.style.cssText = 'position:fixed;inset:40px;z-index:99999;overflow:auto;background:white;color:black;border:1px solid gray;padding:20px';
document.body.append(reviewHost);
const mountedReview = v3Editing.mountV3EditingInspection({parent: reviewHost, source: editingSample.source});
mountedReview.focusBlock('edit-first', 5);
```

- Type in an ordinary block, press Enter slowly twice, Shift+Enter at start/middle/end, Backspace/Delete and Ctrl/Cmd+Z/redo. Expected the planner behavior above, focus on the new block, one undo per action, and no visible/accidentally deleted structural headers. `mountedReview.inspect()` exposes source, diagnostics, selected IDs, history depths and errors.
- Use `mountedReview.selectBlock('edit-first')` and `mountedReview.selectBlock('edit-heading', true)` as the future gutter adapter entry point. Use the real system clipboard to copy, cut, paste, replace selection and check one-action undo. Copy literal code's fake header: it remains in plain clipboard text; real identity headers do not. Partial cross-header text copy omits structural markers; attempting its cut reports the complete-handle-selection requirement and leaves source intact.
- Run `mountedReview.setSourceMode(true)`: real headers/directives are visible and editable, normal raw clipboard behavior returns. Edit a header into invalid syntax; inspect diagnostics. Return to live mode: no silent repair/content loss; further live edits reject. Return to source, undo/repair, then switch live again. Existing history and valid IDs remain. Do not treat this inspector as a preview of final rich-widget or column appearance.
- Use `mountedReview.setReadOnly(true)` and try structural keys/paste: source must not change. Restore editability. `setAvailable(false)` must reject owner commands; restore availability. Use a real IME on ordinary text and ensure composition does not create structural actions prematurely. Embedded widgets' IME/Shift+Enter/focus acceptance remains required when their existing adapters are wired.
- To review capture delegation manually, append a temporary textarea to `mountedReview.view.dom`, register it with `mountedReview.registerEmbeddedTarget(textarea, 'edit-code')`, then focus it. Enter adds textarea newlines normally. Shift+Enter must leave its value unchanged and insert/focus an owner paragraph after `edit-code`. Repeat with math and whole-layout IDs. This checks the event bridge only; it is not a second persisted editor or proof of existing rich-widget integration.
- Finish with `mountedReview.destroy(); reviewHost.remove();`. Expected no remaining capture listener or review surface. Repeat mounting/destroying if checking leaks manually. Actual existing gutter motion, rich-widget focus, split/hosted editors, column visuals and performance remain stage-5/6/7 acceptance.

Suggested commits (not created)

- `feat(editor): add v3 keyboard selection and structured paste`
- `docs(editor): document v3 editing integration and manual review`
