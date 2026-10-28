# Boards

Requested 2026-10-18. The supplied development specification ends at “Unlimited subtopics within practical” in section 8; later Mind Map requirements and any subsequent sections are unavailable. The user authorized the confirmed Mind Map core on 2026-10-24; see the phase-5 contract below. Do not claim the missing remainder is implemented.

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

Native data limits allow JSON/formatting/recovery overhead: 256 KiB per object, 4 MiB total, no fixed object-count ceiling, 1,000 list items, 100×30 table cells, 10,000 inline entries per field and 50,000 bytes of Mermaid source. Positions ±10,000,000; dimensions 80–4,000 by 32–4,000; zoom 10–400%. Preview culling and one active inline/code field avoid mounting document editors across the canvas. New shapes, live resource cards, Mind Maps, grouping and Board import/export remain outside this correction.

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

## Board interaction performance correction (2026-10-20)

The CPU investigation repair coalesces pointer samples before resolving gesture
geometry. Each active pointer retains its latest sample; both touch positions are
applied before pinch geometry is computed. Idle pointer movement performs no Board
geometry reads. Release flushes the final sample before the single history/save
commit, and cancellation restores canonical geometry.

Drag previews translate existing block surfaces using gesture-cached DOM elements;
release writes saved x/y and clears the temporary translation. Camera panning also
uses translation while preserving native layout zoom for sharp text/PDF density.
Resize previews retain live content-height measurement and skip unchanged style
writes. Alignment-guide DOM is retained while guide geometry is unchanged.

Measured automatic heights publish one derived snapshot per frame, with stale
measurements discarded after intervening object changes. These updates still add
no undo step. Full linked-Document preview requests begin during scheduled idle
work with at most two active requests across mounted Boards; canceled queued cards
never start a request. Math/diagram source fields defer their hidden previews until
editing ends. Recovery keeps its 150ms debounce and schedules serialization through
the shared bounded idle scheduler; save/exit/error paths still persist immediately.
Unchanged immutable block content reuses client validation across saves; aggregate,
geometry and server-side validation remain enforced.

No Board format, API payload or database changes. See
`../reports/12-boards-performance-correction.md` for checks and manual acceptance.
Phase 4 remains in manual review; thermal improvement requires user measurement.

### Movement CPU follow-up (2026-10-20)

After the user reported continuing spikes, Board movement now caches pointer
viewport origin until scroll/resize, derives toolbar bounds from inline preview
geometry and camera state, and caches toolbar dimensions on actual resize. Guide
anchors are indexed once per drag and queried by binary search while retaining
nearest-match/tie order. PDF density observation ignores translation-only changes.
Active dragged blocks and the moving camera world receive temporary compositor
hints, cleared on release/cancel or camera settling. Idle blocks retain no permanent
promotion hint. Styling, native zoom clarity, persistence and phase-4 review remain.
See `../reports/12-boards-movement-performance-followup.md` for actual checks,
limitations and manual comparison; temperature improvement is not yet measured.

### Pan re-rendering lifecycle correction (2026-10-20)

The user reported slow block reappearance and continued CPU spikes after the earlier
performance passes. Recently viewed offscreen blocks now remain mounted within a
weighted 48-unit budget (text 1, table/Mermaid 3, linked resource 6, file/media 12),
in addition to the mounting region and independently pinned active editor. Old
surfaces are evicted during longer traversal. The camera publishes a 640px overscan
region when the viewport approaches within 160px of its edge, rather than repeating
visibility updates on a 120ms timer; zoom/resize refresh coverage immediately.

Linked Document source is revision-cached within the Board provider, capped at
24 entries/8 MiB estimated serialized payload. Explicit Refresh/save invalidates it.
The two-request preview queue starts ordinary tasks with visible-card priority,
superseding idle-delayed source fetching. Returning to retained cards reuses their
live renderers; cached source avoids downloads when a surface has been evicted.

The grid is a separate clipped translated layer beneath the world, replacing
canvas-background position updates during pan. Native layout zoom and PDF density
remain. See `../reports/12-boards-pan-rendering-lifecycle.md` for actual checks and
manual acceptance. CPU/thermal resolution remains unverified; phase-4 review continues.

## Board performance architecture correction (2026-10-21)

The user explicitly requested implementing the new architecture without waiting
for P0 recordings. Each mounted Board now owns normalized immutable object records,
per-object subscriptions, a geometry channel and grouped transactional history.
Typing updates the affected record; full snapshot arrays materialize at command,
save/recovery or geometry boundaries. Automatic heights remain batched and derived,
and selection/camera state remains transient. Rendering no longer publishes
retention state during render.

Inactive tables use read-only Document-style surfaces/fullscreen with no hidden
CodeMirror source editor. Editing mounts the existing shared table controller;
scroll position survives mode changes. Rich table cells create Mermaid sessions
only when needed. Native code/math/diagram previews and expensive linked Document
embeds share one Board scheduler with two preview fetch slots, one render-initiation
slot, visible priority, bounded yielding and cancellation. Original Document text,
ownership, complete inline access and active-editor pinning remain. Ordinary
Documents retain their existing default renderer behavior.

Format-4 snapshots advertise optional `mutation_version: 1` only for native,
contiguously ordered objects. Compatible Boards save explicit creates/updates/deletes
through revision-checked PATCH batches; legacy/unknown-capability Boards keep PUT.
Changed data/references/geometry and resulting aggregate bytes/count/order remain
server-validated in one transaction. Changed rows are written individually after
one-time budget initialization. Exact retry bodies/UUIDs and a bounded last-mutation
receipt protect uncertain responses; 409 preserves full local recovery and stops
writes. Full snapshot load/download/recovery and confirmed replacement remain.
PATCH preserves significant whitespace and empty strings. Confirmed Load latest
suspends autosave until the replacement arrives.

The additive migration adds nullable byte/replay metadata, not a new content format.
Run migrations with the matching server deployment. Source-cache/retention budgets,
native zoom/PDF clarity and existing pointer painting stay as established. Actual
CPU/thermal improvement is pending manual measurement. See
`../plans/board-performance-architecture.md` and
`../reports/12-boards-performance-architecture.md`; stay in phase-4 manual review.

