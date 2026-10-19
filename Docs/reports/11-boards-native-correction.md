# Boards phase 3 review correction — Independent canvas blocks

Implemented 2026-10-18 after the user rejected document fragments and authorized “okey fix it”. This replaces the initial phase-3 interaction model and remains phase 3. Await manual review before any phase 4 work.

## What changed

- Board objects now persist their own typed JSON data. Text, heading, list, quote, callout, code, table, image, file/media, math, diagram and divider are independent canvas objects. Text has one inline editing root; lists own items and tables own cells. Arbitrary nested document blocks cannot be inserted or merged into an object.
- Removed the Board document fragment editor, document slash/template insertion, Source/Preview document mode, six-dot gutters, nested document block menus and split target registration.
- Text/headings/lists/quotes/images/dividers have transparent outer surfaces, including Frosted appearance. There are no persistent block headers, grips, text-card borders or shadows. Code, callout, table and media retain content-specific structure.
- Select with a click, drag the unedited body, double-click/Enter to edit, Escape/Done to finish. Selection shows outlines, resize controls and contextual type/heading/alignment/direction/formatting controls. Text grows with content and width rather than remaining a small document window. Rich/media dimensions remain manually resizable.
- Reuse is limited to inline editor primitives, code highlighting/language/copy/input, math rendering, sanitized Mermaid sessions and media players. Documents retain their existing editor. Standalone Board code opts into its own local history; existing Document code input defaults remain unchanged.
- Typed media objects offer Library reuse and upload. File identity and usage remain workspace scoped, including Trash. Uploaded media can play/read without entering editing. Uploads block switching, navigation and destructive canvas actions; conflict drafts remain protected.
- Existing clipboard/layout/layer/history/revision/recovery mechanisms now carry typed objects. Plain text paste stays text; Markdown syntax does not create a miniature document. No grouping or merging is introduced.

## Compatibility and migration

`2026_10_18_000004_add_native_board_blocks.php` was inspected and applied to local PostgreSQL in **24.83 ms**. It adds nullable JSONB `data`, permits preserved legacy rows and native rows with mutually exclusive source storage, upgrades the Board envelope/default to **spatial format 3**, and adjusts geometry minimums. Existing Markdown source rows and object IDs are not rewritten by the migration. Rollback was not run and refuses while any Board objects remain.

Native Board content format is **1**, independent of Document Markdown format 2. Native saves use `block_type`, `content_format_version: 1`, and typed `data`; their `markdown` column is null. Old clients reject the spatial envelope; old PUT shapes are rejected with 422.

The explicit compatibility reader splits old top-level Markdown blocks into independent native objects. The first keeps its original UUID; additional objects receive new UUIDs that persist on the first successful native save. Converted objects are initially laid out vertically near their original position; rearrange them as desired. The first converted object retains the complete original source as opaque `data.legacy_source`, included in snapshot/draft downloads. Attachments found inside old inline/nested content are promoted to separate media objects so they retain visible native uses and Library protection. Backup source alone does not count as an active attachment reference.

Legacy formatting conversion is intentionally conservative: ordinary inline marks, text, headings, lists, code, basic tables, media, math and diagrams convert. Advanced presentation wrappers, rich nested cells/callouts, table spans, inline equations and other uncommon document-specific detail may simplify in the canvas. The full original source remains available in the recovery copy; the correction does not claim complete visual parity for those structures. Unknown versions, malformed content or conversions exceeding native limits fail visibly with original snapshot download and no partial save. Format-1/2 browser drafts use the same explicit adapter; unknown recovery bytes remain untouched until confirmed replacement.

Limits allow JSON/formatting/recovery overhead: **256 KiB per object's JSON data**, **4 MiB total**, **1,000 objects**, **1,000 list items**, **100×30 table cells**, **10,000 inline entries per field**, **50,000-byte Mermaid source**. Geometry: positions ±10,000,000, dimensions 80–4,000 by 32–4,000; zoom 10–400%. Text auto-height stops at the geometry limit and then scrolls. Source/body budgets remain enforced before mutations; server validation rechecks every write atomically.

## Validation

