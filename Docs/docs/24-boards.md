# Boards

Requested 2026-10-18. The supplied development specification ends at “Unlimited subtopics within practical” in section 8; later Mind Map requirements and any subsequent sections are unavailable. Preserve this boundary rather than inventing the missing requirements.

## Foundation (approved 2026-10-18)

This first phase introduces `board` as a fourth native Node type. Boards can live at workspace root or inside folders. Boards and documents are leaves; databases continue to accept documents only. Creation, moves, bulk moves, and restoration share the existing hierarchy action and workspace locks.

The phase includes a dedicated Board landing page, ordinary explorer presentations, filtering and ordering, context menus, Search Master and its `type:board` filter, breadcrumbs, floating tabs/history/reload, favorites, Trash/restoration/permanent deletion, and workspace ownership checks. The Board page is an empty state, not an operational spatial editor. Stop after manual review before implementing the next phase.

## Architecture decisions recorded before implementation

- Keep identity, title, hierarchy, ordering, favorite state, and lifecycle in `nodes`. Extend the named PostgreSQL type constraint in a new migration; never rewrite the original migration. Downgrade must refuse while any Boards remain, including trashed Boards.
- Use `/workspaces/{workspace}/boards/{node}` through the existing authenticated Inertia shell. The generic Node URL redirects there. Do not build a separate shell, navigation store, or permission system. Validate every ancestor when opening a Board so a trashed folder hides its Boards.
- No Board content table is needed for an empty Board. Do not create a `documents` record for a Board. Content storage arrives with the spatial editing phase, where stable object identities and ownership can be designed together.
- Favorites already have a Node boolean but no user-facing workflow. Add a normal Node favorite write and reuse the existing context menu and explorer filter; no second favorites store.
- Keep Boards out of container selectors, child-creation contexts, and drop-inside targets. Search Master creation while viewing a Board uses its parent folder or workspace root.
- Use the Lucide `PanelsTopLeft` icon consistently. Reuse existing surfaces, appearance settings, dialogs, page title editing, and tab transitions. Do not advertise inactive canvas controls.
- The current document implementation uses canonical Markdown format 2, a CodeMirror editing engine, shared rich-block renderers, and optimistic revision checks in `SaveMarkdownDocument`; older JSON wording is historical. Later Board block adapters must reuse those block capabilities without mounting a full document editor per object. The current editor has pre-existing uncommitted changes that this phase must preserve.
- Board-owned blocks will belong directly to the Board with stable object IDs, layout, and compatible canonical block content. They must never acquire Document Node identities automatically. Referenced Documents will retain their existing Node, parent, content, attachments, mention indexing, and revision checks. Spatial references/connections must never imply hierarchy or automatic mentions.
- Keep lightweight previews for inactive references and activate editing only for the active card. Do not persist pointer movement individually. These are constraints on later implementation, not features delivered by the foundation.
- Current document-package export supports documents only. Do not offer a Board document export or change its format. Whole-account portability remains a separate existing phase; future Board content must be integrated there explicitly.

## Subsequent phases (each requires explicit approval)

Phases 1–3, including the native correction, are approved. Phase 4, live resource cards, is authorized by “okey go ahead”; see `../phases/12-boards-resource-cards.md`. The following list preserves the feature sequence; Mind Maps and later work remain gated.

1. Spatial persistence and canvas navigation: stable object/layout schema, scoped validation and revision conflicts, pan/zoom, selection, movement, resize, undo/redo, and debounced saves.
2. Shared native block adapters: inline editing, formatting, slash controls, compatible rich blocks, files/Library usage, clipboard and layering.
3. Live resource cards: scoped insertion, new sibling Documents, lightweight previews, original-document autosave/conflict handling, and navigation to Databases/Boards.
4. Shared Mind Map block and remaining requested features: confirm the missing source requirements before implementation. Mind Maps are blocks in Documents and Boards, never page types.

## Foundation acceptance

See `../phases/09-boards-foundation.md` and the completion report for exact manual checks. No automated tests may be written or run under the current user instructions; formatting, lint, type, build, migration inspection, and whitespace checks remain required.

## Phase 2 implementation contract

Phase 2 uses `boards` plus `board_objects` and a whole-snapshot JSON save endpoint at `/workspaces/{workspace}/boards/{node}/content`. Spatial format 1 is independent of Markdown content format 2. A Board row's revision protects all its objects; stale saves return 409 without overwriting newer data. Reads hold the Board revision stable while reading objects. UUID identities remain scoped to their owning Board and never create hierarchy/mentions.

The initial adapter supports paragraph text, soft breaks/multiple paragraphs, ordinary links, shared inline formatting, and existing rich-body rendering. Only the active object has a CodeMirror instance. Unsupported block syntax, images, uploads and Orbium references are rejected rather than being saved without their required lifecycle/indexing. Other blocks and slash menus remain phase 3.

The canvas supports pointer/touchpad wheel pan, cursor-centered Ctrl/Cmd+wheel/pinch zoom, Space/middle drag, touch background pan, multi-selection/marquee, handle dragging, edge/corner resizing, keyboard move/resize, duplicate/delete, layer changes, fit-all/selection, reset, dots, and 16-unit snapping. Camera and drag feedback use refs/requestAnimationFrame; offscreen previews are culled with bounded updates. Camera/dots/snap preferences are browser-local and do not cause content saves. Navigation is direct and has no additional camera animations, including under reduced motion.

Completed gestures and debounced content changes enter the existing authenticated workspace write boundary. A single request is in flight per editor, with newer changes queued behind it. Failed snapshots remain pending; conflicts stop further saves until explicitly resolved. IME composition postpones saves. Forty local object/content history entries support undo/redo; camera movement is not part of content history. History resets when leaving the Board.

Drafts are stored per Board in the browser tab’s **sessionStorage**, isolated across browser tabs. The existing shell permits only one active Board editor and prevents leaving it while dirty; the recovery key deliberately survives app-tab ID changes during reload/history restoration. Reloading/restoring the same browser session can recover a draft; closing/clearing that browser session is not a durable backup. A same-revision draft resumes saving; a draft based on an older revision stays local and opens conflict controls. Save errors expose retry where safe, local JSON download, and confirmed loading of the latest server snapshot. The JSON download is a recovery aid, not an account archive or a supported import format. App navigation/tab-close/native-unload guards protect dirty content; browser history/forced termination relies on session recovery. If browser storage fails, the UI explicitly asks the user to keep the tab open until Saved.

Limits: 1,000 objects, 16 KiB UTF-8 per paragraph, 512 KiB total text, positions ±10,000,000, dimensions 160–4,000 by 100–4,000 units, zoom 10–400%. Cards have manual height with internal scrolling while editing; automatic content height and minimap remain deferred. New text goes above existing layers. Duplication checks both object count and aggregate text limits.

Board Details retains the native title/cover/icon controls in a collapsible area to leave space for the canvas. The foundation's favorites, breadcrumbs, tabs, search and Trash remain in use. Board tabs fetch a current server snapshot through the existing navigation path rather than restoring stale cached content. Stop after the phase 2 report before broad shared-block work.

## Phase 3 implementation contract

The following fragment contract is historical and superseded by the **native canvas correction** at the end of this document, explicitly requested during review.

Spatial format **2** supersedes the phase-2 envelope. New `markdown` objects own native Markdown fragments with independently positioned layout; existing `paragraph` objects retain their text and UUIDs and become `markdown` objects when edited. Fragments may contain nested or multiple native blocks as one movable object. They never create a Document Node. The new migration upgrades Board envelope versions, changes the default for new Boards, and extends the object-kind CHECK. Rollback refuses while any objects remain. Markdown content format remains 2; document/account archive formats do not change.

