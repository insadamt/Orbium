# Phase 5 — Shared Mind Map block

## Result and scope

Authorized on 2026-10-24 by “okey work on the mindmap block go ahead”. Implemented the confirmed section-8 core: a central topic, nested parent-child topics, normal Document layout and freely positioned/resizable native Board placement. The supplied specification remains truncated; this is a core Mind Map implementation, not a claim to implement its unavailable remainder or full XMind feature set.

The architecture was recorded before code in `../phases/13-mindmap-block.md`. Previous drawing, partial erasing, Path Pen, style editing and micro-motion changes remain intact and uncommitted. No later phase was started.

## Implemented

- Shared version-1 flat topic graph, deterministic centered two-sided tree layout, SVG connections and themed plain-text topics. No external service, layout library, images, full Document editor per Board map or new dependency.
- Add/edit child and sibling topics, delete an entire branch, collapse/expand, select a safe new parent, fit/zoom and scroll. Root deletion/reparenting is disabled. Reparenting expands its new ancestry; collapsing a selected ancestor restores visible selection. Labels remain editable without waiting for queued CodeMirror widget refreshes.
- **Board Add block → Technical → Mind Map** placement, native viewport move/resize, original Board autosave/revision/conflict/recovery, clipboard and history. Passive maps show graph/view controls; entering Edit activates topic mutations. Corner resize changes viewport dimensions without inserting text-format data.
- **/Mind Map** in canonical Markdown and legacy Documents, with shared graph/UI adapters. Markdown uses an atomic versioned Orbium directive; legacy uses a `mindmap` atom. Topic changes use original Document saves, undo and derived indexing. Composition postpones ordinary Markdown/legacy autosave; hosted sessions retain their existing guards/recovery.
- Tab/Enter add child/sibling; Shift+Tab leaves normal focus navigation available. Topic buttons support arrows/Home and Delete/Backspace. Owner Ctrl/Cmd+Z/Y history applies to topic edits. The central topic cannot be removed or made its own descendant.
- Server/client graph validation: exact version/keys, one matching root, unique IDs, existing parents, connected acyclic ancestry, maximum depth 64 parent links (root depth 0), 500 Unicode code points per label and 64 KiB serialized graph. No fixed subtopic count per parent. Existing Board aggregate/object byte limits remain.
- Document search/plain text/statistics include every label, including collapsed descendants; topic labels never create mentions, attachment references or Node hierarchy/Orbit edges.
- Formatting-preserving `.orbie` export retains the directive and graph. Plain Markdown/legacy convenience export becomes a fenced text outline, including every descendant in parent-child order. Fencing preserves literal labels and avoids ordinary Markdown nesting/mention interpretation. Word/PDF uses the same full text outline in the existing monospace layout. These fallbacks are readable content, not graphical/editable map exports.

## Persistence and compatibility

`2026_10_24_000002_add_mindmap_blocks.php` was SQL-inspected and applied to local PostgreSQL in **17.97 ms**. The prior drawing-gap migration was confirmed applied first. The initial sandboxed SQL-inspection command could not connect to PostgreSQL; the approved local database access succeeded. No rollback or deletion was performed.

The migration upgrades Board spatial envelope/default to **7** and extends the native row kind constraint with `mindmap`. It does not rewrite existing object JSON, UUIDs, revisions or source, and native content format stays 1. Native data contains only `mindmap`. Full/PATCH writes share graph validation and existing byte accounting. The downgrade refuses while any saved Board map exists, including Trash. Old supported Board snapshots/drafts adapt explicitly; map objects in pre-7 envelopes and unknown graph versions are rejected with recovery bytes preserved.

Canonical Document format remains 2, with a new reserved atomic directive and version-1 graph. Older servers reject its unknown directive kind; deploy matching server/client/migration and reload open editors. Legacy Documents remain format 1. Topic IDs are scoped to their map and are not Node/Document IDs. No new graph table or endpoint exists. Current legacy clients advertise Mind Map support; incapable legacy full saves are rejected when a stored map exists. The account archive/package protocol versions are unchanged; Board/account portability integration remains outside this phase.


Legacy compatibility guard: current normal/hosted legacy saves advertise `editor_features: {mindmap: 1}`. If a stored legacy Document contains a map and the request omits that capability, the server rejects the full save with 422 and a reload message. This prevents an older Tiptap schema from silently dropping unknown map atoms. Content/graph validation still applies to capable clients. Manually remove the capability from a copied legacy PUT that omits a saved map: expect rejection and unchanged stored revision/map; the current editor can intentionally delete that map and save.


## Checks

Final checks completed successfully. No automated tests, Playwright, browser automation or browser/manual acceptance checks were written/run. The manual checklist is for the user.

