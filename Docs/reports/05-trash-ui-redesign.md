# Trash UI redesign report

## Scope

Approved Phase 5 review correction after the user reported that the first Trash page did not feel native to Orbium. This report supersedes the presentation and recovery interaction steps in `05-unified-trash.md`; its ownership, permanent-deletion, storage, and concurrency checks still apply.

## Implemented

- Trash now uses the shared floating island spacing and the workspace manager's compact rows, avatars, typography, hover surfaces, and overflow menus.
- Workspace initials and folder/database/document icons identify entries. Each row has a title, truncated original path, compact deletion date, Restore action, and a Details/Delete permanently overflow menu.
- The page uses the existing floating search field. A compact result summary appears while searching; the duplicate content search input is removed.
- Workspace scope stays visible. Type and sort options live in one compact radio menu, with an active-filter indicator and Reset filters.
- Scope changes update the route and server props. The shell's workspace label and Trash breadcrumbs follow that scope, including deleted workspaces; All workspaces has no misleading active workspace label. Reload preserves the chosen scope.
- Empty Trash lives in the page overflow menu, retains an explicit account/workspace label, and preserves the server-checked destructive preview and exact-workspace-name requirements.
- Rows and Select page reuse the shared Radix checkbox. Select page displays a partial-selection state when appropriate. Selected rows receive a restrained surface highlight.
- A compact selection toolbar shows selected/hidden counts, Restore, permanent deletion, and Clear selection. Pagination appears only when multiple pages exist.
- Ordinary single/bulk restoration proceeds directly, with pending state and a success/error notification. Ancestor recovery retains explicit confirmation; separately trashed descendants retain their existing lifecycle rules.
- Details opens as a fixed-width Radix dialog drawer, with its own scroll area, metadata, document excerpt or expandable contents, and persistent actions. It does not resize or reflow the list.
- Separately trashed children use compact overflow actions. Menu/drawer transitions prevent focus restoration from overriding the next dialog's focus; normal drawer closure returns focus to its originating control or the page heading when that control was removed.
- The drawer has Normal/Frosted surface treatment and reduced-motion, reduced-transparency, and missing-backdrop-filter fallbacks. Narrow layouts keep row controls reachable and hide the date column to preserve title space.
- Source responsibilities are split between page orchestration, rows, avatars, page controls, restoration, and details. New files remain under 500 lines.

## Libraries

Reused installed Radix Dropdown Menu, Dialog, Select, and Checkbox components plus the existing AppSelect wrapper. Their primitives handle keyboard/focus behavior; they do not provide Orbium's surface styling, scope persistence, restoration logic, or deletion authorization.

Reviewed Radix Popover as a filter-panel option. It is not installed in this project, and the installed Dropdown Menu's radio groups cover the type/sort choices without adding a dependency. No dependency or lockfile changes.

References:

- https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- https://www.radix-ui.com/primitives/docs/components/dialog
- https://www.radix-ui.com/primitives/docs/components/popover

## Migrations / persistent format changes

None. The existing Trash lifecycle and permanent-deletion actions are retained. Workspace filtering now uses the existing `/trash?workspace=<id>` URL consistently.

## Validation

- Targeted frontend formatting: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; no formatting or lint warnings/errors.
- `./vendor/bin/pint --test`: PASS.
- PHP syntax check for TrashController: PASS.
- `npm run build`: PASS; existing warnings remain for chunks larger than 500 kB and document modules imported both statically and dynamically. The final build also reported plugin-hook timing overhead (81% of its 11-second build time).
- `git diff --check`: PASS.
- Automated tests: neither written nor run, per user instructions.
- Live visual/manual validation: pending. The in-app browser was unavailable during the UI investigation; this implementation was checked through source review and the above quality checks.

## Manual test checklist

Use disposable content for irreversible deletion checks.

1. Open Settings → Workspaces, note its row spacing/avatar/menu treatment, then open the unified Trash page.
   - Expected: Trash follows the same floating island and row language. The old three-action text stack and large filter form are absent. Permanent deletion is in each row's overflow menu.