Only the active fragment mounts the shared CodeMirror dialect, Live Preview, inline selection toolbar, block menus, slash commands, tables, code language/copy controls, callouts, dividers, presentation wrappers, image/file/media editing, and math/Mermaid renderers. Source/Preview and Done are available within the object. Shared nested-block dragging registers a **local-only** target, so it can reorder within this fragment but cannot transfer to another editor. Document split transfers retain their existing behavior. Inactive objects use the shared rich-body renderer with static highlighted code/copy, media players, math, and sanitized Mermaid; they do not mount whole document editors. Offscreen preview disposal also releases player/session resources.

Add block offers the shared native templates; Text/double-click still starts a blank fragment. Uploads and Library reuse use the same insertion anchors and media restrictions as Documents, through Board-scoped upload/metadata/download routes. Metadata/download requests require a live owned Board and same-workspace file. Saved Board fragments count in Library usage, including trashed Boards and trashed ancestor folders. Upload provenance does not move, and removing an object or permanently deleting its Board leaves its binary in Library. As with Documents, unsaved drafts do not protect files; wait for Saved before Library management.

Board rich contexts carry `ownerKind: board`; existing document contexts default to Document. Board Mermaid previews use the existing sanitized client renderer and session lifecycle, with no reads/writes to the document-only server preview cache. Page mentions are deliberately rejected and absent from completion until the next resource-reference phase defines Board mention indexing. Ordinary links and owned attachments are supported; spatial insertion still implies neither hierarchy nor mentions.

Canvas Ctrl/Cmd+C/X/V copies, cuts, and pastes selected objects using a versioned custom clipboard format scoped to the same installation/workspace. Pasted objects receive new UUIDs, preserve relative geometry/layers, and enter history as one action after budget validation. Plain-text clipboard data contains Markdown; canvas plain-text paste creates one native fragment. If another application strips the custom MIME format, only the Markdown fragment survives. Within an active editor, native text clipboard/history applies. Cut removes originals only after clipboard writes succeed. Layer controls and duplicate retain their existing behavior. Fit height measures the selected preview's current rendered height, bounded by the normal geometry limits; it is an explicit action, not continuous automatic sizing. Re-run after asynchronous media/diagram loading if necessary.

Limits are now 128 KiB UTF-8 per fragment and 2 MiB total source, retaining 1,000 objects and the phase-2 geometry/camera bounds. Native parser complexity and Mermaid's 50,000-byte source limit still apply. Uploads block object switching, content/layout actions, and navigation; autosave waits for upload insertion and IME composition. An in-flight stale response freezes editing but keeps the editor mounted until any upload finishes. Valid format-1 paragraph recovery drafts are explicitly adapted to format 2. Unknown/malformed recovery bytes stay untouched, block editing, and can be downloaded before confirmed replacement with server content.

Stop after `../reports/11-boards-blocks.md`. Live resource cards, new sibling Documents, Mind Maps, Board import/export, continuous automatic height, and minimap remain later gated work.

## Phase 3 native canvas correction (approved)

The user rejected miniature document editors inside Board objects and authorized a replacement. Boards now own typed JSON objects with **spatial format 3** and **native Board content format 1**. Text, heading, list, quote, callout, code, table, image, file/media, math, Mermaid and divider have distinct fields. Inline rich text is constrained to text/hard-break nodes with bold, italic, underline, strike, code and safe-link marks. There are no arbitrary embedded document-block arrays. Lists own bounded items and tables own bounded rectangular cell arrays.

Text/headings/lists/quotes/images/dividers have transparent outer surfaces, without document headers, card backgrounds, shadows or six-dot grips, including Frosted appearance. Content-specific code/table/callout/media structure remains. Click selects, drag the unedited body moves, double-click/Enter edits, Escape/Done returns to the canvas. Selection reveals outlines, resize controls and a contextual toolbar. Text grows with its content and width; rich/media objects retain manual dimensions. Existing camera, multi-selection, layering, clipboard, history and revisions remain.

Board text uses a single inline-rich-text editing root, with Enter producing a line break and plain text paste remaining text. Lists and table cells activate only their focused inline editor. Code uses only the existing low-level code input/highlighter/copy/language controls. Math, sanitized Mermaid and media reuse their rendering/player primitives. Board insertion uses a typed palette, not document Markdown templates or slash commands. The document fragment editor, document gutters/source mode and nested/split block transfers are absent. No merge/group operation is introduced.

The new migration adds nullable JSONB data, permits preserved legacy format-2 Markdown rows, upgrades envelope/defaults and widens the geometry minimum to 80×32. It does not rewrite old Markdown. The compatibility reader converts known old objects, splitting top-level blocks into separate canvas objects; the first keeps its UUID and extra objects receive new UUIDs which persist on save. Original full source is retained as opaque `legacy_source` on the first converted object for recovery, while attachment references are promoted to independent image/file objects. Advanced legacy presentation metadata, nested rich table/callout formatting, merged-cell structure and inline equations may simplify visually; the original source remains downloadable inside the snapshot. Native active attachment IDs protect Library files; backup source alone does not imply an active use.

Format-1/2 recovery drafts use the explicit compatibility reader. Unknown/malformed or over-budget conversions show an error and offer original snapshot download, never a partial save. Conflicts keep local data, require confirmed replacement, and retain the previous navigation/upload/IME guards. A first native save persists converted objects atomically using the original revision. Older clients reject the new envelope and their old PUT shape fails validation.

Native data limits allow JSON/formatting/recovery overhead: 256 KiB per object, 4 MiB total, 1,000 objects, 1,000 list items, 100×30 table cells, 10,000 inline entries per field and 50,000 bytes of Mermaid source. Positions ±10,000,000; dimensions 80–4,000 by 32–4,000; zoom 10–400%. Preview culling and one active inline/code field avoid mounting document editors across the canvas. New shapes, live resource cards, Mind Maps, grouping and Board import/export remain outside this correction.

Manual acceptance is in `../reports/11-boards-native-correction.md`. This correction remains phase 3; stop for user review.


## Phase 4 live resource cards (current)

Review correction (2026-10-18): double-click is reserved for editing existing objects. With Select active, double-clicking empty canvas space does not create anything. Native creation requires explicitly choosing a block tool, then clicking to place it (or pressing Enter to place at the view center); successful placement returns to Select. Clipboard paste and resource creation retain their existing behavior.

Boards open full-viewport by default with a visible Back button beside the title. Back uses the active application's tab history when available; otherwise it opens the Board's parent folder or workspace root. Both paths use existing page-leave guards. There is no Focus toggle, Exit focus control or alternate page-sized layout. Browser chrome remains browser-controlled. Orbium's surrounding navigation is hidden and inert only while a Board is mounted, then restored on navigation. The compact identity area retains title, favorites and Details (a dialog). Existing application navigation shortcuts and resource links remain available. See `../reports/12-boards-spatial-refinement.md` and the subsequent `../reports/12-boards-investigation.md`; these supersede the earlier optional Focus presentation.

The earlier source investigation identified native list/table keyboard, history, scrolling and overlay problems. The user approved the complete UX-audit correction with “okey fix all that”. The current adapter now mounts one constrained editor for the entire active native text/list/table block, preserving the same native JSON fields. Lists split on Enter, retain soft breaks with Shift+Enter, merge with boundary Backspace and indent/outdent with Tab/Shift+Tab. Enter on an empty indented item outdents; Enter on an empty top-level item removes it when other items exist and finishes editing, retaining a sole empty item. Tables use normal cell navigation, Tab at the final cell adds a row within existing limits, and structural actions preserve the shared block session. Native text/source editing and canvas actions use the same 40-entry Board snapshot history through toolbar and keyboard, with 700ms typing groups and boundaries for selection/structural changes; referenced Documents retain their own history. See `../reports/12-boards-ux-correction.md` for the complete implementation and pending manual acceptance.