### Repeat-loading correction (2026-10-21)

Prepared diagram/math results now survive culling within a mounted Board. Sanitized
Mermaid SVGs have a 128-entry/4 MiB estimated-string budget; compiled math has its
own 128-entry/4 MiB budget. Native hits attach before paint, with fresh SVG instance
IDs/current colors and working fullscreen controls. Rich table and linked Document
sessions reuse owner/source-matched sanitized diagrams. Native cold diagrams run
directly through the shared Board queue, holding its render slot through async
completion instead of adding Document idle scheduling. Hidden/obsolete callbacks
cannot populate a replacement surface. Uninterruptible renders may complete into
the bounded cache after their card is culled.

Refreshing a linked Document keeps its current readable revision until the new
source arrives. Target changes and unavailable-resource boundaries still discard
the previous content. Cold loads, source changes, cache eviction and reopening a
Board can still require rendering/fetching; this is no claim of zero loading or
measured performance improvement. See `../reports/12-boards-preview-continuity.md`
for checks/manual acceptance. Remain in phase 4.

### CPU follow-up after unchanged user results (2026-10-21)

The user reports unchanged rendering/CPU/temperature after preview reuse. Native
unmarked tables without Document source now render their literal text/breaks
directly into the existing table/fullscreen structure, avoiding a Markdown export
and one table/per-cell parse on every mount. Rich/source-backed tables keep the
shared rich renderer. Height observation no longer restarts on content/height
updates; actual size notifications and explicit scale/width/edit-mode changes
continue measuring automatic height. The Board queue selects the best runnable
job in one pass, yields pending input for 16ms and pauses queued work in hidden
browser documents. Cached SVG color adaptation is weakly memoized; instance IDs
still change per mount and theme CSS variables remain live.

Static checks pass; the CPU/thermal complaint is still unresolved pending manual
foreground recording and built-asset comparison. See
`../reports/12-boards-cpu-followup.md`. Remain in phase 4.

### Experimental Instant Scene prototype (2026-10-23)

The user authorized a reversible first milestone on `codex/instant-scene-engine`
from the latest `codex/boards`. Following the user's direct-review request,
Instant Scene is the default on this experimental branch, using a prepared
DOM/vector adapter with a separate local view key and experimental 50–200%
camera range. `?boardRenderer=original` explicitly restores the reference adapter
and its 10–400% range. `?boardRenderer=instant` explicitly selects Instant Scene.
The optional session override is documented in
`../plans/board-instant-scene-architecture.md`.

Native text, heading, list, quote and callout templates and sanitized Mermaid SVG
are prepared independently of card visibility, with bounded Board-local caches
and the existing shared scheduler. Warm presentation copies prepared content;
active editing still uses native implementations and the same canonical records,
history, saves and recovery. Other kinds keep their existing renderers. Camera
zoom reuses settled layout density during gestures, then restores sharp native
layout; pointer anchors respect the experimental limits.

This is a first working slice, not full rich-content preparation or a production
migration. It adds no schema, API, dependency or persisted content-format change.
Cold content/cache eviction/reopening can still need preparation. No browser,
CPU or temperature improvement has been measured. The exact manual checklist and
remaining boundaries are in `../reports/12-boards-instant-scene.md`. Stop for
review before later engine milestones or another product phase.

### Instant Scene PDF preservation review (2026-10-23)

The user approved the focused PDF milestone after reviewing the prototype's
insufficient preservation. In Instant Scene, prepared PDF page pixels, accessible
page text and per-object page/zoom/rotation/scroll/sidebar state now outlive a
culled card. Warm cards attach the prepared page before metadata revalidation;
unchanged page geometry/density does not start another raster or PDF document
task. Native controls remain available and load the document when required.

One interacted PDF is pinned independently of the existing editor/retention
rules. Changing the active PDF or entering another object's editor releases that
pin. Inactive document tasks are destroyed after their prepared page is complete;
the page remains visible. Cold preparation shares two fetch slots and one render
slot, with hidden-tab suspension and stale-result cancellation. Repeated movement
at unchanged geometry should preserve the current reader/page.

The Board-local LRU holds at most 32 prepared pages / 64 MiB of estimated RGBA
pixel storage plus page-text bytes. View state/metadata follows current object
identities within the existing bounded scene-state cache. Visible canvases and active PDF
internal memory are additional; this is not a browser-wide heap/GPU cap. Cold,
evicted or changed-resolution content can still prepare again. Full Board reload
does not persist these transient assets or view state.

Original rendering remains available through `?boardRenderer=original`; normal
Documents and Library have no Board preservation session. File ownership,
download/fullscreen controls, canonical content, history, saves and recovery stay
with their existing contracts. No migration/API/format/dependency change. Read
`../reports/12-boards-instant-scene-pdf.md` for exact manual steps and measured
versus unmeasured results. Stop before extending this model to other rich kinds.

## Page insertion and native text references (2026-10-23)

The current phase-4 review supports `@` completion in native Board writing and
list blocks. Search same-workspace live Documents, Databases and Boards; choose
with arrows/Enter or a pointer, dismiss with Escape, and switch insertion modes
with Tab. Mention inserts a readable `@Title` safe link in the sentence. It uses
the existing native link mark and ordinary page URL, with app-tab navigation from
previews; it does not create a Document mention-index row or change hierarchy.
The label is captured at insertion and can be edited as ordinary linked text.
Email addresses, code marks and existing linked text do not start completion.

Inline Document mode searches Documents only and places the original live
Document card beside the source block, removing the typed `@query`. This reuses
existing resource persistence, original-document editing and save/lock guards.
It does not nest a Document editor inside a sentence or copy its content.

Add → Page or inline Document provides searchable All pages / Documents filters,
arrow/Enter selection and a collapsed Create a Document form. New Documents still
use the existing idempotent sibling-creation action and retry recovery. The resource
browse endpoint accepts an optional validated `type` filter before pagination,
with unchanged workspace/ancestor visibility. Spatial format 4 and native format 1
are unchanged. See `../reports/12-boards-page-insertion.md` for manual acceptance.

