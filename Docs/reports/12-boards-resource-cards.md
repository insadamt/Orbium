# Boards phase 4 — Live resource cards

## Phase and result

The user approved phase 4 with “okey go ahead” after accepting the native Board correction. This phase adds live resource references while preserving independent native Board text, lists, tables, code, media and diagrams. Implementation is ready for the user's manual review; no browser acceptance results are claimed.

## Implemented

- **Link page / New Document** opens a scoped, paginated title picker for same-workspace Documents, Databases and other Boards. Parent/type context helps distinguish titles. Missing, foreign, trashed and self targets cannot be newly linked.
- Resource objects store only the original target Node ID and spatial geometry. Visible inactive cards load bounded live title/icon/text summaries in batches of 40, with focus/visibility, 30-second and explicit refresh. Full Document source and editor instances load only for the active Document card.
- Active Document cards use the existing Markdown/legacy editor and original save routes, validation, revisions, attachments, mentions and Mermaid cache. Database/Board cards open ordinary Orbium tabs. Hosted block transfers stay local; native Board blocks do not become Documents.
- New Documents are siblings under the Board's current parent folder or workspace root. Creation, validated Board snapshot/card insertion and an idempotency receipt are atomic. Identical uncertain retries reuse the same request and Document rather than creating duplicates.
- Single-request hosted autosave, upload/import/composition guards, session draft recovery, revision/format conflict protection, local draft download and confirmed latest-Document reload. Dirty/conflicting cards stay mounted and prevent switching, removal, undo/layout replacement, navigation and latest-Board replacement.
- Removing/duplicating/copying a card changes references only. Board deletion retains referenced resources; deleted/hidden targets become placeholders. No automatic mentions, hierarchy changes or Orbit edges are created by a reference.

## Persistence and compatibility

`2026_10_18_000005_add_board_resource_cards.php` was inspected and applied to local PostgreSQL in **41.29 ms**. It upgrades the Board spatial envelope/default to **4**, adds the native `resource` kind and creates `board_document_creations`. Native Board content format stays **1**; original Document formats remain unchanged. Historical migrations were not rewritten and no rollback was run.

Resource data accepts exactly `{ target_node_id }`; titles and Document source never enter Board snapshots. The target JSON ID deliberately has no cascading foreign key. Creation receipts have a unique Board/request UUID, payload hash, result revision and a nullable original-Document FK with SET NULL on permanent deletion. Board deletion cascades its objects/receipts only. Downgrade refuses while resource objects or receipts remain.

Existing format-1/2/3 local Board drafts retain explicit conversion/recovery; pre-format-4 drafts cannot contain resource objects. Previously saved unavailable references may be kept, moved, duplicated locally or removed; adding an unavailable reference to another Board is rejected. Existing 1,000-object, 256 KiB/object, 4 MiB/Board and geometry limits remain. Document source retains its existing limits. Creation POSTs preserve existing native text whitespace/empty strings.

Hosted Document recovery uses `orbium.board-document.{workspaceId}.{boardId}.{targetId}.draft.v1` in browser-tab session storage. Board drafts and uncertain creation requests use separate per-Board keys. Same-revision Document drafts resume saving; stale or unknown drafts remain protected. JSON downloads are recovery aids, not supported account archives/import packages. Closing/clearing a browser session may remove recovery data.

## Validation

- `./vendor/bin/pint --test`: passed across the repository.
- PHP syntax: passed for 15 relevant Board/controller/service/action/migration/bootstrap/route files.
- `npm run check:fix`: passed formatting and lint for 504 source files, without warnings/errors.
- `npm run types:check`: passed.
- `npm run lint`: passed; all 600 checked files formatted, 504 source files linted with no warnings/errors.
- `npm run build`: passed; 5,428 modules transformed in 14.77 seconds. Log: `/tmp/orbium-boards-resource-cards-build.log`.
- Migration SQL inspection and local application: passed; no rollback/data deletion.
- `php artisan route:list --path=boards`: passed, 10 registered Board routes including the four resource endpoints.
- `git diff --check`: passed.
- New Board source files and modified editor entry points remain under roughly 500 lines.
- **No automated tests were written or run**, as instructed. Manual/browser checks below are for the user and have not been performed by Codex.

The production build reports mixed static/dynamic imports for existing Document helpers, chunks over 500 kB and plugin timings. These warnings do not fail the build.

## Manual checklist

Use disposable data: a root Board A, a Board B inside folder F, another-workspace Board C, a normal Markdown Document D, a database document E, a Database and another Board. For legacy checks, use an existing format-1 Document if available. Wait for both Document and Board **Saved** before ordinary reloads; failures below are intentional. Open DevTools Network to inspect requests.