The bottom dock exposes Select, Hand, Text, Image, Add and Page. Select owns object selection/movement; Hand owns panning, with Space as temporary Hand. Native creation arms a tool and requires a click/tap with at most six screen pixels of movement (or Enter for view-center placement); dragging, cancellation and pinch do not insert. Successful insertion returns to Select. Escape cancels a gesture/tool/edit, and never changes the full-screen layout. Menus, dialogs, properties and IME composition retain their own dismissal behavior. Resource creation/paste retain their existing flows.

This review explicitly authorizes spatial arrangement: smart edge/center guides with a six-screen-pixel tolerance, enabled by default and browser-local; grid snapping remains independent. Alt bypasses snapping. Guides target nearby visible objects and are painted during a gesture, without per-move content writes. Alignment/distribution commands apply to two/three selected objects respectively through existing object history/snapshot saves. A transient shared selection outline can move multiple independent objects as a unit; it is not persisted grouping or hierarchical containment.

Object presentation uses stronger headings, transparent ordinary writing, refined content-specific code/table/callout/media surfaces, actionable empty media areas and explicit code input focus. Double-click writing/list/table editing targets the clicked text/field. Editor/format focus avoids scroll-into-view commands, and contextual tools use a stable editing lane above the dock. Measured text height is derived from content/width and saves through the existing queue without adding an independent undo step or clearing redo. The optional Object properties panel edits existing bounded position/size and text-style fields; automatic text height is read-only. No new persistent fields, migrations, APIs or format versions are added. Upload/composition/resource locks, revisions, recovery and Library ownership remain in use. Mind Maps, persistent grouping and drawing remain outside this review.

Spatial format **4** adds native `resource` objects with content format **1** and exactly `data: { target_node_id }`. No copied title, excerpt, Document source, mention or hierarchy relation is stored in the Board. Existing native blocks keep their own independent schemas and transparent canvas presentation. Formats 1–3 local drafts are explicitly adapted; unknown formats remain protected. The additive migration upgrades Board envelopes/defaults without rewriting legacy source rows and adds creation receipts. Downgrade refuses while resource objects or receipts exist.

**Link page / New Document** opens a same-workspace picker for visible Documents (including database documents), Databases and other Boards. Search is title-based, bounded to 40 entries per page, and displays parent/type context. The current Board, folders, foreign/trashed nodes and descendants of trashed containers are excluded. Resource previews load in batches of at most 40, expose at most 1,200 characters of Document text plus current title/icon, and refresh every 30 seconds while visible, on browser focus/visibility, after hosted saves or on explicit refresh. Offscreen cards are culled; inactive cards never fetch full Document source or mount full editors. Refreshing a preview never replaces an active Document draft.

Double-click/Enter/Edit on a Document card fetches its original Markdown or legacy source and mounts the existing Document editor for the active card only. It uses the original Document save endpoints, validation, optimistic revisions, mentions, attachment ownership and Mermaid cache. Opening the original uses ordinary Orbium tabs. Database and Board cards are lightweight navigation cards; no embedded database UI or recursive Board canvas is mounted. Hosted Document block transfers are local-only. Native Board blocks cannot be transferred or converted into Documents.

Document and Board revisions remain separate. Hosted Document autosave permits one request in flight, defers during upload/import/composition and retains the latest unsaved source in a per-Board/target session draft. Revision/content-format conflicts freeze editing and preserve the draft for download or confirmed Load latest Document. Invalid/unknown recovery bytes stay untouched until confirmation. Dirty/saving/uploading/composing/conflicting Document cards block switching, removal, undo/layout replacement, navigation and latest-Board replacement; they stay mounted through culling or preview failures. Pending uploads may finish into the protected draft. Session recovery is not durable backup after browser-session deletion. Storage failure produces an explicit warning.

New Document creation uses the Board’s **current parent folder or workspace root**, never the Board as parent. Under the existing workspace write boundary, a Board revision lock, Document creation, complete snapshot validation, appended reference and creation receipt form one transaction. A per-Board request UUID plus payload hash makes identical retries return the original result without duplicate Documents; changed payloads or a Board advanced since creation return 409. A removed original returns 410. The client retains uncertain requests in session storage for identical retry; failed validation rolls back all creation effects. Undo removes the reference and keeps the new Document in the hierarchy.

Saved references whose targets become trashed, hidden or permanently deleted remain removable/movable placeholders. Arbitrary unavailable targets cannot be newly linked. Resource JSON deliberately has no target foreign key: deleting a resource does not erase the saved card, and deleting a Board cascades only its spatial objects/receipts, never referenced Documents. Attachments used inside a referenced Document remain usages of that Document; native Board media remains usage of the Board. A card creates no automatic mention or Orbit relation.

Routes under `/workspaces/{workspace}/boards/{node}` are scoped live-Board reads: `GET resources`, `GET resources/previews`, `GET resources/{target}/document`, and atomic `POST documents`. Responses are private/no-store. Existing geometry/count/data budgets remain. JSON creation POSTs preserve existing Board text whitespace/empty strings like ordinary editor PUTs.

Acceptance/report: `../reports/12-boards-resource-cards.md`. No automated tests are written or run. Stop for manual review before Mind Maps; obtain the missing source specification before planning that phase.


## Approved phase-4 UX correction (2026-10-18)

The current review follows `../reports/12-boards-ux-audit.md` and its user approval. Full-screen, guarded Back, original resource ownership, format 4, native content format 1, revisions, validation limits, upload/IME protection and recovery remain in force. No new backend routes, schema, dependency, or persistent editor format is introduced.

Object movement/resize requires six screen pixels of deliberate movement, independent of zoom. Pointer capture preserves object double-click targeting. Ordinary wheel input pans inactive previews, with internal scrolling reserved for active editing or interactive media players. Modified wheel always belongs to cursor-centered canvas zoom, including over active editors. Arrow keys move/resize by 1 unit; Shift changes the step to 10. Image corner resizing preserves the existing frame ratio unless Shift is held; Alt bypasses grid snapping while resizing as well as moving.

Structural editing and formatting controls live outside measured text/list content. A resize observer measures authored text geometry, skipping transient drag resize; entering editing no longer inserts list/table action rows into content. Save status sits near identity, and errors/notices use bounded, content-sized surfaces with independent top anchoring. Busy uploads/linked-document operations expose a reason for temporarily disabled controls. The properties inspector is a stage sibling, never a descendant of a filtered toolbar; compact layouts use a lower inspector sheet. Fit view and contextual tool placement reserve inspector/chrome space. The visual viewport controls Board height when a touch keyboard opens. Creation tools hide while editing; Done and contextual formatting remain available. The link prompt is replaced by a bounded anchored app popover.

Inactive offscreen selections are culled as previews while selection/object data remains intact; the active editor always stays mounted. Group bounds include unmounted selected objects. Contextual tools observe selected geometry and world child changes, reattaching when culled previews return. Immutable native content validation/byte counts are cached only in the editing model; layout, identity and aggregate limits still run on every commit and complete uncached validation still runs at persistence boundaries. Already-normalized layers avoid redundant sorting, and smart-guide candidates are captured per gesture. These changes reduce known repeated work; no runtime performance improvement is claimed without manual profiling.