## Board block-count cap removed (2026-10-23)

At the user's request, Boards no longer enforce the historical 1,000-object cap.
Native insertion, duplication, clipboard validation, snapshot loading/recovery,
full saves, incremental create/update/delete operations and sibling Document
creation accept Boards above that count. The local stress-scene command also
accepts counts above 1,000. This supersedes earlier object-count limits in the
phase/history descriptions above; no spatial format or migration changes.

The 256 KiB per-block and 4 MiB aggregate data budgets, block-specific content
limits, identity/geometry/layer validation and bounded renderer/PDF caches remain.
Cache capacity is a rendering lifecycle budget, not a Board block-count limit.
See `../reports/12-boards-object-cap-removal.md` for checks and manual acceptance.

## Inline Documents and self-mention rule (2026-10-23 correction)

The user clarified that inline canvas content is **Documents only**. Add → Inline
Document always searches Documents and has no All pages filter. The resource
browse endpoint applies the same restriction; new resource-object writes reject
non-Documents. Existing Database/Board cards retain their original identities for
compatibility and may still be moved or removed. Newly inserted Document cards
enter editing so their content can be changed directly on the canvas.

Mention mode searches the shared same-workspace candidate endpoint, including
folders, Documents, Databases and Boards. That endpoint requires the source Node
ID, excludes it before limiting results and checks source/target visibility.
Native Board mentions use the Board as source. The original Document is the
source when editing a hosted Document card, matching ordinary Document editing.
Markdown and legacy editors and database mention-property pickers exclude their
own source Document. Server-side checks reject saved self-mentions, including
pasted canonical Board page links and table-source mentions. Existing self-links
are not silently rewritten; remove them before saving under the new rule.

This supersedes the earlier All pages / Documents inline picker. No migration,
content-format change or new product phase. Manual acceptance is recorded in
`../reports/12-boards-inline-document-mention-rules.md`.


## Drawing (requested 2026-10-23)

The title toolbar’s Draw button opens Pen, Highlighter and whole-stroke Eraser
controls. Choose theme-following Ink or red/amber/green/blue/purple, with pen widths
1/3/6/12 world units (the highlighter uses four times the chosen width and 30%
opacity). Drag with mouse, pen or touch; a tap creates a dot. Drawing mode stays
active between strokes. Done or Escape when idle returns to Select. Escape during
an active gesture discards only that unfinished stroke/erasure; pointer cancellation,
lost capture and window blur also discard the gesture. Space + drag/middle drag pans;
a second touch cancels unfinished drawing and hands control to the existing pinch
navigation. Drawing over existing blocks does not activate their controls.

Each completed stroke is one independent native `drawing` object. Select moves,
resizes, arranges, layers, duplicates, copies/pastes and deletes it using ordinary
Board actions. There is no text-edit state for strokes. Side resizing stretches the
vector geometry; corners retain proportions. Eraser hit testing follows actual
stroke segments, including moved/resized strokes, rather than their rectangular
frames. Touched strokes fade during the gesture; release removes the touched set
as one undoable action. Only drawing objects can be erased. Drawings are Board
objects and do not stay attached to the blocks beneath them.

Live points and preview paint stay outside React state and persistence; SVG preview
painting/eraser work is scheduled once per frame. Pointer release commits one
history/save change. A stroke has at most 6,000 sampled points and 3,900 world units
of point span per axis; exceeding these budgets preserves the accepted portion and
shows a message to continue with another stroke. Existing 256 KiB/object, 4 MiB/Board,
4,000-unit frame and coordinate budgets still apply. No measured browser/thermal
performance claim is made.

`2026_10_23_000001_add_board_drawings.php` upgrades spatial envelope/default to **5**
and adds `drawing` to the native row constraint. Native content format remains 1.
Data contains `drawing: {points: [[x,y], ...], view_width, view_height, color,
stroke_width, opacity}`, plus optional existing `text_scale` from corner resizing.
Coordinates are local finite numeric pairs within the saved view box; colors are
`currentColor` or six-digit hex, width 1–48 and opacity 1 or 0.3. Client and server
validate these bounded values; arbitrary SVG source/markup is never accepted.
Drawing rendering uses a generated SVG path with numeric coordinates.

Both full saves and PATCH mutations require envelope 5. Existing database rows and
revisions are retained; local recovery explicitly adapts formats 1–4 to 5, rejecting
drawing objects in older envelopes. Existing format-4 resource cards remain readable.
Older clients reject format 5. Deploy migration/backend/frontend together and reload
open clients. Downgrade refuses while any drawing object remains, including drawings
in trashed Boards. See `../reports/12-boards-drawing.md` for actual checks and manual
acceptance. This request extends the current Board phase-4 review only.


### Drawing smoothing (approved 2026-10-23)

Drawing controls offer **Smoothing: Off / Light / Strong**, defaulting to Light
for Pen and Highlighter. Off keeps direct ink. Light reduces small pointer tremors;
Strong applies more cleanup and may soften small details. `perfect-freehand` 1.2.3
supplies centerline streamlining via `getStrokePoints` (Light 0.5, Strong 0.75).
Each stroke captures the brush/smoothing settings and start-of-stroke zoom. Settings
remain local to the mounted Board session and affect new strokes only.

Light/Strong simplify the streamlined path before forming curves. Cleanup uses
1.5 screen pixels for Light and 6 for Strong, converted through start-of-stroke zoom.
The cleanup first reduces nearby points, then retains deviations above the chosen
scale; iterative segment simplification has a comparison budget proportional to
point count. If exhausted on a pathological path, remaining detail is retained.
Off bypasses both streamlining and cleanup. All three modes retain freehand ink.

Cleaned controls become midpoint quadratic sections, retaining pronounced turns.
The curves are sampled into numeric point pairs within the existing 6,000-point
budget. Extra curve samples are distributed within the remaining budget; very
long strokes can use a coarser approximation. Curve density anticipates the
maximum supported camera zoom when budget allows. The raw endpoint remains the
visible tail, retaining the actual release position without a late endpoint snap.
Live preview and committed geometry share the same preparation path; release does
not run a separate beautification pass. Existing local-coordinate rounding to two
decimal places remains in place.

