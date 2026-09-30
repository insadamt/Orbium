# Phase 4 — Search Master, Navigator, tabs and history

Implemented on 2026-09-30. Phase 5 has not started.

## Implemented

- PostgreSQL full-text search and trigram indexes; workspace-owned search service with title, tag, document body and selected database property matching.
- Deterministic ranking: exact title, prefix, fuzzy title, tag/property, then body. Container proximity and recency only break ties within a tier.
- Ctrl + Space Search Master with focused input, result groups, text snippets, keyboard selection, tag results, commands and direct opening.
- Filters: type:doc, type:folder, type:db, #tag, in:FolderName and quoted folder names. Folder filtering includes descendants.
- Empty search shows recent items plus commands. Results exclude trashed nodes and descendants of trashed ancestors.
- Commands create in the current container or a document's parent. Database contexts offer documents only. Settings, appearance, root navigation and Navigator commands are available.
- Ctrl + B Navigator with expansion, title-only tree filtering, keyboard traversal, context actions, rename, move, child creation, trash and tag replacement.
- Drag/drop reuses the existing hierarchy action. Drop on a container to append; Shift + drop places before a sibling. Root is a drop target. Rejections leave the displayed tree unchanged.
- Browser-local tabs scoped by account, explicit new-tab navigation, close/activate, reload persistence, per-tab history, scroll positions and database view/search state.
- Alt + Left/Right history. Ctrl + W and Ctrl + Tab handlers where browsers deliver these reserved shortcuts; visible controls are always available.
- Reveal in Navigator expands ancestors. Reveal in Orbit opens the parent with view=orbit and focus=<node ID>, ready for Phase 5.
- Body results seed the existing document find control and select a literal match when the editor can locate it.

## Persistent changes

Applied migration: 2026_09_29_000004_create_search_indexes_and_tags.

Adds tags, node_tag, title/tag trigram indexes and document/property full-text indexes. Existing editor content formats are unchanged. Browser tab state uses orbium.navigation.v1.<user ID> and is not a server schema contract.

## Validation

- npm run lint: PASS (formatting and lint).
- npm run types:check: PASS.
- npm run build: PASS, with warnings for chunks over 500 kB.
- ./vendor/bin/pint --test: PASS.
- git diff --check: PASS.
- php artisan migrate --force: PASS; the new migration applied.
- docker compose up -d --build app: PASS; the local app image rebuilt and container restarted after the UX revision. Nginx was restarted and the app container is healthy.
- Docker dependency installation reported 5 high-severity npm advisories in the existing dependency set. No dependencies were upgraded in this phase; these advisories remain unresolved.
- No automated tests written or run, per repository/user instructions.
- Interactive behavior and PostgreSQL search acceptance remain for the user's manual review.

## Manual acceptance checklist

Use the local app at http://localhost:18082 and hard-refresh after the rebuild.

1. In one workspace, create a folder named Projects, a nested folder, a database and documents. Aim for 30 mixed items. Include documents titled API Documentation and API Documentation Notes. Put the phrase “Bearer tokens are generated here” only in another document's body and wait for Saved.
   Expected: normal hierarchy, editor and database flows still work.
2. Press Ctrl + Space and search API Documentation.
   Expected: the exact title is first, followed by prefix/fuzzy matches; the input is focused immediately.
3. Search API Documntation.
   Expected: API Documentation appears as a useful fuzzy result.
4. Search Bearer tokens.
   Expected: the body-only document appears under Content with a snippet. Open it; document find contains the query and selects a literal match where available.
5. With Search Master open, use Up/Down and Enter. Press Escape, then reopen. Use Ctrl + Enter on a result.
   Expected: keyboard selection stays visible, Enter opens directly, Escape closes, Ctrl + Enter creates an app tab.
6. Use type:doc, type:folder, type:db and in:Projects, then combine type:doc in:Projects.
   Expected: only matching node types and folder descendants appear. A same-named folder does not include unrelated paths by text-prefix accident.
7. In Navigator, open an item's actions, choose Set tags and enter backend, reference. Search #backend, then search backend and select Tag: #backend.
   Expected: tagged items appear; selecting the tag narrows the query. Setting an empty tag list removes associations.
8. Add a Text database property containing a unique word such as zephyrmatrix. Search that word globally.
   Expected: its database document appears under Tag / property.
9. Open Search Master with an empty query after opening several documents.
   Expected: recently opened visible items and commands appear, without arbitrary unrelated nodes.
10. In a folder, type >new and create a document. Repeat from a document and from a database.
    Expected: creation uses the folder, the document's parent, or the database respectively. Folder/database creation is unavailable inside a database.
11. Press Ctrl + B. Focus the tree with Tab and use arrows, Enter and Shift + F10. Filter using a document title, then using a word found only in its body.
    Expected: keyboard traversal/context actions work; title filtering retains ancestor paths; body-only words do not match the tree.
