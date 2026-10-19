# Boards phase 2 — Spatial persistence and canvas

Approved by the user's “okey next” on 2026-10-18 after the foundation report. Read `../docs/24-boards.md`, the domain/data model, UI system, navigation documentation, and the foundation report before implementation. Do not run automated tests.

## Architecture decisions before implementation

- Add a `boards` extension keyed by Node ID with spatial format version 1 and an optimistic revision. Add Board-owned objects with a stable UUID within each Board, position, dimensions, layer, block type, and canonical Markdown. No Document Node is created for an object.
- Existing Boards are backfilled by a new migration; new Boards receive their extension in the existing hierarchy transaction. Object foreign keys cascade only on permanent deletion, preserving objects throughout Trash/restoration.
- A scoped JSON snapshot endpoint saves one bounded, validated object set atomically under the workspace lock and Board revision lock. Stale revisions receive HTTP 409 and never overwrite newer data. No per-pointer requests; save completed gestures and debounce text edits.
- Initial scope supports paragraph objects as the minimum usable content for exercising the canvas. Reuse CodeMirror, Orbium's Markdown dialect/inline formatting, and existing rich-body rendering. Only the active paragraph mounts an editor. Reject non-paragraph blocks, mentions, and attachment references until the shared-block/reference phases define their complete lifecycle.
- Bound snapshots to 1,000 objects, 16 KiB UTF-8 per paragraph, and 512 KiB total Markdown; dimensions 160–4,000 by 100–4,000 canvas units, positions within ±10,000,000, zoom 10–400%. These practical limits prevent invalid/hostile geometry and remain independent of viewport size.
- Render camera and drag feedback with DOM refs/requestAnimationFrame. Commit React/domain state only at gesture boundaries; cull offscreen previews. Camera, dot-grid, and snapping preferences are browser-local and do not advance shared Board revisions.
- Use wheel/touchpad pan, Ctrl/Cmd+wheel cursor-centered zoom, middle/Space drag pan, empty-space marquee, touch pan/pinch, fit-all/selection, and reset view. Keep editing/scroll/shortcuts separate from canvas controls.
- Keep a bounded session undo/redo history for object/content actions, not camera movement. Support add, select/multiselect, move, resize, duplicate, delete, and front/back layering. Full clipboard, other block types, rich slash menus, live references, drawing/connections/frames, and Mind Maps remain later phases.
- Keep the existing shell. Add guards to its navigation paths before cached/tab activation can unmount a dirty Board, and reuse tab-close/native-unload guards. Keep a recovery draft per Board in the browser tab’s sessionStorage for network failures, history navigation, and reload/restoration. Session storage isolates separate browser tabs; recovery must not depend on the app-tab ID, since navigation preferences are shared across browser tabs. Recover without auto-overwriting a newer server revision; offer draft download and explicit confirmation before loading server content.
- Fetch Board tabs fresh through the existing navigation path rather than reviving stale cached snapshots. Preserve existing document retention and unrelated uncommitted work.

## Required validation

Run PHP formatting/syntax, TypeScript, frontend formatting/lint, production build, migration SQL inspection and application where local PostgreSQL is available, and whitespace checks. Do not write or run test suites. Finish with a report, exact manual steps and expected outcomes, known limits, and commit suggestions.

## Stop

Stop after phase 2 for manual review. Do not start the broad shared-block adapters, resource cards, or Mind Maps without explicit approval.
