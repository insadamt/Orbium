# Boards phase 3 — Shared native blocks

Historical report: the user rejected this document-fragment model. The replacement and current manual checklist are in `11-boards-native-correction.md`.

Implementation complete on 2026-10-18; awaiting the user's manual review. Phase 4 is not authorized.

## Implemented

- Board-owned native Markdown fragments, preserving UUID identity and independent spatial layout without creating Document Nodes.
- Shared dialect, inline formatting/selection toolbar, native block menus, slash insertion, heading/list/checklist/quote/callout/divider, code languages/copy, tables, presentation wrappers, image/file/video/audio/PDF, math and Mermaid. Source/Preview and Done remain inside the active object. Only that object mounts the editing engine; inactive objects use rich previews, including static code highlighting/copy.
- Shared nested-block dragging with a local-only resolver boundary. Reordering within one fragment works without exposing it to Document split transfer.
- Board-scoped attachment upload, metadata and download using existing storage, workspace authorization and Library binaries. Saved fragment references count in protected Library usage, including Board/ancestor Trash. Ordinary links work; page mentions remain rejected until their lifecycle is implemented in the next phase.
- Native template insertion, existing layering/duplication, explicit Fit height, and canvas copy/cut/paste. Copied objects preserve relative layout and receive fresh UUIDs. One paste/cut enters Board undo once; editor text clipboard/history remains local to the active fragment.
- Upload guards for object changes, layout/content actions and navigation. Autosave waits for upload insertion and IME composition. A conflict keeps an active editor mounted and read-only, allowing an upload already in flight to finish into the protected local draft.
- Explicit upgrade of valid format-1 paragraph recovery drafts. Unsupported/malformed drafts remain untouched and downloadable, with editing blocked until confirmed loading of saved content.

## Commits

No commits created. Earlier Boards phases and unrelated editor/split/history changes were already uncommitted and remain in the working tree.

Suggested logical commit messages after reviewing/staging the appropriate changes:

1. `feat(boards): support versioned native markdown fragments`
2. `feat(boards): reuse native block editing and workspace media`
3. `feat(boards): add scoped clipboard and fragment layout controls`

## Migrations and compatibility

`2026_10_18_000003_enable_board_markdown_blocks.php` upgrades Board envelopes/defaults from spatial format 1 to **2**, permits `paragraph` and `markdown` object kinds, and preserves original source and identities. Applied to local PostgreSQL in **23.99 ms** after SQL inspection. The sandbox could not reach PostgreSQL; the inspected migration succeeded with approved local database access. No rollback was executed. Downgrade refuses while any objects remain.

New/edited objects use `markdown`; untouched legacy `paragraph` rows remain valid. Markdown content format stays **2**. Old spatial clients reject the new envelope; format-1 write requests receive 422. The recovery storage key retains its historical `draft.v1` name so existing paragraph drafts can be found; the envelope inside is versioned independently. This is session recovery, not a supported import/export format.

Limits: **1,000 objects**, **128 KiB UTF-8 per fragment**, **2 MiB total source**; positions ±10,000,000; dimensions 160–4,000 by 100–4,000; zoom 10–400%. Native parser complexity and Mermaid's 50,000-byte source limit also apply. Whole-account/document-package formats are unchanged.

## Validation performed

- `./vendor/bin/pint --test` — passed.
- PHP syntax checks — passed for 10 relevant PHP files, including the new migration, Board action/services/controller, attachments, Library, reference availability and routes.
- `npm run types:check` — passed.
- `npm run lint` — passed; 579 formatted files and 484 linted files, no lint warnings/errors.
- `npm run build` — passed; 5,408 modules in 14.33 seconds. Build log: `/tmp/orbium-boards-blocks-build.log`.
- `php artisan route:list --path=boards` — six routes registered, including Board upload/metadata/download.
- Migration SQL inspection and application — passed against local PostgreSQL.
- `git diff --check` — passed.
- No automated tests were written or run, as instructed. No browser/manual acceptance results are claimed.

The build retains the existing mixed static/dynamic import warnings for document helper components and the chunk-size warning above 500 kB. The final build also reports plugin timings (mostly Babel transforms); it exits successfully.

## Exact manual checklist

Use a disposable Board inside a folder, a second Board in the same workspace, a Board in another workspace, an existing Markdown Document, and a few local PNG/video/audio/PDF/general files. Open browser DevTools Network with Preserve log. Wait for **Saved** before reload/navigation or Library management, except where a step intentionally checks failures.

