# Unified Trash page report

The approved [UI redesign](05-trash-ui-redesign.md) supersedes this report’s presentation and ordinary-restoration interaction steps. Its backend safety checks and limitations still apply.

## Scope

Approved enhancement during Phase 5 review. No next-phase work.

## Implemented

- Standalone `/trash` page combining trashed workspaces, folders, databases, and documents.
- Account-wide and workspace-filtered entry points through the floating account menu; Settings → Workspaces also links to the unified page. The existing workspace-management quick Trash controls remain available.
- Title/original-location search, workspace/type filters, newest/oldest/title sorting, and 30-entry pages.
- Selection across pages/search results, single and bulk restoration, single and bulk permanent deletion, and explicitly scoped Empty Trash.
- Deleted containers appear once with descendant counts. A details panel exposes their expandable contents, marks separately trashed children, and provides restore/delete actions for those separately trashed children.
- Read-only document excerpts, original paths, deletion dates, owned attachment counts, and attachment sizes.
- Restoration uses the original location and preserves document bodies, database values, and attachments. Restoring a container does not restore separately trashed children.
- Restoring a separately trashed child under a deleted ancestor requires an explicit Restore with ancestors choice. This can make the ancestor's other retained contents visible.
- Permanent deletion previews the selected entries and unique affected node/file totals, includes all descendants regardless of their individual Trash status, and requires exact names for every selected workspace.
- Empty Trash explicitly ignores search and type filters; its scope is the chosen workspace or the entire account.
- Ownership checks and workspace locks protect all mutations. Deletion compares a fresh server fingerprint against the preview and rejects changed scopes before deleting.
- Database deletion removes dependent records through existing foreign keys and explicitly removes owned attachment records. File removal happens after commit; failures produce a user warning and a server log for administrator cleanup.
- Successful permanent deletion clears matching retained document pages, open tabs, deleted navigation-history entries, split groups, and recent node IDs. Existing unsaved-change guards run before deletion of affected open documents.
- Trash tabs have their own title/icon and survive navigation persistence and refresh.
- The existing workspace permanent-deletion endpoint now only accepts a trashed workspace.

## Libraries

Reused the existing Radix Dialog wrapper and AppSelect. Radix handles dialog/select accessibility, focus, and keyboard interactions; it does not implement server ownership, lifecycle behavior, or storage cleanup.

Reviewed TanStack Table for selection, sorting, and pagination. It still requires application-specific rendering, server integration, and selection scope management. The approved first version uses a focused list and Laravel/Inertia without adding a dependency.

References:

- https://www.radix-ui.com/primitives/docs/overview/accessibility
- https://tanstack.com/table/latest/docs/guide/client-side-vs-server-side

## Migrations / persistent format changes

None. Existing soft-deletion fields and foreign-key contracts are reused. Browser navigation accepts the new `trash` tab kind without changing its storage key.

## Validation results

- Targeted frontend formatting: PASS.
- `./vendor/bin/pint --test`: PASS.
- PHP syntax checks for all new backend files: PASS.
- `php artisan route:list --path=trash`: PASS; five authenticated Trash routes registered.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; no formatting warnings or lint errors.
- `npm run build`: PASS. Existing warnings remain for chunks over 500 kB and document modules imported both statically and dynamically.
- `git diff --check`: PASS.
- Automated tests: neither written nor run, per user instructions.
- Interactive and destructive behavior: awaiting user manual validation. No application data was deleted while implementing this feature.

## Manual test checklist

Use disposable content for permanent-deletion checks.

1. Create two workspaces, **Trash Lab A** and **Trash Lab B**. In A create a folder **Container**, a nested folder, a database with two documents, and a standalone document. Give one document distinctive text, database property values, and an uploaded image/file. Save fully before continuing.
   - Expected: content is accessible and saved before any Trash operation.
2. Trash the standalone document and one database document. Open the floating account menu → **Trash** from A's workspace explorer.
   - Expected: a full Trash page opens filtered to A; both documents appear with original paths and deletion dates. The tab is named Trash and shows the Trash icon.
3. Open the standalone document's **Details**.
   - Expected: its excerpt is readable and noneditable. Owned attachment count/size is shown; no editor/autosave mounts in the preview.
4. Search by the standalone document's title, clear the search, filter to Documents, and change all three sort options.
   - Expected: filtering and sorting affect the list. A search with no match shows the no-results message. The top floating search also filters Trash.
5. Restore the database document. Reopen its database and document.
   - Expected: it returns to its original database with the saved body, property values, and files intact. It disappears from Trash after refresh.
