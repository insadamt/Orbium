# Performance Engine Phase 3 — browser block containment experiment

Date: 2026-10-07. Product Phase 5 review; Performance Engine Phase 3 only.

## Status and hypothesis

Phase 1 and Phase 2 remain **KEEP**, as accepted by the user. Starting branch: `master`; starting HEAD: `560ea96` (`perf(navigation): shrink retained document history payload`); starting working tree: clean.

**Acceptance decision: pending manual evidence.** An evidence-based KEEP / MODIFY / REVERT verdict cannot be assigned before the requested Chrome traces and editor checks. Retain the small experiment for measurement, rather than treating implementation completion as production KEEP. Stop here; no Phase 4, virtualization, or editor lifecycle work.

Hypothesis: letting the browser skip offscreen simple top-level blocks reduces retained TEST activation layout and scrolling rendering costs. Phase 2 removed the large warm Inertia payload as the dominant bottleneck. User-supplied Phase 2 medians:

| Destination | Interaction | UpdateLayoutTree | Layout | Inertia navigation |
| --- | --- | --- | --- | --- |
| Small (~62 KB) | ~109 ms | ~40 ms | ~5.9 ms | ~35.5 ms |
| TEST (~884 KB) | ~175 ms | ~62 ms | ~44.8 ms | ~25.1 ms |

TEST reference: about 1,854 top-level blocks, 423 headings, 98 native code-language controls, 70 Mermaid views, and ~880 KB editor JSON. Earlier reference: ~999 ms cold mount task, ~47k–63k+ DOM nodes. These are supplied/historical measurements, not new measurements.

This experiment **may reduce style, layout, paint, tab-reactivation rendering, and scroll rendering work**. It does **not reduce DOM nodes, ProseMirror document/state size, initial model construction, or retained editor memory**. All NodeViews and the full editable document still exist. No speedup or browser-correctness result is claimed.

## DOM investigation and eligibility

Inspected Orbium's editor configuration, gutter/hover, retained workspace, block-style decorations, stylesheet, media/math/code NodeViews, and installed Tiptap node renderers/TableView. This is source-level investigation of the actual configured renderers; no live-browser DOM inspection was performed. Confirm these boundaries using Elements before recording.

`EditorContent` hosts a single `.tiptap.ProseMirror.orbium-editor` contenteditable root. Its direct document children are natural block boundaries. `BlockStyleClasses` already attaches incremental node decorations to structural blocks, including nested blocks. The new eligibility attribute is restricted by the ProseMirror parent identity (`parent === doc`), rather than inferred from a DOM tag/depth alone.

| ProseMirror type | Configured editable DOM boundary | Phase 3 |
| --- | --- | --- |
| `paragraph` | `<p class="orbium-paragraph">` | Eligible when direct document child containing only text and hard breaks |
| `heading` | `<h1>`–`<h6>` with `orbium-heading-N`; normal commands use H1–H3 | Same conservative inline-content rule |
| `horizontalRule` | `<hr class="orbium-divider">` | Eligible only as direct document child |
| `bulletList` | `<ul class="orbium-bullet-list">` with nested `<li>` | Excluded |
| `orderedList` | `<ol class="orbium-ordered-list">`, optional start attribute | Excluded |
| `taskList` | `<ul data-type="taskList" class="orbium-checklist">`; task `<li>` contains checkbox label and content `<div>` | Excluded |
| `blockquote` | `<blockquote class="orbium-quote">` containing blocks | Excluded |
| `codeBlock` | Native NodeView `<div data-node-view-wrapper class="… orbium-code">`, toolbar/native select, `<pre><code>` contentDOM | Excluded |
| `table` | TableView `.tableWrapper` around `<table class="orbium-table">`, colgroup/tbody/rows/cells | Excluded |
| `mermaid` | React NodeView outer wrapper, `.orbium-mermaid` inner wrapper and editor/preview | Excluded |
| `blockMath` | React NodeView outer wrapper, `.orbium-math` inner wrapper and editor/preview | Excluded |
| `inlineMath` | Inline React NodeView inside paragraph/heading, relative span with absolute editing popover | Excludes its containing paragraph/heading |
| `image` | React NodeView outer wrapper and `.orbium-image.editor-image` with resize/floating controls/caption | Excluded |
| `file` | React NodeView outer wrapper and `.orbium-file` containing download link | Excluded |
| `callout` | `<aside data-callout class="editor-callout orbium-callout">` containing blocks | Excluded |