## Phase-4 block presentation review (2026-10-18)

The user authorized the next enhancement: visual presentation of the existing supported block types. `board-block-presentation.css` owns the final block typography and surface treatment, separated from selection/properties geometry. Body writing uses 16px/1.65, headings 36/28/21px, tables 14px, code 13px and captions 12px. Transparent writing, quotes, lists and images retain their native canvas presentation; code/table/callout/resource surfaces share a restrained border/radius vocabulary and existing Frosted tokens.

Code previews reuse exactly one shared language/Copy header; preview and edit headers reserve matching height. Quotes and callouts have quiet directional accents, tables use internal rules and a subdued first row, and media captions/empty areas use the same spacing system. Resource metadata now renders its “Linked” label as actual accessible text rather than CSS-generated content. Geometry, editing/history, persistence and original-resource ownership are unchanged. Automatic text height may settle once after the typography changes.

See `../reports/12-boards-block-presentation.md` for actual checks and the representative-board manual checklist. This remains the current review; direct manipulation, richer preview functionality, faster paste/conversion and later feature phases are not implemented in this visual pass.

## Document-style Board blocks (2026-10-18 review correction)

The user approved redesign work and specified “like blocks in documents same style same thing but without the 6 dots”. This supersedes the earlier proposed spatial-notebook visual direction and the independent Board typography/surface palette. Native objects now reuse the Document editor's `orbium-editor` presentation, heading/quote/callout classes, rich-table styling and rich-card/attachment presentation. Board adapters remove document-flow spacing and retain bounded spatial frames; native data, editing/history, selection, movement and resizing remain Board-owned.

Code, Math and Diagram use Document-style identity/action headers with inner content surfaces. Code keeps one heading and Copy action across preview/editing. File players reuse their existing Document player; ordinary file downloads use the Document link/size treatment. No six-dot gutter is mounted for native objects or for original Documents hosted inside resource cards. Ordinary Document pages retain their normal gutters. Linked resource previews retain their existing reference-specific layout and original ownership.

No schema, format, API, dependency or insertion-geometry change is introduced. New text wrapping can settle automatic text heights. This remains phase-4 manual review; see `../reports/12-boards-document-style.md` for actual checks, limitations and exact manual acceptance steps.

## Document-like native editing (2026-10-18 follow-up)

The user additionally requested easier editing like Documents. With Select active, releasing an unmodified click/tap on native writing/list/table content begins editing at that location. The existing six-screen-pixel drag threshold still distinguishes movement; Hand, resize, multi-selection, interactive links/checkboxes and pinch gestures retain their own behavior. Source/media/resource blocks retain their explicit edit entry points.

Selecting native text exposes formatting beside the selection using Document toolbar styling. Ctrl/Cmd+K opens the existing guarded link popover, including at a collapsed caret. Both formatting and writing menus are portaled outside the transformed world, follow camera/viewport changes and keep readable screen-sized controls. Structural list/table actions remain in the contextual editing lane.

An otherwise empty text/heading/quote/callout can use `/` with filtering, Arrow navigation, Enter and Escape to select Text, H1/H2/H3, bullet/numbered/checklist, Quote or Callout. These convert the existing object through validated Board history without changing its identity, position or resource ownership. From plain text, typing `#`, `##`, `###`, `-`, `*`, `+`, `1.`, `>`, `[]` or `[ ]` followed by Space applies the corresponding native writing type. Ctrl/Cmd+Alt+0–3 switches writing/heading styles while retaining inline content. Backspace on an empty heading/quote/callout returns it to Text. Literal prefixes remain undoable. Composition and read-only states guard conversion.

Escape first dismisses an open writing menu; Ctrl/Cmd+Enter finishes native editing. Math/Diagram source editing focuses its source field and switches the content area from preview to source until Done; code continues using the shared code input. Native writing remains a single typed spatial object: Enter/Shift+Enter retain line breaks inside writing/table cells, and lists retain their existing native item behavior. Full arbitrary Document fragments and the six-dot gutter remain absent. See `../reports/12-boards-document-editing.md` for validation and exact manual checks.

### Editing stabilization (2026-10-19)

Board code-language controls use the shared React `AppSelect` directly. The DOM-replacing `mountCodeLanguageSelect` adapter is appropriate for imperative Document widgets, not React-owned Board controls: replacing a React-owned select caused a reproduced `removeChild` crash on finishing code editing. React portal interactions outside the canvas DOM are excluded from canvas pointer/keyboard/double-click routing so choosing a language or interacting with popup controls does not finish editing or move objects.

Native edit entry establishes selection/focus in a layout effect rather than stacking animation-frame focus calls. Tables entered without a click point begin at the first cell; finishing editing clears any saved pointer location. Explicit history/conversion resets carry a transient editor-reset version, allowing native content to synchronize on undo/redo/conversion without echoing every typing snapshot back into the editor. External replacements preserve selection anchor/head where possible. Link editing bookmarks its original selection, and toolbar pointer-down preserves text selection across pointer types.

Writing-menu keyboard acceptance reads the live editor query, supports heading shorthand such as `/h2`, and leaves Escape to the native editor after the innermost menu dismisses. Ctrl/Cmd+Enter is captured before the code input's own keymap. Inactive native controls honor upload/resource locks as well as Board conflicts. No persisted format, schema or API changed. Browser results and outstanding keyboard/camera/mobile/IME checks are recorded in `../reports/12-boards-editing-stabilization.md`; full acceptance remains pending.


## Selection and sizing review correction — 2026-10-19

The user approved the proposed selection/resizing correction with “okey go ahead”. This supersedes the single-click editing rule above. With Select active, one click selects; double-click, Enter or Edit starts editing. Ordinary explicit links, checkboxes and player controls retain their own actions. Dragging inactive content moves it. No six-dot handles are introduced.

Selected, inactive objects expose all four edges and four corners, with zoom-independent hit targets. West/north resizing moves the origin after dimension clamping so the opposite edge stays anchored. Text/list/heading/quote/callout corners scale font size and frame together (0.25–8×). Horizontal edges change wrapping; vertical edges set a fixed frame height. Images preserve frame proportions at corners unless Shift is held; independent edge/free resizing crops the image to fill its frame without stretching pixels. Alt bypasses grid snapping. Multi-selection retains its existing arrangement behavior; individual resize handles remain hidden for multi-selection.

Content-sized writing, tables, code, math, diagrams and attached files measure their actual child content with actual outer padding, replacing the extra bottom allowance. Vertical resizing fixes their frame height; Fit height restores automatic content sizing. Manually framed writing may grow while actively editing so newly authored text remains reachable. Existing unmarked content-sized frames can tighten to their intrinsic content on opening; use vertical resizing to establish a fixed frame. Resource and image frames remain independently sized.

Image insertion/replacement measures the loaded image and fits its frame to its natural ratio within existing geometry limits. Existing saved images are not automatically reframed; Reset proportions fits them explicitly. Upload/Replace, Library replacement, caption and image controls live in the existing contextual toolbar so editing does not consume image frame height. Crop fills the saved frame and exposes horizontal/vertical focal-position sliders. Cropping is nondestructive: no attachment bytes change. Caption space is only rendered when a caption exists. Existing frames use fill-cropping by default; Reset proportions reveals the complete original image.

