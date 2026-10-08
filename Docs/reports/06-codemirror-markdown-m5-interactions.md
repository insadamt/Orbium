# M5 — CodeMirror Orbium interactions

Date: 2026-10-08. Status: **M5 interactions implemented for manual review; full behavior parity, browser acceptance and matched performance acceptance remain pending.**

The user subsequently rejected the UI. The [M5 UI correction report](06-codemirror-markdown-m5-ui-parity.md) supersedes the initial menu and rich-block presentation described below and includes the new manual comparison checklist. M5 acceptance remains pending.

The user explicitly approved M5 after the M4 report and selected reuse of installed CodeMirror completion/tooltip APIs with Orbium editing logic. This approval does not approve M6 or Tiptap removal. M4's recorded rich-content gates remain open.

## Implemented

- A selection-only floating CodeMirror toolbar with bold, italic, underline, strike, inline code, links, seven named text colors, a custom hex color and default color. Tooltips follow editor focus and disappear in inactive tabs. Arrow keys/Home/End navigate controls; Escape returns to the document. Formatting uses isolated history transactions and bounded source edits. Inline code chooses a safe backtick fence; emphasis keeps surrounding whitespace outside its markers. Syntax-sensitive and multiline ranges do not receive the toolbar.
- Workspace-scoped @ completion using the existing authorized mention endpoint, a 180 ms delay and aborted stale requests. Labels are escaped; the inserted canonical reference stores the target ID rather than a URL or title as identity. Slash and mention completion share the installed completion engine. Ctrl+Space remains Search Master.
- Mention navigation uses the existing Inertia visit flow and autosave guards. Ctrl/Cmd+click opens a separate tab. Nested rich-body mentions use the same navigation handler. Reference-style links resolve their definitions for preview navigation; source spelling remains unchanged.
- One hovered block gutter per editor, with add-below, turn-into for text/headings, Auto/LTR/RTL, paragraph/heading alignment, whole-block selection, duplication, Markdown copy, move up/down, delete and native drag reorder. Complete top-level list/quote/directive ranges move together. Stale source menus and document edits during drag are rejected. Alt+Shift+Up/Down moves the current block, Ctrl/Cmd+Shift+A selects it, and Ctrl/Cmd+Shift+M opens its menu from the keyboard. Selecting a rich block exposes its canonical source until the caret leaves that block.
- Clipboard images and file drops reuse authorized attachment upload and the mapped upload anchor. Supported image MIME types become images; other files become file blocks. Multiple files upload sequentially; failures stop the batch. Uploads into source-only constructs insert after the enclosing block. Attachment insertions separate surrounding prose and retain navigation/upload guards. The existing replacement path still preserves image metadata.
- Empty-document Markdown file import, plus Markdown-text paste into an empty document even when clipboard HTML is available. Files accept `.md`/`.markdown`, strict UTF-8 and a 400,000-byte limit. Source is normalized to LF; H4–H6 are preserved. External/reference-style external images become literal inline code rather than fetched images. Authorized canonical attachment references remain canonical. A read-only server inspection validates the dialect and reference ownership before local mutation. An in-flight import cannot replace later edits or write into an inactive editor. Import enters ordinary undo/autosave.
- Export uses the latest local body and current title as the filename, without injecting an H1. “Keep Orbium references” preserves source and IDs; “Use links to this installation” rewrites semantic URL nodes, including reference definitions, for online navigation. Code, math, captions and labels are not string-replaced. Both modes are single-document downloads and omit binary files/header/database/account metadata. The common download helper is shared with the legacy exporter.
- Finder count, stepping and highlights use mapped logical text rather than hidden Markdown punctuation/metadata/IDs. Matches can cross inline formatting; decoded escapes/entities, code/Mermaid source, math and captions remain searchable. The latest snapshot/query is cached; edit counts/highlights settle after 150 ms, and Enter uses the immediate current snapshot. Matching exposes rich source ranges and scrolls to the result. Server Search Master still reads server-derived plain text.
- Ordinary preview lines derive automatic Unicode direction and neutral-line inheritance. Code/source fields remain LTR. Explicit block presentation uses canonical metadata wrappers. CodeMirror's installed BlockWrapper API provides actual paragraph/list/list-item/quote containers for account styles; wrappers map through edits and refresh with the existing viewport manager. Stable rich/table/media selectors and the existing account style runtime remain in use. Nested checklist previews now use the stable checklist selector.

## Libraries and limitations

No packages were installed or upgraded. Reused packages are the installed `@codemirror/state`, `@codemirror/view`, `@codemirror/autocomplete`, `@codemirror/language`, `@codemirror/commands`, `@codemirror/search`, `@lezer/markdown` and `@radix-ui/react-dropdown-menu`.

