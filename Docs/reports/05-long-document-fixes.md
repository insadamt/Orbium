# Phase 5 review — long document performance fixes

Date: 2026-10-03.

## Scope and result

Implemented the editor fixes following the long-document investigation and the user's approval. No later phase was started. Existing uncommitted text-color, direction, CSS, server inspector, and documentation work was preserved. No dependency, schema, route, or persisted content-format changes were introduced.

### Direction handling

- Content edits find the changed top-level range instead of recursively normalizing the entire document. Following blocks are processed only until inherited direction stabilizes.
- Unchanged nested block subtrees reuse normalization results, including within long lists and tables.
- Strong-direction inference inspects text nodes until the first directional character instead of concatenating the complete block text. Results are cached by immutable node identity.
- Initial normalization constructs normalized content and applies one replacement instead of a separate markup step for every block. Selection and stored marks are restored at their unchanged positions; initial normalization is excluded from undo history.
- Explicit direction modes, legacy RTL behavior, and automatic direction inherited by empty blocks retain the working-tree behavior present before this fix.

### Syntax highlighting

- Replaced the installed Lowlight plugin's full-document update handler while retaining the inherited code-block behavior, VS Code paste handler, existing grammars, and automatic language detection.
- Cursor-only transactions reuse decoration state without a document traversal.
- Content edits map retained decorations, invalidate the changed top-level range, and enqueue its code blocks. Actual step maps are included so identical duplicated blocks and replacements do not invalidate the wrong positions.
- Initial and changed highlighting runs in scheduled batches of at most 16 blocks, checking a six-millisecond budget between blocks. Browsers without `requestIdleCallback` use a timer fallback. This is a cooperative budget, not a guarantee that a single block finishes within six milliseconds.
- Cached spans use content-fragment identity and language, so direction-only attribute changes and unchanged blocks in an affected container reuse highlighting.
- Scheduled work reads the current queue, cancels on editor destruction, and publishes decoration-only transactions that do not trigger content autosave or create undo entries. Code remains editable before colors finish appearing.

### Pointer and media work

- Hover targeting walks up from the event target to the editor block and resolves its document index, avoiding a full DOM-child containment scan.
- Gutter fallback and drag insertion use binary search over vertically ordered block bounds instead of measuring from the first block every time. Existing animation-frame hover batching remains.
- Mermaid, block math, and inline math previews activate within a 600-pixel viewport margin. Once activated they stay active, preserving editing behavior and avoiding repeated mount work. Observer cleanup and an unsupported-browser fallback are included.
- Editor images use native lazy loading and asynchronous decoding.

## Library decision and limitations

