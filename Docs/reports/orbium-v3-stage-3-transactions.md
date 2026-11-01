Summary: Reports the inactive V3 stable-ID owner-command implementation, actual quality checks and exact manual history/integrity review. It depends on `../docs/26-v3-owner-transactions.md`, the stage-2 structural index and the specification's stage-3 boundary.

# V3 stage 3 — owner transactions

## Phase and delivered work

The user approved this stage with “continue” on 2026-10-31. The stage-3 command foundation is implemented for isolated review; it is not activated in the existing editor.

- Added explicit DTOs and planners for identified insertion, complete-body replacement, text conversion, paragraph/heading splitting, compatible paragraph merge, consecutive deletion, duplication and same-scope movement.
- Prepared operations bind to an exact owner token/state/source, generate IDs once and verify declared identity/type/scope changes plus untouched source bytes before dispatch. Filter-altered, stale, read-only, invalid-source, nonconsecutive or no-op requests reject without an owner write.
- Duplication remaps real block/layout/column headers, including descendants, while retaining literal header examples, page/media IDs, map-topic identities and rich source. Movement keeps structural IDs and relative order.
- Text conversion preserves all list items, continuations, nesting and readable checkbox states; callout conversion retains authored titles. Splitting balances inline marks and refuses cuts through atomic syntax/content. Rich/ambiguous transformations fail safely.
- One owner history transaction carries the actual source edits, selection and existing inverted motion effects. The live adapter uses current permission/IME checks and existing motion/widget-retention services. No child editor history was created.
- Added an isolated manual transaction inspector with undo/redo, stale-plan, selection, permission and composition controls; added a focused manual sample and maintained the phase/technical docs.

Ten new TS files are separated by responsibility; all are below 500 lines. The stage-2 field now exports its existing pure safe-body range mapper so candidate planning can reuse it. Prior stage-1/2 changes remain in the working tree.

## Boundaries and known limitations

- Current UI, keyboard shortcuts, source/live rendering, drag, autosave and persistence remain format 2. The motivating corruption cases are not claimed fixed in the active editor yet.
- Cross-column/in-out moves, new layout creation and final-child column cleanup/dissolution belong to stage 5. Their commands reject now. Existing whole-layout move/delete/duplicate and same-column edits are supported by the foundation.
- Generic split applies only to paragraphs/headings. Lists stay one block. Conversion into rich/callout types, nested opaque content conversion and ambiguous inline merges require dedicated lossless adapters; requests reject without flattening content. Incompatible alignment also rejects. Explicit conversion away from numbered-list type removes its type-specific list style.
- Body replacement is an explicit bulk primitive; callers must retain presentation/rich metadata in the supplied body. Generic whole-layout replacement is denied.
- Structural candidate validation can scan source and compare all unaffected blocks. Safe ordinary body mappings avoid a full source parse; no measured performance improvement or constant-time update is claimed.
- Live widget/column focus handoff, visual history/move behavior, browser IME and V3 split-linked transfers remain unverified until later integration. The manual inspector's composition flag only exercises its command guard. The live adapter is not mounted by the current app.
- Structural validation still does not substitute for rich schema, safe URL/rendering, workspace/asset/reference or server authorization checks. There are no database, API, dependency, active format or user-data changes.

## Actual verification

| Check | Actual result |
| --- | --- |
| Targeted `vp check` on transactions and `structure/v3-structure-state.ts` | PASS: formatting completed, no warnings/lint errors in 11 TS files. |
| `npm run types:check` | PASS after the final command/owner guard changes. |
| `./vendor/bin/pint --test` | PASS; PHP formatting only, no PHP behavior tests. No PHP source was changed in this stage. |
| `npm run lint` | FAIL: the same 18 existing formatting failures recorded in stage 1/2; none of those files changed. |
| `npm run build` | PASS, exit 0; final application build completed in 16.75 s. Existing chunk-size, ineffective import and plugin timing warnings remain. |
| Tracked/new-file whitespace, summaries and source line limits | PASS after final changes. |

The active application build does not bundle or execute these uninstalled foundation modules. Types/targeted lint cover their source; build success is not runtime acceptance. Documentation is ignored by the repository formatter/linter and was reviewed separately.

No automated tests, command-fixture runs, runtime assertions, browser interaction or browser automation were performed by the agent. `php artisan test`, `npm run test` and Playwright were not run. Expected results below are for the user's manual acceptance, not reported observations.

## Manual setup

Use the development app with its normal Vite server running. In developer tools, import the inspection modules and read the disposable sample. If `/@vite/client` is absent, use the normal development setup and reload first. These steps create an isolated in-memory owner; they do not edit the open Document, import the sample or save anything.

