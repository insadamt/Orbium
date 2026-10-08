# M4 — CodeMirror rich blocks

Date: 2026-10-08. Status: **rich-block implementation ready for manual review; M4 acceptance, full Tiptap parity and performance gates pending.**

The user's “okey next” approved M4 after rejecting the earlier writing/design experience. The user then explicitly selected reuse of the installed Mermaid, DOMPurify, KaTeX and Lowlight libraries. This authorizes M4, not M5 or removal of Tiptap. M3 writing fixes also remain subject to manual review.

## Implemented

- Direct CodeMirror StateField replacements for block layout, with a viewport-driven refresh manager. Widgets retain focused controls during source edits and release render subscriptions, idle jobs, fetches and size observers when removed. Source mode exposes the canonical document. Finder selections reveal the matching source range.
- Lezer Markdown extensions for Orbium metadata directives, inline underline/color, dollar math and JSON math escape forms. A string-aware JSON scanner rejects duplicate/unknown keys, invalid values and invalid Unicode. Extension parsing is bounded at depth 32. Incomplete or unsupported constructs retain source; existing server validation remains authoritative.
- Mermaid uses the existing document-scoped preview session, strict renderer, DOMPurify sanitization, cache/source membership checks, unique SVG IDs, responsive dimensions and error handling. Edit/Preview uses the existing Tiptap control styling and edits diagram content rather than fence punctuation.
- Block/inline KaTeX rendering with `trust: false`, expansion/size bounds and source-preserving renderer failures. Block editing retains conventional dollar syntax where representable; JSON escape forms remain available. Inline editing uses a source prompt.
- Code language selector, existing language icons, Lowlight colors, copy, optional preview line numbers and horizontal scrolling. Unknown languages remain plain. Additional language-info text survives code-content edits. `kind=code` preserves literal Mermaid code instead of turning it into a diagram.
- GFM and Orbium rich tables: formatted cell previews, native cell Markdown editors, Tab/Shift+Tab between cells, row/column insertion/removal for grids without spans, header/alignment/width controls, horizontal merge/split, and lossless rich serialization when GFM cannot represent the result. Existing row/column spans and widths render and survive cell edits.
- Authorized image/file metadata endpoint supplies filename, MIME, size and purpose without storage paths. Images require supported MIME and image purpose before display. Image controls include pointer/keyboard resizing, width, alignment, caption, replace, download and remove. Replacement retains presentation metadata and uses the existing mapped upload anchor to reject stale insertions. File blocks show an icon, author label, original name, MIME and byte-size display.
- Callout previews, optional authored folding/title, explicit direction/alignment, ordered-list display type and authored empty blocks. Nested rich content inside supported directive/table/callout bodies uses DOM construction; raw HTML and unsupported URLs stay literal. Shared document typography and stable style selectors are used.
- Widget edits enter CodeMirror history and autosave. Ctrl/Cmd+Z and redo in widget controls use document history; Ctrl/Cmd+S continues to flush the active document. Hidden-tab Mermaid work pauses through the existing session, and nearby rich-range refreshes skip hidden documents.

No M4 database migration, persisted format change, automatic conversion of legacy documents or attachment purge. Format-1 documents still use Tiptap. M1–M3 changes already in the working tree are preserved. No commit, push or merge was created.

## Libraries and limits