Smoothed geometry is saved as the existing ordinary drawing points. Existing
strokes are not reinterpreted or rewritten; old clients that already understand
format 5 render the new strokes and erase their actual saved segments. There is
no new schema field, migration or format version. Existing history, clipboard,
selection, resize, recovery, cancellation and byte/geometry limits still apply.
No shape recognition or pressure/taper behavior is added. The initial implementation
report is `../reports/12-boards-drawing-smoothing.md`; the user-feedback correction,
actual latest checks and revised acceptance are recorded in
`../reports/12-boards-drawing-smoothing-correction.md`.


### Drawing toolbar refinement and recognition removal (2026-10-23)

Following poor recognition results, the user requested removing the recognition
system for now and redesigning drawing controls to match the app. The $P adapter,
all template catalogs, recognition hook/timers/conversion logic, category controls,
candidate actions and gallery are removed. Strong is extra freehand smoothing;
there is no delayed conversion or recognition mode. Existing converted objects
remain normal editable Text or drawing objects; saved content is not rewritten.
The smoothing library remains, with its MIT notice in `../../THIRD_PARTY_NOTICES.md`
and `public/third-party/board-drawing-licenses.txt`. Removed recognizer notices no
longer describe a distributed dependency.

Drawing controls now use a compact lower-left glass panel above the zoom lane.
Pen, Highlighter and Eraser have visible labels, the shared Board buttons/tooltips
and app hover-highlight motion. Done returns to Select. Ink swatches include a
selection check and a theme-following option. Width uses four visual presets with
actual width labels (highlighter remains four times wider). A local brush preview
shows color, width and highlighter opacity. Smoothing uses the shared animated
`AppSelect`, with direct/gentle/extra descriptions. Eraser hides irrelevant brush
controls and explains whole-stroke removal and Undo.

The panel has an eased 180 ms entrance and 100 ms noninteractive exit using the
live element and CSS discrete display transitions. Unsupported browsers fall back
to immediate visibility changes. Reduced motion removes panel/swatch/width
transitions; shared controls retain their existing reduced-motion behavior. Layout
wraps on narrow Boards and touch controls are at least 42 px. The panel scrolls
within short canvas heights, keeping the zoom lane clear. Keyboard focus, labels,
existing Escape cancellation, pan/pinch, history and save behavior remain in use.

Spatial format stays **5**; no migration, backend endpoint or persisted field is
added. Exact checks and manual acceptance are recorded in
`../reports/12-boards-drawing-toolbar.md`. The earlier recognition report is
historical and superseded. Remain in Board phase-4 manual review.


### Canvas and vertical drawing dock (requested 2026-10-24)

The Board title row is removed from the working surface, giving that height to
the canvas. Title/icon/appearance editing remains under the floating top-right
Options → Board details dialog. Favorites and fullscreen remain available there
and beside the menu. App tabs/navigation retain the Board title.

Tools and history now form one centered left vertical glass dock, with circular
buttons, a monochrome filled active state and right-side tooltips. Add is icon-only,
announces its active placement kind and opens toward the canvas. The dock overlays
the canvas, so opening controls never shifts objects or changes the viewport size.

Draw opens a narrow palette beside the dock. Illustrated horizontal pen,
highlighter and eraser controls extend on hover/selection; ink colors the pen nib
and highlighter tip. Existing labeled tools, ink swatches, width presets, live
stroke sample, smoothing and Done/Escape behavior remain. The palette and dock
scroll within short viewports; coarse pointers retain 42px controls and use a
three-column ink grid. Reduced motion disables brush travel and palette animation.
Fullscreen retains the same floating layout without reserving heading space.

This supersedes the title-toolbar/lower-left drawing-panel placements above.
No persisted format, API, drawing algorithm or dependency changes. Spatial format
remains 5. Static checks and exact manual acceptance steps are recorded in
`../reports/12-boards-canvas-dock.md`. Browser visual acceptance remains pending;
no automated tests or browser automation were used. Remain in phase 4.


### Dock styling and opaque surfaces correction (2026-10-24)

Following user review, Board controls use opaque theme card/popover colors,
including when the surrounding app uses frosted surfaces. Canvas content no longer
shows through the dock, drawing palette, contextual controls, view/Add/smoothing
menus or Board context menu. The canvas itself uses the solid theme background.
The dock retains its vertical placement but uses the app's rounded rectangular
buttons, quiet accent selection, border and restrained shadow.

The palette omits the repeated Drawing heading, Done button, footer instructions,
eraser paragraph, named Ink row and separate stroke preview. Tool labels,
accessible names/tooltips, selected color checks, numeric width and smoothing
remain. Smoothing choices read Off / Light / Strong. Click the active Draw button,
Select, or press Escape while idle to leave drawing. Escape during a gesture still
cancels only that unfinished gesture. Reset remains on the zoom percentage button;
its duplicate View menu item is removed. No drawing or persistence behavior changes.
See the correction checklist in `../reports/12-boards-canvas-dock.md`.


### Drawing palette toggle clarification (2026-10-24)

Clicking the active Draw dock button toggles only the palette. Drawing continues
with the current Pen/Highlighter/Eraser and settings while the palette is hidden;
click again to reopen it. The Draw button remains pressed to indicate drawing
mode, exposes palette expansion to assistive technology and names its current
Show/Hide settings action. Select or idle Escape exits drawing. Entering drawing
from another tool opens settings. Choosing a brush in the palette keeps settings
open. This supersedes the click-Draw-to-Select behavior above; no persistence or
drawing algorithm changes. See the latest manual checklist in
`../reports/12-boards-canvas-dock.md`.


### Partial eraser and size controls (requested 2026-10-24)

The eraser now removes touched portions of native ink instead of deleting a whole
stroke. Four sizes (8, 16, 32, 64 screen pixels in diameter; default 16) live under
Eraser. A dual-outline mouse cursor shows the selected footprint. Size remains
local to the mounted Board, separate from pen/highlighter width; its world radius
is captured from the camera zoom at gesture start. Palette hiding preserves the
active eraser/size, as with the drawing tools.