```js
const viteOrigin = new URL(document.querySelector('script[src*="/@vite/client"]').src).origin;
const v3Files = await import(`${viteOrigin}/resources/js/components/editor/markdown/structure/v3-document-file.ts`);
const v3Commands = await import(`${viteOrigin}/resources/js/components/editor/markdown/transactions/v3-transaction-inspection.ts`);
const nativeSample = await fetch(`${viteOrigin}/Docs/examples/orbium-v3-transactions.orbie`).then(response => response.text());
const sample = v3Files.decodeV3DocumentFile(nativeSample);
const session = v3Commands.createV3TransactionInspection(sample.source);
session.inspect();
```

Expected: valid source, 10 explicit blocks, zero undo/redo depth, no mounted editor or save request. The illustrative page/attachment references are not workspace-authorized content. Do not import this sample through the current UI. Create a fresh session from `sample.source` whenever a step asks for a reset.

## Manual checklist

1. **Insert and same IDs on redo.** Run `const inserted = session.applyOperation({kind:'insert', target:{parentId:null, beforeId:'tx-heading'}, type:'paragraph', body:'More.'})`; inspect `inserted.createdIds`. Call `session.undo()`, then `session.redo()`.
   - Expected: one fresh block before `tx-heading`, one additional undo action, original IDs/bodies unchanged. Undo removes exactly that block and restores original source/selection. Redo restores the same generated ID and accepted source, not another UUID.
2. **Merge a compatible pair.** In that redone state run `session.applyOperation({kind:'merge', earlierId:'tx-second', laterId:inserted.createdIds[0]})`.
   - Expected: `tx-second` survives with `Again.More.`, the inserted ID retires and the source caret is at the join. One undo restores both exact blocks; another undo reverses insertion. Redo restores original transaction IDs in order.
3. **Separate conversion/merge actions.** Reset. Convert with `session.applyOperation({kind:'convert', blockId:'tx-heading', type:'paragraph'})`. Then merge `tx-second` with `tx-heading` in a second command. Undo once, then again.
   - Expected: first command retains `tx-heading` ID and both heading lines; second retains earlier `tx-second` ID. First undo restores two paragraphs; second restores the original heading/source. No later items or adjacent block types change.
4. **Nested checklist meaning.** Reset and convert `tx-tasks` to `paragraph`. Inspect the body, then undo/redo. Separately convert it to bullet/numbered/checklist types from a fresh session.
   - Expected: `TASK-ONE`, `NESTED-CHECKED`, `TASK-TWO`, checkbox states and continuation text remain readable. Paragraph source uses escaped list markers, not discarded checkbox/item content. Between-list conversion retains nesting/continuation lines and explicit type/ID; each command undoes once.
5. **Inline split.** Reset and run `const split = session.applyOperation({kind:'split', blockId:'tx-first', offset:10})`. Inspect source/IDs, undo, redo.
   - Expected: `tx-first` contains `Hello **wo**`; the new paragraph contains `**rld**.`. Presentation/inline syntax stays balanced. Undo restores exact original source; redo restores the same trailing ID. Repeat offsets 0 and 16 on fresh sessions; empty blocks remain identified.
6. **Atomic split refusal.** Reset. Attempt `{kind:'split',blockId:'tx-reference',offset:5}`, `{kind:'split',blockId:'tx-styled',offset:3}`, and a split at offset 0 on a rich/list block such as `tx-code`/`tx-tasks`.
   - Expected: an explicit error (`atomic-split`, `opaque-body` or `unsupported-split` as applicable), unchanged source/history/selection and no regenerated existing IDs. Choose an offset outside an atomic inline item when splitting a supported text block.
7. **Presentation and rich guards.** Reset. Convert `tx-styled` to `heading-2`, undo, then try converting it to `bullet-list`. Convert `tx-callout` to paragraph in a fresh session. Attempt code-to-paragraph and a text-to-rich conversion separately.
   - Expected: supported heading conversion retains ID, color/underline source, RTL and center metadata; incompatible list alignment rejects without change. Callout authored title/body survive. Generic rich conversion rejects rather than flattening code/media/table/map data. Later adapters will implement only lossless explicit conversions.
8. **Opaque duplicate and semantic references.** Reset. Duplicate `tx-code`, then `tx-reference`, undoing/resetting between cases. Inspect each returned `copiedIds` map and source.
   - Expected: copied real block header gets a fresh ID; literal `++block` inside the code still names `tx-first`. Literal attachment text and the page destination `orbium:node/123` are unchanged. Undo/redo restores the exact copied IDs; no asset/page identity is regenerated.
9. **Ordered multi-block commands.** Reset and duplicate `['tx-heading','tx-tasks']`. Separately move them with `{kind:'move', blockIds:['tx-heading','tx-tasks'], target:{parentId:null,beforeId:'tx-first'}}`. Try reverse/nonconsecutive IDs and a missing target.
   - Expected: accepted operations keep relative order; moves retain IDs, duplicates get fresh IDs. Original unselected bodies/types remain byte-identical. Invalid ranges/destinations fail without partial removal/insertion; adjacent/no-op moves do not add history.