The official [CodeMirror decoration example](https://codemirror.net/examples/decoration/) requires direct decorations for widgets that affect vertical layout. CodeMirror owns viewport DOM mounting; Orbium owns Markdown source changes, widget controls and structural validation. `@lezer/markdown` 1.8.0 is now a direct dependency using its existing locked installation, without changing its version.

Installed renderers are Mermaid 12.0.0, DOMPurify 3.4.16, KaTeX 0.18.9 and Lowlight 3.3.0. Mermaid's [strict security setting](https://mermaid.js.org/config/schema-docs/config-properties-securitylevel.html) and SVG sanitization are reused. KaTeX's [security guidance](https://katex.org/docs/security) and [options](https://katex.org/docs/options) support disabling trusted commands and bounding expansion. These libraries do not supply table operations, attachment ownership, rich selection or Tiptap interaction semantics; Orbium implements those controls.

Rendering a single large code block/equation/diagram or table still has synchronous work inside its scheduled render. Directives parse their body when that enclosing construct is parsed; this is not a claim that all nested parsing is incremental. Visited rich descriptors remain in the editor state while CodeMirror virtualizes widget DOM. Static nested-body previews have a 128 Ki-character/depth-32 fallback to literal source. These bounds and reuse do not establish a performance improvement without matched measurements.

## Remaining acceptance gaps

- Rich block widgets currently target top-level blocks and rich bodies embedded in supported directives/tables/callouts. Reserved directives/math blocks inside ordinary list/quote prefixes, reference-style attachment widgets and arbitrary inline media retain source rather than receiving the same rich controls. This is an outstanding **M4 gate**, not accepted full syntax parity.
- Nested rich content in a cell/callout/metadata body is previewed and edited through that cell or enclosing source editor. This differs from independently selectable Tiptap child node views. Native cell/source editing does not provide a floating formatting toolbar or rich clipboard selection.
- Row insertion/removal and column insertion/removal are disabled when spans exist; horizontal unit-row-span merge/split is supported. Existing vertical spans are preserved and editable through source. Complete table interaction parity is pending.
- Image controls reuse semantics and styles but have not been visually compared in the browser. Explicit RTL/alignment metadata is presented; complete automatic-direction inheritance and block-menu interaction remain in the migration parity gate.
- Finder still uses the existing raw-source policy. Toolbar, mentions picker, block gutters/reorder, paste/drop media, import/export and archive integration remain M5 scope. Tiptap removal remains M6 scope.
- No browser verification, screenshots, IME validation or matched TEST measurements were performed. Build/type/lint checks cannot establish caret behavior, stable scroll height, selection fidelity or that the editor feels the same as Tiptap. Replacement acceptance remains **NO-GO / pending**.

## Actual validation

- Formatting: `vp fmt` passed for changed Markdown editor/CSS sources; final `npm run lint` format gate passed all 306 checked files.
- `npm run lint`: PASS, no warnings/errors in 241 linted files.
- `npm run types:check`: PASS (`tsc --noEmit`).
- `./vendor/bin/pint --test`: PASS across the repository; targeted PHP formatting also passed.
- `php -l app/Http/Controllers/AttachmentController.php` and `php -l routes/web.php`: PASS.
- `php artisan route:list --path=attachments --except-vendor`: PASS; upload, download and metadata routes registered.
- `npm ls @lezer/markdown @codemirror/lang-markdown @codemirror/search mermaid dompurify katex lowlight --depth=0`: PASS, installed versions consistent.
- `npm run build`: PASS. Build reports large-chunk warnings and ineffective dynamic imports for document image/media/header/loader/opening preview and database property modules. These warnings are not a clean bundle/performance acceptance result. Markdown editor chunk is approximately 250 kB before gzip; Mermaid and existing code icons also have shared chunks.
- `git diff --check`: PASS.
- All new source files remain under 500 lines.

Automated tests were neither added nor run, following root `AGENTS.md` and the user's instruction. Manual checks and matched performance measurements below remain unperformed.

## Exact manual checklist

Use a newly created format-2 Markdown document. Use a separate existing format-1 Tiptap document as the design/interaction reference. Paste [the M4 fixture](../examples/orbium-markdown-m4.md) through **Markdown source**, then return to **Live Preview**. The fixture has no attachment IDs; add real attachments through slash commands.

1. **Writing and slash commands:** Type `# `, `## `, `### `, `- `, `1. `, `> `, bold/italic/strike/backticks and a checklist. Press Enter at a heading's end and in ordinary paragraphs. Filter `/mermaid`, `/code`, `/table`, `/math` using arrows and Enter. Expected: readable block typography and writing behavior, commands insert the chosen rich block, and ordinary typing remains available before/after it. Compare against Tiptap; report any caret jump, lost text or design mismatch.
2. **Mermaid:** In the fixture's Mermaid block, click Edit, change `C[Read]` to `C[Review]`, then Preview. Enter `flowchart TD` on the first line and `A -->` on the next as an invalid diagram and preview again; undo it. Expected: content-only source editor, changed diagram, safe error with retained source, undo restores it. Save/reload; expected source and diagram survive. The literal `kind=code` Mermaid block must remain code.
3. **Code:** Edit the TypeScript body, including a literal triple-backtick run. Switch language to PHP and Python, copy, enable line numbers, and try a long line. Expected: safe longer fence, colors/icons, accurate copied content, preview numbers and horizontal scrolling. Edit the unknown-language body; expected language token and `preserve-this-info` stay in Source and after reload.
4. **Math:** Edit the block equation to `\frac{x}{y}`, preview, then try `\notARealCommand`. Click the inline equation and edit its prompt. Expected: valid math renders; invalid math shows an error without losing LaTeX. In block math, enter a literal line containing `$$`; expected the saved source uses the JSON escape form. Check save/reload and undo/redo.
5. **Ordinary table:** Click the empty cell, enter `**Alpha**`, Tab to the next cell, Shift+Tab back, then Escape. Add a row and column; delete a nonheader row and column. Enter two paragraphs in a cell. Expected: no missing empty cells, formatted previews, keyboard cell navigation, deliberate structure changes, and conversion to rich directives for multiple paragraphs with content preserved after reload.
6. **Rich table:** In the spanning fixture, edit a cell and change its alignment/header. Split the horizontal span, add rows/columns, set a width, then merge right again. Expected: content/spans/widths survive source, save and reload; merges retain both bodies. On the vertical-span table, expected structure controls are disabled and cell edits preserve the vertical span. Use Source for vertical-span structure changes; malformed grids must fail save instead of being padded.
7. **Images/files:** Insert a PNG/JPEG/GIF/WebP with `/image` and a file with `/file`. Drag a resize handle, use arrow keys on it, enter a width, change alignment and caption, replace, download, remove, then undo removal. Expected: accurate previews/metadata, clamped display width without rewriting stored width on viewport resize, retained caption/alignment across replacement, authorized downloads and undo restoration. Save/reload after each operation. Removing a reference must not purge the binary.
8. **Ownership:** While signed in, open the real attachment's `/metadata` URL. Substitute another document or another user's workspace in the path. Expected: owned metadata contains only ID/name/MIME/size/purpose; unauthorized paths return 404 and never expose filenames/storage paths. Put an attachment from a different document into Source; expected preview unavailable and save rejected.
9. **Presentation:** Compare fixture headings, code, Mermaid, callouts and media with Tiptap in Light/Dark and with a saved account theme. Open the folded callout; inspect explicit Arabic RTL/right alignment and alphabetical list numbering. Expected: source metadata and theme-aware purple survive; folded content is readable; list starts at its authored value. Flag visual differences; parity is not pre-approved.
10. **Safety/source fidelity:** Inspect the HTML example. Temporarily copy the unsafe-link/external-image examples out of their literal code fence, then remove them after checking the expected save rejection. Expected: literal text, no script execution or remote image fetch. In Source, add a duplicate metadata key or remove a reserved closer; expected recoverable source and a failed save with diagnostics. Restore it. Change an unrelated paragraph and compare the surrounding Source; expected unedited source spelling remains unchanged.
11. **Lifecycle/history:** Edit Mermaid/code/math/table/caption, undo/redo with focus inside each control, press Ctrl/Cmd+S and reload. Switch between retained tabs and split panes, switch Source/Preview and scroll away/back while previews prepare. Expected: latest edits survive, no stale render overwrites or duplicate listeners, hidden editors do not keep rendering, and controls remain usable after remount. Report any lost control focus or unexpected undo boundary.
12. **Long-document gate:** Use the same logical TEST content/assets and matched browser, viewport, theme and cache state as Tiptap. Record cold mount, first preview, warm activation, scrolling/typing latency, DOM/memory, layout/long tasks, five hidden tabs, save cost and split behavior over repeated runs. Expected: no document-size-dependent rendering burst for unrelated distant widgets and no scroll jumps from already prepared diagrams. Record medians/spread/traces before claiming any improvement.
13. **Unsupported nested gate:** Add a reserved directive or block math inside an ordinary quote/list and a reference-style attachment. Expected current limitation: source remains available; canonical save must retain semantics. This gate stays open until rich presentation/control parity is demonstrated. A source fallback is not permission to flatten or remove content.

## Suggested commits

- `feat(editor): add CodeMirror rich block previews and editing`
- `feat(attachments): expose authorized document attachment metadata`
- `docs(editor): document M4 review gates and manual checks`

## Stop gate

Remain in M4 during manual review and fix M4 defects here. Do not start M5 or remove Tiptap without explicit approval. No matched performance or full feature-parity acceptance is claimed.
