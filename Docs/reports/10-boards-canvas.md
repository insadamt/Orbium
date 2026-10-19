# Boards phase 2 completion report

## Phase

Boards phase 2 — Spatial persistence and canvas navigation, 2026-10-18.

The user approved the foundation and requested this phase with “okey next”. Architecture was recorded before implementation in [10-boards-canvas.md](../phases/10-boards-canvas.md). This phase stops before the broader shared-block adapters, resource cards, and Mind Maps.

## Implemented

- Added `boards` and Board-owned `board_objects` with stable UUID identity, position, manual dimensions, layer, paragraph type, canonical Markdown content format 2, independent spatial format 1, and a Board revision.
- Backfilled existing Board Nodes, including trashed ones. New Board creation initializes its extension through the existing hierarchy transaction. No Document Node is created for a block.
- Added scoped JSON GET/PUT snapshot endpoints under the existing authenticated workspace write middleware. Whole snapshots validate before object replacement; writes lock the Board revision and reject stale saves with HTTP 409. Reads hold a shared lock so objects and revision form a consistent snapshot.
- Added bounded geometry, object-count/text-size validation, version checks, UUID uniqueness, paragraph syntax/link validation, and database foreign-key/CHECK constraints. Unsupported media, Orbium references, and non-paragraph blocks cannot silently bypass the later shared-block lifecycle.
- Replaced the empty Board landing surface with a spatial canvas using the existing shell and appearance. Details expands the existing title/cover/icon controls; favorites and breadcrumbs remain native.
- Added wheel/touchpad pan, cursor-centered Ctrl/Cmd+wheel zoom, middle/Space drag, touch background pan and two-finger pinch/pan, fit-all/selection, reset, dot-grid visibility, and 16-unit move/resize snapping.
- Added click/modified-click/marquee selection, group movement from handles, right/bottom/corner resizing, keyboard move/resize, duplicate, delete, front/back layering, and 40-entry local undo/redo for content/object actions.
- Added double-click quick text, Enter to edit, Escape/Done to finish, and keyboard focusable paragraph cards. Only the active paragraph has a CodeMirror instance; inactive previews reuse Orbium's rich-body renderer. Paragraph editing shares the Markdown dialect, inline formatting implementation, source highlighting, and supported link validation. Text source uses CodeMirror's own selection, composition and undo behavior while editing.
- Camera/drag feedback uses DOM refs and requestAnimationFrame. React/domain changes occur on completed object gestures, with bounded viewport updates for preview culling. Pan/zoom alone never sends a content save.
- Added debounced autosave with one request in flight and a pending latest snapshot. IME composition delays saves. Network/validation failures keep pending edits; conflicts stop further writes. Retry, local draft download, and confirmed loading of the latest server version are available.
- Added sessionStorage recovery per Board, isolated across browser tabs and independent of shared app-tab IDs. Guarded existing navigation, cached-tab activation, app-tab close, and native unload; visibility/pagehide also persist pending drafts. Board tabs fetch current server content rather than restore stale cached revisions.
- Extended the existing content-preservation middleware exception to Board saves, so paragraph leading/trailing spaces and empty strings survive request normalization.

## Explicitly not implemented in this phase

- Other block types, full rich/live-preview editing parity, slash menus, automatic content-driven height, media uploads/Library references in blocks, or document mentions from Board paragraphs.
- Live Document cards, new sibling Documents created from canvas, and Database/Board reference cards.
- Object clipboard copy/paste, connections, frames/groups, drawing, minimap, and Mind Map blocks.
- Persistent/cross-session undo history, Board paragraph body indexing in Search Master, Board content statistics, split panes, or full portability/export/import support.

Search Master continues to find Board pages by title. The local JSON download is a recovery aid, not an account archive or a supported import package. Board cover/icon Library usage remains the existing supported media flow.

## Commits

No commits were created. Phase 1 and unrelated editor/history/split-loading changes were already uncommitted and were preserved. Keep unrelated files out of a Boards commit.

Suggested logical commit messages:

1. `feat(boards): persist spatial objects with revision conflict protection`
2. `feat(boards): add canvas navigation and paragraph interactions`
3. `feat(boards): protect unsaved canvas drafts across navigation`

## Migrations / persistent format changes

