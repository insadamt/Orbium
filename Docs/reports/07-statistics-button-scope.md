# Statistics button and scope review

Date: 2026-10-15. Status: implemented for manual review within the Statistics
milestone; no new phase started.

## Changes

- The standalone Statistics chart button above the page now opens the shared
  dialog directly, defaulting to the open document, folder, or database.
- Workspace roots and Library default to the current workspace. Pages without
  workspace context default to Account.
- The dialog's scope selector offers This page when applicable, Account, and
  every owned active workspace. Switching scope keeps the underlying page open.
  Closing and reopening restores the current page's default scope.
- Statistics was removed from document/explorer/database entry menus and
  navigator actions. Statistics-only three-dot buttons were removed from
  folder/database headers and the legacy document toolbar.
- The button reads the active retained tab's cached page context when available.
  Embedded pages have a standalone button above their content.
- Existing counts, save handling, APIs, migrations, and rebuild behavior are
  unchanged. No data migration or rebuild is needed for this UI review.

## Validation

| Check | Actual result |
|---|---|
| Changed TypeScript formatting | Passed |
| `npm run types:check` | Passed |
| `npm run lint` | Passed; formatting and lint checks clean |
| `npm run build` | Passed; existing large-chunk and ineffective-dynamic-import warnings |
| `git diff --check` | Passed |

This review changes frontend controls only; PHP/database behavior is unchanged.
No automated tests were written or run. Browser behavior remains for the user's
manual acceptance.

## Manual checklist

1. Open a document and click the chart button above the page. Expect the
   Statistics dialog to select **This page**, showing that document's totals.
   Expect the document URL, editing state, and save status to remain unchanged.
2. Select **Account · All workspaces**. Expect account totals. Select a
   **Workspace** option. Expect only that workspace's totals. Return to
   **This page** and expect the original document's totals.
3. Close the dialog while Account is selected and reopen it. Expect This page
   again. Open another document and repeat: expect the new document's totals.
4. Open a folder or database and click the top chart button. Expect This page
   to show that container's descendants. Open a workspace root or Library:
   expect its workspace selected by default. Open Settings: expect Account.
5. Inspect document three-dot menus, explorer item/context menus, and database
   entry context menus. Expect no Statistics item. Folder/database headers and
   the legacy document toolbar must not retain a statistics-only three-dot button.
6. Switch retained document tabs, then use the top chart button. Expect the
   active document's totals. In a split view, activate each side before opening
   Statistics and expect that side's document. Embedded pages must expose a
   standalone chart button above their content.
7. With DevTools throttling enabled, change scopes quickly. Expect the latest
   selected scope to win; old responses must not replace it. Close while loading,
   reopen, and expect a fresh request for the default scope.
8. Check keyboard focus, Enter/Space activation, selector navigation, Escape
   dismissal, narrow screens, Light/Dark, and Normal/Frosted appearances.
   Expect readable controls, scrollable dialog content, and normal editor use
   after closing the dialog.

## Suggested commit

`fix(statistics): open page totals from the standalone scope button`

No commit was created. Stop for manual review.