1. **Existing links:** on A choose **Link page / New Document**, search D and insert it; repeat for E, the Database and another Board. Expected: current titles/types/parent context, independent resource cards and no copied Document/Node. A itself and folders are absent. Search with no matches shows an empty result; Load more appends without duplicates when there are more than 40 matches.
2. **Current ownership:** inspect D/E in the explorer, database table and Orbit before/after linking. Expected: original IDs and parent remain unchanged; E stays in its Database. No new containment/mention/Orbit edge comes from the card.
3. **Root creation:** on A create `Board root note`. Expected: exactly one new Document at workspace root, one selected editable card and a saved Board. Open the original and confirm it is the same Document. Undo the insertion, then Redo. Expected: card disappears/returns; Document remains at root.
4. **Folder/current parent:** on B create `Folder note`. Expected: parent F, never B. Move B into another folder G through the normal hierarchy and create `Moved Board note`. Expected: new Document parent G; the previous Document remains under F. Board child/drop-inside creation remains unavailable.
5. **Whitespace preservation:** add native Text with leading/trailing spaces, an empty Code block and an empty table cell; save, then create a Document. Inspect GET `…/boards/{id}/content`. Expected: existing data keeps spaces/empty strings, format 4, native content format 1, resource data contains only target ID and no copied title/source.
6. **Edit original:** double-click D's card or select and press Enter/Edit. Type and format content, insert a real Document mention, code/table and media. Expected: existing Document controls, original Document PUT URL, one save request at a time, then Saved. Open/reload D normally: edits, mention indexing and attachments belong to D. Board layout revision does not advance merely because D's content changes.
7. **Shared references:** add D twice on A and once on B; edit one reference, finish, activate another. Expected: same original content and current revision. Only one card mounts the full editor at a time. After a normal external edit, focus the Board or click Refresh/wait 30 seconds. Expected: lightweight preview reflects saved content/title/icon without replacing an active draft.
8. **Legacy Document:** activate an existing format-1 Document card, edit/save and reopen the original. Expected: original legacy editor/save route and format preserved. Upload/import use original Document ownership. If no legacy Document exists, mark this step not applicable; do not change production source formats to manufacture one.
9. **Navigation cards:** double-click/Enter on Database/Board cards; use the open-original arrow on all card types. Expected: ordinary Orbium app tabs, original page identity, no embedded database or recursive Board editor. The source Board remains available in its tab/history.
10. **Card operations:** move/resize/layer/duplicate D's card; copy/cut/paste it to another same-workspace Board. Save/reload. Expected: new card UUIDs with the same target ID; original content/parent unchanged. Delete the card, then Undo. Expected: only the reference changes. Cross-workspace typed paste is rejected. Native block and Document block transfers remain separate.
11. **Guard dirty edits:** throttle Network, edit D, then try Done, another card, Delete, Undo, toolbar insertion, latest-Board reload, app-tab navigation/close and browser reload. Expected: pending/saving Document stays mounted; destructive/switching actions wait, navigation warns/blocks and no edits are lost. After Saved, switching/removal works. Browser forced termination relies on session recovery.
12. **Upload/import/composition:** throttle an upload in D and try the same actions; repeat with empty-Document Markdown import and IME composition. Expected: active operation remains protected, save waits for insertion/composition, then original Document saves. Offscreen previews or inactive cards cannot clear the active card's lock. Failed operations show errors and retain existing content.
13. **Culling and previews:** create many references, inspect Network, pan cards offscreen and back; keep one active card selected while panning. Expected: bounded preview GETs (at most 40 IDs/request), no full-source reads for inactive cards, offscreen inactive previews unmount, active Document stays mounted. Pan/zoom remains responsive; refresh failure offers explicit retry and preserves an active draft.
14. **Document conflict:** open D normally in browser tab A and its Board card in tab B. Load both before saving. Save A, then edit/save B. Expected: B's original Document save returns revision validation 422 (or 409 for applicable format conflicts), freezes editing and preserves its local draft; A remains unchanged. Download B's draft, cancel Load latest once, then confirm. Only confirmation replaces local content with current D. Repeat with another Board reference editing the same D.
15. **Conflict during upload:** start a throttled original-Document save/upload, advance D from another browser tab and allow the stale save to fail. Expected: ordinary editing freezes; an upload already started may finish into the protected local draft. Latest-Document replacement is unavailable while upload/import/composition/save remains active. Download contains the latest local result.
16. **Board conflict:** open the same Board in two browser tabs; save layout in A, then change layout in B. Expected: 409, B's layout draft protected with download/confirmed latest-Board controls. New-Document creation with a stale Board also returns 409 and creates no sibling/card. Dirty original-Document sessions must be resolved before replacing Board layout.
17. **Offline Document recovery:** go offline while editing D, wait for failure, then reload the same browser tab and activate D's card. Expected: a same-revision draft recovers; restore Network and Retry to save. If another tab advanced D, recovered edits remain local/read-only with conflict/download controls. If local storage is blocked/full, a warning says to keep the Board open until Saved.
18. **Unknown recovery:** on disposable data, set the Document draft key above to malformed JSON or `{"format_version":999}`; reload and activate the card. Expected: original recovery bytes retained, editor frozen, raw draft downloadable; cancel latest reload retains bytes and confirmation clears them only after a successful fresh fetch. Repeat the existing unknown Board-draft check; no partial conversion/save.
19. **Missing targets:** save a D card, then trash D or its ancestor from another browser tab. Refresh previews. Expected: unavailable placeholder without source disclosure, still movable/removable; other Board edits save. Restore D: preview/edit resumes. Permanently delete a disposable target and repeat: placeholder survives, removing it never deletes other resources. Newly inserting an already unavailable target is rejected.
20. **Board lifecycle:** trash/restore a Board with references and verify its layout returns. Permanently delete a disposable Board containing a newly created sibling Document. Expected: Board objects/receipts disappear; the sibling and all other referenced Documents/Databases/Boards remain at their original parents.
21. **Attachment ownership:** upload/reuse an image/file inside D's card, wait for Saved and inspect Library deletion review. Expected: usage points to D; removing the Board card does not remove D's file usage. Native Board media still points to the Board, including Trash. Unsaved drafts do not count as Library usage.
22. **Atomic validation:** copy a successful creation POST as fetch in DevTools. With a fresh request/object UUID and current Board revision, change one existing object to invalid geometry or resource data before sending. Expected: 422, no new sibling, no card, unchanged Board revision. Repeat with object limit/foreign target where practical. Do not reuse a successful creation key for this rollback check.
23. **Identical retry:** replay the exact successful creation POST immediately, before further Board writes. Expected: same Document/card/snapshot and no duplicate sibling. Change only its title with the same request UUID: 409, unchanged data. After moving a card and saving, replay the original request: 409 explaining creation already succeeded and Board changed; no duplicate Document. If its original Document was removed, expect 410. For a lost-response simulation, interrupt a throttled response after the server commits, reopen the picker and Retry: it reuses the stored payload rather than a new request.
24. **Creation guard:** throttle Network and create a sibling while native layout edits are pending. Expected: pending Board save completes first; creation runs once, form cannot close/edit/re-submit and navigation/close is protected until completion. Network errors keep the same request/title for retry. A known validation failure releases the guard and permits correction.
25. **API isolation:** from an authenticated request, replace Board/workspace/target IDs with C's workspace or IDs of trashed nodes/ancestors, folders and the Board itself. Expected: 404 on unavailable Board/full-Document reads, omitted unavailable targets in successful preview batches, or 422 on invalid snapshot target writes; no title/content disclosure or mutation. Preview IDs >40, unknown kinds/versions, copied source/title keys in resource data, duplicate UUIDs and invalid geometry are rejected with unchanged state. Older native Board draft envelopes still recover; a resource in a pre-4 draft fails visibly.
26. **Native/Document regressions:** exercise phase-3 transparent Text/Heading/List/Quote/Image/Divider in Light/Dark/Frosted; native rich/media/diagram controls; canvas clipboard, history, pan/zoom; normal Document editing/slash/table/media/math/Mermaid and split transfers. Expected: independent native Board objects, no permanent text backgrounds/six-dot grips/merging; normal Document pages retain their default behavior. References do not enable native-block transfer into Documents.