- `npm run check:fix`: passed formatting/lint, without warnings/errors.
- `./vendor/bin/pint --test`: passed across the repository.
- PHP syntax: passed for 17 relevant/new or already-modified PHP files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 739 checked files formatted, 624 source files linted without warnings/errors.
- `npm run build`: passed; 5,562 modules transformed in 14.96 seconds. Log `/tmp/orbium-mindmap-build.log`.
- Migration SQL inspection/application: passed, 17.97 ms local application.
- `git diff --check`: passed.
- New Mind Map sources and modified editor entry points remain under roughly 500 lines.

The build's existing mixed static/dynamic Document-helper import, large-chunk and plugin-timing warnings are informational. Visual feel, large-map browser performance, thermal behavior and actual export rendering remain unmeasured until manual review.

## Exact manual checklist

Use a disposable Board A, another same-workspace Board B, a Markdown Document D, an existing legacy format-1 Document if available and a hosted D card. Reload open Boards/Documents after deploying format 7. Use labels **Launch**, **Research**, **Build**, **Sources** to make ownership and ordering obvious. Wait for Saved before ordinary reloads, except intentional failure checks.

1. **Create on Board:** Add block → Technical → Mind Map, then click the canvas or press Enter to place. Expected: one new independent native map with **Central topic**, selection controls and a 760×460 initial viewport. No Document/page is created. Enter/Edit/double-click exposes topic controls; Done returns to normal Board movement.
2. **Edit labels:** name the central topic Launch, add Research and Build as children, then Sources as a child of Research. Insert text in the middle of a label, delete a few characters, type Arabic and emoji. Expected: caret/text remain usable, balanced branches connect to the proper parents, original topic IDs remain stable and autosave reaches Saved. Reload: all labels and ancestry return.
3. **Keyboard/focus:** focus a topic button and use Right/Left, Up/Down and Home. In Topic text press Tab to add a child and Enter to add a sibling; use Shift+Tab to navigate out. Expected: visible topic selection/focus, protected root, and accessible labelled buttons/input. Delete/Backspace on a topic button deletes its subtree; Backspace in the text field deletes characters only.
4. **Collapse:** select Sources, then collapse Research using its node toggle. Expected: Sources hides but remains stored, visible selection returns to Research and expansion restores its text/ID/branch. Collapse the central topic, save/reload and expand. Expected: every hidden descendant survives. Passive Board maps require entering Edit to change collapse state.
5. **Reparent:** collapse Build, select Sources and change **Topic parent** to Build. Expected: Build and its ancestors expand so Sources stays visible, Research remains intact, and the new parent survives reload. The current topic/descendants are excluded from parent choices; the central topic's parent selector is disabled.
6. **Delete/history:** select Research with nested children, Delete branch, then Ctrl/Cmd+Z and Redo; repeat from the topic text input and Board history buttons. Expected: complete subtree restoration/removal without creating another Node or changing unrelated blocks. Central-topic deletion is unavailable. Undo typing restores prior label values using owner history.
7. **Board geometry:** finish editing, drag the map, resize from side and corner handles at different canvas zoom levels and reload. Expected: freely changed viewport dimensions, fit/layout updates and unchanged graph topology/labels. Inspect saved data: only `data.mindmap`, no accidental `text_scale` or Document content. Resizing never adds a hierarchy child.
8. **View-only changes:** use map Fit/zoom buttons and scroll its viewport. Expected: view changes without a Board/Document content save. Fit brings the tree into view; zooming permits readable scrolling through a larger map. Map view state may reset when remounted; graph/layout ownership remains saved.
9. **Copy/duplicate/cull:** duplicate the map and edit only the copy; copy/paste onto B, then pan inactive maps offscreen and return. Expected: independent Board object IDs, self-contained identical initial trees, no synchronized edits between copies and no loss through culling. Existing camera, selection, layers, save and clipboard behavior remains usable.
10. **Markdown Document:** type `/Mind Map` in D, build the same tree, rename/reparent/collapse topics and Undo/Redo. Expected: shared graph controls in the normal 440-pixel Document viewport, original Document autosave and stable graph after reopening. Global Source mode shows the versioned atomic directive; Live Preview returns to the editable map. Ordinary text before/after it remains intact.
11. **Document reorder/clipboard:** move the Mind Map with the existing Document gutter, duplicate/copy it and edit one copy. Expected: all graph labels/IDs stay within their own blocks, content before/after remains correct and Undo restores the prior block position/content. Reordering must not drop the React widget or reset an active accepted label edit.
12. **Legacy Document:** if a format-1 Document exists, insert `/Mind Map`, edit and reload; test Undo/Redo from the label input and convenience Markdown export. Expected: same graph/UI, original legacy content/save format and a full fenced text outline export. If no legacy Document exists, mark this step not applicable; do not convert production data solely to manufacture one.
13. **Hosted original:** insert/edit a map inside D's live Board resource card, then open D normally. Expected: original Document edits, revision, search/statistics and identity are shared. The Board-owned map from earlier remains independent; native map editing never mounts a full Document editor.
14. **Composition and guards:** use IME in a topic label on a Board, normal Markdown/legacy Document and hosted card. Throttle Network and try leaving/closing while changed content saves. Expected: composition postpones the owner save, every accepted label edit stays in owner content, normal pending-save/navigation guards apply and the hosted card preserves its original-Document recovery behavior. No changes exist only in a blur callback.
15. **Conflicts:** load the same Board in browser tabs A/B, save a map edit in A, then make a stale edit in B. Expected: 409, protected local Board draft, no overwrite of A. Repeat with D open normally and as a hosted card. Expected: original Document revision validation rejects the stale save; hosted recovery offers draft download/confirmed latest reload. Cancelling reload retains local data.
16. **Recovery:** go offline, edit a map, wait for a failed save and reload the same browser tab. Expected: the existing Board/hosted-Document session draft retains accepted map data. Restore Network and retry when revisions match. If the server advanced, conflict recovery keeps the stale draft for download. A storage failure must retain the existing explicit recovery warning; session storage is not durable backup after clearing the session.
17. **Search/statistics/literal labels:** save unique text inside a collapsed descendant in D and search for it; open Document statistics. Expected: label text/word counts and Mind Map block count are present. Put `<script>alert(1)</script>`, `[link](orbium:node/123)`, backticks and `@name` in labels. Expected: literal text only, no execution, page mention, attachment usage, hierarchy change or extra Orbit edge.
18. **Native round-trip:** export D as `.orbie` with formatting preserved and import it into a disposable Document using existing transfer controls. Expected: central/topic IDs, parent links, labels and collapse flags survive as an editable map. Native package validation accepts matching body/manifest; literal topic text is not rewritten as page/attachment references.
19. **Plain/office export:** export D as plain Markdown and, if deployment dependencies are available, Word/PDF. Expected: a complete indented text outline, including collapsed Sources in its actual parent branch. Markdown uses a safely sized text fence, even when labels contain backticks; Word/PDF uses a monospace outline. No topic disappears and the original interactive map remains unchanged. The exported outline does not reconstruct an editable map on import.
20. **Validation, one case at a time:** copy a successful Board full/PATCH save or Document Markdown PUT as fetch in DevTools. On disposable data, try an unknown graph version, unknown field, duplicate topic ID, missing root, second root, nonexistent parent, self/descendant cycle, invalid ID, nonboolean collapse, over-500-code-point label, graph over 64 KiB or path over 64 parent links. Expected: 422 (or deployment body-size rejection), unchanged saved revision/content and no partial mutation. A Mind Map directive with a nonempty body is also rejected.
21. **Compatibility/trash:** load a pre-7 Board draft without maps: expected explicit adapter, preserved drawings including gaps. Put a map in a disposable pre-7 draft or change its graph version: expected protected recovery error/download with no silent save. Trash/restore the Board/Document: map content returns. Do not actually downgrade shared data for review; migration code must refuse rollback while saved Board maps exist, including Trash.
22. **Regression/performance:** exercise native Board text/media/table/math/Mermaid, partial eraser/Path Pen, drawing style/history/motion and ordinary Document rich blocks/attachments/mentions/split transfers. Expected: previous behavior retained. Try a larger map within the byte budget, collapse most branches and navigate/cull it. Record browser responsiveness manually; no CPU/thermal improvement is claimed. No Playwright or other automated browser tooling is needed for this checklist.

