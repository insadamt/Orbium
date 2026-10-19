# Boards phase 1 completion report

## Phase

Boards phase 1 — Native page foundation, 2026-10-18.

The repository's one-phase rule applies. This delivers the native page identity and integration layer, not the complete Boards specification. The source attachment stops in section 8 after “Unlimited subtopics within practical”; remaining Mind Map requirements and any later sections are unavailable.

Architecture and phase boundaries were recorded before source implementation in [24-boards.md](../docs/24-boards.md) and [09-boards-foundation.md](../phases/09-boards-foundation.md).

## Implemented

- Added `board` to supported Node types with a new PostgreSQL constraint migration. Boards have no Document record and no hierarchical children.
- Boards can be created at workspace root or in folders through explorer context menus, the account creation menu, Search Master, and the older hierarchy interfaces.
- Creation, individual moves, bulk moves, and restoration retain the existing hierarchy action, workspace write lock, ownership scope, sibling ordering, cycle checks, and database-only-document rule.
- Added an authenticated Board page at `/workspaces/{workspace}/boards/{node}`. Generic Node links redirect there. Opening verifies the entire folder ancestry, so Boards under trashed folders are unavailable.
- Reused the existing Inertia shell, floating controls, breadcrumbs, appearance, tab history/persistence, tab transitions, and `PanelsTopLeft` Lucide icon.
- Integrated Grid/List/Gallery, title/type filtering, type sorting, drag/reorder and group movement, explorer context actions, Search Master titles/recents and `type:board`, and Trash type filtering/icons.
- Added a favorite toggle using the existing `nodes.is_favorite` field: Board page button, explorer context action for all Node types, and the existing explorer filter menu's new Favorites choice. Favorites filtering is within the current container.
- Reused page-header title, cover, icon, upload/crop, and Library selection controls. Board page media are included in existing saved Library usage and deletion protection. Library usage links navigate to the Board.
- Search Master creation from an open Board targets the Board's parent folder/root. Board pages offer no child creation, and Boards are excluded from container selectors and drop-inside targets.
- Reused Trash, restoration, and permanent deletion. Permanent deletion also removes matching Board locations from tabs, cached pages, and history through the existing cleanup flow.
- The Statistics button uses workspace statistics while viewing a Board, since Board content statistics do not exist yet. The empty Board has no inactive page-search/canvas controls.
- Updated the domain/scope/data-model handoff documentation for the fourth Node type.

## Explicitly not implemented in this phase

- Infinite canvas navigation, spatial object schema/persistence, selection, movement/resizing of Board objects, connections, frames/groups, drawing, clipboard, layering, or object undo/redo.
- Board block editing adapters or a separate block editor. The current document editor and its unsaved-work/conflict mechanisms remain the basis for later adapter work.
- Live Document cards, new sibling Documents created from canvas cards, or Database/Board reference cards.
- Shared Mind Map blocks in Documents or Boards.
- Split-pane support for Boards, Board content statistics, Board document-package export, or whole-account Board archive support.

These require subsequent approved phases. The Board page explicitly says that canvas editing is unavailable.

## Commits

No commits were created. Existing editor/history changes and additional concurrent split-loading changes were preserved. Do not include those unrelated files in a Boards commit.

Suggested logical commit messages:

1. `feat(boards): add native board nodes and enforce leaf containment`
2. `feat(boards): integrate board pages with navigation and lifecycle`
3. `feat(navigation): expose node favorites in explorer filters`

Documentation may accompany the corresponding logical changes.

## Migrations / persistent format changes

- Added `2026_10_18_000001_allow_board_nodes.php` without editing the historical migration.
- Inspected the migration SQL with `--pretend`, then applied only this migration to local PostgreSQL successfully (`12.63ms DONE`). Existing node rows/content were not rewritten.
- Rollback refuses when any Board Node remains, including trashed Boards; it never converts or deletes Board data to fit the old constraint. The rollback guard was reviewed, not executed against user data.
- No new content table, editor format, attachment format, or document-package version.
- Other deployments must apply the migration before using the updated creation UI.

## Validation results

