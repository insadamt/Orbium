Summary: Records the source-backed Board feature inventory and migration acceptance matrix. Depends on the current Board implementation, the Konva architecture contract and the manual checklist in `17-boards-konva-engine.md`; “wired” is not browser verification.

# Konva feature-parity inventory

2026-11-01. Audited against actual code on latest `main`, not only historical reports. Every runtime acceptance below remains **pending manual review**. No automated tests or browser interactions were performed. The original and Instant Scene modes remain selectable reference implementations.

## Source ownership

| Area | Actual owners | Migration treatment |
|---|---|---|
| Rendering and lifetime | `board-workspace`, `board-object-card`, `board-subscribed-object-card`, `use-board-rendered-objects`, `instant-scene/*` | Existing native object shells, culling/retention/editor pinning and HTML/PDF preparation retained; graphics alone choose Konva or compatibility SVG. |
| Input and camera | `use-board-pointer`, `use-board-pointer-geometry`, `use-board-pan-shortcut`, `use-board-camera`, `board-gesture-preview`, `board-pointer-paint`, `board-resize-preview` | Same pointer owner, coordinate conversion and gesture commits; graphics consume explicit paint notifications. |
| Ink and erasure | `use-board-drawing`, `use-board-path-drawing`, `board-drawing-smoothing`, `board-drawing-simplification`, `board-drawing-data`, `board-eraser-session`, `board-eraser-geometry` | Bounded smoothing/cached tails in Konva; exact existing swept clipping plus drawing-only spatial candidates in both modes. |
| Shapes | `board-shape-data`, `board-shape-block`, `use-board-shape-placement`, `board-shape-picker`, `board-shape-formatting` | Shared path functions and native rich-label editor retained. |
| Canonical actions | `board-record-store`, `board-record-history`, `use-board-objects`, `use-board-block-editing`, `board-arrangement`, `use-board-clipboard`, `board-transform-commit` | No separate Konva domain/history; completed gestures use existing actions. |
| Saving and recovery | `use-board-autosave`, `board-api`, `board-mutation-api`, `board-recovery`, `board-document-recovery`, `use-board-document-session`, `board-resource-api` | Existing full/PATCH/revision/conflict/draft contracts unchanged. |
| Motion and UI | `board-toolbar`, `board-selection-tools`, `board-context-menu`, `board-scene-motion`, `board-motion-effects`, `board-deletion-preview`, Board CSS | Existing native presentation retained; finite graphics feedback follows existing WAAPI progress and drawing style timing. |

## Feature matrix

“Shared” means the existing native implementation continues to own the behavior. “Adapted” means the Konva migration adds a graphics path. Neither status asserts manual acceptance.

