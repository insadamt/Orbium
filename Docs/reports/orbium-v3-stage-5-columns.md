Summary: Records stage-5 column implementation, quality checks and exact user-run manual acceptance; depends on the V3 phase specification, owner transaction/editing contracts and disposable inspectors.

The user approved stage 5 with “continue”. Implemented identified column creation, side wrapping, adding a third column, precise cross-scope moves, proportional empty-column cleanup, deterministic dissolution, resize/stack commands and native projected editing against one owner history. Added an opt-in column widget using the existing grid CSS and divider service, keyed projection retention, clipboard/keyboard delegation, composition/permission guards and a drop-target adapter compatible with the current indicator geometry.

The application remains format 2. No V3 save/import activation, migration, data reset, staging or commits. Existing rich widgets, gutter/menu/slash callers, drag-controller routing, search/outline/hosted views and persistence still require coordinated stage-6 adapters. The opt-in inspector presents text bodies and the real column grid/dividers; it does not claim full existing rich-feature parity. Stop for stage-5 manual review before stage 6.

Actual checks

| Check | Actual result |
| --- | --- |
| Targeted `vp check --fix` on V3 columns/editing/transactions | PASS: 31 files, no warnings or lint errors. |
| `npm run types:check` | PASS on final source. |
| `./vendor/bin/pint --test` | PASS (PHP formatting check). |
| `npm run lint` | FAIL: the same 18 pre-existing formatting files outside these V3 modules. No unrelated formatting fixes made. |
| `npm run build` | PASS: 5,709 modules, 18.58 seconds; existing large-chunk, ineffective dynamic import and plugin-timing warnings remain. |
| `git diff --check` | PASS. |
| Static source/document hygiene | PASS: 31 source summaries/line limits/whitespace, stage-5 doc links and specimen whitespace. All new source files stay below 500 lines. |

Command logs are under `/tmp/orbium-v3-stage-5-*`; final type/build logs use `final-types.log` and `final-build.log`. No automated tests, runtime fixture commands or browser automation were run. Runtime items below are acceptance steps for the user, not claims of agent-executed results. Type checking covers the inactive V3 modules; the application build does not execute them.

Manual setup

Use the application with its usual Vite development server and a fresh browser console context, or reuse already-defined aliases. Run these statements manually; they do not import/save application documents:

```js
const stage5Origin = new URL(document.querySelector('script[src*="/@vite/client"]').src).origin;
const stage5Files = await import(`${stage5Origin}/resources/js/components/editor/markdown/structure/v3-document-file.ts`);
const stage5Commands = await import(`${stage5Origin}/resources/js/components/editor/markdown/transactions/v3-transaction-inspection.ts`);
const stage5Sample = stage5Files.decodeV3DocumentFile(await fetch(`${stage5Origin}/Docs/examples/orbium-v3-column-transfers.orbie`).then(response => response.text()));
let columnsReview = stage5Commands.createV3TransactionInspection(stage5Sample.source);
const resetColumns = () => { columnsReview = stage5Commands.createV3TransactionInspection(stage5Sample.source); };
const columnInfo = id => columnsReview.inspect().structure.columns.find(column => column.id === id);
const moveBlocks = (blockIds, target) => columnsReview.applyOperation({kind:'move',blockIds,target});
const blockInfo = id => columnsReview.inspect().structure.blocks.find(block => block.id === id);
const blockSource = id => { const block = blockInfo(id); return columnsReview.inspect().source.slice(block.from, block.to); };
columnsReview.inspect();
```

Expected: valid source, 12 blocks, five columns, root layouts `layout-a` and `layout-b`, zero history actions. `inspect().layouts` shows A widths `[2500,3500,4000]` and B `[6000,4000]`. The duplicate-looking header and six colons inside `a-right-one` code remain literal. Keep the fixture out of the current format-2 import UI.

Manual checklist: transactions and identity