- PHP formatting and syntax passed for Board services/action/controller/model, Library and the migration (nine PHP files).
- TypeScript passed.
- `npm run lint` passed: 583 files formatted, 488 files linted, without warnings/errors.
- `npm run build` passed: 5,412 modules in 14.72 seconds; log `/tmp/orbium-boards-native-build.log`.
- Migration SQL inspection and local application passed. No rollback or data deletion was performed.
- `git diff --check` passed.
- No automated tests were written or run, as instructed. No browser/manual acceptance results are claimed.

Build warnings about existing document helper mixed imports, large chunks and plugin timings remain informational.

## Manual checklist

Use a disposable Board, a second Board in the same workspace, another-workspace Board, an existing Document, and sample image/video/audio/PDF/files. Wait for **Saved** before reload or Library management except where failures are intentional.

1. **Transparent canvas:** add Text, Heading, List, Quote, Image and Divider through Add block. Deselect them and switch Light/Dark/Frosted. Expected: no persistent card background, header, six-dot grip, border or shadow around text; image/divider have no generic shell. Selection shows its outline and relevant controls.
2. **Direct movement:** click a text object, drag its body, then double-click to edit it. Repeat at 50% and 200% zoom and on touch. Expected: body dragging moves the object, editing lets text selection/caret work, and content never merges into another object. Escape/Done restores canvas interaction.
3. **Inline text:** type several lines with Enter; bold/italic/underline/strike/code and add a safe link through contextual controls. Paste `# Heading` and `- item` from a text application. Expected: one text object with line breaks, inline formatting and literal pasted syntax; no slash menu, document editor, nested block gutter or Source/Preview mode. Save/reload preserves formatting.
4. **Heading/type controls:** select Text, change it to Heading, change size, alignment and direction, then convert to Quote/Callout/Text. Expected: content survives; only the selected object's type/presentation changes, without creating a Document or nested block. Save/reload works for every conversion.
5. **Text sizing:** type a long paragraph and narrow its width with the selection edge. Expected: text height grows to its wrapped content. Delete most text. Expected: height shrinks. Long content remains scrollable once bounded by 4,000 units; there is no fixed paragraph editor window.
6. **Lists:** add List, change bullets/numbers/checklist, add three items, format one, remove another and toggle a checkbox without editing. Expected: list items belong to one typed list object; they have no document gutters. Only the active item mounts the inline editor. Read-only conflict state disables changes.
7. **Tables:** add Table, edit/format cells, add/remove rows and columns, then reload. Expected: rectangular data persists; only the chosen cell activates inline editing. Removing a row/column never removes the last one or merges table contents into another object. Moving/resizing the outer object preserves the table.
8. **Code:** add Code, choose JavaScript, type `const count = 1;`, copy it, undo/redo while editing, Done and copy its static preview. Expected: syntax/language/source persist and clipboard contains code only. Escape exits editing. No document block grip/menu appears.
9. **Equations and diagrams:** add Math and Diagram, edit their own source fields, preview/expand the diagram and reload. Expected: native math and sanitized Mermaid render. Invalid source remains editable with a diagnostic. Board Network requests never use a Document Mermaid cache route.
10. **Images:** add Image, Edit, choose an existing Library image, set a caption, resize and reload. Expected: transparent outer presentation and the original attachment ID; caption/source survive. Upload another image. Expected: Board attachment endpoint, one image object and one Library binary, no Document creation.
11. **Media/files:** add File / media, reuse/upload a video, audio, PDF and generic file as separate objects. Test playback/seek/volume, PDF page/zoom/fullscreen and downloads both in and out of editing. Expected: native players, no autoplay, controls do not drag the canvas; unsupported codecs retain download fallback. Captions do not replace file identity.
12. **Selection/layout:** multiselect text/media, move/resize/duplicate, change layers, delete, Undo/Redo, fit view, grid/snap and pinch. Expected: separate identities and content survive. There is no merge/group action. Fit height works for manually sized rich/media objects after their previews load; text sizes itself.
13. **Clipboard:** copy/cut two selected objects, paste onto the same Board and another same-workspace Board. Expected: fresh IDs, preserved relative layout and one undoable paste. Inside text, native text clipboard/history works. Cross-workspace typed clipboard is rejected. Plain text paste on empty canvas creates a text object, without interpreting Markdown. Other applications may strip the custom format and retain only text.
14. **Saved Library protection:** inspect/delete-review a file used only by a saved native Board object, then trash its Board/ancestor folder and repeat. Expected: usage blocks deletion in both cases and points to Board/Trash. Restore and verify content. Delete the actual media use and save; after all live/saved uses are removed, deletion becomes available even if opaque legacy backup text contains an old ID.
15. **Legacy Board:** open an old fragment containing headings, paragraphs, code and files. Expected: independent native objects, first original UUID retained, no miniature document windows. Additional content is placed vertically. Save/reload and inspect GET `…/content`: spatial format 3, native content format 1, typed `data`. Download a draft and verify the original source is retained in `legacy_source`.
16. **Nested legacy references:** open an old table/callout with nested image/file references. Expected: original text remains in the basic table/callout presentation, attachments also appear as independent image/file objects, and complete old source is retained for recovery. Merged-cell/advanced presentation detail may simplify as described above.
17. **Upload guard:** throttle Network, start a file upload, then try Done, another object, Add, Delete/Undo, tabs, navigation and close. Expected: switching/actions wait and no insertion is lost. After upload completion, the actual typed media reference saves. Failed/unsupported uploads show an error and leave the binary in Library if it was already stored.
18. **Conflicts:** open the same Board in browser tabs A/B. Save A, then edit B with its stale revision. Expected: B receives 409, preserves its draft and blocks writes; A remains unchanged. Download B's draft; cancel Load latest once, then confirm. Only confirmation replaces local changes. An upload already running may finish into the protected draft.
19. **Offline recovery:** go offline, edit text and move an object, then reload that browser tab. Expected: same-revision typed draft recovers. Restore Network and retry. If the server advanced elsewhere, conflict controls appear without automatic overwrite. Session storage is not durable backup after browser-session deletion.
20. **Unknown recovery:** on a disposable Board put `{"format_version":999,"revision":0,"objects":[]}` in `orbium.board.{workspaceId}.{boardId}.draft.v1` in Session Storage and reload. Expected: unsupported draft error, blocked editing, original bytes downloadable and retained until confirmed Load latest. Repeat with malformed JSON. If legacy server conversion exceeds native budgets, the page instead offers original server snapshot download with no partial save.
21. **Limits and API rejection:** copy a successful native PUT as fetch in DevTools. Individually try an unknown kind/version, extra `data` key, unsafe link mark (`javascript:alert(1)`), duplicate UUID, foreign attachment, image with non-image file, malformed first table row, oversized data or invalid geometry. Expected: 422 (or deployment 413 for body size), unchanged revision and objects, no execution. A stale revision must return 409. Foreign/trash content/attachment requests remain inaccessible.
22. **Document regression and resources:** exercise Document formatting, slash/media/table/code/math/diagram, and Document split moves/undo. Expected: unchanged behavior. Return to a Board with many objects, pan previews offscreen and change active cells/items. Expected: only the focused inline/code field is active, offscreen players/previews release, and no document gutter/split target is registered by a Board. Playback stops on unmount; remounted players may reset state.

## Known boundaries

- Native inline formatting is bold/italic/underline/strike/code/link; advanced legacy document presentation is retained in recovery source rather than recreated as document controls. Lists/tables have Board-specific controls with simpler structure.
- Upload/reuse is performed from typed media objects. Document slash insertion and file paste into a text document are intentionally absent. Text/ordinary clipboard paste remains text.
- Legacy splitting can change layout and extra-object count; over-budget data fails visibly. Secondary UUIDs become persistent on the first successful native save.
- No live resource cards, sibling Documents, shapes, Mind Maps, grouping, Board import/export or later phase work was started.

## Commit suggestions and stop

No commits created. Previous Boards work and unrelated pre-existing editor/split/history changes remain uncommitted.

- `feat(boards): replace document fragments with typed canvas blocks`
- `fix(boards): use transparent text and contextual canvas editing`
- `feat(boards): preserve legacy content during native block conversion`

Stop for phase-3 manual review. Reported defects belong to this correction; phase 4 still requires explicit approval.
