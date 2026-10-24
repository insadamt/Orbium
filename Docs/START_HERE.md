Board dock styling correction (2026-10-24): the user requested app-consistent
styling, opaque backgrounds and less clutter. Board controls now use solid theme
surfaces, rounded app-style buttons and subtle active states. Removed redundant
drawing heading/Done/footer/sample/ink text and the duplicate view-reset menu
item. Draw toggles back to Select; Escape and Select also finish drawing. Read
the correction in `reports/12-boards-canvas-dock.md` and `docs/24-boards.md`.
Remain in Board phase-4 manual review.

Board canvas/dock review (2026-10-24): the user requested removing the visible
title, expanding the canvas upward and moving tools to a centered left vertical
dock. Board metadata remains in Options → Board details. A slim drawing palette
beside the dock uses illustrated pen/highlighter/eraser controls with the existing
ink, width and smoothing settings. Read `reports/12-boards-canvas-dock.md` and
`docs/24-boards.md`. This supersedes title-row and lower-left drawing-palette
placement below. Remain in Board phase-4 manual review.

Drawing toolbar review (2026-10-23): the user reported poor recognition and
requested its removal for now, plus app-style toolbar/motion and UX improvements.
The recognizer, templates, timers and conversion UI are removed; Strong now only
smooths freehand ink. Drawing uses a compact glass panel, labeled tools, visual
width presets, checked ink swatches, a brush preview and shared animated smoothing
select. perfect-freehand remains for smoothing. Saved objects and spatial format 5
are unchanged. Read `reports/12-boards-drawing-toolbar.md` and `docs/24-boards.md`.
This supersedes the local-smart section below; remain in Board phase-4 manual review.

Local smart drawing (historical; removed by the toolbar review above): the user chose free local recognition with
explicit templates. Strong pen now groups nearby strokes for one second and
uses a BSD-licensed $P adaptation for 63 defined shapes/signs/digits/uppercase
letter classes. Clear matches convert; ambiguous matches offer choices/Keep ink.
Text becomes native editable text; shapes become canonical drawing vectors.
One Undo restores source ink. perfect-freehand 1.2.3 replaces the homemade
per-sample streamlining filter. Read `reports/12-boards-smart-templates.md`,
`docs/24-boards.md` and `../THIRD_PARTY_NOTICES.md`. Format 5 stays unchanged;
recognition accuracy/browser feel require manual review within Board phase 4.

Drawing smoothing correction (2026-10-23): the user reports Off/Light/Strong
feel the same. The first pass was too weak and retained dense input wobble.
Cleanup now simplifies deviations at 1.5 px (Light) or 6 px (Strong) before forming
curves, with stronger stabilization and a bounded comparison budget. Off remains
direct. Read `reports/12-boards-drawing-smoothing-correction.md`. Format 5 remains
unchanged; browser feel still requires manual acceptance within Board phase 4.

Drawing smoothing review (2026-10-23): the user approved smooth curves, light
stabilization and Off / Light / Strong controls. New strokes default to Light;
curve geometry is baked into ordinary bounded point pairs, keeping spatial
format 5 and existing drawings unchanged. Preview/save share the same sampled
curve and raw endpoint. Read `reports/12-boards-drawing-smoothing.md` and the
smoothing subsection in `docs/24-boards.md`. Remain in Board phase-4 manual review;
browser feel and performance remain unmeasured.

Board drawing review (2026-10-23): the user requested “add drawing system to
the board”. Pen/highlighter ink, color/width controls and a whole-stroke eraser
now use native drawing objects with selection, resize, clipboard, history and
autosave. The additive drawing migration upgrades spatial format to 5; reload
open clients after deploying client/server/migration together. Older local drafts
adapt explicitly; downgrade refuses while drawings remain, including in Trash.
Read `reports/12-boards-drawing.md` and the drawing section in `docs/24-boards.md`.
This is an explicitly requested extension within Board phase-4 manual review;
no later product phase is authorized. Browser/performance acceptance is pending.

Inline/mention clarification (2026-10-23): inline canvas insertion now offers
Documents only and activates editing. Mentions support all visible workspace Node
types except the source page. Markdown/legacy/hosted Document editors, Board text
and database mention properties share self-exclusion with server-side rejection.
Read `reports/12-boards-inline-document-mention-rules.md`. Existing non-Document
cards remain readable; phase-4 review continues.

Board count review (2026-10-23): the user explicitly requested removing the
1,000-block cap. Frontend validation/actions, full/incremental server saves,
sibling Document creation and the local stress command now omit that count cap.
Existing byte/geometry/content budgets and bounded renderer caches remain.
Read `reports/12-boards-object-cap-removal.md`; this stays in phase-4 review.