1. **Targeted typing:** reset; calculate `const offset = columnsReview.inspect().source.indexOf('LEFT-ONE') - columnInfo('a-left').bodyFrom;`. Call `columnsReview.applyColumnEdit({columnId:'a-left', edits:[{from:offset+4,to:offset+4,insert:'!'}], selection:{anchor:offset+5,head:offset+5}})`. Expected `LEFT!-ONE`, all IDs/widths retained, right/code/styled bodies and other root blocks unchanged. A second adjacent edit with `userEvent:'input.type'` may join the normal typing undo group; structural commands remain isolated. Undo/redo restores the exact typed source and IDs. Inspect a prepared column edit, alter owner source/selection, then `applyPrepared`: stale preparation must reject.
2. **Root into a populated column:** reset; run `moveBlocks(['root-before'],{parentId:'a-left',beforeId:'a-left-two'})`. Expected same block ID and content, ordered between `a-left-one` and `a-left-two`; no empty-column cleanup; other payloads/widths unchanged. One undo restores the root position; redo reuses the ID.
3. **Ordered multi-block transfer and three-to-two cleanup:** reset; run `moveBlocks(['a-left-one','a-left-two'],{parentId:'b-right',beforeId:'b-right-one'})`. Expected the pair stays ordered, IDs/styles/check states unchanged. Empty `a-left` retires; `layout-a` retains its ID, surviving column IDs and widths `[4667,5333]`. B retains `[6000,4000]`. One undo restores all original IDs, widths and both positions; redo restores the same hierarchy.
4. **Column out to roots and two-to-one dissolution:** reset; move `a-middle-one` to `{parentId:null,beforeId:'layout-a'}`. Expected A becomes two columns with `[3846,6154]`; heading ID/type preserved as root. Then move `a-right-one` to the same root target. Expected remaining `a-left-one`/`a-left-two` promote at the old layout location with original IDs and source; `layout-a`, `a-left` and `a-right` retire. B remains untouched. The literal fake header/reference in the moved code must remain verbatim. Two undos restore the original three-column A and its proportions.
5. **Delete the final child atomically:** reset; delete `a-middle-one`. Expected only that child/column retire, with widths `[3846,6154]`. Delete `['a-left-one','a-left-two']` next. Expected the remaining code child promotes unchanged, A dissolves and focus resolves to surviving content. No single-column layout remains in any committed state. Each delete is one undo. Reset and delete only `a-left-one`: the column remains populated, widths remain unchanged and later child content survives.
6. **Create two/three columns:** reset; apply `{kind:'create-columns',target:{parentId:null,beforeId:'root-after'},count:2}`. Expected fresh layout, two fresh columns, two fresh empty paragraphs; 15 blocks/seven columns total. Caret targets the first new paragraph. The returned `createdIds` contains five identities. Undo/redo restores the same created identities. Reset and use count 3: four new blocks/three columns, seven fresh identities, equal `[3333,3333,3334]`. Root/other layout bodies stay unchanged.
7. **Side wrapping:** reset; apply `{kind:'wrap-columns',blockIds:['root-before'],besideId:'root-between',side:'left'}`. Expected one new layout/two columns, original root IDs become children in the requested order, 13 blocks/seven columns total. Repeat `right`; original bytes/IDs survive. Repeat with `b-left-one` beside `root-between`: the new layout retains its styled source; removing B's final left child dissolves B and promotes `b-right-one` in the same action. Undo restores both hierarchies and metadata.
8. **Add a third column:** reset; add a column to `layout-b`. Expected same layout/old column IDs, one fresh column and fresh paragraph, equal thirds and focus in the new paragraph. Add again: clear maximum-three rejection and no source/history change. Reset; use `{kind:'add-column',layoutId:'layout-b',side:'left',blockIds:['a-middle-one']}`. Expected moved heading ID retained, a new left column in B, original A cleans up to two columns with `[3846,6154]`; one undo reverses both consequences.
9. **Resize/equal/stack:** reset; resize B to `[7000,3000]`. Expected only its outer metadata line changes; every child and column header/ID remains unchanged. Resize to `[5000,5000]` for equal widths. Each action is independently undoable. Invalid minimums, totals, fractional values and wrong counts reject without a write. Reset; stack A. Expected its four children become root blocks in left-to-right reading order with exact bodies/IDs; only A and its three column IDs retire, B remains unchanged. Undo restores the original layout/proportions.
10. **Dynamic fences:** reset; insert a paragraph before `a-left-two` in `a-left`, with body `::::::::orbium {"kind":"block","align":"center"}\nTALL-FENCE\n::::::::\n`. Expected a valid new child; the enclosing column fence grows past eight colons and the outer fence grows past it. Other column headers and existing child payloads remain unchanged. Undo restores old delimiters/IDs. Ordinary text edits beside the six-colon code example must not widen containers just because of literal text. Repeat with valid one-to-three-space indentation on opening/closing directives: fence growth must preserve valid source rather than replacing indentation as if it were colons.
11. **Whole-layout movement:** reset; move `layout-a` to the root end with `{kind:'move',blockIds:['layout-a'],target:{parentId:null}}`. Expected its layout/column/child IDs, source and widths move together unchanged; no scope confusion, remapping through a deleted range or phantom cleanup. Undo/redo preserves the same identities. A layout moved/pasted into a column must reject as nesting.
12. **Internal/external paste:** reset; select `layout-a`, save `const copiedA = columnsReview.copyBlocks();`, select `root-before` alone, then `columnsReview.pasteText('',copiedA.native)`. Expected original A stays; pasted A/columns/children get fresh IDs while types, widths, checklist/style and literal code/reference text survive. The fake `a-left-one` code header stays literal, rather than being remapped. One undo/redo restores the same new IDs. Paste supported external Markdown column directives: fresh identified layouts/children appear; empty column bodies receive empty paragraphs. Pasting that layout into an existing column rejects without partial edits. Different clipboard document scope still rejects.
13. **Safety and repeated cleanup:** read-only/composing inspectors, missing targets, reversed/nonconsecutive ranges, stale prepared edits and invalid raw source must reject writes. Repeat moves into/out of columns and undo/redo several times. Expected no extra IDs, lost bodies, orphan columns, changed references or width drift. Deleting the entire root handle selection with `ensureParagraph:true` must leave one identified empty paragraph, with one undo restoring all original structure.

