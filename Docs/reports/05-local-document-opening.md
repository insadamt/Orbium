# Phase 5 review — local document opening

Date: 2026-10-03.

## Finding

The user's port-8000 screenshot under Fast 4G shows a 309 KB document response taking 869 ms and a 1,122 KB document page script taking 2.18 seconds. Network Finish is 6.35 seconds; that is not a measurement of editor readiness. The large `sad` document (node 46) has 840 top-level blocks and about 323 KB of stored JSON. Every top-level block already has direction metadata, so opening it should not cause a whole-document direction rewrite.

The previous Docker Nginx gzip change only affects port 18082. Port 8000 still serves built scripts without that configuration.

## Change

The document page loads its editor through React `lazy` and `Suspense`. While the editor module downloads, the page displays a lightweight, non-editable rendering of the first 18 blocks. The preview reads text from the already-loaded Inertia content and does not change stored data. A failed editor module load retains the preview and offers a page reload. Once loaded, the existing Tiptap editor, autosave, search, and block controls mount normally.

The page's own built script fell from 1,121,507 bytes to 5,841 bytes. The deferred editor script is 1,115,749 bytes. This moves the heavy script after the document shell can render; it does not reduce total editor code or prove faster time to editable. No browser timing was collected.

## Library decision

React `lazy` and `Suspense` provide this split without a new package. The previously reviewed TanStack Virtual targets list rendering, while Orbium's single ProseMirror editor needs selection, search, undo, composition, and drag behavior across blocks. It is not added on this evidence. The preview is a temporary opening state, not document virtualization.

## Validation and limits

- Type check, lint, Pint, production build, and whitespace checks passed.
- The build still warns about large chunks. Automated tests were neither written nor run, per user instructions.
- The preview shows only the first 18 blocks, flattens inline formatting, and is read-only. Large-editor construction still runs when its chunk arrives. A Performance trace is needed to tell whether further delay is JavaScript evaluation or DOM mounting.

## Manual checklist

1. On port 8000, rebuild assets and hard-reload `sad` with DevTools Fast 4G and cache disabled. Expected: title and first document blocks appear before the editor script finishes; editing controls become available after it loads.
2. With Network open, find the small `show` script and deferred `document-editor` script. Expected: the page script is roughly 6 KB and the editor script roughly 1.1 MB; no duplicate document response or content save is caused by the preview.
3. Open a short document and a database document. Expected: both show their correct first blocks, then become fully editable with their existing header and property controls.
4. In a disposable copy of `sad`, type near the beginning and end, search for text near the end, drag a block, undo, and wait for Saved. Refresh. Expected: all changes persist and there is only one editor after the preview disappears.
5. In DevTools Performance, record a warm-cache opening of `sad`. Expected: use the trace to separate editor JavaScript evaluation from ProseMirror DOM construction before choosing a virtualization design.

Suggested commit: `perf(editor): show document content while editor loads`.

## Measured editor-readiness follow-up (2026-10-03)

This follow-up stays in Phase 5 and builds on the lazy loader above. The original `sad` document (workspace 1, node 46) was never edited. A disposable document (node 56) was created and populated through `SaveDocument` with the exact 840-block content for typing and control checks. After undoing the probes, its stored content matched node 46 structurally at the model level; the original revision remained 23.

### Browser measurement and diagnosis

All timings below were measured in Orbium's built-in Browser on port 8000 with production assets, without Fast 4G throttling. The timer started at the workspace-tile click. The readiness check waited for the complete `.orbium-editor[contenteditable="true"]` with all 840 top-level blocks; a separate exact-copy run placed the cursor and typed a probe. A first open after a new build fingerprint approximates an uncached editor asset. The Browser did not expose a cache-disable control, so these are not controlled cold-cache benchmarks.

| State | First open after asset change | Repeat open | Open, place cursor, type on exact copy | Main long task |
|---|---:|---:|---:|---:|
| Existing React code-block node views | 4.65 s | about 4.9 s | 4.44 s | 3.70 s |
| Native ProseMirror code-block node view with toolbar | 1.36 s | 1.28 s | 1.34 s | 0.38–0.49 s in instrumented runs |

On the exact disposable copy, opening, placing the cursor at the end, and typing a probe was acknowledged in 4.44 s with the original React views and 1.34 s with the final native view. The separate 1.53 s native trial gave the same result within normal local variation. The copy still had 840 blocks and 88 code-language controls. A language change to Plaintext and undo restored JSON; copying code returned the exact 27-character first code block. Typing and the language change were undone, Saved appeared, and the persisted copy again matched the original content.