Optional native data fields are `text_scale` (0.25–8), `manual_height` (boolean), `image_fit` (`contain`/`cover`) and `image_position` (`x`/`y` percentages, 0–100). Both client/server validate these values. Missing fields retain normal scale, automatic content sizing and centered fill. Resource data stays reference-only. These additive optional fields use existing native content format 1/spatial format 4 and require this updated validator when saving; a previous server can reject the new fields. No migration or binary/content rewrite is performed. See `../reports/12-boards-selection-resizing.md` for checks and manual review. Remain in phase-4 manual review.


### Follow-up: whole-block corner scale and automatic growth — 2026-10-19

The user clarified that corners must make the entire block visually bigger/smaller, and adding rows/content must grow a block rather than hide the addition. This supersedes the writing-only scale and fixed-height overflow behavior above.

Every ordinary corner now uniformly scales the whole block surface: text, table cells, technical content, internal padding, media captions and resource-card content. Edges continue changing the frame/reflow/crop. Shift-corners retain the image free-frame exception. The existing optional `text_scale` field now represents whole-surface scale (0.25–8) for all block kinds; resource data may additionally carry this presentation value beside its target ID. Resource cards still store no copied Document content. Client/server validators accept exactly these reference/presentation resource fields.

The surface uses CSS zoom with explicit unscaled width/height, preserving its logical wrapping during corner scaling. Handle and canvas camera sizing remain independent of that content zoom. Content measurements convert logical child heights back to Board units. Live pointer painting and ordinary rendering update the same scale and frame dimensions.

Content-height observation is no longer disabled by manual sizing. For manually sized native content, saved height is a minimum: content can grow it during or after editing. Resource cards also grow when their rendered preview or hosted Document needs more height. Automatic native frames can still shrink with content removal, and Fit height removes manual extra space. Existing 4000-unit limits, image crop frames, explicit media viewport scrolling and bounded resource summaries remain. See `../reports/12-boards-scale-auto-growth.md`; manual acceptance remains required.


### Zoom rendering clarity correction — 2026-10-19

The user reported poor resolution when zooming out and in across all blocks. Camera painting now uses CSS layout zoom on the zero-sized world with camera offsets divided by zoom, replacing the transformed/composited `translate(...) scale(...)` world. The world retains an explicit stacking context through `z-index: 0`, and no longer requests a persistent transform layer. DOM text, tables, SVG math/diagrams, native media and resource surfaces can be rasterized at their effective displayed scale rather than stretching a cached camera layer. Per-block surface scale composes with camera zoom; persisted camera and Board coordinate formats do not change.

PDF page raster density now includes effective display scale (camera × block scale) alongside the existing device-density and 8,388,608-pixel budget. Board camera/object style changes trigger a debounced density check; panning at unchanged density does not request another render. The previous PDF raster stays visible until its replacement is ready. Fullscreen relocation refreshes observation, and disposal disconnects it. At ordinary Document scale, existing PDF density limits remain. Low-resolution source images/videos and the PDF pixel budget still bound extreme enlargement; tiny content cannot retain full-size legibility when reduced below available screen pixels.

See `../reports/12-boards-zoom-clarity.md` for actual checks and manual review. Remain in phase-4 manual review.


### Follow-up: automatic content height — 2026-10-19

The user approved removing manual block expansion. This supersedes the manual-height minimum and Fit height behavior above. Native writing, tables, code, math, diagrams, files and resource cards derive height from their rendered content, growing and shrinking after additions, removals, wrapping, async loading and editing-mode changes. Other objects retain their saved positions, so growth may overlap nearby objects. Existing 32–4000-unit height bounds remain, with overflow access at the cap and existing bounded media/resource previews.

Content blocks expose west/east width handles and four whole-surface scaling corners. North/south height handles are hidden; Properties height is read-only; Alt+Up/Down cannot stretch them. Width controls reflow content without changing surface scale. Image frames keep their existing cropping/proportion controls and vertical handles; dividers retain their existing geometry. Fit height is removed from both selection and context menus. Math/diagram source textareas size to their source rather than offering manual vertical stretching.

Legacy optional `manual_height` values remain accepted by client/server validators for saved-data compatibility, but no longer constrain content height and no UI action creates them. No migration, new field or format-version change is introduced. Opening a visible legacy frame can tighten and save its derived height through the existing queue without an extra history step. See `../reports/12-boards-automatic-height.md`. Remain in phase-4 manual review.


### Follow-up: live height border during resize — 2026-10-19

Automatic height also follows the live pointer preview. Each scheduled resize paint applies width/surface scale, measures the newly wrapped content, then paints the measured frame height before release. North-corner correction keeps the opposite bottom edge anchored within coordinate bounds. The same measured preview is committed on release; Escape/pointer cancellation restores original geometry. Measurements stay transient during dragging to preserve one resize history/save action. Images and dividers keep their existing frame sizing. See `../reports/12-boards-live-height-border.md`; remain in phase-4 manual review.


## Interface simplification review (2026-10-19)

The user approved a focused interface reduction within the existing phase-4 review:

- The primary dock contains Select, Hand, Text, Add, and grouped undo/redo. Image placement and all other block kinds remain in Add. Its compact two-column menu uses names/descriptions instead of sample preview cards and includes Link page or create Document. Selecting a placement tool preserves canvas focus for Enter-to-place; opening the resource picker yields focus to that dialog.
- Back and the title remain in the header. Its Board options menu contains Board details and the existing favorite toggle. Closing details returns focus to Board options.
- The selection toolbar retains block identity/text style, Edit/Done and editor-specific formatting. More contains Properties for single selections, and duplication, alignment/distribution, layers and deletion while not editing. Arrange is a submenu for multi-selections; minimum-selection restrictions remain. Properties receives focus when opened and returns focus to More or the canvas when closed.
- History shares the creation dock and stays available while editing, when placement controls are hidden. The zoom/view dock stays in the bottom corner, with the creation dock above it at narrower widths.
- Remove the permanent object count and redundant Editing label. Empty Boards show one placement instruction; placement/cancel instructions remain contextual. Quiet Saved feedback and explicit unsaved/error/recovery controls remain.
- Shared theme/frosted surfaces, selection/edit gestures, automatic block height, corner scaling, save locks and linked-page ownership remain in force.

See `../reports/12-boards-interface-simplification.md` for manual acceptance and verification limits. This does not authorize a later feature phase.


## Native app-shell correction (2026-10-19)

The user approved integrating Boards into the normal Orbium interface. This supersedes earlier full-screen-default, hidden app controls, separate Board Back/header and bottom creation-dock presentation rules.

- Boards render as a normal `floating-body-island` below the existing app bar, tabs and breadcrumbs. The Board no longer fixes itself over the viewport, hides application controls, marks them inert or disables body scrolling. Existing navigation guards continue to protect unsaved Board/hosted Document work.
- The Board heading reuses `NodeMediaHeader` in its compact `toolbar` layout: the existing `PageTitleField`, validation, header save endpoint and error feedback, without allocating a cover above the canvas. The existing details dialog retains cover/icon editing, and the Board options menu retains favorites. Title changes remount only the title/header view, not the active canvas.
- Select, Hand, Text, Add and history occupy a normal toolbar row between the heading and canvas. It uses the existing accent/foreground styles instead of a separate floating dock or inverted selected-tool palette. Add opens downward. Placement tools hide while editing; history remains available. Narrow layouts abbreviate Select/Hand to labeled icons and allow toolbar wrapping.
- The canvas retains a rounded contained surface with zoom in its bottom corner and contextual selection/editing controls. Camera fit, contextual placement and properties positioning reserve space for this contained layout. Recovery/error feedback stays inside the canvas and scrolls when height is limited.
- The page height is measured from its actual position beneath the responsive app bar and responds to app-bar/spacer changes, window resizing and visual viewport changes. A minimum working height permits normal page scrolling on short screens instead of covering navigation.
- No Node hierarchy, block content, persistence version, endpoint, archive or feature-phase change is introduced.