Manual checklist: mounted columns, keyboard and dividers

Mount the opt-in surface in a disposable overlay:

```js
const stage5Editing = await import(`${stage5Origin}/resources/js/components/editor/markdown/editing/v3-editing-inspection.ts`);
const stage5Layouts = await import(`${stage5Origin}/resources/js/components/editor/markdown/columns/v3/v3-column-layout.ts`);
const reviewHost = document.createElement('section');
reviewHost.style.cssText = 'position:fixed;inset:40px;z-index:99999;overflow:auto;background:white;color:black;border:1px solid gray;padding:20px';
document.body.append(reviewHost);
const mountedColumns = stage5Editing.mountV3EditingInspection({parent:reviewHost,source:stage5Sample.source,columns:true});
mountedColumns.focusBlock('a-left-one', 4);
```

- The actual existing column grid/dividers appear; structural headers and layout syntax stay hidden. Rich bodies remain readable Markdown in this inspector; final rich-feature rendering comes in stage 6. `mountedColumns.inspect()` shows authoritative source, IDs, history and errors.
- Type several adjacent characters in one child, move the caret, type again and undo/redo with real Ctrl/Cmd shortcuts. Expected only the intended child changes, one owner history, natural typing grouping, stable unaffected views and no forced owner scroll jump per character. `stage5Layouts.mountedV3ColumnLayouts(mountedColumns.view)` exposes mounted projections for manual identity/focus inspection.
- Enter continues inside text/list blocks, then exits on an empty final line/item. Shift+Enter at beginning/middle/end and the very end of the final child inserts in that same column and focuses the new paragraph. In the inspector, literal code bodies are source text; dedicated code/Mermaid/math widget keyboard acceptance must be repeated after stage-6 rich adapters are connected.
- Select a column block with the projected view's V3 handle-selection helper, Shift-extend and copy/cut/paste consecutive blocks. Expected correct order, new IDs on paste, stable IDs on moves and no raw structural headers in plain copies. Ctrl/Cmd+A selects current content first, then the entire owner document. Normal selections must not overwrite a split sibling owner's history.
- Drag the real dividers: pointer move previews only; release commits one owner action. Escape, pointer cancellation and window blur cancel with no history change. Try arrows, Shift+arrows and Home; minimum widths hold. Undo/redo restores proportions. Start a drag, mutate the owner through a separate console command, release: it must cancel cleanly rather than apply stale geometry. Read-only/unavailable/composing owners reject resize writes.
- Use `mountedColumns.applyOperation(...)` for Add column / Equal widths / Stack blocks and transfer DTOs while observing the surface. Surviving column projections should retain their view objects after sibling removal/addition. Width-only edits keep projection DOM. Stack/dissolve removes the grid without duplicate hidden editors; undo recreates the exact IDs and hierarchy. Final menu/slash/gutter routing remains a stage-6 acceptance item.
- Narrow the overlay through 680px and 520px. Expected three/two-column responsive stacking follows existing container rules; widening restores saved proportions and creates no history. Check a narrow split/hosted container later in stage 6. Enable OS reduced motion: existing divider transitions follow the reduced-motion CSS path.
- Use a real IME. Native composition in the active registered column should publish body deltas to the owner without an independent history. Structural actions must wait until composition finishes, including actions aimed at another column. No text loss, duplicate caret, stale projection error or composition remount is acceptable. These runtime behaviors were not exercised by the agent.
- Switch Source Mode on: grids disappear and real headers/directives are editable. Make source temporarily invalid, inspect diagnostics and switch live: no silent rewrite or partial last-valid-coordinate write. Repair/undo in source, then return live: valid IDs, widths and content return. Test read-only and `setAvailable(false)` guards; restore before continuing.
- To review drop geometry manually, import `columns/v3/v3-column-drop.ts` and call `resolveV3ColumnDrop({owner:mountedColumns.view,blockIds:[...],pointer:{clientX,clientY},isAvailable:()=>true,onError:console.error})` with measured viewport coordinates. Expect vertical targets for side creation, horizontal targets within/outside layouts, ordered moves, rejection of nested/max-column destinations and safe stale-target rejection. The returned target matches the existing drag controller contract. Actual grip drag ghosts, edge scrolling, Escape/cancel and split-pane routing must be reviewed after the stage-6 controller adapter consumes these targets; this phase did not simulate dragging.
- Finish with `mountedColumns.destroy(); reviewHost.remove();`. Expected no mounted V3 projections/layout controllers, orphan divider listeners or capture handlers after deferred cleanup. Repeat mount/source-toggle/destroy if manually checking leaks.

Known limits and commit suggestions

No runtime or performance measurements were taken. Full visual/rich/drag/hosted/persistence acceptance remains stage 6/7. Current format-2 behavior was left active. This phase does not introduce old native-document migrations or bypass attachment/reference authorization.

Suggested commits (not created):

- `feat(editor): add v3 column transactions and owner projections`
- `docs(editor): document v3 column integration and manual acceptance`