| Feature | Actual existing behavior | Konva migration / acceptance focus |
|---|---|---|
| Pen | Repeated freehand gestures; tap makes a round dot. | Adapted: cached chunks/tail; compare short/long strokes and dots. |
| Highlighter | Brush width ×4; opacity 0.3. | Adapted: alpha applied once to live canvas; saved stroke retains opacity. Check joins and self-crossings. |
| Path Pen | Click/tap corners; straight segments; live hover tail. | Adapted: cached placed geometry, small changing hover tail; original SVG anchors. |
| Path finish | Enter, double-click, Finish; near-first-point closure after three anchors. | Shared completion; verify one object and no duplicate last point. |
| Path draft editing | Backspace, draft Ctrl/Cmd+Z, Remove last point, Cancel; one-point drafts discarded. | Shared, with immutable point-array replacement for cached geometry invalidation. |
| Path constraints | Shift snaps angles to 45°; duplicate points below three screen pixels ignored. | Shared. |
| Path settings/pan | Brush changes update draft; closing palette and Space/middle pan retain it. | Shared; inspect retained canvas path through camera and fallback transitions. |
| Smoothing | Off; Light streamline 0.5/cleanup 1.5px; Strong 0.75/6px. | Adapted: existing preparation on bounded chunks. New long-stroke smoothing has a local scope; handwriting/zigzag visual acceptance required. |
| Endpoint/fidelity | Actual release endpoint, two-decimal saved coordinates, no release beautification. | Adapted: same preview/final prepared geometry, coalesced samples plus dispatched endpoint. |
| Input devices | Mouse, touch and stylus; second touch cancels ink and starts pinch. | Shared input routing. Hardware checks pending. |
| Ink limits | 6,000 points; 3,900-unit sampled span; coordinate/object/Board byte limits. | Shared validation; streamed output also stays inside saved-point budget. |
| Partial eraser | Swept capsule cuts visible segments; handles dots, gaps, moved/nonuniformly resized ink. | Adapted preview; exact existing geometry preserved after broad-phase/segment rejection. |
| Eraser sizes | 8/16/32/64 screen-pixel diameters and dual-outline cursor. | Shared UI and zoom-derived radius. |
| Eraser identity | Surviving fragments retain original UUID/frame/layer; `breaks` separate subpaths. | Shared reconstruction and persistence. Fully erased object disappears. |
| Eraser limits/cancel | Atomic limit cancellation; Escape/capture loss/blur restore prior gaps. | Shared; compare both renderer modes and Undo/Redo. |
| Drawing formatting | Single-selection color/width; view-box expansion keeps centerlines fixed; opacity unchanged. | Shared restyling; bounded 160ms graphics style interpolation. |
| Drawing actions | Move, resize, duplicate, delete, copy/paste, layers and history. | Shared actions; imperative Konva transform preview. |
| Current shape picker | **Circle, Rectangle, Triangle** in actual code, despite earlier six-shape documentation. | Shared picker unchanged. |
| Legacy shapes | Rounded rectangle, ellipse, diamond, hexagon also validate/load. | Adapted using shared paths; all **seven** validated kinds retained. |
| Shape placement | Click, drag in all directions, Enter, Shift proportions, cancellation. | Shared native placement preview and one final action. |
| Shape appearance | Transparent/colored fill, themed/explicit stroke, width, solid/dashed, rounding. | Adapted using existing path generation and constant object-space outline width. |
| Shape labels | Rich marks, links, inline icons, alignment/direction, wrapping/overflow, native editor. | Shared DOM editor stays above its own vector and below higher objects. |
| Shape resize | Geometry/rounding independent of label typography; Shift aspect constraints. | Shared record/resize actions and projected vector geometry. |
| Text and headings | Native inline editor, H1–H3, marks, links, line breaks, writing conversion/shortcuts. | Shared native/Instant Scene HTML surfaces and native active editor. |
| Lists | Bulleted/numbered/checklists, item editing and checkbox controls. | Shared, including prepared checklist delegation. |
| Quotes and callouts | Native rich content and contextual formatting. | Shared DOM renderers. |
| Code | CodeMirror, language picker, highlighting, copy and focused edit behavior. | Shared source/native editor; no canvas rasterization. |
| Tables | Native/source-backed rich tables, cell controls, spans, headers, sorting, widths/fullscreen. | Shared read-only/active table adapters. |
| Mermaid | Sanitized cached rendering, source editing, error and fullscreen paths. | Shared prepared/native DOM adapters. |
| Math | Existing KaTeX preview, source editing and errors. | Shared DOM adapter. |
| Divider | Native divider, ordinary move/selection/layer behavior. | Shared DOM adapter. |
| Images | Upload/Library source, framing, crop/fit, captions, original aspect behavior. | Shared live native renderer and attachment ownership. |
| Files/media | File cards, PDF reader, video/audio players, replace/download/fullscreen. | Shared native players; preserve Instant Scene PDF state/cache/pinning in Konva mode. |
| Resources | Inline Documents, older non-Document resource cards, missing/revoked states, sibling creation. | Shared resource adapters and original Document saves/locks. |
| Mind Maps | Existing rich embedded view/fullscreen editor, topic controls/layouts/search/icons/zoom. | Shared native implementation, including map-local camera wheel ownership. |
| Inline icons | Built-in/brand/custom icons, completion, marks, owner-scoped attachments. | Shared native text/label/map renderers. |
| Legacy content | Existing compatibility readers adapt supported older Board data. | Shared reader; no migration or saved format change. |
| Selection | Click selects, double-click/Enter/Edit edits; rectangular object hit areas. | Shared native shells deliberately retain hit semantics; passive Konva hit graphs disabled. |
| Multi-selection/marquee | Shift/modifier selection, empty-space marquee, group bounds. | Shared native selection; selected graphics shells become stacking barriers. |
| Drag/resize | Cached pointer origin, live previews, side/corner handles, one release commit. | Adapted graphics notification at existing imperative boundaries; cancel restores geometry. |
| Snapping/guides | Grid snapping, indexed smart alignment guides, Alt bypass. | Shared original geometry and guide presentation. |
| Arrangement/layers | Alignment, distribution, front/back ordering, mixed content layers. | Shared actions; bounded ordered graphics bands with explicit whole-scene SVG fallback. |
| Clipboard | Same-workspace structured copy/cut/paste, new IDs, text fallback, native editor clipboard. | Shared; Konva never serializes a node as persistent content. |
| History | Forty grouped Board actions, typing groups, derived sizing outside history. | Shared store/history. Camera and pointer samples create no entries. |
| Keyboard | Select all, duplicate, delete, edit, arrow move/Shift step/Alt resize, Undo/Redo, tool/path commands. | Shared handlers; compare focused canvas/editor/portal cases. |
| Camera | Wheel/touch pan, modified-wheel/pinch zoom, Hand/Space/middle pan, Fit/reset. | Same authoritative ref; Konva uses native layout zoom, 10–400%, and separate `konva.view.v1` browser key. |
| Focus/IME/portals | Existing editor/selection focus, composition/upload/resource locks, portal exclusions. | Shared; canvases are pointer-transparent and contain no editors. |
| Autosave/status | Debounced one-in-flight writes, existing Saved/error/loading UI. | Shared; no per-sample writes. |
| Recovery/conflicts | Session drafts, unknown-draft download, 409 preservation, deliberate Load latest/retry. | Shared original contracts. |
| Import/export | Existing supported clipboard, attachment download and recovery download. Native Board document export is not an existing feature. | Contracts retained; no new import/export format or conversion step. |
| Navigation | Original app tabs, fullscreen, return/culling, responsive chrome and help. | Shared; viewport resize invalidates projection. |
| Themes/appearance | Default ink follows currentColor, explicit colors remain explicit, original CSS surfaces. | Graphics recolor on document theme changes; HTML appearance unchanged. |
| Motion | Toolbar/menu/palette/selection/handles/edit/save motion; finite create/delete/style feedback. | Native effects retained, WAAPI graphic progress mirrored, canonical drawing SVG reconstructed only for short deletion feedback. |
| Reduced motion | Existing media query disables native/script effects and stops running ones. | Graphics motion stops on the same preference change. |
| Idle/background | Existing camera is input-driven; rich preparation pauses while hidden. | Additional graphics work invalidates only on changes; finite animation frames and barrier expiry stop. Runtime proof still pending. |
| Renderer rollback | URL beats valid session value; invalid override falls through; Instant Scene default. | Adds `konva`; original/instant precedence and default unchanged. |

## Acceptance boundaries

- More than six presented graphics bands or the total scene-pixel budget selects **original graphics for the entire presentation**. Labels/selection shells count as barriers, including their short outgoing outline fades. The mode remains `konva`, but `data-board-graphics="original"` and `data-board-graphics-fallback` expose this limit. Such recordings are fallback measurements, not Konva performance results.
- New streamed smoothing is local to consecutive 64-sample chunks. Existing saved drawings are unchanged. The smoothing modes, endpoints and saved format are preserved, but pixel-identical new strokes versus the previous whole-stroke algorithm are **not claimed**.
- All browser appearance, interaction, touch/stylus, persistence, memory, CPU/GPU and thermal comparisons are pending. Static checks alone do not complete parity acceptance.