Actual checks and exact manual acceptance: `../reports/12-boards-native-app-shell.md`. Remain in phase-4 review.


## Vertical toolbar review (2026-10-19)

The user requested a vertical, icon-only toolbar at the left inside the Board. This supersedes the horizontal row above the canvas from the native app-shell correction.

- Select, Hand, Text and Add form a vertical icon rail with vertically grouped undo/redo. All controls retain accessible names and native hover titles; selected tools retain the shared accent treatment. Existing editing/upload/save locks remain.
- The rail sits inside the Board page alongside the canvas in normal flow, reserving its own width so it does not cover content, save feedback or selection controls. It is 46px wide on fine pointers and 54px on coarse pointers, with 42px touch buttons. On short working areas the rail scrolls vertically.
- Add opens to the right, aligned with its trigger, using existing viewport collision handling. The picker contents retain labels and descriptions. Zoom remains in the bottom corner and the normal Orbium app bar/tabs/title remain visible.
- Camera coordinates, fit/selection calculations and automatic sizing continue to use the actual remaining canvas viewport; the toolbar does not introduce a camera offset or content migration.

See `../reports/12-boards-vertical-toolbar.md` for actual checks and manual validation. Remain in phase-4 review.


## Toolbar consistency review (2026-10-19)

The user approved polishing all Board toolbars after the vertical-rail review.

- Board actions, text-style/More triggers and native inline formatting reuse one `BoardToolButton` with consistent icon size, spacing, hover/open/focus/disabled treatment and a shared tooltip. Tooltips show supported shortcuts when applicable, prefer the right for the rail, and respect viewport collisions. Reduced motion disables toolbar/tooltip transitions.
- The rail reserves a bounded 320px height (scrolling in shorter available space) and keeps undo/redo at its bottom. Select/Hand and Text/Add retain visual grouping. Selected placement tools have an accent background, subtle border and small side indicator.
- Placement tools remain visible but disabled while editing; their hints explain that editing must finish first. This supersedes hide-on-edit behavior, preventing the rail and history positions from jumping. Existing upload/save locks and native history behavior remain.
- Contextual controls share the same button styling. Block style/identity precedes block-specific formatting, then Edit/Done and More. Done uses accent emphasis. Native text formatting retains selection-preserving pointer handling and existing commands; the link popover retains its bookmark/focus behavior.
- The quiet corner group contains minus, a clickable live zoom percentage, plus and View options. The percentage calls the existing Reset view action (camera origin and 100% zoom); Fit all moves into View options alongside Fit selection, reset, grid/snap/guides and help.
- The normal Orbium app bar/tabs/title, contained canvas, content data, selection/resize behavior and persistent formats remain unchanged.

Actual static checks, verification refinements and exact manual acceptance are recorded in `../reports/12-boards-toolbar-polish.md`. Remain in phase-4 review.

## Contextual toolbar anchoring review (2026-10-19)

The user approved anchoring floating controls above the selected block and matching Document toolbar presentation.

- Selection controls remain centered above the selected block or multi-selection bounds during selection and editing, with a 14px gap. If there is insufficient room above, they move below and stay bounded by the canvas/inspector space. This supersedes bottom docking during editing.
- Selected object resize observations keep the anchor current when content grows or shrinks. Controls remain outside the zoomed world at readable screen size.
- Block and native text-selection toolbars reuse Document toolbar surfaces, compact controls, shared reveal and moving hover highlight, including reduced-motion behavior. Existing contextual list/table/media controls and More actions remain available.
- Native selection formatting stays within the visible canvas and temporarily hides overlapping block controls without removing their layout dimensions. Collapsing the text selection restores the block controls; a focused block toolbar retains keyboard focus.

Actual checks and manual acceptance are recorded in `../reports/12-boards-contextual-toolbars.md`. Remain in phase-4 review.

## Selection menu simplification and divider motion (2026-10-19)

The user requested removal of Properties and correction of hover animation across dividers. Selection More no longer offers Properties or mounts its inspector. During editing, More is hidden because its remaining actions apply to inactive selections; Done and contextual editing controls remain available. The shared menu highlight retains its previous row while crossing separators/gaps, including when Radix focuses the menu surface, then animates to the next enabled option. Keyboard navigation and reduced-motion behavior remain supported. See `../reports/12-boards-properties-removal-divider-motion.md` for checks and manual acceptance. Remain in phase-4 review.

## Text toolbar priority clarification (2026-10-19)

The user clarified that selecting text must hide the block toolbar regardless of overlap. Native text selection now owns the contextual controls until the selection collapses or editing finishes. The block toolbar also stays hidden while caret-based link formatting is visible. Panning the text toolbar offscreen does not restore block controls while text remains selected. This supersedes overlap-only hiding and its focused-control exception. The hidden block toolbar retains its geometry so restoring it does not change its anchor. See `../reports/12-boards-text-toolbar-priority.md`; remain in phase-4 review.

## Floating toolbar motion and shared Select (2026-10-19)

The user requested improved toolbar entrance/closing and app-consistent selects. Board block and native text-formatting toolbars now use a 180ms eased fade with a small rise/scale on entrance, followed by a 120ms fade/downward settle on dismissal. Closing uses an inert, aria-hidden visual snapshot because the actual controls must hide/unmount immediately; snapshots strip IDs/editor markers and remove themselves after finishing or cancellation. Rapid reopening cancels the same toolbar's previous exit. Reduced motion skips entrance/exit travel and stops active effects. The existing shared Document toolbar motion remains the default outside Boards.

Native list-style controls now use `AppSelect` with the shared menu surface, current-value check, pointer/keyboard behavior and animated highlight. Toolbar-specific sizing retains compact controls and coarse-pointer hit targets. Code-language controls already use the shared Select. See `../reports/12-boards-toolbar-motion-select.md`; remain in phase-4 review.

## Text toolbar lifecycle stabilization (2026-10-19)

The user reported glitching and block controls staying visible during text selection. Priority and camera-overlay ownership now resolve through the mounted Board formatting slot, rather than querying Tiptap's editor ancestors during child layout effects before the editor DOM is attached. Selection subscriptions are installed independently of whether that editor DOM has reached the canvas. Text selection/caret link controls immediately suppress block controls until deselection or editor teardown.

Board toolbar motion now uses opacity transitions on the live surface, including discrete display transitions for hide/show where supported. The previous cloned exit snapshots and scale/translation animations are removed, so no outgoing toolbar copy can remain alongside text formatting. Ending editing unmounts its toolbar immediately. Priority hides remain immediate; reduced motion removes fades. This supersedes the snapshot motion approach. See `../reports/12-boards-text-toolbar-stability.md`; remain in phase-4 review.

### Floating toolbar pop refinement (2026-10-19)

The user requested pop-out opening and pop-in closing. Live Board block/text toolbars now grow from 92% to full size with an eased 180ms fade on opening and shrink/fade over 120ms on hidden-state dismissal. Independent CSS scale preserves layout measurements and camera anchoring. Text-priority suppression and editor unmount remain immediate to prevent overlapping controls; priority restoration uses the pop entrance. Reduced motion removes both transitions. Closing transitions require discrete-display support and a mounted surface. See `../reports/12-boards-toolbar-pop.md`; remain in phase-4 review.