Each pointer sweep clips the drawing's polyline against its swept capsule,
including interpolated intersections between sparse points. Round stroke caps
are accounted for using the stroke's scaled half-width. Erased portions disappear
in the SVG preview during the drag. Preview work is frame-scheduled and paints
only changed paths, without modifying canonical Board records until release.
Escape, lost capture, blur and pointer cancellation restore the original paths.

Release replaces touched strokes with their surviving pieces as one validated
history/save transaction. Each survivor is an ordinary format-5 drawing object;
the first survivor retains the original UUID and later pieces get new UUIDs.
Frames shrink within existing minimum sizes while retaining the original drawing
scale, color, thickness, opacity and relative layer order. A fully erased stroke
is removed. Untouched content is preserved. Undo restores the complete drag and
Redo reapplies it. Surviving pieces may be selected, moved, resized and erased
independently. No masks, new persisted fields, schema or migration are needed;
existing format-5 clients can render the saved fragments.

This is vector path cutting, including the visible stroke width, rather than a
pixel mask or shaving one side of a thick stroke. Highly nonuniform resizing uses
the larger scale for cap clearance, which may cut conservatively. Per-gesture
preview limits cancel the whole erasure above 120,000 surviving points across
touched strokes or 6,000 fragments per source stroke. Existing Board validation
can reject an oversized final result atomically, restoring the original scene
with the normal limit message. Runtime performance/visual acceptance is unmeasured.

This supersedes whole-stroke erasing in earlier drawing descriptions. No later
product phase starts. See `../reports/12-boards-partial-eraser.md` for actual checks
and exact manual validation.


### Keep erased ink in one drawing block (2026-10-24 correction)

User clarification supersedes the separate-survivor behavior above. Partial
erasing now keeps surviving subpaths inside the **original drawing object** with
its UUID, frame, view box, scale, color, width, opacity and layer. Select, move,
resize, duplicate and clipboard actions treat the remaining ink as one block.
Repeated erasing reads all existing subpaths, preserving earlier gaps. Fully
erasing the final visible subpath removes the object. Each drag remains one
Undo/Redo transaction; canceled previews restore all prior gaps.

Drawing data retains `points` and adds optional **`breaks: number[]`**. Each index
starts a new subpath in the flattened point array. Breaks must be strictly
increasing positive integers below the point count. Empty breaks are omitted;
ordinary drawings retain their original six fields. Rendering generates multiple
SVG move commands inside one path and never reconnects across a break. Dot
subpaths retain the existing round-cap behavior. No raw SVG or arbitrary nested
content is persisted. Client/server validation enforces 6,000 total points per
object, at most 5,999 internal breaks and the existing byte/geometry limits.
Oversized previews cancel the drag atomically.

The additive `2026_10_24_000001_add_board_drawing_gaps.php` upgrades the Board
spatial envelope/default to **6**, leaving object content versions, UUIDs and
revisions unchanged. Full saves, PATCH mutations, sibling Document creation and
recovery serialization use envelope 6. The new reader explicitly adapts valid
format-5 snapshots and formats 1–4 local drafts; a `breaks` property in an older
envelope is rejected rather than reinterpreted. Unsupported future envelopes are
rejected. Old clients reject format 6. Rollback refuses while any drawing has
breaks, including drawings in Trash. Deploy migration/server/client together and
reload open Boards.

Already-split pieces saved by the previous implementation have no source grouping
metadata and are not automatically merged. No unrelated drawings are joined.
Read `../reports/12-boards-single-drawing-eraser.md` for migration/check results and
manual acceptance. This stays in Board phase-4 review.


### Point-by-point Path Pen (requested 2026-10-24)

Draw → **Path Pen** adds the connected-corner tool from the supplied reference.
Click/tap anchors to build a straight-segment outline. Square anchor markers show
placed points, with the latest point filled. A frame-scheduled pointer preview
shows the next segment. Hold Shift while placing a point to constrain its angle
to 45° increments. Ordinary freehand smoothing is hidden and does not round these
corners. Ink and width controls apply to the entire unfinished path and update
its preview when changed.

Enter, double-click or the compact Finish action commits an open path. Clicking
within eight screen pixels of the first point, after at least three placed points,
closes and commits the outline. Consecutive clicks less than three screen pixels
apart do not add duplicate endpoints. Backspace, draft Ctrl/Cmd+Z or Remove last
point removes the latest anchor. Escape or Cancel discards only the unfinished
path; idle Escape then leaves drawing. One-point drafts do not save as paths.
Finish/Remove/Cancel actions provide pointer/touch access without a keyboard.

Hiding/reopening the Draw palette retains the unfinished path and active tool.
Clicking the already-active Path Pen choice is a no-op. Switching to another tool,
window blur, pointer cancellation, two-finger pinch startup, history actions or
leaving the mounted Board discard its transient draft. Space/middle-button pan
keeps the draft. Unfinished paths are not autosaved or recovered; finish first.

A completed path is **one ordinary drawing object**, regardless of its segments.
Selection, movement, scaling, duplication, clipboard, partial erasing, Undo/Redo
and autosave use the existing drawing pipeline. Partially erased paths retain
internal gaps in that same block. Anchor markers exist only during construction;
this adds straight-segment construction rather than editable Bézier handles or
post-save vertex editing. Closed outlines have no fill.

The existing 6,000-point limit, 3,900-unit input span, coordinate bounds and final
byte/geometry validation apply. A rejected finish preserves the editable draft.
No backend/schema/dependency/migration or saved-format change: Board format remains
**6**. The transient tool name is not persisted. See
`../reports/12-boards-path-pen.md` for actual checks and manual acceptance; remain
in phase-4 review.


### Existing drawing color/width and Path Pen appearance (2026-10-24)

Path Pen now uses a horizontal fountain-pen body/nib illustration consistent with
the Pen/Highlighter/Eraser rows, replacing its miniature path/anchor diagram.
Palette tooltips open to the right with short names and an optional shortcut,
keeping the preceding row clear. Path construction behavior is unchanged.