A temporary in-page Chromium Resource Timing and Long Task trace isolated the delay. In a representative baseline open, the document request transferred 300,006 bytes in 590 ms, the 1,116,887-byte editor script transferred in 15 ms, and the dynamic import took about 71 ms. The editor DOM had committed before a single 3,698 ms main-thread task delayed the next animation frame and Tiptap's `onCreate`. Direction normalization took 6 ms. The first batch of syntax highlighting took about 1 ms. The response and script loading were therefore secondary on this local connection. The prior Fast 4G screenshot remains useful network evidence but cannot establish editor readiness.

Controlled comparison builds narrowed the long task to code-block node-view construction. Removing the React node view while keeping 88 editable code blocks cut opening to 1.31 s and the long task to 265 ms. Keeping a minimal React code view without its toolbar still took 3.18 s with a 2.14 s long task. The full React view mounted 88 toolbars and React portals; the new native view preserves those controls without that cost.

### Change and library choice

The code-block extension now uses an application-owned ProseMirror node view. It retains editable `contentDOM`, language icons and selection, code copying, direction updates, and the existing incremental Lowlight decorations. No persisted format, route, dependency, or document content changed.

Options reviewed:

- [Tiptap's existing `ReactNodeViewRenderer`](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react) is ergonomic and handles React lifecycle, but the measured 88 instances dominate opening time here.
- [Tiptap's JavaScript node-view API](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/javascript) and [ProseMirror's node-view contract](https://prosemirror.net/docs/ref/#view.NodeView) for `contentDOM`, `update`, `stopEvent`, and `ignoreMutation` support the existing toolbar without another package. Orbium now owns its DOM events and cleanup, which need review when Tiptap is upgraded.
- [TanStack Virtual](https://tanstack.com/virtual/latest) handles list windows and dynamic row measurements. A single editable ProseMirror document also needs continuous selection, IME composition, search, undo, and block dragging, so adopting it would require a separate editor architecture. It would add complexity before this measured bottleneck required it.

### Validation and limits

- Targeted `vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 209 formatted files and 148 linted files, no warnings or errors.
- `./vendor/bin/pint --test`: passed.
- `npm run build`: passed in 5.41 seconds. Existing large-chunk warnings remain; the editor chunk is about 1.116 MB.
- `git diff --check`: passed.
- Automated tests were neither written nor run, per user instruction.
- The Browser API did not expose DevTools' Network panel, a full CPU flame chart, cache disabling, or Fast 4G controls. Resource Timing and Long Task entries were captured with temporary probes and then removed. The measurements identify the dominant local bottleneck, not a universal latency guarantee.
- The complete 840-block ProseMirror DOM still mounts. The change targets the measured 88 React code-block views; very large documents, other complex node views, and slower networks may still need separate profiling.

### Manual test checklist

Use node 56 (`sad performance disposable copy`) for every edit. Wait for **Saved** before refreshing. Leave node 46 (`sad`) untouched.

1. From workspace 1, open `sad`, return home, and open it again. Expected: all 840 top-level blocks become editable; the title or first-block preview alone does not count as ready. On this local build, a representative first open was 1.36 s and repeat open 1.28 s.
2. Open node 56, click at the beginning and end, type a short unique probe, wait for Saved, refresh, and confirm the exact text. Then undo/delete it and wait for Saved. Expected: cursor placement and typing work across the full document, and the original node 46 is unchanged.
3. In node 56, find a code block, change its language (for example JSON → Plaintext → JSON), type inside it, and undo/redo. Expected: the language icon/label and highlighting follow the selected language, code text remains editable, and changes persist after Saved and refresh.
4. Use a code block's Copy button in node 56 and paste into a safe scratch field. Expected: copied text equals only that code block; the button briefly reports success or failure, then resets.
5. On node 56, use document search to reach text near the end, move the caret, then drag a block and undo. Expected: selection, search, block controls, and undo remain correct with the native code views.
6. Repeat an open with Browser DevTools Network and Performance panels if available to you, once with disabled cache/Fast 4G and once warm. Start at the tile click and stop only after clicking and typing in node 56. Expected: distinguish response/transfer, script evaluation, and remaining main-thread DOM work; record time to the typed character, not Network Finish.

No commit was created. Suggested commit: `perf(editor): replace React code block views with native ProseMirror DOM`.