Collapse correction: the first dimension-caching approach did not resolve the user's More-only strip. The block toolbar now retains the last nonempty selection's presentation (object, count and editing mode) when selection clears, preserving its actual controls during the exit. It becomes inert immediately and switches to the current selection's presentation before reopening. The dimension observer/custom properties were removed. Unpositioned and text-priority-hidden states still reset scale/opacity immediately before the next entrance. No duplicated DOM or editor lifetime extension is introduced.

### Toolbar text layout controls (2026-10-19)

Text, heading, quote and callout blocks expose dedicated Text alignment and Text direction buttons in both the block toolbar and native text-selection toolbar. Menus offer Left/Center/Right alignment and Automatic/Left to right/Right to left direction, with current-choice checks and corresponding trigger icons. These replace the nested layout options in Text style. Layout applies to the whole block through existing `align`/`dir` data and action history, preserving inline content and marks. See `../reports/12-boards-toolbar-text-layout.md`; remain in phase-4 manual review.

Selection-toolbar correction (2026-10-19): alignment/direction now appear only in the block toolbar. Native selection formatting instead includes the shared Document text-color picker, with theme-aware presets, custom hex colors and Default reset. A selection bookmark preserves the target while using color inputs. Native inline serialization, previews and client/server validation support an additive `textColor` mark with `attrs.color` restricted to supported preset tokens or six-digit hex. Existing content/spatial versions stay 1/4; old Boards remain readable, but previous servers reject the new mark, requiring client/server deployment together. Text colors apply to selected inline text, including list items/table cells, and participate in Board action history. See `../reports/12-boards-selection-text-colors.md`; remain in phase-4 review.

### Tools beside the title (2026-10-19)

The user requested moving the left rail above the canvas, to the right of the Board title. The page heading now hosts a horizontal Select/Hand/Text/Add/history toolbar before Board options, superseding the vertical rail placement. Add opens downward and tooltips prefer below. The canvas uses the full working width; placement tools retain editing locks and history stays visible. Below 640px, the title occupies its own row and the tools/options wrap beneath it to the right, with existing coarse-pointer targets. The page owns the host while the existing Board controller renders tools through its portal. See `../reports/12-boards-title-toolbar.md`; remain in phase-4 review.

Select-style refinement (2026-10-19): the title toolbar uses the shared Select hover/focus highlight across enabled tools/history. Add now has a labeled trigger with a rotating chevron and current non-text placement icon/name; its menu is a compact single-column Writing/Media/Technical list with current-tool checks, replacing the two-column descriptive grid. Shared menu entrance/exit/highlight, viewport scrolling, keyboard/typeahead navigation, coarse-pointer rows and reduced motion remain supported. Placement/resource-picker focus rules stay in effect. See `../reports/12-boards-toolbar-select-polish.md`; remain in phase-4 review.

## Floating toolbar usability refinement (2026-10-19)

The user requested a broader enhancement after the lifecycle repairs. Floating controls now use consistent 34px desktop/42px coarse-pointer sizes, softer control corners, balanced surface padding/shadows and grouped text emphasis/decoration/link/editing controls. Text formatting includes a selection-preserving Finish editing action so hiding block controls does not remove the visible way to finish editing. Empty block-formatting slots no longer reserve space.

During a pointer selection drag, text controls stay hidden until release/cancellation; keyboard selection remains immediate. Placement uses the browser range bounds when the selection belongs to the active editor, with editor-coordinate fallback, so wrapped selections center on their actual extent. Camera/viewport clamping and exclusive text-selection priority remain.

Four table structural buttons are consolidated under one Table menu with live dimensions and the existing row/column limits. Choosing an action restores table focus; dismissing without an action returns to the trigger. The shared list Select, no Properties option, pointer-free tooltips and live-surface fades remain. See `../reports/12-boards-floating-toolbar-refinement.md`. Remain in phase-4 review.

### Document table parity (2026-10-19)

Native Board tables now mount the same `mountTable` component used by Document
Live Preview. Cell Markdown editing, selection formatting, row/column handles,
axis menus, sorting, drag reordering, edge insertion and fullscreen preview share
Document code and CSS. Single-click still selects a Board object; double-click
or Enter starts editing. Table actions return focus to the visible Board table,
and undo/redo uses Board history, including inside portaled axis menus.

Existing `rows` tables render through a lossless inline-to-Markdown adapter
without a migration or an automatic save. The first accepted table edit adds
optional `data.table_source` containing one Document table; `rows` remains a
rectangular source-text projection for existing Board consumers. The server
validates the Document table contract and matching dimensions, and includes
nested table attachment IDs in existing workspace ownership checks. The limits
remain 100 rows, 30 columns and the existing Board byte budgets. Source-backed
tables require this app version to preserve the complete rich editing behavior.
See `../reports/12-boards-document-tables.md`. Remain in phase-4 manual review.

Board table insertion controls (2026-10-19): Add row and Add column remain hidden
outside table edit mode, including on hover or keyboard focus. During editing,
they follow the Document table's normal hover/focus visibility. Fullscreen
preview remains available outside edit mode.

## Linked-page scrolling review (2026-10-20)

Linked resource cards keep their saved frame height rather than automatically growing
with their target content. New cards start at 600 × 420 Board units; resize handles
can adjust that viewport. The title and resource actions stay above the internally
scrolling body. Wheel scrolling over the body works immediately, including before
selection/editing, with contained overscroll; Ctrl/Cmd-wheel still zooms the canvas.

Document cards fetch the original source through the existing scoped endpoint and
render it immediately with the shared rich-body renderer, without mounting an editor.
Target revision changes and explicit Refresh reload the rendered content. Legacy
Documents use the existing Markdown serializer. Double-click/Enter still opens the
original Document editor inside the same scrolling frame. Database/Board links retain
navigation cards. No persisted schema or hierarchy changes are introduced. This
supersedes automatic resource-card height and plain-text Document excerpts only;
other native content retains automatic height. See
`../reports/12-boards-linked-page-preview.md`; remain in phase-4 manual review.

## Linked-page editing controls and container review (2026-10-20)

The linked-page editor restores the normal Document block gutter for both Markdown
and legacy Documents. While editing, users can drag internal blocks to reorder
content in the original Document. A reserved inner gutter keeps controls visible
inside the clipped card. Markdown hosted sessions remain local-only drag targets;
reordering never transfers blocks to other editors or creates Board objects.
Markdown drag edge/wheel scrolling stops at the resource viewport boundary.

The resource container has a bordered, rounded inner surface, a muted header with
an icon tile, title and Linked/Editing original subtitle, accessible action focus
states, a thin scrollbar and consistent reading/editor padding. Clipping stays on
the inner card so Board selection outlines and resize handles remain accessible.
This supersedes the earlier hosted-document gutter suppression; native Board blocks
retain their existing interaction model. See
`../reports/12-boards-linked-page-editing.md`; phase 4 remains in manual review.

## Linked-page scroll continuity (2026-10-20)

Switching between rendered preview and original-Document editing preserves the
resource viewport's horizontal and vertical scroll offsets. A temporary minimum
content height retains the scroll range through source-fetch/lazy-editor loading;
restoration waits for the replacement surface and its initial layout. Refresh,
revision updates and confirmed editor reloads use the same continuity mechanism.
The temporary height and observer are removed once the replacement is ready or
when the transition is canceled. Positions are transient per mounted card, and
shorter replacement content clamps to its available scroll range. See
`../reports/12-boards-linked-page-scroll-continuity.md`; remain in phase-4 review.

## Linked-page preview/edit style continuity (2026-10-20)