- Added `2026_10_18_000002_create_board_content.php`; original migrations were not rewritten.
- Inspected the generated SQL with `--pretend`, then applied only this migration to local PostgreSQL successfully: `55.94ms DONE`.
- Foreign keys retain content throughout soft deletion and cascade only on permanent deletion of the owning Board/Node/workspace. Downgrade refuses if any Board objects remain rather than silently deleting content. The downgrade guard was reviewed, not executed against user data.
- Spatial snapshot format: `format_version: 1`; Markdown format: `content_format_version: 2`; Board revision starts at 0 and advances on successful snapshot writes.
- Other installations must apply the new migration before using this code.

## Validation results

| Check | Actual result |
|---|---|
| `./vendor/bin/pint --test` | Passed; formatting check only. |
| `php -l` on 13 phase-2 PHP files | Passed. |
| `npm run types:check` | Passed. |
| `npm run lint` | Passed: 576 files formatted; no warnings/errors across 481 linted files. |
| `npm run build` | Passed: 5,405 modules; final build completed in 11.78s. |
| `php artisan route:list --path=boards` | Passed: native show plus GET/PUT content routes registered. |
| Migration SQL inspection | Passed. |
| Local migration application | Passed. |
| `git diff --check` | Passed. |
| Automated tests | Not written or run, as instructed. |
| Interactive acceptance / touch / performance benchmarks | Not performed; manual review remains required. |

The build retains warnings for chunks over 500 kB and mixed static/dynamic imports of existing document helper components (crop dialog, property header, opening preview, and editor loader). No build error. Log: `/tmp/orbium-boards-canvas-build.log`.

New source files are split by persistence, recovery, geometry, camera, pointer gestures, object history, rendering, editing, and controls. The largest new source file is the pointer hook at 422 lines.

## Manual validation checklist

Use a disposable Board named **Canvas review**, plus an existing phase-1 Board to inspect backfill behavior. Refresh the running application so it loads the current assets. The local migration is already applied. Unless a step deliberately exercises an error, wait for **Saved** before reloading or switching tasks.