Board page insertion review (2026-10-23): the user requested easier page adding,
`@` references in native text and inline Documents. The native completion menu
supports safe-link mentions or adjacent live Document cards; Add has searchable
page/Document filters and a collapsed sibling-creation form. Read
`reports/12-boards-page-insertion.md` and the page-insertion section in
`docs/24-boards.md`. This remains Board phase-4 manual review.

# Orbium — Codex implementation handoff

PDF preservation review milestone (2026-10-23): after reporting repeated rendering,
the user explicitly approved the focused PDF slice with “okey go ahead”. Instant
Scene now owns bounded prepared PDF pages and per-object view state independently
of card lifetime, attaches warm pixels before metadata revalidation, pins one
interacted reader and releases inactive document tasks after preparation. Read
`reports/12-boards-instant-scene-pdf.md` and the PDF section in
`plans/board-instant-scene-architecture.md` for exact budgets, diagnostics, actual
checks and manual acceptance. Stop after this PDF milestone; other rich types,
persistent caching, workers/tiling/adaptive fidelity and later product phases
remain unapproved. Runtime performance and thermal improvement are unmeasured.

Instant Scene prototype (2026-10-23): the user authorized the first working
milestone on `codex/instant-scene-engine`, branched from freshly fetched
`codex/boards` at `ca15212`. Following the user's direct-review request, Instant
Scene is now the default on this experimental branch; `?boardRenderer=original`
retains the reference renderer. The experimental
adapter prepares native text/list templates and sanitized Mermaid independently
of card mounts, and uses transient zoom scaling with sharp settled layout.
Read `plans/board-instant-scene-architecture.md` and
`reports/12-boards-instant-scene.md` for flags, budgets, actual checks and exact
manual comparison steps. Production browser/CPU/thermal comparisons remain
unmeasured. The later PDF milestone above supersedes the original stop boundary
only for PDF preservation. This is Board phase 4, with no approval
for persistent assets, workers, full rich coverage or a later product phase.

Board CPU follow-up (2026-10-21): the user reports the preview correction did not
improve rendering/CPU/temperature. Treat the thermal issue as unresolved. Plain
native tables now avoid Markdown round-tripping; height observers avoid restarting
after their own updates; the queue selects jobs in one pass and pauses pending work
in hidden browser tabs; reusable SVG color adaptation is memoized. A temporary
built-frontend comparison server is running on localhost:8001 without changing the
existing development server. See `reports/12-boards-cpu-followup.md`. No foreground
trace or temperature comparison has been obtained; do not claim resolution.

Board repeat-loading correction (2026-10-21): the user reported frustration with
rendering/loading. Prepared sanitized Mermaid SVGs and math markup now survive
block eviction within bounded Board-local caches. Native diagrams use the Board
queue directly, and Document refresh keeps the current readable revision visible.
Read `reports/12-boards-preview-continuity.md`; browser acceptance remains manual
within phase 4.

Board stress scene (2026-10-21): `php artisan boards:stress <workspace>` creates
disposable native-block scenes for manual profiling in the local environment.
Read `reports/12-boards-stress-scene.md` for options, actual creation/checks and
manual steps. This stays within Board phase-4 performance review.

This package is the authoritative implementation brief for **Orbium v0.1.0**.

Board optimization plan (2026-10-21): the user requested implementation of
`plans/board-performance-engine.md`, then explicitly directed “look just enhance
everything implement the new architecture”. That supersedes the earlier P0-only
execution gate. The record/subscription/history, scoped renderer scheduling,
read-only tables, memoized visibility and revisioned incremental-save architecture
is implemented within the existing Board phase-4 review. Read
`plans/board-performance-architecture.md` and `reports/12-boards-performance-architecture.md`
for the protocol, additive migration and manual acceptance checklist. P0 diagnostics
remain available; actual browser/thermal measurements are pending. Do not start
another product phase or claim measured improvement from static checks.