| Check | Actual result |
|---|---|
| `./vendor/bin/pint --test` | Passed. This is a formatting check. |
| PHP syntax checks on 11 changed PHP files | Passed. |
| `npm run types:check` | Passed. |
| `npm run lint` | Passed: 561 formatted files; no warnings/errors across 467 linted files. |
| `npm run build` | Passed: 5,390 modules; final build completed in 12.06s. |
| `php artisan route:list --path=boards` | Passed: Board show route registered. |
| `php artisan route:list --path=favorite` | Passed: Node favorite PATCH route registered. |
| Migration SQL inspection | Passed: only the named type constraint is replaced. |
| Local migration execution | Passed: Board migration applied. |
| `git diff --check` | Passed. |
| Automated tests | Not written or run, as explicitly instructed. |
| Interactive browser acceptance | Not performed; the user will validate manually. |

Build warnings remain for chunks over 500 kB and mixed static/dynamic imports of existing document helpers: the crop dialog, database-property header, document-opening preview, and document-editor loader. These are warnings, not build failures. The final build log is `/tmp/orbium-boards-build.log`.

The initial sandboxed migration-status command could not connect to PostgreSQL. The same read succeeded outside the sandbox, and the inspected Board migration was then applied successfully there.

## Manual validation checklist

Use a disposable workspace named **Boards review**. Create a folder named **Research**, a database named **Reading list**, and a document named **Notes**. Record their IDs from their URLs when doing the request-level checks. Start/refresh the application using the normal development workflow; the local migration is already applied.

| Step | Exact action | Expected result |
|---|---|---|
| 1 | At workspace root, right-click empty space → **New Board**. Enter **Root ideas** and create it. | A Board page opens at `/workspaces/{workspace}/boards/{id}` with the correct title, icon, workspace breadcrumb, and an explicit empty state. No child document is created. |
| 2 | Open **Research**. Use the account menu's **New board** entry to create **Research ideas**. | The Board belongs to Research; its breadcrumb is workspace → Research → Research ideas. Root ideas remains at root. |
| 3 | Return to root. Open `Ctrl + Space`, type `> new board`, and create **Search ideas**. Repeat while viewing **Research ideas**, creating **Sibling ideas**. | Search ideas is at workspace root. Sibling ideas is inside Research, alongside Research ideas; it is never a child of the Board. |
| 4 | Open Reading list and inspect Search Master's `> new` commands and the database's document creation flow. | New Board/Folder/Database commands are absent for the database context. Creating a database document still works. |
| 5 | In the root and Research explorers, switch **Grid**, **List**, and **Gallery**. Open the type filter → **Boards**; then choose **All types** and **Type** sorting. | Board icons/titles render in each view, only direct children appear, Boards filtering excludes the other types, and type sorting is stable after reload. |
| 6 | Right-click Root ideas → **Rename** and change it to **Root research**. Open it and edit the page title to **Root knowledge**; blur or press Enter. | Both rename paths save. Explorer title, breadcrumb, tab title, browser title, and Search Master reflect Root knowledge after navigation/reload. |
| 7 | On Root knowledge, click **Favorite** and reload. Return to root and choose the explorer's **Favorites** filter. Use its context menu → **Remove from favorites**. | Favorite state persists across reload. Favorites lists Root knowledge before removal and hides it afterward. Choose All types to see it again. |
| 8 | With Manual order selected, drag Root knowledge onto Research. Open Research, reorder it beside another Board, then drag it to the existing move-out target. | Moves and sibling order persist after reload. Moving out puts the Board back at workspace root with a corrected breadcrumb. |
| 9 | Ctrl/Cmd-click a Board and Notes to select both; drag the selection onto Research. | Both move together through the existing group-drag interaction and preserve their relative order. No content is duplicated. |
| 10 | Drag a document over the center of a Board card. Try dragging a Board over the center of Reading list. | Neither produces an inside/nesting placement. A sibling reorder may be offered, but a Board never gains children and never becomes a database child. |
| 11 | Focus a Board and press Ctrl+Enter, or use its context menu → **Open in new tab**. Switch among a document, database, and Board; use Back/Forward, then reload. | The Board uses the ordinary app tab with its Board/custom icon and correct title. History and tab restoration work. Existing document editing still works after switching back. |
| 12 | Open `Ctrl + Space` and search the exact Board title, then `type:board`, then `type:board in:Research`. Open a result using the keyboard. | Exact title finds the Board; type-only search lists Boards; folder filtering returns only Boards inside Research. Results open the original Board. |
| 13 | On a Board, change the cover and icon, first by upload and then by **Choose from Library**. Reload; inspect its Gallery card and tab. Open the chosen image's Library details and saved usage link. | Media persist and match the Board; usage identifies the Board and opens it. Library refuses deleting a saved image still used by a Board. |
| 14 | With a Board open, click Statistics. Switch Light/Dark and Normal/Frosted appearance; enable Reduce Motion and switch tabs. | Statistics opens the workspace scope without a failed Board request. The Board uses the shared appearance, and tab motion respects reduced motion. |
| 15 | Delete a disposable Board from its explorer context menu. Open All Trash, filter **Boards**, inspect it, and restore it. | The Board disappears from normal explorer/search; Trash shows the Board icon/type. Restoration returns it to the original parent with title, media, and favorite state intact. |
| 16 | Trash Research while it contains a Board. Try the Board's saved direct URL and search for it; then restore Research. | The Board is unavailable while its ancestor is trashed, absent from normal search, and available again in its original location after restoring Research. |
| 17 | Open another disposable Board in an app tab, then trash it from another tab. In Trash, review and confirm its permanent deletion. | Deletion removes the Board's matching tab/history/cache locations. Its direct URL is unavailable. Uploaded files remain in Library under the existing page-deletion policy. |
| 18 | Sign into a second account, or change only the workspace ID in a Board URL to a workspace that does not own that Board. | The Board is not exposed. A foreign account cannot open, rename, favorite, upload media to, move, trash, or restore it. |