## Known limits

- Lightweight previews use bounded plain text, not full rich rendering; externally saved changes appear on explicit/focus/periodic refresh. An active editor requires explicit conflict resolution rather than silently replacing content.
- Session storage is local to the browser tab/session and is not durable backup. Unknown recovery data is downloadable; no Board import/export or account portability integration is added.
- Previously saved missing targets can be kept on their Board, but unavailable IDs cannot be newly linked to another Board. Restore the target first.
- Mind Maps, drawing/shapes, grouping/merge, embedded databases, recursive Boards and later requested phases are not implemented. The supplied Mind Map specification is incomplete.

## Issues fixed during review

- Per-object resource lock ownership prevents inactive/culling cards from clearing the active editor lock.
- Preview disappearance/error no longer destroys an active original-Document draft.
- Creation JSON bypasses string trimming/null conversion to preserve native snapshot text.
- Creation locks navigation without blocking the preceding layout flush; receipts retain safe retries and report removed targets explicitly.
- Conflict guards reject command-generated edits, preserve original format/revision errors and permit already-started uploads to finish into local recovery.

## Commits and stop gate

No commits created. Previous Board phases and unrelated pre-existing editor/history/split changes remain uncommitted; do not stage them as one undifferentiated change.

Suggested messages for logical commits:

- `feat(boards): add scoped live resource references and atomic sibling creation`
- `feat(boards): edit original documents with guarded hosted sessions`
- `docs(boards): document resource cards and manual acceptance checks`

Stop for phase-4 manual review. Fix reported defects within this phase. Do not start Mind Maps without explicit approval and the missing source requirements.