Current feature task (2026-10-18): the user approved the native Board correction and authorized phase 4 with “okey go ahead”. Follow `phases/12-boards-resource-cards.md` and `docs/24-boards.md`: live resource cards, original Document persistence and sibling Document creation, while preserving independent native Board blocks. Phase-4 implementation and manual acceptance are recorded in `reports/12-boards-resource-cards.md`. Boards now use the normal Orbium app bar/tabs and page surface, superseding the earlier full-screen default; see `reports/12-boards-native-app-shell.md`. Presentation, smart guides, arrangement and properties are documented in `reports/12-boards-spatial-refinement.md`. The latest investigation, navigation correction, indexed-field editor fix and unresolved block interaction problems are recorded in `reports/12-boards-investigation.md`. The user subsequently approved all UX-audit corrections with “okey fix all that”; the native editing, history, gesture, overlay, responsive and performance-work refinements are recorded in `reports/12-boards-ux-correction.md`. The subsequent approved block-presentation pass is recorded in `reports/12-boards-block-presentation.md`, with a standalone visual gallery and representative-board checklist. Stop for manual review before any Mind Map/later phase.

Latest Board review correction (2026-10-18): the user approved redesign work and requested the same styling as Document blocks without six-dot handles. Follow the Document-style presentation correction in `docs/24-boards.md` and `reports/12-boards-document-style.md`; this supersedes the spatial-notebook proposal. Remain in phase-4 manual review.

The follow-up request also adopts Document-like editing ergonomics: native click-to-edit, nearby selection formatting, writing commands/shortcuts and focused source editing. See `reports/12-boards-document-editing.md`. Independent native blocks and the phase-4 stop gate remain in force.

Stabilization review (2026-10-19): the user reported widespread glitches and authorized repairs. A reproduced code-editor unmount crash, portal/canvas event interference, delayed edit focus and native editor synchronization were repaired. Read `reports/12-boards-editing-stabilization.md` for the browser-observed results and remaining manual acceptance gaps. Do not treat earlier static checks as full Board acceptance.

Selection/resizing review (2026-10-19): the user approved the proposed block correction with “okey go ahead”. Single-click selects; double-click/Enter edits. All eight resize handles, text corner scaling, tight content sizing, image natural proportions and nondestructive cropping are described in `docs/24-boards.md` and `reports/12-boards-selection-resizing.md`. This supersedes the earlier click-to-edit ergonomics. Remain in phase-4 manual review.

Whole-block sizing clarification (2026-10-19): the user reported that corners still expanded frames and requested automatic growth for added rows/content. Corners now scale complete block surfaces, including tables/technical/resource blocks; manually sized content can grow rather than hide additions. See `reports/12-boards-scale-auto-growth.md`. This supersedes writing-only corner scaling and fixed-height clipping. Remain in phase-4 manual review.

Zoom clarity repair (2026-10-19): the user reported poor block resolution during zoom. Camera rendering now uses native layout zoom rather than scaling a cached world layer; PDF page rendering follows effective camera/block density within its pixel budget. See `reports/12-boards-zoom-clarity.md` and `docs/24-boards.md`. Remain in phase-4 manual review.

Automatic height review (2026-10-19): the user approved removing manual expansion from content blocks. Content determines height in both directions; side handles control width and corners scale the whole surface. Vertical content handles and Fit height are removed; image crop frames remain. Legacy manual heights no longer prevent shrinking. See `reports/12-boards-automatic-height.md` and `docs/24-boards.md`. Remain in phase-4 manual review.

Live height border repair (2026-10-19): content-driven height is measured during the resize pointer preview so the selection border tracks wrapping before release. See `reports/12-boards-live-height-border.md`. Remain in phase-4 manual review.

Board interface simplification (2026-10-19): the user approved a smaller toolbar, quieter header and contextual selection controls. Images and linked pages are under Add; Board details/favorites are under the header menu; duplication, arrangement, layers and properties are under selection More. History remains visible during editing. See `reports/12-boards-interface-simplification.md` for actual checks and manual acceptance. Remain in phase-4 manual review.

Native app-shell correction (2026-10-19): the user approved integrating Boards with the normal app bar, tabs and app styling. Board viewport takeover and inert/hidden navigation are removed. The shared Node title editor supports a compact toolbar layout, Board tools sit above the canvas, and height follows the actual responsive app bar. This supersedes the separate Board header/Back and full-screen presentation rules. See `reports/12-boards-native-app-shell.md`; remain in phase-4 manual review.

Vertical Board toolbar (2026-10-19): the user requested a left-side icon-only bar inside the Board. The tools/history now form a vertical rail beside the canvas with accessible names and hover titles; Add opens to the right. This supersedes the horizontal toolbar placement, while retaining the native app shell. See `reports/12-boards-vertical-toolbar.md`; remain in phase-4 review.

Board toolbar polish (2026-10-19): the user approved consistent control styling, explicit active/focus states, proper tooltips, stable editing controls and compact zoom. The rail now keeps placement controls visible but disabled while editing, with history at the bottom; this supersedes the earlier hide-on-edit rule. See `reports/12-boards-toolbar-polish.md`; remain in phase-4 review.