| Step | Exact action | Expected result |
|---|---|---|
| 1 | Open the existing Board, then create/open Canvas review through the normal explorer. | Both load a canvas without losing Node title, parent, favorite state, or page media. No Document is created for their blocks. |
| 2 | Double-click empty space, type `A connected idea`, and press Escape. Use **Text** to add a second paragraph. | A block appears where requested; Text adds near the viewport center. Each block is independently selectable and editable. Saved appears after debouncing. |
| 3 | Double-click a block, select a word, and use Bold/Italic/Strikethrough/Inline code or their Ctrl/Cmd shortcuts. Add an ordinary Markdown link, then press Escape. | Shared formatting modifies canonical Markdown; the inactive preview renders formatting and link text. Only the active block mounts an editor. |
| 4 | Edit a paragraph with leading/trailing spaces, non-Latin text, emoji, and several paragraph breaks. Wait for Saved, reload, and edit it again. | Source content survives unchanged. Text wrapping and paragraph breaks remain readable. |
| 5 | Click a block once; Shift/Ctrl/Cmd-click another; then drag empty space around several blocks. Clear with Escape/empty-space click. | Selection states are distinct from editing. Modified clicks toggle selection; marquee adds intersecting blocks; clearing changes no content. |
| 6 | Drag a selected block's top handle. Select two blocks and drag either handle. Try dragging the inactive body instead. | The handle moves the object/group with stable relative positions. Ordinary body selection does not move a block. A completed move persists after reload. |
| 7 | Select a block and drag its right edge, bottom edge, and lower-right corner. Shrink it and enter editing with long text. | Dimensions stop at 160×100 minimum and 4,000 units maximum. The editing surface scrolls internally and content remains available; it does not pan the canvas. Reload preserves size. |
| 8 | Focus the canvas/card. Press Enter to edit; Escape to finish; use arrows, Shift+arrows, and Alt+arrows. Use Tab/Shift+Tab to focus cards. | Enter activates the selected paragraph. Arrows move it; Shift moves farther; Alt resizes. Typing/text selection inside CodeMirror is not intercepted by canvas shortcuts. |
| 9 | Start a move/resize, press Escape before releasing, then release. Repeat by switching browser-window focus during the gesture. | The preview restores its original geometry. Canceled gestures create no save/history entry. |
| 10 | Scroll a mouse wheel and touchpad horizontally/vertically. Try middle drag and Space+drag, including over block handles. | The canvas pans smoothly without object movement or page scrolling. Releasing Space returns to selection mode. |
| 11 | Hover near a block corner and Ctrl/Cmd+wheel zoom repeatedly; then use zoom buttons, **Fit all blocks**, **Fit selection**, and **Reset view**. | Wheel zoom keeps the pointed-to canvas position anchored. Zoom stays within 10–400%. Fits frame the requested objects where the supported zoom range allows; reset returns to 100%/origin. |
| 12 | Hide/show dots. Enable Snap, drag a block and resize it. Pan/zoom, wait a moment, reload. | Move/resize settles on 16-unit increments. Camera and dot/snap settings restore in this browser without changing shared content revision. |
| 13 | Select overlapping blocks; use **Duplicate**, **Bring selection to front**, **Send selection to back**, and **Delete selection**. | Duplicates have new object IDs and an offset; originals remain. Layering changes which card is on top. Delete removes only selected Board objects. Reload preserves the result. |
| 14 | Undo and redo creation, text edits after finishing, a group move, resize, duplication, layering, and deletion using toolbar/shortcuts. | Content/object states return in order; redo restores them. Camera movements do not enter history. In-editor undo stays with CodeMirror; Board history is bounded and resets on leaving the Board. |
| 15 | With Network filtered to `/content`, wait for Saved; drag a block continuously for five seconds, then release. Pan/zoom separately. | No PUT is emitted for individual pointer moves. One debounced snapshot PUT follows the completed gesture. Pan/zoom alone emits no content PUT. |
| 16 | While editing long text, select text normally and scroll inside the editor. Use an IME if available and pause during composition. | Selection works, scrolling stays in the editor, and the canvas does not intercept editor shortcuts. Partial IME composition is not sent as a save; the completed text later saves. |
| 17 | Use touch where supported: one finger on empty space, two-finger pinch/pan, then drag a block handle and resize. | Empty space pans, pinch zooms around its midpoint, handles move/resize, and switching gestures does not leave a moved preview or stuck pointer capture. |
| 18 | Edit, immediately click another app tab/new-tab action/back button, and immediately try closing the Board tab. | Dirty/in-flight content blocks leaving/closing and requests a flush. After Saved, repeat the action; navigation succeeds. Returning fetches current server content. |
| 19 | In DevTools Network choose Offline, edit text/move a block, and wait for Not saved. Try app navigation; then go Online and use Retry save. | The latest changes remain visible and recoverable; navigation is guarded. Retry writes the retained latest snapshot and reaches Saved. |
| 20 | Repeat an offline failed edit. Return Online and reload without first retrying (accept the browser's unsaved-change warning if shown). | The same browser session recovers the local draft. If the server revision still matches, it resumes saving; otherwise it shows conflict controls and preserves the local content. |
| 21 | Open the same Board in two browser windows or two app tabs while Saved. Save a change in the first, then change the stale second editor without reloading it. | The stale save receives 409; the first save is not overwritten. The second editor shows Not saved/conflict and retains its local draft. |
| 22 | In the conflict UI, download the local draft. Choose Load latest, cancel once, then confirm it. | The downloaded JSON contains local content/layout. Cancel preserves it. Confirmed successful loading replaces local state with the current server snapshot and resets history; a failed GET keeps the draft. |
| 23 | Add a heading/list/fenced-code/image/Orbium-reference source to a paragraph, wait for an error, then correct it back to ordinary paragraph text. | Unsupported content receives a clear validation error and remains local for correction; no attachment/mention or Document is created. Corrected paragraph text can be retried/saved. |
| 24 | Save a nonempty disposable Board, trash it, restore it, then permanently delete a different disposable nonempty Board after review. Also trash/restore its parent folder. | Soft deletion hides the Board but retains all objects. Restoration returns identical content/layout. Permanent deletion removes only the owning Board's objects; other Boards and ordinary Documents remain intact. |
| 25 | Switch Light/Dark, Normal/Frosted, and Reduce Motion; resize the window. Expand Details and edit title/media after saving. | Canvas/cards follow appearance; controls stay usable at narrow widths. No extra camera animation is introduced. Title/media changes preserve the Board snapshot. |

For a manual renderer inspection, `.board-paragraph-input .cm-editor` should match zero elements outside editing and one while one paragraph is active. This selector deliberately excludes retained Document editors elsewhere in the shell.

### Manual request-level checks

Copy a real Board content PUT from browser DevTools Network. Keep the authenticated session/CSRF header, set `Accept: application/json`, and edit only its JSON payload. Use a disposable Board, keep its complete original snapshot, and inspect a subsequent GET after each rejected request. These are user-operated checks; no test code was added or executed.

1. Resend an older revision after a valid save.
   - Expected: 409; the current objects and revision do not change.
2. Change `format_version` to 2 or an object's `content_format_version` to an unsupported value.
   - Expected: 422; no partial object deletion/update.
3. Duplicate an object UUID within the payload, omit one required geometry field, use width 0/height -1, use coordinates beyond ±10,000,000, or send nonnumeric geometry.
   - Expected: 422; the previous snapshot remains intact. UUID duplicates differing only in case are also rejected.
4. Add an unexpected object property such as `parent_id` or `document_node_id`.
   - Expected: 422; no Node relation or Document is created/changed.
5. Supply more than 1,000 objects, over 16 KiB UTF-8 in one paragraph, or more than 512 KiB total paragraph source.
   - Expected: rejected before any snapshot replacement. The UI also prevents over-limit typing/duplication where applicable.
6. Replace paragraph source with a heading, list, image, reserved attachment/page reference, unsafe link scheme, or NUL text.
   - Expected: 422 and no saved content/index/media changes.
7. Use the path of a foreign workspace/Board, a Document Node, a trashed Board, or a Board below a trashed folder for GET and PUT.
   - Expected: scoped 404/rejection; no content is exposed or mutated.
8. Use an empty `objects` list with the current revision on a disposable Board, then reload it.
   - Expected: a valid empty Board with an incremented revision. An absent/non-list `objects` payload is rejected instead.
9. Inspect the owning Node's `children`, `documents`, and Board object records read-only after ordinary creation/movement/duplication.
   - Expected: objects retain UUID identities and Board ownership; the Board remains a hierarchy leaf, and there is no Document row per block.

## Known limitations and recovery boundaries

- This is a usable canvas/paragraph phase, not the complete Boards specification. Rich block adapters, references and indexing/Library lifecycle for them are still gated work.
- Objects use manual height. Preview text may be clipped in a small card; enter editing to scroll all its content, or resize it.
- History holds 40 local snapshots and is not durable across navigation. Camera/dots/snap are browser-local per Board.
- Recovery uses sessionStorage. Reload/restoration in the same browser session can recover drafts; closing/clearing that browser session is not a durable backup. Browser storage failure is reported, and the user must keep the editor open until Saved or download the draft.
- App navigation canceled while dirty is not automatically replayed: wait for Saved and repeat the action. Forced browser history/termination relies on session recovery.
- Read/write conflicts deliberately require resolving against the latest server version; this is not collaborative editing or automatic merging.
- Practical limits are documented above and in the phase brief. Touch, large-Board performance, and visual behavior require manual review; no benchmark claim is made.
- The original specification still ends partway through Mind Map requirements. Obtain its missing remainder before dependent later work.

## Issues discovered/fixed during verification

- Request normalization would have trimmed Board Markdown; extended the existing preservation exception.
- A separate revision/object read could mix concurrent versions; snapshot reads now lock the Board row through both reads.
- Duplication could exceed aggregate text limits or reuse an ambiguous layer; duplicate operations now check both limits, and layer indices are normalized.
- A rejected text-size update could otherwise leave text visible only in CodeMirror; the editor now prevents the transaction before it changes the displayed document.
- Culling initially settled only after navigation stopped; bounded viewport updates now reveal content during continuous navigation without per-frame React updates.
- Shared app-tab preferences can change IDs during browser reload/history; recovery now follows the Board within each isolated browser session rather than depending on an app-tab ID.
- Formatting discrepancies were corrected and the relevant checks rerun successfully.

## Stop gate

Stop after Boards phase 2 and wait for explicit user approval before the broader shared-block phase. User-reported problems belong to this phase and should be fixed before proceeding.