12. Drag a document into another folder, then onto the root target. Shift + drag it before a sibling.
    Expected: parent/order changes persist after reload. Try moving a folder into itself/its descendant, or a folder into a database.
    Expected: invalid moves show a validation message without leaving a false tree state.
13. Rename and trash an item from Navigator; reload and search its old title. Also trash a folder containing documents.
    Expected: names update, trashed nodes and their descendants disappear from Search/Navigator. Existing Trash controls can restore them.
14. Use New tab on results and Ctrl-click hierarchy links. Navigate between several locations inside each tab. Close an inactive tab and switch active tabs.
    Expected: ordinary navigation reuses the active tab; explicit opening creates a tab; other tabs keep independent history.
15. In a database tab, select Gallery and enter a local title filter. Switch away and back, then reload.
    Expected: tab identity, active tab, database view and filter survive.
16. In one tab, navigate A → B → C. Use Alt + Left twice and Alt + Right once. Switch to another tab and repeat.
    Expected: each tab traverses its own history. Navigating somewhere new from B discards C from that tab's forward history. Scroll positions restore.
17. Edit a document and immediately attempt to switch tabs before autosave completes.
    Expected: the existing unsaved-content guard prevents navigation; tab identity/history do not advance. Retry once Saved appears.
18. Use Reveal in Navigator on a deeply nested search result.
    Expected: its ancestors expand and the target is selected. Use Reveal in Orbit.
    Expected: the parent opens with view/focus parameters; a notice explains that spatial focus arrives in Phase 5.
19. Switch workspaces and search for a unique title from the first workspace. Sign out and sign in with another account.
    Expected: results remain workspace-scoped and persisted tabs are account-scoped. Direct navigation to another account's workspace is rejected.
20. Use >Open Settings and >Toggle appearance. Close panels using Escape and use Tab through controls.
    Expected: commands work; focus remains within an open dialog and returns when it closes.

## Limits and interpretations

- Phase 5 owns the visual Orbit implementation.
- The document jump is literal text matching; full-text matches across formatting boundaries or separated words may open the find control without an exact selected range.
- Browser-reserved Ctrl + W / Ctrl + Tab may not reach the web app. Use visible tab controls in that case.
- Search returns at most 60 node matches and 10 matching tag choices.
- No favorites/frequency tracking or duplication actions were added; these are optional actions in the navigation specification.
- Searchable database values are text, number, select, multi-select, date, URL and email; file/mention identifiers are not searched as text.
- Browser-local tab state does not synchronize across devices.
- Build size warnings remain for the editor/diagram bundles and main application.

## Phase 4 visual and UX revision

- Reworked the workspace root and folder page into the same centered, calm content width and title scale as the document page.
- Replaced the permanent workspace panel with a compact switcher. Workspace creation, rename, ordering, trash and restore remain available in the switcher.
- Replaced always-visible node cards and form controls with a simple content list, a New menu and focused item actions.
- Reworked Search Master as a single input, grouped compact rows and a restrained keyboard footer. Secondary result actions appear on request; creation happens in an inline form.
- Reworked Navigator into a quiet left overlay with a clear filter and tree. Rename, tags, move and trash now use inline controls in its action area instead of browser prompts.
- Styled tabs and history controls to sit quietly alongside the document page.

Visual revision manual checks (live browser inspection was blocked by browser security policy for the open `127.0.0.1:8001` tab):

1. Open a document, then its parent folder and workspace root. Expected: centered content widths, similar title weight and spacing, and no permanent workspace sidebar.
2. Click New on the workspace page, choose each allowed type and cancel once. Expected: a stable menu and inline naming form; creation only occurs on submit.
3. Open Search Master, type a title and use keyboard arrows. Expected: one clear focus area, readable result hierarchy, selected row visible and secondary actions tucked behind the row action button.
4. Open Navigator, filter and expand several levels, then choose Rename, Tags, Move and Trash. Expected: controls stay in the panel, keep context visible and require a deliberate confirmation for Trash.
5. Switch between document and workspace tabs. Expected: tab controls stay legible but visually secondary to page content.

## Review findings addressed

- Database pages use a database prop rather than node; the shell now reads both so commands use the correct container.
- Creation waits for hierarchy context to load instead of silently falling back to root.
- Tab mutations commit only after successful Inertia navigation, preserving the document save guard.
- Empty-query recents are filtered before limiting search results.
- Folder filters use ancestor IDs rather than title-path pattern matching.

## Commits and suggestions

No commits created. Existing uncommitted Phase 3 changes were preserved.

Suggested logical commits, after separating the existing Phase 3 work:

- feat(search): add ranked PostgreSQL workspace search and filters
- feat(search): add Search Master commands and document jumps
- feat(navigation): add Navigator tree actions and drag and drop
- feat(tabs): persist workspace tabs and per-tab navigation history

## Stop gate

Await manual review and explicit approval before Phase 5.