The official [autocomplete source](https://github.com/codemirror/autocomplete) supports custom completion sources; its archived GitHub repository points to the upstream's new hosting rather than indicating that the installed API stopped working. The installed TypeScript documentation specifies abort-on-document-change, tooltip lifecycle, per-line direction and BlockWrapper behavior. Those installed signatures were checked before implementation. The official [view source](https://github.com/codemirror/view) provides the underlying DOM/selection primitives. These primitives do not implement Orbium dialect edits, ownership, tables or block movement; Orbium owns those rules.

[dnd kit](https://dndkit.com/) was also examined. Its general sortable abstractions would need an adapter for CodeMirror-owned viewport nodes. This implementation uses one native drag handle plus keyboard movement rather than mounting a React sortable item for every document block. Touch drag parity is not established by this choice and must be reviewed; menu and keyboard movement remain available.

Block wrappers do not establish visual or performance parity by themselves. Logical finder mapping performs a full bounded source parse for a new document snapshot when search settles and retains character-to-source mappings. Reference-definition resolution performs a cached full parse when needed. Both costs require matched long-document measurements. Native HTML drag does not prove touch accessibility. No browser/IME/caret/scroll measurements were performed.

## Changes to APIs and persistence

- Added `POST /workspaces/{workspace}/documents/{node}/markdown/inspect`, requiring authenticated document ownership, format 2 and JSON. It returns inspected normalized source without changing the document revision, mention index, attachments or database body.
- Canonical format remains `orbium-markdown-v1` / content format 2. No database migration or automatic legacy conversion.
- Existing format-1 documents continue using Tiptap.
- The existing Markdown reference remapper remains the archive integration point. Full account archive/export/restore is still separately gated by product Phase 6. A standalone `.md` with IDs is not self-contained portability.

## Actual validation

Actual final results:

- Formatting: `npx vp fmt` passed for the changed/new editor sources. `npm run lint` confirmed all 324 checked files are correctly formatted.
- `npm run lint`: PASS, no warnings/errors in 259 linted files.
- `npm run types:check`: PASS (`tsc --noEmit`).
- `./vendor/bin/pint --test`: PASS across the repository.
- `php -l app/Http/Controllers/DocumentController.php` and `php -l routes/web.php`: PASS.
- `php artisan route:list --path=markdown --except-vendor`: PASS; PUT save and POST inspection routes registered.
- `npm run build`: PASS, final build completed in 9.18 seconds. Existing large-chunk and ineffective dynamic-import warnings remain. The Markdown editor chunk is approximately 284.60 kB / 101.25 kB gzip, with shared renderer/library chunks; this is not a standalone loading-cost or performance acceptance claim.
- `git diff --check`: PASS. New Markdown files also passed whitespace checks against `/dev/null`.
- All new source files remain under 500 lines; the main editor is 420 lines and the gutter is 403 lines.

Automated tests were neither added nor run, as requested. Browser/manual checks, screenshots, IME review and matched performance measurements remain unperformed.

## Exact manual checklist

Use a newly created format-2 document and retain an existing Tiptap document as the reference. Import [the M5 fixture](../examples/orbium-markdown-m5.md) into an empty document; use [the M4 fixture](../examples/orbium-markdown-m4.md) separately for rich-block regression checks.

1. **Import and source:** Create an empty document, click Import Markdown and choose the M5 fixture. Expected: editable preview, source LF normalization, H6 retained as H6, no inserted title body, Saved after autosave and the same body after reload. Import is hidden once content exists. Undo restores emptiness and the import control. Paste `# Review` plus a blank line and `**Imported text**` into another empty document; expected the same import flow even when clipboard HTML exists.
2. **Rejected import:** In an empty document, import a file over 400,000 bytes, invalid UTF-8, or an unclosed reserved directive. Expected: actionable error and unchanged body. Import `![Remote](https://example.com/image.png)`; expected literal text, no remote image request. Use an unauthorized attachment ID in a separate canonical import; expected rejection before the body changes. Type while inspection is in flight; expected current typing is kept and the stale import is rejected.
3. **Toolbar:** Select an ordinary word; apply bold, italic, underline, strike and inline code individually, using undo between checks. Select the complete colored fixture span's text, choose a different preset/custom color, then default color. Expected: canonical source, visible formatting, preserved underline when clearing color, undo/redo and save/reload. Select bold text and apply italic; expected bold is not accidentally removed. Switch Light/Dark with preset purple; expected violet/yellow adaptation. Tab to toolbar controls and use arrows/Escape. Syntax-sensitive/multiline selections currently require Source; do not treat their missing toolbar as accepted full parity.
4. **Links and mentions:** Type `@`, search for a document/folder/database, choose each using arrows/Enter and then mouse. Search quickly and dismiss with Escape. Expected: only current results insert, stored `orbium:node/<id>`, escaped titles and correct authorized navigation. Rename a target and confirm the same ID still opens it. Ctrl/Cmd+click opens a separate tab. Remove the reference, save/reload and inspect the existing mention index; expected no stale entry. Test a reference-style mention in a separate source document and a mention inside a callout/table cell.
5. **Block actions:** Hover the two movable paragraphs. Turn the first into H2, duplicate, copy Markdown, move down/up and delete. Add below and choose `/quote`. Expected: complete blocks, valid source and one undo step per action. Drag a code/table/callout and an explicit direction wrapper around the two paragraphs; expected no split wrapper, lost rich source or stale drag after typing. Use Alt+Shift+Up/Down, Ctrl/Cmd+Shift+A and Ctrl/Cmd+Shift+M; expected keyboard movement, selection and menu access. Select a rich block; expected editable canonical source, preview restored when the caret leaves.
6. **Direction/alignment:** Check the Arabic paragraph and following neutral `12345`; expected RTL inheritance. Type English into that neutral block; expected automatic LTR. Set a normal paragraph to RTL/right, reload, then restore Auto/default alignment. Expected metadata survives and Auto does not persist a cached resolved direction. Compare mixed Arabic/Hebrew/English caret and selection with Tiptap, including inside nested list/quote/table/callout bodies. Full nested direction/IME parity remains a manual gate.
7. **Media:** Paste a clipboard PNG, drop a PNG and PDF, then use Add file to choose two files. Expected sequential authorized uploads, image/file distinction, correct order, accurate metadata and survival after reload. Drop into code/source-only content; expected insertion after that enclosing block. Type/edit the upload anchor during a slow upload, then try navigation; expected no stale insertion or lost work. Verify image replacement/caption/width/alignment with the M4 checklist.
8. **Finder:** Search `alpha beta gamma`; expected one match across bold syntax. Search `searchable-code`, `frac` and a real image caption; expected source-backed matches and correct jumps. Search `preset` or an internal attachment ID that occurs only in metadata/destinations; expected zero logical matches and highlights. Enter/Shift+Enter wraps; edit while the finder is open and check the settled count. Open the document from a Search Master result containing a `find` term; expected a logical-text jump.
9. **Export:** Make an unsaved local edit and export using Keep Orbium references. Expected current body, title-based filename, no extra H1 and unchanged canonical source spelling. Export with online links; expected only semantic destinations change, including reference definitions. A code block containing the literal `orbium:node/42` stays unchanged. Inspect inline JSON caption/math strings with similar text; expected no replacement. Neither mode contains attachment binaries or constitutes an archive.
10. **Account styles:** Apply a saved theme with paragraph padding/border, bullet-list and quote borders, heading font changes and rich/media/table rules. Expected paragraph/list/quote styles affect containers rather than repeat on each wrapped line; normal and database documents update through the existing settings notification. Compare nested paragraphs and wrapped multi-line blocks against Tiptap in Light/Dark. Clear/disable styles and check default appearance. Record any visual differences before parity acceptance.
11. **Lifecycle and source fidelity:** Edit, undo, save, switch retained tabs and split panes, toggle Source/Preview and reload. Expected selection/history/autosave behavior remains stable, inactive controls cannot mutate content and hidden Mermaid work remains paused. Compare unedited surrounding source bytes before/after every UI action. Test mixed-script typing and an IME composition before accepting the engine.
12. **Performance and remaining rich gates:** Repeat the matched TEST protocol from the M4 report, including active typing with finder open, five hidden tabs, wrappers/custom styles, drag and split behavior. Record medians/spread for mount, activation, typing, scrolling, DOM/memory, layout and saves. No improvement is pre-claimed. Recheck M4's nested reserved syntax, span-table operations and independently editable rich children; those gaps remain outstanding until demonstrated or explicitly resolved.

## Remaining review gates

- Full 65-row parity evidence and the earlier M3 writing acceptance remain pending. M4's nested rich syntax and span-table interaction gaps are carried forward, not accepted or silently deferred.
- Formatting currently targets a single safe inline source range. Multiline/partially crossed syntax and independently editable nested source controls do not yet have the same floating toolbar behavior as Tiptap. Partial default-color/underline removal inside an inherited outer span requires selecting the complete span or source editing; this is an outstanding parity gap.
- Turn-into preserves text/headings and intentionally rejects structural blocks rather than flattening lists/tables/media. Full nested block selection/reorder and conversion parity still needs review.
- Automatic direction is derived for ordinary lines; nested rich-body inheritance and mixed-script caret behavior need browser evidence.
- Reference-style attachment widget controls and full rich clipboard conversion remain outstanding M4/M5 parity gates. Canonical Markdown text is preserved; arbitrary clipboard HTML is not converted into Orbium rich metadata.
- Touch drag, source reveal/selection focus, wrapped-container geometry and saved-theme equivalence need manual review. No complete replacement acceptance is claimed.

## Commits and stop gate

No commit, push, merge, database reset or Tiptap removal was performed. Suggested logical commits:

- `feat(editor): add CodeMirror formatting mentions and block controls`
- `feat(editor): add Markdown transfer and logical document search`
- `feat(documents): validate Markdown imports before insertion`
- `docs(editor): record M5 interaction review checklist`

Remain in M5 during review. Fix reported M5 defects here. M6 requires explicit user approval and the documented parity/performance acceptance gates.
