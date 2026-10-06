# Trash permanent deletion ID correction

## Scope

Phase 5 manual-review bug fix after a reported PostgreSQL `nodes_parent_id_foreign` violation during permanent deletion. No next-phase work.

## Cause

The Trash implementation treated collection keys as node IDs after calling Eloquent Collection `only()`. The installed Laravel implementation returns `array_values($dictionary)`, resetting those keys to indexes starting at zero.

Consequences in the previous implementation:

- Permanent deletion/unlinking received collection indexes rather than the selected nodes' actual primary keys.
- Combining subtrees with index-based union dropped distinct nodes that shared collection indexes, giving incorrect bulk preview totals and navigation-cleanup IDs.
- Node attachment lookup used the same incorrect indexes.

The reported request failed inside `DB::transaction`, before post-commit file cleanup, so that request's database changes rolled back and it did not reach file deletion. This correction does not perform data repair or delete any application data during development.

## Fixed

- Subtree collections explicitly retain node-ID keys after Eloquent `only()`.
- Preview aggregation inserts each node using its actual ID, correctly deduplicating overlapping selected subtrees.
- Preview node IDs are extracted from model `id` fields.
- Permanent deletion uses the same unique ID list as the fresh, fingerprint-verified server preview for both unlinking and removal.
- Owned attachment lookup reads node `id` fields directly, without relying on collection indexing.
- Restrictive hierarchy foreign keys, ownership scope, transactional rollback, and post-commit storage cleanup remain in place.

## Libraries / schema

No new library, migration, or persistent-format change. The correction uses the existing Laravel collection implementation, inspected directly in `vendor/laravel/framework/src/Illuminate/Database/Eloquent/Collection.php`.

## Validation

- Targeted PHP formatting: PASS.
- `./vendor/bin/pint --test`: PASS.
- PHP syntax checks for ManageTrash and TrashCatalog: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS; existing large-chunk and mixed-import warnings remain.
- `git diff --check`: PASS.
- Automated tests: neither written nor run, per user instructions.
- Destructive/manual verification: pending user validation; no application data was deleted during implementation.

## Manual test checklist

Close any old deletion confirmation and refresh Trash before testing, so the preview uses the corrected code. Use disposable fixtures.

1. Create an unrelated retained document and a disposable folder containing a nested folder, a document, and a database with two documents. Upload an attachment to one disposable document and save fully. Trash one child separately, then trash the top folder.
   - Expected: Trash groups the folder and shows its complete subtree, including the separately trashed child.
2. Open permanent deletion for the disposable folder and inspect the totals; cancel once.
   - Expected: the node count includes the folder itself and every descendant exactly once. File counts include its owned attachments. Cancelling changes nothing.
3. Reopen the confirmation and delete the disposable folder permanently, then reload.
   - Expected: no foreign-key exception. The selected folder and all its descendants disappear. The unrelated retained document remains accessible with its original content and attachments.
4. Create and trash two independent disposable folders with different numbers of descendants and files. Select both and delete permanently.
   - Expected: preview totals equal the combined distinct nodes/files, and both complete subtrees disappear. Unrelated content remains unchanged.
5. Create disposable trashed content in two workspaces; run Empty workspace Trash for one workspace.
   - Expected: only the chosen workspace's Trash is emptied. The other workspace's Trash and active content remain intact.
6. Using disposable content, repeat the operation that originally produced the reported error (bulk deletion or Empty all Trash, as applicable).
   - Expected: the operation completes without `nodes_parent_id_foreign`; the selected scope matches the preview. Deleted workspaces still require exact names.
7. Restore a disposable document with attachments instead of permanently deleting it; also check another account's content where available.
   - Expected: recovery preserves content/files, and other accounts' data remains inaccessible and unaffected.
8. Open a deletion preview, change one of the selected items in a second browser window, and submit the older preview.
   - Expected: the stale deletion is rejected before data removal; refreshing and opening a new preview shows the current scope.

## Commit suggestion

`fix(trash): use model IDs for subtree previews and permanent deletion`

No commit created. Existing staged changes were left untouched; the correction is available as a working-tree diff.

## Stop gate

Await manual review; remain in Phase 5.