Selecting **one drawing block** shows Drawing color and Drawing width in the same
floating selection toolbar used by text. Color reuses the text color picker with
presets, spectrum, custom six-digit hex and Default drawing color. Drawing colors
are stored as supported hex values; Default restores theme-following `currentColor`.
Closing this picker restores canvas focus while its drawing remains selected,
allowing normal Board keyboard actions. Other text picker callers retain their
previous focus behavior. Width offers 1/3/4/6/12/24/48 drawing units; existing other
valid widths remain visible as a selected option. Labels follow existing px
conventions; effective appearance still follows drawing resize/camera scale.

These actions update the selected original Pen, Path Pen or Highlighter object.
The path, internal break indices, identity, relative layer, opacity and original
scale remain. Width changes expand the local view box and spatial frame only
when the new stroke/caps need room; point offsets compensate to keep world-space
centerlines fixed. Frames do not shrink again on width reduction. A required
expansion beyond existing geometry/coordinate limits is rejected with a message.
The existing byte-budget validator can also reject a change atomically.

Each actual style action is undoable/autosaved through the existing record update;
choosing the same style is a no-op. Styling saved ink does not change the creation
brush or smoothing settings. New drawing style controls use opaque theme surfaces
in normal/frosted modes and retain existing coarse-pointer targets. Multi-selection
retains its current count/actions rather than showing single-object style controls.

No schema, backend, dependency, migration or envelope changes; format remains **6**.
See `../reports/12-boards-drawing-style-editing.md` for actual checks and manual
acceptance. Stay in Board phase-4 review.


### Board micro-motion pass (requested 2026-10-24)

Accepted creates/deletes now produce short lifecycle cues, including duplicate,
paste, cut and Undo/Redo restoration/removal. Inactive block surfaces pop/fade up
on creation (180ms); active editors and freshly released drawings use a steady
140ms fade to preserve caret/ink position. Deletion shrinks/fades an inert visual
preview for 140ms while the canonical object, editor and persistence action are
removed immediately. Simple previews are bounded static copies stripped of IDs,
editor markers and interactive content. Rich/large subtrees use a short summary
preview; media/render tasks are never cloned.

A transient accepted-transaction subscription owns lifecycle effects, separate
from record/layout subscriptions. Initial load, confirmed snapshot replacement,
automatic-height measurements and culling do not trigger block entrances.
Restoration cancels any old exit for that ID. Pending entrances expire after
250ms and are capped at 48; each transaction admits at most 24 effects, exits at
16, active script-driven effects at 48. Simple exit copies are capped at 400 DOM
nodes each. Offscreen or over-2,000,000-screen-pixel surfaces skip lifecycle motion.
Reset/unmount/reduced-motion changes cancel effects and remove exit previews.
Visual-listener failure cannot interrupt an accepted save/history transaction.

Editing entry/exit fades the mounted body over 120ms without moving the caret or
waiting to focus. Block-type, alignment, direction and list-style changes get a
140ms settle (opacity-only for active editors). Drawing color/stroke width
transition over 160ms. Existing native text/list elements transition color and
background where their mounted style changes; replaced text nodes appear normally.
There is no per-keystroke pop or tween of SVG drawing/eraser geometry.

Selection outlines fade; resize handles pop in, grow on hover and compress on
press. Board buttons compress on press, active glyphs/checks confirm with a small
pop, eraser-size rings transition, and history/Path Pen actions fade when enabled/
disabled. Checklist toggles pop briefly and checked-item text changes soften.
New Path Pen anchors pop; previous anchors retain their DOM and change fill instead
of all replaying their entrance. Placement hints rise/fade on entry; the empty
prompt fades/scales in/out where discrete display transitions are supported;
save-status labels fade on status change and their surface colors soften.

The full new-effects inventory, durations, audit findings, known limits and exact
manual checks are in `../reports/12-boards-micro-motion.md`. Existing toolbar/menu,
drawing-palette and fullscreen motion remains. Pan/zoom, drag/resize coordinates,
editor focus, typing, drawing input, erasure geometry and actual saving/deletion
stay direct. All new motion respects reduced motion; changing that preference
also stops active script-driven effects. No new persisted data, schema, backend,
dependency or envelope; format remains **6**. Runtime performance and browser feel
remain manually unverified. Remain in phase-4 review.


## Phase 5 — Shared Mind Map block (authorized 2026-10-24)

The user requested “okey work on the mindmap block go ahead”. `../phases/13-mindmap-block.md` records the confirmed core and architecture; `../reports/13-mindmap-block.md` records actual checks/manual acceptance. This supersedes earlier Mind Map stop statements only for this phase.

**Add block → Technical → Mind Map** selects native Board placement. A new map is 760×460, with a central topic, independent move/resize/clipboard/history and autosave. It mounts the shared topic UI directly, without inheriting a Document editor. Double-click/Enter/Edit activates topic controls; Done returns to ordinary Board movement. Inactive maps show the same static tree and view controls without topic mutation. Existing Board culling, conflict recovery and upload/composition/navigation guards remain in use. Corner resizing changes the viewport independently without adding text formatting fields.

The shared graph is `{version:1, root_id, topics:[{id,parent_id,text,collapsed}]}`. Native data contains exactly `mindmap`; spatial format **7** adds the new kind. IDs are block-local strings, never Node references. Server/client require one root, unique identities, connected acyclic ancestry and maximum parent-link depth 64 (central topic depth 0). UTF-8 labels allow up to 500 Unicode code points. Serialized graph size is bounded to 64 KiB; existing Board object/aggregate byte budgets remain. There is no fixed subtopic count per parent. Unknown graph versions/fields, dangling parents, cycles and malformed labels are rejected before writes. The migration preserves existing rows/revisions/source and refuses downgrade while any saved Board map exists, including in Trash. Old supported envelopes/drafts adapt explicitly; a map inside a pre-7 envelope is rejected with recovery data preserved.