### Manual request-level containment and ownership checks

Use browser DevTools **Network** to copy/replay a normal Node create, move, favorite, or bulk-move request from this disposable workspace. Keep its valid session and CSRF header. Set `Accept: application/json` and remove `X-Inertia`/`X-Inertia-Version` when replaying so validation errors are visible directly. This is a user-operated acceptance procedure; no test files or test suite were added.

1. Replay `POST /workspaces/{workspace}/nodes` with `{ "type": "board", "title": "Invalid database child", "parent_id": DATABASE_ID }`.
   - Expected: HTTP 422 with a `parent_id` validation error; no Board is created.
2. Replay that create request using a Board ID as `parent_id`, first with `type: document`, then `folder`, `database`, and `board`. Also attempt a Board under Notes (a Document ID).
   - Expected: every request is rejected with a `parent_id` validation error; the leaf Nodes remain childless.
3. Replay `PATCH /workspaces/{workspace}/nodes/{board}/move` with `{ "parent_id": DATABASE_ID, "position": 0 }`, then use a Board ID as the destination for another Node.
   - Expected: HTTP 422; the source stays at its prior parent/order.
4. Replay `POST /workspaces/{workspace}/nodes/bulk` with `{ "action": "move", "node_ids": [BOARD_ID, OTHER_SIBLING_ID], "parent_id": DATABASE_ID }` (start with two real siblings). Also try a Board as the destination.
   - Expected: the entire batch is rejected; neither sibling is partially moved.
5. Replay create/move/favorite requests using a foreign-workspace Node ID, and a favorite payload `{ "is_favorite": "invalid" }`.
   - Expected: foreign resources remain inaccessible (404 or scoped validation rejection); invalid favorite state receives 422 and does not change the stored flag.
6. Optional read-only database inspection: select the created Board Node and look for the same ID in `documents` and `databases`.
   - Expected: the Node has `type=board`, the expected parent, and no row in either extension table.

## Issues found and addressed during verification

- Frontend formatting initially failed on the new edits; formatted only the files touched for Boards, then reran the check successfully.
- Older metadata restoration would turn Board tabs into workspace tabs; added Board to the existing allowed kinds.
- Permanent-deletion URL matching omitted Board routes; extended the existing matcher.
- The generic Statistics action would target a nonexistent Board statistics scope; scoped that action to the workspace for this foundation.
- New and substantially edited source files remain under approximately 500 lines. No dependencies, separate navigation infrastructure, editor rewrites, or unrelated refactors were added.

## Stop gate

Stop here for manual validation of Boards phase 1. Do not begin spatial canvas implementation until the user explicitly approves this phase. Obtain the missing specification text before dependent Mind Map/later work.