6. Trash a document inside Container separately, then trash Container. Open Trash and expand Container's Details and its nested folders.
   - Expected: Container appears once. Its retained children and separately trashed child are distinguishable. The separately trashed child has Restore/Delete controls.
7. Restore Container itself.
   - Expected: retained children become accessible again. The separately trashed child stays deleted and appears as its own Trash entry. Restore that child separately to recover it in its original location.
8. Repeat the previous setup, but restore the separately trashed child from Container's Details while Container is still deleted.
   - Expected: confirmation requires **Restore with ancestors**. Confirming restores the needed ancestors and the selected child. Other independently trashed descendants remain deleted.
9. Trash disposable documents in both workspaces. Use **All Trash**, select several entries, change the search, and choose Restore selected.
   - Expected: the selection count clearly includes hidden selections, the dialog lists all selected entries, and restoration affects only those entries. Changing workspace/type clears selection.
10. If you have over 30 independent Trash entries, select entries on two pages and return to the first.
    - Expected: page controls work; Select this page affects only that page; selections persist across pages and the action preview includes them all.
11. Permanently delete a disposable standalone document with an owned attachment. First cancel the confirmation, then repeat and confirm.
    - Expected: cancellation changes nothing. Confirmation lists node/file totals, shows a pending state, and removes the document from Trash permanently. Reloading does not bring it back. Its former document/file URLs are unavailable. Its stored attachment file should be absent on the server.
12. Permanently delete a disposable folder containing nested folders, database documents, files, and a separately trashed child.
    - Expected: totals include the entire subtree without duplicate nodes/files. Every descendant disappears, including the separately trashed child. Unrelated content in the workspace remains intact.
13. Open disposable content in another app tab, trash it, and permanently delete it from Trash.
    - Expected: successful deletion removes its retained page and affected tabs/history. If an affected document is still saving or has unsaved changes, deletion is blocked until the existing save guard allows cleanup. Other open tabs continue working.
14. Trash Trash Lab B as a workspace. Find it in All Trash, inspect its contents, and try permanent deletion with an incorrect name before entering the exact name.
    - Expected: confirm stays disabled with an incorrect name. With the exact name, the workspace, all descendants, and owned files are removed. Other workspaces remain available.
15. In A's filtered Trash, set a search/type filter hiding some entries and choose Empty workspace Trash. Cancel once, then confirm using disposable data.
    - Expected: the dialog states that search/type do not limit deletion and previews all A Trash roots. Confirmation empties only A's Trash, leaving B/unrelated workspaces untouched. Empty all Trash previews every workspace, requiring exact names for deleted workspaces.
16. Open a permanent-deletion confirmation in one browser window. Restore or otherwise change one selected item in another window before confirming the first.
    - Expected: the old request is rejected before deletion. Close the dialog, refresh, and review the current selection again.
17. Refresh with Trash as the active app tab, use app Back, switch between Trash and another tab, and test with no active workspaces remaining.
    - Expected: Trash's title/icon and route persist; Back/tab navigation works; All Trash remains reachable even when all workspaces are deleted.
18. Use Tab/Enter to operate filters, checkboxes, Details, and dialogs; cancel dialogs with Escape. Check Light, Dark, Frosted, Normal, and reduced-motion settings.
    - Expected: keyboard focus remains visible, dialogs contain focus, cancellation does not mutate data, content is readable, and no essential behavior depends on motion.
19. Sign in as another user or use a separate browser profile. Try the first user's workspace filter and item detail URLs.
    - Expected: ownership checks return 404; the other account's Trash and counts do not expose the first account's content.

## Known limitations

- The list has client pagination; the server currently loads account hierarchy/attachment metadata to build grouped roots and action previews. Very large accounts may need server pagination and more targeted subtree queries.
- Search/type filters operate on grouped root entries; expand Details to inspect descendants. Active children hidden by a trashed container are shown by title/type rather than full document excerpts. Excerpts are limited to 4,000 characters.
- Bulk requests accept up to 1,000 explicitly selected entries. Empty Trash evaluates its server-side scope without that selection limit.
- File cleanup failure does not roll back committed database deletion. A warning and server log identify the cleanup problem; no background retry infrastructure was added.
- Links/mentions and shared content references to permanently deleted items/files become unavailable. This change does not rewrite surviving editor bodies to remove those references.
- Restoration to a different destination, automatic expiry, and a full rich-content Trash viewer were not included in the approved first version.
- Manual UI/data/storage verification remains pending.

## Commit suggestions

No commit created.

- `feat(trash): add unified page with bulk recovery and permanent deletion`
- Alternative split: `feat(trash): add owned subtree restore and permanent purge actions` followed by `feat(trash): add unified browsing and bulk controls`

## Stop gate

Await manual review; do not begin the next phase.
