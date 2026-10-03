# Long document performance investigation

Date: 2026-10-03. Scope: investigation within the current Phase 5 review.

## Outcome and evidence limits

The editor contains several whole-document operations that scale with document length, including operations on every edit and cursor transaction. These explain plausible causes of slow opening and interaction lag, but their relative contribution requires a browser Performance recording of an affected document. No runtime timing, browser reproduction, database profiling, or measured speedup is claimed.

No application code was changed. Existing uncommitted editor direction, text color, CSS, server inspector, and documentation changes were preserved. Findings describe the current working tree, including those changes.

## Findings

1. **Direction normalization processes the whole document on opening and every content change.** `resources/js/components/editor/automatic-block-direction.ts:98` dispatches an initialization transaction. Its `appendTransaction` at line 120 loops through every top-level block and recursively visits its block descendants. Blocks with missing/default direction metadata receive individual `setNodeMarkup` steps. Imported or older documents can therefore incur many updates immediately after their first render. The existing WeakMap caches strong direction inference, but does not skip the full traversal. One-character edits still traverse unchanged blocks.

2. **The installed Lowlight plugin scans the entire document twice on every transaction, even selection-only transactions.** `node_modules/@tiptap/extension-code-block-lowlight/src/lowlight-plugin.ts:105` calls `findChildren` on both old and new documents before checking `docChanged`. The installed helper uses `doc.descendants`. This cost exists even in documents without code blocks. When editing inside a code block, the plugin rebuilds highlighting for every code block, not just the edited one. Initialization also highlights every code block. Missing/unrecognized language values use automatic language detection. Orbium enables this plugin for every document in `document-editor.tsx:165`.

3. **The complete editable document mounts at once, including expensive offscreen content.** `editor-block-gutter.tsx` mounts one `EditorContent` with the complete document. There is no viewport gate around custom node views. `media-nodes.tsx` schedules each Mermaid preview 200 ms after mounting; the debounce delays work but does not avoid offscreen work. Both math views synchronously render KaTeX during their initial render. `image-view.tsx:145` uses an image without native lazy loading. Long media-rich documents therefore incur more startup work and resource requests. Full editable DOM size also remains a layout/memory concern; its actual cost needs profiling.

4. **Pointer handling still searches from the beginning of the document.** `editor-block-hover.ts` copies all editor DOM children and searches them for each scheduled hover measurement. Pointer positions in the gutter can cause repeated bounding-box reads until a matching block is found. `editor-block-gutter.tsx` similarly scans block rectangles on drag-over. The prior animation-frame batching limits hover frequency, but does not reduce work per measurement. This is particularly relevant near the end of tall documents.

5. **Autosave can still cause a periodic main-thread stall.** `use-document-autosave.ts:42` runs `content.toJSON()` and `JSON.stringify()` synchronously for the entire document when a save begins. The prior fix correctly removed this from each keystroke. It does not eliminate the save-time cost. This is a candidate for pauses after typing, not a general explanation for initial loading unless opening triggers normalization and a save.

6. **Secondary costs require separate measurement.** `DocumentController::show` sends all workspace mention candidates, even for ordinary documents, and performs ancestor traversal in both ownership validation and breadcrumb construction. These costs scale with workspace size/depth rather than document height. The document page statically imports the editor, common highlighting grammars, and math support. The previous report measured a roughly 1.06 MB minified document entry; that is historical evidence, not a fresh build measurement. Glass appearance applies backdrop filtering to the document island; compare against normal surfaces and a static background before attributing scrolling lag to it.

## Important exclusions

- The installed Tiptap React `useEditor` implementation defaults to **not** rerendering on every transaction when `shouldRerenderOnTransaction` is undefined. Adding `false` alone would not fix these findings.
- The installed built-in text-direction extension primarily supplies attributes. The full normalization traversal is in Orbium's custom extension.
- Search counting is already debounced and only subscribes while the floating finder has a query. It is not the first suspect when the finder is closed.
- The earlier performance reports explicitly did not claim browser profiling or a complete solution for long documents.

## Proposed implementation order

First capture an affected production-build document opening, typing, cursor movement, and scrolling. Then make direction handling incremental while preserving inherited direction, explicit RTL/LTR, nested blocks, undo/redo, and old content. Address the highlighting plugin's unconditional scans and document-wide re-highlighting. Defer offscreen preview work and image loading with stable dimensions. Replace repeated hover scans with targeted lookup. Profile again before choosing editable-document virtualization or moving serialization off the main thread.

No new feature or dependency was implemented or selected. The installed libraries were inspected directly. Any proposed package addition needs a separate library/limitations comparison and user choice before implementation. Generic list virtualization must not be treated as a drop-in replacement for a contenteditable document: selection, IME, search, block dragging, and variable-height content need an explicit design.

## Manual diagnostic checklist

Use disposable copies for content changes and wait for Saved before leaving. Use the same browser/device and production assets. These checks are pending manual execution.

1. Record opening a short and a long document in DevTools Performance with Network visible. Repeat after caching assets. Expected diagnostic result: distinguish slow server response/transfer from JavaScript work after the response; retain both recordings.
2. Open a long document without editing and watch Network for PUT requests. Expected: an already-normalized document should not need a content save merely from opening; older/default-direction content may trigger normalization and a save. Compare reopening after Saved.
3. With the finder closed, type in an ordinary paragraph, then hold an arrow key to move the cursor. Expected diagnostic result: inspect direction-plugin work during edits and Lowlight `findChildren` work during both edits and cursor movement.
4. In a disposable code-heavy document, edit one code block. Expected diagnostic result: inspect whether `getDecorations`/highlighting processes the other code blocks too.
5. Open a document containing many diagrams, equations, or images below the viewport. Expected diagnostic result: observe preview work and image requests before scrolling to that content.
6. Move the pointer along the gutter near the start and near the end; then drag a block. Expected diagnostic result: compare time in `findHoveredBlock`, `findDropLocation`, and layout measurements.
7. Type, pause for autosave, and continue typing. Expected diagnostic result: determine whether a visible pause aligns with JSON serialization and the outgoing PUT. Refresh after Saved; all edits must persist.
8. Repeat scrolling with a static background and normal surface appearance. Expected diagnostic result: a meaningful improvement isolates an appearance/compositing contribution; no change points back toward editor work.

## Checks and commit suggestion

- Automated tests: neither written nor run, per instructions.
- Formatting, lint, type, and build checks: not run; application code was not changed and these checks cannot establish runtime performance.
- Report whitespace: checked with `git diff --no-index --check /dev/null Docs/reports/05-long-document-investigation.md`.
- No commit created. Suggested documentation commit: `docs(performance): investigate long document loading and editor lag`.