## Review fixes and known limits

- Corner resizing explicitly skips text-scale fields for maps, preserving the native data contract.
- An optimistic input value bridges queued Markdown widget refreshes so typing does not wait for a new widget prop. Accepted changes still enter owner content immediately.
- Collapsing an ancestor restores visible selection, and reparenting opens the destination ancestry.
- Plain export traverses actual parent-child relationships rather than flat insertion order. Fenced text avoids a deep map exceeding Markdown list nesting or label text becoming links/HTML.
- Shared scope is the confirmed core. Advanced layouts/themes, arbitrary branch dragging, topic files/page references, collaboration and XMind import/export are absent. The unavailable remainder of the supplied specification is not implemented.
- Topic text is plain, bounded text; there are no rich text styles or attachment/mention semantics inside topics. There is no fixed per-parent child cap, but byte/label/depth budgets apply.
- Map fit/zoom/scroll/selection is transient. Native Board object geometry and graph/collapse data persist; graphical map exports are not added. Very large maps may require zoom/scroll; browser visual/performance acceptance remains manual.
- Whole-account and Board portability remain separate work. Session recovery retains its existing browser-session lifetime limitations.

## Commit suggestions and stop

No commits created. Existing unrelated drawing/motion changes were not reset or staged.

- `feat(mindmap): add shared validated topic trees and native editing`
- `feat(boards): persist mind maps with spatial format 7`
- `feat(editor): support mind map blocks and safe export fallbacks`
- `docs(mindmap): document core scope and manual acceptance`

Stop after this phase for manual review. Reported defects belong to this phase; no later feature phase is authorized.