1. **Upgrade and creation:** open a Board created in phase 2, note its text/position, reload, then create a fresh Board at root and another in a folder. Expected: old content/layout survives; new Boards open normally. GET `…/boards/{id}/content` reports `format_version: 2`; the explorer gains no Document Nodes from block insertion.
2. **Native text and templates:** use Text and Add block → Heading 1, Bullet list, Numbered list, Checklist and Quote. Enter content, click Done, then reopen each with double-click/Enter. Expected: native presentation and editing persist; all remain independently movable Board objects. Checklist toggles are editable while its fragment is active; inactive previews show their saved state.
3. **Slash and inline controls:** in Text type `/`, filter for Heading/Callout/Table, use arrows and Enter, then format selected text with the floating toolbar and Ctrl/Cmd+B/I. Apply a color or underline, switch Source/Preview, save and reload. Expected: the same native formatting and canonical source survive. Ctrl+Space still opens Search Master. Page-mention completion is absent.
4. **Code:** Add block → Code. Choose JavaScript in its native language picker and enter `const count = 1;`. Copy using the code control, click Done and use the preview's Copy control. Expected: language and highlighted source persist; both copies contain code only. Reopen and change language without altering layout.
5. **Tables:** Add block → Table; edit cells, add a row/column using native controls, format text in a cell, then Done/reopen/reload. Expected: cell content, structure and presentation persist. Table controls do not move the outer object.
6. **Callouts and wrappers:** add a Callout, enter multiple paragraphs and a nested list, and use its block menu to change a supported presentation property such as direction/alignment. Duplicate/reorder a nested block. Expected: shared controls preserve content and wrappers inside one spatial fragment.
7. **Nested dragging:** within one fragment with at least three native blocks, drag its native gutter grip to reorder, then undo/redo inside that editor. Expected: only its Markdown order changes. Dragging outside that fragment cancels and creates no Document/other-object content. Recheck existing Document-to-Document split dragging separately; its behavior should remain intact.
8. **Math:** add Math block and enter `x^2 + y^2 = z^2`; also add inline math within Text. Toggle native Edit/Preview and reload after Saved. Expected: KaTeX previews/source persist; invalid formulas show the native diagnostic without destroying source.
9. **Mermaid:** Add block → Mermaid, preview its sample graph, edit a label, expand the preview, then Done and reload. Expected: diagrams render through the existing sanitized renderer in both editor and inactive preview. Network must contain no `/documents/{boardId}/mermaid-previews` requests. Invalid diagram source stays editable with an error preview.
10. **Library image reuse:** in an active Text fragment use `/image`, choose an existing PNG and Use image. Resize/caption using native controls, Done, wait for Saved and reload. Expected: the original attachment ID/binary is reused; source metadata and image presentation persist.
11. **Uploads and dropped files:** use `/file` → Upload a new file, then drop/paste a supported image into an active fragment. Expected: uploads use `…/boards/{id}/attachments`, references insert at their anchors and save. Files are visible in workspace Library with Board upload provenance. No Document is created.
12. **Playable media:** insert `/video`, `/audio` and `/pdf` using both Library reuse and new uploads. While editing and after Done, try play/pause/seek/volume, PDF page/zoom and fullscreen. Expected: native controls work without canvas movement, no autoplay, and downloads remain available. Browser codec restrictions retain native download fallback.
13. **Preview scrolling and gestures:** create a long code/table/media fragment with small manual height. Scroll its body; pan/zoom over empty canvas, then repeat at 50% and 200% zoom. Expected: body scrolling stays inside the object; canvas gestures and native editing remain separate. Media controls do not select/move/resize objects.
14. **Fit height:** select a short fragment previously resized tall and click Fit height; repeat with long content after media/diagram loading. Expected: height shrinks/grows to the rendered preview within 100–4,000 units; content remains intact. Undo restores the previous height. Fit height is an explicit action; invoke it again after asynchronous previews load if necessary.
15. **Canvas clipboard:** select two differently sized/positioned/layered objects, Ctrl/Cmd+C, click blank canvas, then Ctrl/Cmd+V. Expected: two selected copies with new IDs and preserved relative positions/layer order appear near the view center; originals remain. One canvas Undo removes the pasted set; Redo restores it. Repeat between the two same-workspace Boards.
16. **Cut and native text paste:** select objects on the canvas and Ctrl/Cmd+X/V, then undo. Separately paste ordinary multiline Markdown from a text application onto the canvas and inside an active fragment. Expected: cut removes originals only after copy succeeds; canvas text paste creates one fragment; editor paste edits its own text. Native text copy is not replaced with object JSON. Applications that strip the custom clipboard MIME retain only Markdown, not geometry.
17. **Clipboard workspace boundary:** copy objects from the first workspace, open the other-workspace Board and paste while the custom clipboard format is retained. Expected: rejection with no added objects. Attachments cannot be rebound to another workspace through a Board save.
18. **Layer/layout regression:** multiselect rich objects, drag handles, resize, duplicate, front/back, delete, undo/redo, fit selection/all and toggle grid/snap. Expected: native content survives each action and reload; geometry/layer history stays independent of camera settings. Re-run touch/pinch and reduced-motion checks from the phase-2 report.
19. **Saved Library usage:** open details for a file used only by a saved Board object and start Delete review. Expected: Board usage links to the Board and deletion is blocked. Trash the Board or its ancestor folder and repeat. Expected: usage remains protected with a Trash link. Restore it and verify the fragment/file remains intact.
20. **Shared binary lifecycle:** reuse one Board file in a Document, delete the Board object, then permanently delete the disposable Board. Expected: the Library file and Document reference remain. After removing all saved uses, Library deletion becomes available. Provenance alone never counts as use.
21. **Upload guards:** throttle the network, start a new Board file upload and try Done/Escape, another object, Add block, Undo/Delete, tab switching/closing and navigation. Expected: object/layout changes and navigation wait; upload insertion stays anchored. After completion, actions resume and source saves. A failed upload leaves existing content intact and shows an error.
22. **Revision conflict:** open the same Board in two browser tabs. Save a change in A, then edit in B without refreshing. Expected: B receives 409, preserves its local draft and freezes writes; A is unchanged. Download B's draft, cancel Load latest once, then confirm it. Expected: only confirmation replaces B's local content with A's snapshot. If an upload was already running when the conflict arrived, it can finish into B's protected downloadable draft.
23. **Offline recovery:** go offline, edit a rich fragment and move an object, wait for Not saved, download the draft and reload the same browser tab. Restore connectivity and retry when the base revision still matches. Expected: source/layout recover and save. A newer server revision produces conflict controls instead of an automatic overwrite. Forced browser/session deletion is not a backup.
24. **Legacy recovery:** on a disposable Board, retain a copy of its GET snapshot and note its revision. In DevTools Application → Session Storage set `orbium.board.{workspaceId}.{boardId}.draft.v1` to a valid legacy snapshot: `format_version: 1`, the same revision, and only plain `paragraph` objects with existing geometry/UUIDs. Reload. Expected: it recovers and saves using format 2 without losing source or identity. Do not use rich Markdown in the legacy paragraph fixture.
25. **Unknown recovery protection:** on that disposable Board set the same session key to `{"format_version":999,"revision":0,"objects":[]}` and reload. Expected: an explicit unsupported-draft error, disabled editing, and no PUT. Download local draft must preserve these original bytes. Cancel Load latest keeps them; confirmed Load latest replaces them with current server content. Repeat once with malformed JSON.
26. **Document regressions:** open an existing Markdown Document. Exercise slash media upload/reuse, table/code/math/Mermaid, attachment open/download and split block transfer/undo. Expected: default Document routes, server Mermaid cache and existing behavior remain unchanged; existing unrelated editor/history refinements remain present.
27. **Resource/performance:** create enough objects to pan previews offscreen, then return; switch active editing between objects and leave the Board. Expected: only one Board fragment editor is active, offscreen preview/player resources release, playback stops on unmount and the page remains usable. A culled/remounted player may reset playback/page position, matching current native virtualization behavior.