The extra React NodeView wrapper is created by Tiptap's renderer; its inner `NodeViewWrapper` carries Orbium's classes. Neither receives containment. Nested paragraphs/headings/dividers inside **any** container, list items, table cells, inline nodes, and arbitrary descendants receive no containment attribute. Mention-containing paragraphs/headings are also excluded; unknown future inline nodes fail the allowlist. Text marks (bold, italic, links, inline code, colors) remain eligible.

Lists and quotes have stable outer wrappers, but their variable-height nested content and possible complex descendants make them a broader experiment. Excluding them avoids new recursive eligibility machinery, list-counter containment interactions, nested margin changes, and enclosing floating controls. This intentionally measures a conservative subset before considering more coverage.

## Library decision

Researched [TanStack Virtual](https://tanstack.com/virtual/latest/docs/introduction) and [react-window](https://github.com/bvaughn/react-window), plus [Tiptap performance guidance](https://tiptap.dev/docs/guides/performance). The first two support rendering virtual lists; they do not supply an Orbium/ProseMirror editing integration. Our assessment is that putting them around this contenteditable would require DOM ownership, selection, composition, search, and coordinate integration beyond this phase. Tiptap's React integration guidance also does not solve the measured browser layout problem by itself.

Selected application-owned decorations plus native CSS, as explicitly requested; no dependency added or upgraded, and no further library-choice approval needed. Native containment retains the editor DOM but leaves skip distance and rendering decisions to the browser. The [CSS Containment specification](https://www.w3.org/TR/css-contain-2/#content-visibility) requires `auto` content to remain available to find, focus, and selection; this does not establish correctness of Chrome's integration with ProseMirror. Manual checks remain mandatory.

## Implementation and reversal

- Existing block decoration emits `data-editor-containment-block="paragraph|heading|horizontalRule"` only for eligible top-level nodes. The eligibility function checks direct inline children; it performs no DOM geometry reads. Existing incremental change-range mapping/rebuilding handles edits, moves, conversion, paste, undo, and redo. Selection-only transactions reuse decorations. No new plugin, listener, observer, timer, polling, or diagnostic publication.
- Document editor root declares `data-editor-viewport-containment="enabled"`. The style-preview and opening-preview roots do not opt in.
- Dedicated imported `editor-viewport-containment.css` uses the opted-in root plus **direct eligible child attribute**, with `content-visibility: auto` and `contain-intrinsic-block-size: auto 1lh`.
- Block-axis sizing reserves one computed line-height until the browser learns the rendered size; `auto` then reuses it. Paragraph default is 1.75 × 1.03rem; headings use their own line-height/font size. Divider already has an explicit 1.75em height. Existing margins, borders, padding, and inline width are preserved; no width estimate or additional containment property.
- Both declarations are inside `@supports`, including `1lh`. No explicit browser override exists in Vite config. Unsupported browsers keep existing rendering; do not infer compatibility solely from the build. Print behavior requires a separate check if exporting through browser printing.
- Existing saved styles may change wrapping, line-height, overflow, shadows, or display. Learned heights can become stale after edits/width/style changes; paint containment can clip decorated text or imported overflow. Verify default styles first, then the actual saved theme and split widths.

Disable for A/B without rebuilding: set every loaded editor root's `data-editor-viewport-containment` to `disabled` outside a recording. Re-enable with `enabled`; verify computed styles before each run. Newly mounted roots default to enabled; repeat the override after a cold mount. Rollback is removal of the CSS import/stylesheet, root attribute, and eligibility decoration additions, or reverting this single commit after saving user edits. No content migration or undo-history reset needed.

## Validation

- `npx vp fmt resources/js/components/editor/styles/block-style-extension.ts resources/js/components/editor/document-editor.tsx resources/css/app.css resources/css/editor-viewport-containment.css`: **PASS**, four files.
- `npm run types:check`: **FAIL**, TS2322 at untouched `resources/js/components/navigation/tab-page-cache.ts:39`: reduced page props omit required Inertia `errors`. Confirmed the identical sole error with `tsc --noEmit` against an isolated `git archive` of starting HEAD `560ea96`, sharing the installed dependencies and generated Wayfinder modules. This failure predates Phase 3; no change to Phase 2 history handling.
- `npm run lint`: **PASS**, 269 formatted files, 204 linted files, no warnings/errors.
- `./vendor/bin/pint --test`: **PASS**.
- `npm run build`: **PASS**, 7.09 seconds. Existing >500 kB chunk warnings and ineffective dynamic imports for document image crop dialog, media menu, database property header, and editor loader remain.
- `git diff --check`: **PASS**; new files also checked before staging/commit.
- Automated tests: neither written nor run. Browser/manual checks and all new performance numbers: **pending user execution**.

## Exact Chrome benchmark setup

1. Use the original TEST content for performance recordings, and a disposable copy for edits. Wait for Saved before refresh. Use production assets from the normal Orbium server; ensure a running Vite dev server is not overriding them. For existing diagnostics, build with `VITE_ORBIUM_PROFILE=true npm run build`; use the same profile setting in both comparisons. The validation build above was an ordinary production build.
2. Fix Chrome version/device, viewport/zoom, appearance/background, saved CSS theme, power mode, extensions, and CPU throttling. Primary run: no CPU throttling. Use a separate identical fixed throttle if desired. Record these settings with each trace.
3. Open DevTools → More tools → Performance monitor; enable CPU, JS heap, DOM nodes, and event listeners. In Performance enable Memory; leave screenshot capture and other recording settings identical. Keep DevTools dock position fixed. Inspect one eligible and one excluded block in Elements → Computed outside recording.
4. Previsit small and TEST, wait for saves and preview/highlighting jobs to settle, and set each tab's starting scroll/caret identically. Run the following once in Console **outside** recordings to select OFF or ON for all loaded retained editors:

```js
document.querySelectorAll('.orbium-editor[data-editor-viewport-containment]')
  .forEach(root => root.dataset.editorViewportContainment = 'disabled'); // OFF
// For ON, run the same statement with 'enabled'.
```

5. OFF computed eligible block: `content-visibility: visible`. ON: `auto`, intrinsic block size begins with `auto`. An excluded block should remain `visible` with default styles. If `CSS.supports('content-visibility', 'auto')` or `CSS.supports('contain-intrinsic-block-size', 'auto 1lh')` is false, record unsupported; no experiment is active.
6. Measure OFF and ON in fresh reloads with identical previsit/scroll paths; repeat each three times and alternate ordering to reduce drift. Save `phase3-off-P3-1-1` / `phase3-on-P3-1-1`, etc. Compare warm document visits separately from first exposure to offscreen blocks; learned-size warming is not the same as merely previsiting a tab. Also compare P3-1 against the accepted Phase 2 trace/numbers.
7. Reset samples with `window.__ORBIUM_PERF__?.reset()` before recording; snapshot/summary only outside the measured interval. No Console polling and no geometry/count scans during traces. Chrome Performance is authoritative; a computed `auto` value does not prove the browser skipped a block.

Optional eligibility snapshot in a profiling build, TEST active, outside recording:

```js
const root = document.querySelector('[data-editor-activity-active="true"] .orbium-editor');
const eligible = [...root.children].filter(block => block.hasAttribute('data-editor-containment-block'));
console.log({ topLevelDomBlocks: root.children.length, eligible: eligible.length,
  excluded: root.children.length - eligible.length });
console.table(eligible.reduce((counts, block) => {
  const type = block.dataset.editorContainmentBlock;
  counts[type] = (counts[type] || 0) + 1;
  return counts;
}, {}));
const schemaCounts = {};
root.editor.state.doc.forEach(node => {
  schemaCounts[node.type.name] = (schemaCounts[node.type.name] || 0) + 1;
});
console.table(schemaCounts);
```

Counts describe eligible/excluded **top-level blocks**, never internally skipped elements. The schema and DOM counts should agree here; inspect any difference rather than assuming a type from its tag. Clear Console references before any heap retention comparison.

## P3-1 — warm small ↔ TEST switching

Start on small with both tabs previsited. Performance → Record, click TEST then small ten times (20 switches total), pausing about one second per switch without editing. Stop and save. Repeat OFF/ON, three recordings each, with the same recorded scroll positions.

For each destination click, select the interaction in Interactions and record interaction latency; inspect Main → click event and its handler duration. Select the corresponding click-to-presented-frame interval; use Bottom-up/Call tree for `UpdateLayoutTree`, `Layout`, PrePaint, and Paint, and record tasks >50 ms. Do not sum nested event and handler times. Calculate separate destination medians (ten TEST and ten small per recording), then compare the three repeats. Record p95/max and long-task counts as supporting evidence.

Expected success signal: substantial TEST Layout reduction versus ~44.8 ms, with correct scroll/caret restoration and reduced overall activation rendering. Small reference: interaction ~109 ms / Layout ~5.9 ms; TEST: ~175 ms / Layout ~44.8 ms. No O(1) or latency result is promised. Warm switching must not recreate the editor or repeat cold construction marks.

## P3-2 — continuous TEST scrolling

Use the same prior scroll path, distance, speed, viewport, and appearance; record exactly ten seconds of continuous scrolling. Start at the same block. Test fast wheel scrolling, scrollbar dragging, jumping far down, then returning upward in separate functional runs. Run fresh/unvisited and previously traversed paths separately in OFF/ON.

Select exactly the ten-second interval. Record main-thread busy percentage from non-overlapping busy time / interval, style recalculation (`UpdateLayoutTree`), Layout, PrePaint/Paint, tasks >50 ms, dropped frames if shown, and DOM nodes. Avoid adding nested task durations twice. DOM counts need not fall; all blocks remain mounted. Expected: no collapsed whitespace, extreme scroll jumps, thumb/anchor instability, delayed blank content, or repeated height corrections on an already traversed path. Earlier scroll busy reference ~53.8% is historical, not an accepted Phase 2 scroll measurement.

## P3-3 — deep jump

Before recording, choose a distinctive existing text near block ~1800, using Elements or `root.editor.state.doc.child(1799).textContent` where that index exists. Keep it unchanged. Start near the top. Record opening local document search, entering the query, and pressing Enter to jump. Measure the jump action to the first correctly presented target frame, inspect long tasks, and watch subsequent frames for correction/jumps. Repeat with shared page finder and an existing heading/deep link if supported; Ctrl/Cmd+End is an additional cursor-driven deep-jump check.

Expected: exact target visible, correctly positioned and editable; no late jump to the wrong block. Test both first-time and previously visited target paths. Record cold preview jobs separately if the target is near a complex block.

## P3-4 — selection and input semantics

On the disposable TEST copy, click a visible paragraph; type, Enter, paste multiline text, and undo/redo. Test arrow keys, Shift+Arrow across nearby boundaries, Home/End, and PageUp/PageDown. Extend a selection beyond the viewport with Shift+PageDown and a drag while scrolling; select across an eligible/excluded boundary. Format using the selection toolbar.

Expected: correct caret/text selection, all selected content visible when approached, correct toolbar position, no crash or offscreen input loss. If practical test IME composition and Arabic/Hebrew RTL in automatic and explicit direction modes. Save and reload to verify final text. Selection can force selected blocks to render and reduce containment's benefit; measure that separately rather than hiding the cost.

## P3-5 — browser find

Start near the top with the distinctive deep target unvisited after reload. Orbium intercepts Ctrl/Cmd+F for local search, so open **Chrome's three-dot menu → Find and edit → Find** (wording may vary), then use Ctrl/Cmd+F once Chrome's native find UI is open. Enter the deep query; navigate matches in both directions. Keep this distinct from local and shared page finders. Record the native-find jump and inspect long tasks/position corrections.

Expected: browser finds offscreen text, scrolls to the correct visible block, and highlights the correct match. Failure to find skipped content or incorrect positioning is a potentially disqualifying regression even if layout improves.

## P3-6 — block tooling, exclusions, and retained state

Hover gutter at top and near bottom, add a block, open slash and mention menus, select/format text, and drag/drop across the viewport. Verify indicator and final drop agree. Insert inline math and a mention into an eligible paragraph/heading; inspect that the containment attribute disappears. Undo removal/insertion, convert paragraph ↔ heading ↔ list, paste and move blocks into/out of quote/list/callout; attributes must track eligibility without becoming persisted document attributes.

Near eligible blocks, exercise code language/copy, table cell selection and row/column/resize controls, Mermaid Edit/Preview, math editing/popovers, image resize/align/caption, file download, callout, ordinary lists and checkboxes. Expected: correct geometry and content; no clipping of excluded NodeView controls. The whole paragraph with inline math remains uncontained, including its popover.

Type a marker, switch away immediately, return, wait Saved, undo/redo, then reload after Saved. Expected: existing autosave, undo, selection, retained scroll, tab identity and history unchanged. Repeat after deep scrolling, in light/dark, actual saved styles, narrow/split panes, and relevant reduced-motion settings. Inspect each iframe independently. No hidden destination overlays or new remounts.

## Known risks and decision gate

- Initial one-line estimates undercount unvisited wrapped/multiline paragraphs/headings. Learned sizes help revisits, but resize, edits, custom CSS, and hidden/revealed behavior may still cause corrections. Extreme jumps/unstable anchoring are a rejection signal.
- `content-visibility: auto` also implies style/layout/paint containment while visible. Text ink, marks/shadows, custom theme overflow, placeholder pseudo-elements, and margin behavior need visual checking. Inline math/mentions and nested containers are excluded to limit this risk.
- ProseMirror coordinate mapping, search selection/scrolling, gutter binary search, drag/drop, and menus still read geometry. Reads may force rendering or encounter estimated bounds; correctness and actual retained-size behavior must be established manually. No private ProseMirror API change or coordinate workaround is included.
- Excluding code, tables, diagrams and other complex blocks limits possible benefit on TEST. Negligible improvement is a valid NO-GO result. A large selection can bring many blocks back into rendering.
- Browser support checks confirm syntax, not implementation fidelity. Native browser find, contenteditable selection/IME, RTL, accessibility and narrow widths require manual checks.

| Verdict after manual evidence | Gate |
| --- | --- |
| **KEEP** | Measurable substantial layout/paint reduction, all editor semantics correct, simple maintainable implementation |
| **MODIFY** | Benefit exists, but eligibility/estimates/selectors need a small refinement; rerun affected scenarios before acceptance |
| **REVERT / NO-GO** | Selection/search/coordinates break, anchors jump unstably, benefit negligible, or invasive editor work would be required |

All P3 result cells are pending. Correctness wins even when traces improve. If simple-block ProseMirror coordinate mapping fundamentally breaks, reject the experiment; do not begin a layout engine to rescue it.

Commit suggestion: `perf(editor): experiment with viewport rendering containment`. One logical commit; stop after implementation, checks, report and commit.