Orbium is a self-hosted spatial knowledge workspace combining:

- hierarchical knowledge organization;
- Notion-like document/database ergonomics;
- Markdown-first writing shortcuts;
- a minimalist 3D orbital navigation model;
- a global Search Master;
- versioned, validated, portable account archives.

## Codex: mandatory workflow

1. Read `AGENTS.md`.
2. Read `docs/00-product-spec.md`, `docs/01-v0.1.0-scope.md`, and `docs/02-domain-model.md`.
3. Read the documentation referenced by the current phase.
4. Start with **Phase 0 only**.
5. Complete tasks in the phase in order unless a dependency requires a documented adjustment.
6. Use one commit per logical task.
7. Run the required validation before each commit.
8. At the end of the phase:
   - run the complete phase quality gate;
   - produce a phase report using `docs/14-phase-report-template.md`;
   - present the manual validation checklist to the user;
   - **STOP**.
9. Do not start the next phase until the user explicitly confirms the current phase.

The user intends to inspect each phase manually before allowing the next one.

## Document precedence

If documents appear to conflict, use this precedence:

1. `AGENTS.md`
2. `docs/01-v0.1.0-scope.md`
3. `docs/02-domain-model.md`
4. feature-specific documentation
5. phase documents
6. implementation convenience

Do not silently invent product behavior to resolve a conflict. Prefer the smallest behavior consistent with the higher-priority documents and record the interpretation in the phase report.

## Phase order

| Phase | Goal |
|---|---|
| 0 | Repository, stack, auth, Docker, quality gates |
| 1 | Workspaces, hierarchy, node CRUD, containment |
| 2 | Document editor, Markdown UX, mentions, attachments |
| 3 | Databases, properties, Table and Gallery |
| 4 | Search Master, workspace selector, tabs, navigation history |
| 5 | 3D Orbit and motion system |
| 6 | Versioned portability protocol and restore |
| 7 | Settings, onboarding, resilience, UX polish |
| 8 | v0.1.0 release candidate and release hardening |

See `phases/README.md`.

## Core vocabulary

- **Relation**: structural parent-child containment.
- **Mention**: contextual reference from one document to another node.
- **Orbit**: 3D visualization of relations only.
- **Search Master**: global search/navigation/command interface opened with `Ctrl + Space`.
- **Workspace explorer**: conventional hierarchy browsing on workspace and folder pages.
- **Database document**: a normal document whose parent is a database and which additionally has structured property values.

## Absolute product rules

- A node has exactly one parent, except workspace-root nodes whose parent is `null`.
- A folder can contain folders, documents, databases, and Boards.
- A database can contain documents only.
- A document cannot contain children.
- A Board cannot contain hierarchical children; see the current feature-phase scope above.
- Mentions never alter hierarchy.
- Mentions are not rendered as lines in the 3D Orbit.
- The initial database views are only **Table, Gallery, Orbit**.
- Database required-properties and templates are not part of v0.1.0.
- The editor uses Notion-like block interaction plus Markdown typing shortcuts.
- The visual identity is monochrome/minimalist 3D with frosted glass UI surfaces; semantic colors are informational only.
- Orbium portability is a versioned protocol, not a raw database dump.

Contextual toolbar review (2026-10-19): the user approved keeping floating controls above selected blocks during editing and matching Document toolbar styling/motion. Native text formatting takes priority over overlapping block controls. See `reports/12-boards-contextual-toolbars.md` and `docs/24-boards.md`. Remain in phase-4 manual review.

Selection-menu correction (2026-10-19): the user requested removing Properties and repairing hover highlight travel across dividers. Properties/inspector wiring is removed from Board selection controls; More is hidden while editing. Shared menus preserve hover highlight continuity through separators. See `reports/12-boards-properties-removal-divider-motion.md`. Remain in phase-4 review.

Text-toolbar priority clarification (2026-10-19): native text selection hides the block toolbar until deselection or editing ends, regardless of toolbar overlap. See `reports/12-boards-text-toolbar-priority.md`. This supersedes overlap-only hiding; remain in phase-4 review.

Toolbar motion/Select review (2026-10-19): Board floating toolbars gain eased entrance and short noninteractive exits; the list-style dropdown now uses the app's shared `AppSelect`. See `reports/12-boards-toolbar-motion-select.md`. Remain in phase-4 manual review.