No package added or upgraded. Reviewed the [Tiptap CodeBlock Lowlight documentation](https://github.com/ueberdosis/tiptap-docs/blob/main/src/content/editor/extensions/nodes/code-block-lowlight.mdx) and inspected the installed Tiptap/ProseMirror implementations. The existing Lowlight integration supports retaining our grammars and language settings, but its installed update plugin scans every document and rebuilds all highlighting in relevant transactions. A small application-owned replacement addresses that specific behavior without changing the highlighting engine.

The replacement identifies the inherited plugin by its installed `lowlight$` key prefix. Recheck that integration when upgrading Tiptap. Native scheduling and IntersectionObserver cover the deferred work; no virtualization package was selected. Editable-document virtualization would require a separate design for selection, IME, search, dragging, and changing block heights.

Remaining limitations:

- The complete ProseMirror document and React node views still mount. This is not unbounded-document virtualization.
- A single huge code block still highlights synchronously within one scheduled job. An already-running Mermaid render cannot be interrupted. Affected top-level containers still need code-block discovery; broad replacements can affect a broad range.
- Change-range discovery can compare unchanged siblings. The fix removes repeated recursive normalization and highlighting, not every operation proportional to the number of siblings.
- Preview/image heights can settle as content becomes available. Existing image data does not include an intrinsic aspect ratio. Visited previews remain active, and native image loading distance is browser-controlled.
- Autosave still serializes the document synchronously at save time. Workspace mention payloads, ancestor queries, route bundle splitting, and appearance compositing were not changed in this editor-focused fix.
- No affected-document browser trace or before/after latency benchmark was collected. Manual confirmation remains necessary; no numeric speedup is claimed.

## Validation

- Targeted Vite Plus formatting: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 207 formatted files and 146 linted files in the configured scope, no warnings/errors.
- `./vendor/bin/pint --test`: passed.
- `npm run build`: passed in 7.40 seconds; existing chunks above 500 kB still produce warnings.
- `git diff --check`: passed. New files were also checked individually for whitespace errors.
- All new source files are below 500 lines.
- Automated tests were neither written nor run, per user instructions. Browser/manual checks below remain for the user.

## Manual test checklist

Use a disposable copy of the affected document, production assets, and the same browser/device. Wait for Saved before refreshing or leaving unless intentionally checking the save guard.

1. Open the affected long document, then reopen it with cached assets. Type immediately near the beginning and end. Expected: complete content, usable selection and typing, and code colors appearing progressively without blocking content availability. Compare opening and interaction with the earlier version; capture DevTools Performance if lag remains.
2. In a document with many code blocks, hold an arrow key, edit one block, change its language, and select Plaintext. Repeat with an unspecified-language fence and a supported alias such as `js`. Expected: correct eventual coloring, unchanged source text, normal cursor movement, no save just because colors finish rendering.
3. Duplicate identical code blocks before/after one another, move them with the block handle, insert a paragraph above them, and delete blocks. Undo and redo each operation. Expected: highlighting follows the correct blocks with no missing/duplicated spans or stale positions. Repeat inside a list, quote, or table where allowed.
4. In a long nested list, edit English and Arabic/Hebrew text; press Enter to create empty items. Change the first strong character's language and try explicit LTR/RTL/Auto. Expected: correct direction and inherited direction, preserved list structure, and responsive edits. Repeat for nested quotes and table cells.
5. Select text across blocks, apply formatting/color, type mixed-language text, and undo/redo. Repeat with a selected image and a table-cell selection. Expected: selection/caret and formatting remain correct when direction normalization runs; no unexpected jump to a block boundary.
6. Open an older/imported document with default direction attributes. Wait for any normalization save, refresh, then undo a new edit. Expected: content and direction persist; opening itself does not become an undo action. Only content changes trigger saves, not background highlighting.
7. Move the pointer over text and the gutter near the document's end; right-click, use Add below, and drag a block upward/downward. Repeat over lists, images, tables, and code. Expected: the correct block gets controls and the final drop matches its indicator.
8. Open a long document with offscreen diagrams and inline/block equations. Scroll and use document search to reach them. Expected: previews appear near the viewport, valid content renders, and invalid source retains its recoverable error. Edit source and switch Edit/Preview; the latest source must render and persist. Navigate away while rendering is queued; no old result should appear in another document.
9. Scroll through image-heavy content, select/resize/align an image, and refresh after Saved. Expected: images load as approached, selection and resizing work, and sizes/alignment persist. Check scroll position while images/previews settle, including narrow layouts and split panes.
10. Type rapidly, wait for Saved, refresh, and verify the exact content. Repeat Ctrl+S, undo/redo, search navigation, and immediate navigation with pending edits. On disposable content, try offline editing and Retry after reconnecting. Expected: existing save guards, error handling, and latest-content persistence remain intact.
11. Repeat core scrolling/editing in light/dark mode, reduced motion, normal/glass surfaces, and with a static background. Expected: no functional regression. If only glass/animated-background runs lag, retain a separate trace for appearance profiling.

## Commit suggestions

No commit created.

- `perf(editor): normalize direction incrementally and schedule code highlighting`
- `perf(editor): defer offscreen previews and reduce block layout scans`

Review shared-file hunks before committing because the working tree also contains the user's earlier changes. Stop for manual review within Phase 5.