10. **Delete/focus/empty owner.** Reset, delete `tx-second`, undo/redo. Create an empty paragraph and delete it. In a fresh session delete all root IDs in document order. Also create a session from an empty string and insert its first empty paragraph.
    - Expected: ordinary/empty deletion focuses preceding content, or the next block if deleting the first. Each delete undoes once and restores retired IDs. Deleting all blocks yields a valid empty source/index. First insertion into empty flow creates one identified paragraph without replacing an unrelated title or record.
11. **Complete body edits and identity protection.** Reset, replace `tx-second` with `Updated text.\n\n`. Then try body source containing a new unescaped `++block` header or malformed directive. Try replacing the whole layout body in the column sample in the next step.
    - Expected: the valid edit retains the block's ID/type; surrounding blocks remain exact. Undeclared identities/malformed syntax and whole-layout body replacement reject before dispatch. Metadata must be included in a bulk body replacement when it is intended to remain.
12. **Whole layout operations.** Load `Docs/examples/orbium-v3-columns.orbie` through the same `fetch`/native decoder and create a fresh transaction session. Duplicate `review-layout`; inspect IDs, undo, redo. Separately move the original layout before `columns-summary`, then delete the original layout in a fresh session.
    - Expected: duplication changes 7 structural identities (layout + 4 child blocks + 2 columns), yielding 12 total blocks/4 columns. Original scopes/widths and raw rich payloads remain intact. Root layout movement retains all IDs; deletion retires its full subtree only. Trailing layout separator whitespace is removed with it so the preceding paragraph acquires no extra content. Undo restores exact hierarchy/widths/source/IDs in one action.
13. **Same-column operations and stage-5 boundary.** On a fresh columns session, insert a paragraph into `review-left`, reorder its children within that column, edit/duplicate a child and delete one while others remain. Separately try moving a child to `review-right` or root, creating a new columns block and deleting the last remaining child of a column.
    - Expected: supported commands use the one owner history and preserve siblings/column IDs. Cross-scope transfer/new-layout/final-child cleanup requests report the deferred stage-5 operation and change nothing; no empty-column or independent child-history state is introduced.
14. **Stale source and selection.** Reset. Prepare a duplication with `const pending = session.prepare({kind:'duplicate',blockIds:['tx-first']})`; change source using `applyRawSourceChanges`, then call `applyPrepared(pending)`. Repeat with `setSelection` instead of a source edit.
    - Expected: `stale-operation`, unchanged state relative to immediately before applying the stale plan. Reprepare to perform a new command; do not reuse a prepared plan after undo or another state change.
15. **Owner, permissions and composition.** Prepare a plan in one session and try applying it in a second session with identical source. Separately set read-only and try insert/delete/undo/redo; set composing and try preparing/applying a command. Restore the controls and retry appropriately.
    - Expected: wrong-owner/stale, read-only and composition guards reject before writes. Re-enabling editability does not make a plan from an older permission state current. The composition flag is only an inspection model, not browser IME verification.
16. **Malformed raw source recovery.** Reset and use `applyRawSourceChanges` to break a block header. Inspect `valid`, `source` and `lastValidSource`; attempt a structural command, then undo the raw edit.
    - Expected: actual malformed source remains present, the last-valid snapshot stays separate, commands reject with `invalid-source`, and undo can restore valid source without inventing IDs.
17. **EOF spelling.** Create a fresh session from `++block {"id":"eof","type":"paragraph"}++` (no final LF). Insert a new paragraph after it; separately replace the EOF block body, duplicate it and move a final unterminated ordinary block in a multi-block sample.
    - Expected: required header/body/separator newlines are inserted only at the affected boundary, IDs remain coherent, unrelated bytes are preserved, and one undo returns the original missing-LF spelling exactly.
18. **No active product switch.** Open ordinary/database/Board-hosted Documents through the current app; type, use Source/Preview, save/reload and inspect current export behavior.
    - Expected: existing format-2 behavior remains. No V3 keyboard binding, UI/motion, server save, migration or package-format change has been activated by this stage. Browser motion/IME/permissions/linked-history acceptance will be recorded when the new layer is integrated.

For every accepted action, compare source, explicit IDs/types, selection and undo/redo depth. For a rejected action, inspect the same fields after the error: they must not have changed as part of that rejected command. No visual/performance result is inferred from these isolated state checks.

## Commits and stop

No commits created. Suggested message:

```text
feat(editor): add stable-ID V3 owner transactions
```

Stop for stage-3 review. Fix reported transaction issues within this stage. The next stage is the approved keyboard/selection/paste behavior and requires explicit user approval; no stage-4 bindings or active V3 editor were started.