Text toolbar lifecycle repair (2026-10-19): selection priority/camera ownership use the mounted Board formatting slot rather than editor ancestors queried before attachment. Live opacity transitions replace cloned closing toolbars and scaled movement. See `reports/12-boards-text-toolbar-stability.md`. Remain in phase-4 manual review.

Floating toolbar usability review (2026-10-19): the user requested a broader enhancement. Text controls are grouped and include Finish editing; pointer selection waits for release before showing the toolbar; selection bounds improve wrapped-text placement; table actions use one compact menu. See `reports/12-boards-floating-toolbar-refinement.md`. Remain in phase-4 manual review.

Title-toolbar placement (2026-10-19): the user requested moving the left tools beside the title and committing the toolbar work. Tools/history now form a horizontal heading group to the right of the title, with downward Add and responsive wrapping, superseding vertical-rail placement. See `reports/12-boards-title-toolbar.md`. Contextual toolbar motion/layout controls and selection text colors are recorded in their review reports. Remain in phase-4 review.

Document-table parity (2026-10-19): the user requested Board tables literally
match Documents. Native Board tables now reuse the Document Live Preview table
component, cell editor, menus, drag controls and fullscreen preview. Existing
row data remains readable; edited tables additionally persist validated Document
table source. See `reports/12-boards-document-tables.md`; remain in phase-4 review.

Linked-page interaction refinement (2026-10-20): following user approval, linked
Markdown cards retain the visible source block when entering/leaving editing, reuse
already-loaded preview source where revisions match, and keep previews visible
through pending source loading. Header chrome is reduced to title/icon, Open and
one menu, with transient save status and a compact shared gutter. See
`reports/12-boards-linked-page-interaction-refinement.md`; remain in phase-4 review.

Optional Board fullscreen (2026-10-20): the user requested fullscreen with animation.
Boards retain their normal default layout and gain a heading toggle that animates
the live page to/from the app viewport, preserving mounted editors and camera.
Escape respects existing interaction dismissal and reduced motion skips animation.
See `reports/12-boards-fullscreen.md`; remain in phase-4 manual review.

Fullscreen Board correction (2026-10-20): the title/tools now float inside the
fullscreen canvas. Heading space/padding animate back into the normal row on exit,
and the page arrival fade no longer replays after fullscreen. See the correction
entry in `reports/12-boards-fullscreen.md`; phase-4 manual review continues.

Floating fullscreen controls (2026-10-20): title, toolbar and heading buttons now
use separate floating surfaces with canvas interaction through the gaps. See
`reports/12-boards-fullscreen.md`; remain in phase-4 manual review.

Board media insertion (2026-10-20): the user requested PDF, video and audio blocks.
Add now includes dedicated placement tools with type-filtered uploads/Library reuse,
using the shared Document/Library players. They persist as existing file objects
with optional validated `media_kind`; deploy client/server together. See
`reports/12-boards-media-blocks.md` and `docs/24-boards.md`. Remain in phase-4 review.

Media toolbar styling review (2026-10-20): Image, Video, Audio, PDF and File now
use shared compact controls, an Add/Replace source menu, a caption panel and image
framing panel. See `reports/12-boards-media-toolbar.md` and `docs/24-boards.md`.
Remain in phase-4 manual review.

Board CPU performance repair (2026-10-20): the user authorized fixes after the
interaction audit. Pointer geometry is coalesced per frame; block movement and
camera panning use translation; resize painting avoids repeated unchanged style
writes. Opening batches automatic-height publication and bounds full Document
preview requests. Hidden math/diagram previews wait until editing ends; recovery
serialization yields to input and unchanged content validation is cached across
saves. See `reports/12-boards-performance-correction.md` for actual checks,
limitations and manual steps. Phase 4 remains in manual review.

Board movement CPU follow-up (2026-10-20): the user reported continued spikes after
the first pass. Pointer origin and toolbar geometry no longer require repeated
movement-frame DOM measurements; guide targets are indexed per gesture, PDF
observers ignore translation and compositor hints last only during movement.
See `reports/12-boards-movement-performance-followup.md`. Thermal improvement remains
pending manual measurement; phase-4 review continues.

Board pan re-rendering repair (2026-10-20): the user reported delayed reappearance and
continued spikes. The Board retains a bounded recent set of rich surfaces, caches
revision-matched linked Document source and prioritizes visible fetches without the
previous idle wait. Camera culling uses stable coverage/guard bounds and the grid
moves in a separate layer. See `reports/12-boards-pan-rendering-lifecycle.md` for
checks and manual steps. Thermal resolution remains unverified; stay in phase 4.