## Negative API checks (manual)

Use DevTools to copy a successful Board PUT as fetch, edit the request manually and issue it once per case on a disposable Board. Keep the current revision/CSRF token. After every rejected request, GET the snapshot again: **revision and saved objects must remain unchanged**.

1. Set `format_version` to 1 or 999, `block_type` to an unknown value, or `content_format_version` to 999 → **422**.
2. Repeat a UUID, supply an extra object field, set a negative/oversized layer or invalid geometry → **422**.
3. Set one Markdown fragment above 131,072 UTF-8 bytes, the Board total above 2,097,152 bytes, or object count above 1,000 → **422**. Large body rejection at a deployment limit may instead be **413**.
4. Put `[@Page](orbium:node/123)` into a native fragment → **422** with a page-mention phase message. The same text inside a code fence remains literal code.
5. Insert a missing/other-workspace attachment ID, or use image syntax for an owned non-image file → **422**. Replace a link destination with `javascript:alert(1)` → **422**, with no execution.
6. Send the previous revision after another save → **409**, preserving the winning snapshot.
7. Request Board content/upload/metadata/download for another account/workspace, a Document ID in the Board route, or a Board hidden by Trash → **404** (or the authentication redirect when logged out). A same-workspace Board must not turn a foreign file ID into an accessible download.
8. Request a Board attachment using `/documents/{boardId}/attachments/{id}` → **404**; request the correct `/boards/{boardId}/attachments/{id}?download=1` → authorized download. A missing storage binary must show unavailable metadata/preview rather than successful playback.

## Known limits and stop gate

- Native fragments can group multiple nested blocks as one spatial object; source-level subblocks are not separate Node/object identities.
- Page mentions/live Document/Database/Board cards and sibling Document creation belong to phase 4. Mind Maps still require the missing part of the supplied specification.
- Board Mermaid previews are regenerated through the existing client renderer rather than the Document-only persistent cache.
- Manual height/explicit fitting, bounded source/object budgets, browser clipboard format support and session-only recovery apply as documented. Board import/export, minimap and continuous automatic sizing are not delivered here.
- Unsaved uploads remain Library assets if insertion fails; unsaved references do not block Library deletion. Browser codec support and culling can affect playback, as in the native editor.

Stop here for manual review. Fix reported phase-3 issues before considering a later phase.