Resource preview and editing now share 18px/20px/24px outer padding and the same
52px inner block-control gutter, base typography and writing width. The gutter is
reserved in preview as well as editing so text does not move sideways on activation.
Rendered previews opt into the existing saved Document stylesheet scope; the general
resource-placeholder paragraph reset no longer overrides paragraphs within them.

The Markdown editor's save status and existing actions menu render in the card
header through an optional hosted-controls context, removing the toolbar's extra
vertical space from the writing surface while keeping all actions accessible.
Reorder guidance is screen-reader-only, header background stays the same between
modes, and resource selection uses a solid outline during editing. Ordinary
standalone Document controls keep their original placement. See
`../reports/12-boards-linked-page-style-continuity.md`; remain in phase-4 review.

## Linked-page interaction refinement (2026-10-20)

The approved refinement prioritizes anchored in-card editing and quieter chrome.
Markdown previews optionally annotate rendered top-level blocks with their canonical
source ranges. The resource viewport records the first visible block and its offset
inside the card; preview/editor switches restore that block after layout, with a
second correction for CodeMirror's estimated offscreen heights. Pointer activation
focuses near the original double-click without browser focus scrolling; Enter/menu
activation focuses the anchored block. Legacy/unsupported preview content retains
the pixel-offset fallback. Source-range metadata is transient DOM data only.

The preview remains visible while an editor source request is pending. If the
preview already loaded the target's current advertised revision, editing reuses
that source; normal original-Document revision checks remain authoritative. No
inactive card mounts a full editor.

The card now has a 46px single-line header, a plain icon, title, Open action and one
menu. Refresh moves into the menu; while editing, it also contains Finish editing
and the existing Document actions. Saved status is screen-reader-only; saving,
unsaved and error status remain visible. Resource cards use a subtle border without
an extra shadow, with a shared 40px gutter and compact hover controls. This
supersedes the earlier 64px header/icon tile and 52px gutter. See
`../reports/12-boards-linked-page-interaction-refinement.md`; remain in phase-4 review.

## Optional animated fullscreen (2026-10-20)

Boards still open in the normal app layout. The heading now offers Enter fullscreen
and Exit fullscreen. Fullscreen expands the existing Board across the browser content
viewport with a 320ms eased geometry transition; exit returns it to its normal page
position over 260ms. Browser tabs/address bars remain visible. The title, tools,
options, canvas controls and save/recovery UI remain available.

The page and editors stay mounted, preserving drafts, selection, camera and history.
The covered app shell becomes inert and body scrolling is locked until exit or
unmount. Menus/dialogs remain available through their existing portals. Escape exits
fullscreen when focus is within the Board and no editor, placement, gesture, input,
menu, dialog, composition or native media fullscreen owns dismissal. An active
editor/tool finishes first through existing Board handlers. The explicit exit control
remains available during editing. Reduced motion skips geometry animation, including
when enabled during a transition; viewport resizing updates the fullscreen bounds.

Fullscreen is transient UI state and introduces no persistence or schema change.
See `../reports/12-boards-fullscreen.md`; remain in phase-4 manual review.

### Fullscreen canvas header and exit correction (2026-10-20)

The fullscreen title and Board toolbar now float together inside the working
canvas. The canvas reaches the viewport edges underneath them. The existing
heading remains mounted; animated padding and measured heading space restore
its ordinary row when leaving fullscreen. Expanded save/error notices move below
the floating heading. Narrow layouts retain the existing heading wrapping.

After fullscreen has been used, the page's arrival animation remains disabled so
restoring its normal styles cannot replay the initial opacity fade. Scrollbar
space is retained while body scrolling is locked, reducing layout shifts on exit.
This supersedes the initial fullscreen layout with a separate heading above the
canvas. See the correction entry in `../reports/12-boards-fullscreen.md`.

### Separate floating fullscreen controls (2026-10-20)

The user clarified that fullscreen controls should look like floating panels.
The full-width heading backdrop is removed. The title, Board toolbar and individual
fullscreen/options buttons now have separate rounded surfaces, subtle borders,
shadows and backdrop blur. The title has a bounded width, while tools align right
and retain the narrow-screen wrap. Empty space between panels passes pointer
input to the canvas. Surface opacity, depth and title padding follow the existing
fullscreen animation progress; editor mounting and exit-blink prevention remain.

## PDF, video and audio insertion (2026-10-20)

Board Add now exposes Video, Audio and PDF alongside Image and File. Choosing a
media tool arms normal click/Enter placement and returns to Select after insertion.
Empty blocks show the media-specific icon and prompt; their Upload and Library
controls are available during editing. Library search, sorting and pagination keep
the requested media filter. Replacement uses the same filter.

These choices persist as native `file` objects with optional
`data.media_kind: 'video' | 'audio' | 'pdf'`. The attachment ID, name and caption
contract remains unchanged. Existing generic file blocks continue to preview
supported media according to MIME. New typed blocks validate matching MIME on
Library selection, upload completion, metadata loading and server save. MIME is
server-detected; a mismatched upload remains in Library but is not attached.

The shared Document/Library player supplies playback, download, PDF pagination and
zoom, PDF modal preview and native video fullscreen. Audio has no fullscreen.
Content-driven height, Board resizing/scaling, undo/redo and attachment usage
protection remain in effect. Removing a block keeps its file in Library.

No migration, new block kind, dependency or format-version change is introduced.
Native content remains version 1 and the Board envelope remains version 4. Older
servers reject the optional field, so deploy client and server together. Existing
saved blocks need no rewrite. Browser codec support and the existing upload limits
still apply. See `../reports/12-boards-media-blocks.md` for actual checks and manual
acceptance. This remains phase-4 review.

### Media movement correction (2026-10-20)

Media players reserve their filename/type header for Board selection, dragging and
double-click editing. Download/fullscreen buttons, video stages, playback controls
and PDF reader surfaces retain interaction ownership. The whole player must not be
marked `data-board-interactive`, because that prevents pointer selection/movement
from every visible part of loaded media. Finish editing before dragging as with
other native blocks. Reader wheel ownership remains on `data-board-player`.

Media movement follow-up (2026-10-20): dragging is also available from inline PDF
pages and video pixels after finishing editing. Only the PDF/playback control strips
retain the Board interaction marker. Inline video pixels pass pointer targeting to
their stage outside editing; Play and the playback bar remain operable. Videos with
native fullscreen controls keep pointer targeting. PDF wheel scrolling remains
unchanged. This supersedes the header-only movement restriction above.

## Media editing toolbar refinement (2026-10-20)

Image, Video, Audio, PDF and File editing share compact Board toolbar controls.
Add file/Replace opens the shared animated menu for Upload file and Choose from
Library, retaining existing type filters and upload locking. Caption is an icon
control opening a small labeled text panel with live preview, Clear and Done.
Caption edits still use Board history/autosave; Escape closes the panel rather
than reverting already-applied changes.

Attached images additionally offer Image framing: Fit/Fill, horizontal/vertical
crop positions with percentage labels in Fill mode, Reset proportions and concise
crop-frame guidance. Fit shows the whole image in its existing frame; Reset
proportions restores the natural frame. The former always-visible caption field,
plain source buttons and inline crop controls are removed from the toolbar.

Buttons reuse BoardToolButton/tooltips, grouped separators, current-state cues,
coarse-pointer targets and existing floating-toolbar motion. Popovers use shared
surface tokens, bounded scrolling, keyboard focus/return, Escape dismissal and
reduced-motion support. Done stays in the surrounding toolbar. No persistence,
attachment ownership, player interaction or Board format changes. See
`../reports/12-boards-media-toolbar.md`; remain in phase-4 manual review.