Select a topic to edit its plain label; **Child**, **Sibling**, **Delete branch**, collapse/expand and **Topic parent** provide core changes. Root deletion/reparenting is unavailable. Parent choices exclude the selected subtree, and moving a topic expands its new ancestry so it stays visible. Collapsing a selected ancestor restores visible selection. Tab adds a child, Enter adds a sibling; Shift+Tab permits normal focus navigation. Topic buttons support arrows/Home and Delete/Backspace. Existing owner history handles Ctrl/Cmd+Z/Y; deleting a branch is undoable. Balanced left/right layout keeps the central topic centered. Fit/zoom and native scrolling are view state, not persistent graph changes.

Documents expose **/Mind Map**, using the same graph/rendering controls in the normal document layout. Canonical format-2 source uses an atomic `:::orbium {"kind":"mindmap","mindmap":{...}}` directive with no body; legacy Documents use a `mindmap` atom. Graph edits enter original Document saves/revisions/indexing without a second persistence service. Search/statistics include all labels, including collapsed topics; plain labels create no mentions or attachment usage. Formatting-preserving export retains the versioned directive. Plain Markdown and Word/PDF exports use an indented outline of every topic rather than dropping the block. Exported outlines are not editable graphical maps. See `06-document-editor.md`, `18-document-transfer.md`, and `20-office-document-export.md`.

Advanced themes/layout modes, node attachments/links, arbitrary branch dragging, XMind import/export, collaboration and the missing remainder of section 8 are outside this core phase. No Board/account portability or later product phase is added. No browser performance/visual acceptance is claimed without the user's manual review.


Mind Map review correction (2026-10-26): the shared canvas now has a compact header, a bottom topic panel and searchable parent picker. Editable passive Board maps expose **Edit**. F2/Space or double-click selects a topic label for renaming; keyboard branch deletion restores parent focus. Undo to collapsed ancestors keeps a visible selected topic. Actual asymmetric bounds avoid empty mirrored space; accepted edits retain the current scale, initial views remain readable at 65% or above, and explicit Fit can shrink the whole tree further. Selected topics are revealed within the inner canvas. Zoom/scroll remain transient; graph formats and owner persistence are unchanged. See `../reports/13-mindmap-review-correction.md` for manual checks.


Mind Map fullscreen redesign (approved 2026-10-26): embedded maps now use the Mermaid/shared rich-card heading with Edit and fullscreen preview actions. Inline inspectors, hints, grid and view controls are removed. Edit opens a fullscreen dialog with a plain canvas, direct topic renaming, a vertically centered left topic toolbar, searchable parent panel, bottom zoom/Fit, real owner save status and Done. Board editing commands open this same surface. Read-only fullscreen preview has no mutation tools. Topic edits, Undo/Redo and IME guards remain owned by the original Board/Document despite the dialog portal. Document previews adapt within 200–440 pixels; Board viewport dimensions remain saved independently. See `../reports/13-mindmap-fullscreen-editor.md`; this supersedes the previous inline presentation correction without changing graph formats or later-phase scope.


Mind Map text review (2026-10-26): topic frames automatically follow measured text height, with tree spacing and connectors following their actual dimensions. One active topic uses Document-style inline text editing and shared selection formatting controls. Accepted edits use graph version 2 with inline content and an exact plain-text projection; version 1 remains supported. Native Board geometry remains independent of topic text size, with original owner history/autosave/conflict/recovery. Shared technical/media surfaces adopt the approved frame and inset styling. See `../reports/13-mindmap-rich-text-and-sizing.md` for checks and exact manual acceptance.


Block icon consistency correction (2026-10-26): technical headers now share canonical SVG glyphs across Document and Board renderers, with 20-pixel type icons and 17-pixel actions in 32-pixel buttons. Code keeps its main Code badge and shows the language logo beside the name/picker. Native/cached Board Mermaid fullscreen sits beside Edit in the header. File fallbacks use icon actions and keep their badge when metadata updates; real media players retain their own header. See `../reports/13-block-icon-consistency.md` for checks and exact manual acceptance.


Mind Map topic-width review (2026-10-26): fullscreen editing exposes an outward-edge grip for each selected topic, bounded to 100–800 map pixels. The map uses variable-width parent/child spacing and connectors while topic height remains content-driven. A completed drag creates one original Board/Document action; cancellation does not save. Topic widths persist independently of native Board viewport dimensions using graph version 3, with older maps still readable. See `../reports/13-mindmap-topic-width.md` for checks and manual acceptance.


Mind Map branch text commands (2026-10-26): editing a branch now supports mixed text blocks. Type `/` at the start of an empty paragraph/heading (including inside a list/quote/callout) to open a searchable menu with type icons: Text, Heading 1–3, Bullet list, Numbered list, Checklist, Quote, Callout and Code. Arrow keys choose; Enter/Tab applies; Escape dismisses the menu before ending editing on a subsequent press. Literal slash text stays text when the menu is dismissed, and code blocks keep slashes literal. Enter continues a paragraph/list/code block inside the topic; Shift+Enter inserts a soft break where supported. Tab/Shift+Tab indent/outdent list items. Escape or Ctrl/Cmd+Enter finishes editing. Once a topic is selected, existing Enter/Tab branch-creation shortcuts remain. Inline toolbar formatting and automatic height apply to the structured body; selected topics retain width adjustment. New graph version 4 saves exact text/body with original owner history and save guards, preserving older maps and widths. Static/readonly views render the saved block structure without editing controls. Tables, media and math/diagram widgets are outside these text commands. See `../reports/13-mindmap-branch-slash-commands.md` for actual checks and manual acceptance.


Mind Map manual-width repair (2026-10-26): the selected branch now has a visible horizontal-arrow grip at its bottom outward corner, including while its text editor is active. Dragging retains the text caret and uses the existing transient/one-commit resize behavior. The left dock also has **Branch width**, opening a 100–800 px number field with **Apply** and **Reset** (180 px). Enter applies, Escape closes the panel and restores focus to its dock button; closing without applying discards the local draft. Height stays automatic. Graph versions and owner persistence/history are unchanged; resizing structured text retains graph 4. Read-only/embedded maps expose neither grip nor width panel. This supersedes the earlier requirement to leave text editing before finding a narrow grip. See `../reports/13-mindmap-manual-width-repair.md`.