2. Click the floating Search icon and search for a known trashed title or path. Clear with Escape/the search close control, then try a nonexistent title.
   - Expected: there is one search field, the list/count update, a short result summary appears, and the no-match state offers Clear filters.
3. Open Filter; change each type and sort option and use Reset filters.
   - Expected: choices are marked, remain usable with the keyboard, and the filter indicator appears only for a type filter or non-default sorting.
4. Change the workspace scope to another workspace, a deleted workspace, and All workspaces. Reload after each choice.
   - Expected: the URL, scope control, breadcrumbs, shell label, and displayed entries agree. The scope survives reload. Changing scope clears selection/details. All workspaces does not claim a selected active workspace.
5. Select one row, then use Select page. Select entries on multiple pages if you have more than 30 roots; change search to hide selected entries.
   - Expected: partial selection is visible, selected rows have a quiet highlight, and the toolbar shows total selection plus the hidden/off-page count. Clear selection resets everything. Pagination stays absent for a single page.
6. Click Restore on a standalone trashed document with distinctive content or database properties. Repeat with a bulk selection that needs no ancestors.
   - Expected: restoration happens without a confirmation dialog, pending controls prevent duplicate submissions, and a notification confirms success. Content/properties/files return to their original location intact.
7. Open Details for a trashed folder and restore a separately trashed child whose parent is still deleted.
   - Expected: a confirmation appears requiring Restore with ancestors. Cancelling changes nothing. Confirming restores the necessary ancestor chain and selected child while other separately trashed descendants remain deleted.
8. Click a title or its overflow → Details. Expand nested folders, scroll the drawer, and close it with Escape or its close button.
   - Expected: the drawer opens at the right, list width and scroll position stay stable, metadata/content are readable, and focus returns to the originating control. Nested rows use icons/chevrons and separately trashed children have overflow actions.
9. Open a document's Details and click Restore. Open a folder's Details and choose a child's Delete permanently action, then cancel the confirmation.
   - Expected: ordinary restoration closes the drawer after success; a new confirmation receives keyboard focus correctly when opened from a drawer/menu. Cancel leaves data unchanged and does not leave an invisible overlay blocking the page.
10. Open a row's overflow → Delete permanently. Cancel, then repeat with disposable content and confirm.
    - Expected: existing unique item/file totals and subtree warnings remain. Successful deletion removes the selected subtree; retained tabs/history cleanup and unsaved-change guards continue to work.
11. Choose the page overflow → Empty workspace Trash while search/type hide some entries; repeat with All workspaces using disposable content.
    - Expected: confirmation identifies the exact scope and explains that search/type do not limit Empty Trash. Deleted workspaces require their exact names. Cancelling changes nothing.
12. Check Light/Dark × Normal/Frosted, a narrow window, reduced motion, and reduced transparency where supported. Navigate rows, filters, selections, drawer, and confirmations using Tab/Enter/Escape.
    - Expected: text remains readable, controls have visible focus, compact layouts preserve actions, dialogs contain focus, and reduced-motion settings remove drawer/spinner animation.
13. Repeat the first report's stale-confirmation and cross-account checks.
    - Expected: changed deletion previews are rejected before removal; another user's content is never exposed.

## Known limitations

- Manual visual/data validation remains pending; the browser review could not be performed here.
- Root-only search/type filtering, 4,000-character document excerpts, client pagination, the 1,000-explicit-selection limit, and file-cleanup failure handling retain the first report's limitations.
- The deletion date column hides in narrow windows; the full timestamp remains available in Details.
- Restore to another location and a rich document preview are outside this correction.

## Commit suggestions

No commit created.

- `refactor(trash): align controls and layout with Orbium surfaces`
- If committing the complete uncommitted Trash feature together: `feat(trash): add native unified trash with bulk recovery and permanent deletion`

## Stop gate

Await user manual review. Remain in Phase 5.