Mind Map hierarchy templates (approved 2026-10-26): fullscreen Edit has a **Templates** control at the upper right of the canvas. Its visual picker offers Balanced mind map, Right-facing tree, Left-facing tree, Top-down hierarchy, Bottom-up hierarchy, Outline tree, Brace map, Fishbone and Timeline. For Timeline, reopen Templates to choose Horizontal or Vertical. Selecting a different layout commits one original owner action, retaining IDs, ancestry, plain/rich text, topic widths and collapsed descendants. Selecting the active layout or dismissing the picker does not save. Measured text height and variable widths drive each layout's spacing and connectors; Fit, scrolling and branch resizing remain available. The templates rearrange existing content without inserting sample topics. Timeline uses existing sibling order without dates, scheduling or durations. Fishbone keeps the existing root as the outcome and direct branches as cause groups. Arrow navigation follows branch growth (left/right or up/down); Outline retains the standard Right-child/Left-parent behavior. Read-only/embedded views render the saved layout without a picker. Graph version 5 persists the choice; older maps default to Balanced. See `../reports/13-mindmap-hierarchy-templates.md` and the static gallery `../previews/13-mindmap-templates.html`.


Mind Map organization tools (2026-10-26): in fullscreen Edit, drag a branch label or its selected top-left grip onto another topic's center to change parent, or its leading/trailing quarter to place before/after it. A highlight/insertion line and status explain the pending drop. Invalid root/self/descendant targets are excluded; Escape/history, pointer cancellation and capture loss cancel the preview. Near-edge dragging scrolls the inner canvas. Only accepted release commits; Alt+Up/Down provides sibling reordering. Enter adds a sibling immediately after the selected topic. Original widths, text and subtree IDs remain.

**Branch appearance** in the left dock offers nine inherited colors plus Inherit/reset, and searchable, paginated canonical built-in/brand icons. Descendant color overrides survive; icons decorate their own topic. Colors apply to topic frames/backgrounds and connectors across all layouts. Custom images and inline body icons are not introduced into the Mind Map schema. Graph version 6 persists the new metadata.

Fullscreen search is available in Edit and read-only preview, including Ctrl/Cmd+F, Enter/Shift+Enter and next/previous buttons. It performs literal topic-text matching with case/diacritic folding, highlights matching frames, reveals hidden matches through temporary ancestor expansion and scrolls the active result into view. Clearing/Escape restores saved collapsed state without a save. Editing a match keeps it visible until editing finishes, even if the text stops matching. Read-only search never mutates content. **Expand all**, **Collapse all** (root only) and **Levels** (root counts as level 1) apply one undoable saved visibility action, clear search and finish active editing. See `../reports/13-mindmap-organization-tools.md` for checks, limitations and exact manual acceptance.


Mind Map icon refinement (2026-10-26): branch `icon` metadata now renders in a 36 px external badge above the topic's left edge, using a 23 px glyph and the inherited branch color. All template packing/bounds and Fit reserve 44 px above icon-bearing frames; connectors still meet the text frame. There is one decorative badge in both embedded and fullscreen views, including during text editing. This supersedes the inline-only decoration described in the organization-tools review.

Structured branch bodies now accept shared inline icons in graph 7. `/icon`, `:query` completions and the selection toolbar reuse Emoji/Icons/Brands/Custom with Library image reuse/upload. Emoji are literal text; built-in/custom atoms support replacement, deletion and text marks. Custom images are validated workspace PNG/JPEG/GIF/WebP attachments, discovered for Library usage/deletion protection and served through the Board owner routes. Original Board history/autosave, measured height, independent width, composition/read-only guards and existing templates remain. Code blocks do not accept icon atoms. Native Board text/list/table inline schemas remain unchanged; no outer Board format change or migration. Deploy matching client/server and reload. See `../reports/13-mindmap-inline-icons.md` for checks and exact manual acceptance.


Selection color coverage (2026-10-28): selecting native writing/list/table blocks or Mind Map objects now exposes Selection color without text editing. Multi-selection colors supported content and drawings in one Board action; media/resource appearance is retained. A single drawing keeps its original palette. Mind Map topic dock adds Topic color for supported prose and inline icons; its decorative badge follows a uniform topic text color, otherwise the existing branch color. Text-selection tools remain available for partial edits. Existing formats, validation, original owner saves and history remain; no migration. See `../reports/14-selection-colors-across-surfaces.md` for the full audit and exact manual checks.


Native inline icons and map zoom (2026-10-28): native Text/H1–H3/Quote/Callout/List fields now offer Inline icon through `/` and `/icon`, including within a sentence/list item. Tables and nested rich callouts use shared inline-only icon completions/picker, Library and owner-scoped uploads. Normal editor selection includes atomic icons with text; double-click explicitly replaces them. Native marks, preview, clipboard and owned attachment usage persist through Board envelope 8 (native object content version remains 1), protected by the additive `2026_10_28_000001_add_board_inline_icons.php` migration. It was applied locally; matching server/frontend/migration and a reload are required elsewhere. This supersedes earlier native-inline exclusion statements. Mind Map wheel and Ctrl/Cmd plus/minus zoom locally, with pointer/center anchoring and zero/Fit recentering; the parent Board camera defers map wheel events. See `../reports/14-native-board-icons-selection-and-mindmap-zoom.md` for exact manual acceptance, compatibility and actual checks.


Colon completion/selection repair (2026-10-28): native Board editors now install the shared colon suggestion extension with priority over ordinary newline handling. `:icon`/`:icons` open the unfiltered picker; ordinary `:name` completes symbols. Inline glyphs have an actual transparent selection character with overlaid artwork rather than empty user-select-all boxes, and editor/preview glyphs synchronize color directly from marks. Board, Mind Map and legacy Document text colors use the same saved-selection transaction; Board links inherit selected colors. Full reload is required for an already-mounted editor to receive the new extension. See `../reports/14-icon-completion-selection-repair.md` for exact checks/manual acceptance.
