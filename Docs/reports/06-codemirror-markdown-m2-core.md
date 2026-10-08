# M2 — CodeMirror source editor and baseline preparation

Date: 2026-10-07. Branch: `editor/codemirror-markdown`. Base: `a237139` (M1 persistence report). Status: source editor implemented for manual review; matched browser measurements and acceptance are pending. M3 has not started. No automated tests were written or run.

Follow-up: the user authorized [M3 Live Preview, slash commands and Markdown shortcuts](06-codemirror-markdown-m3-live-preview.md). The source-only UI/deferrals below describe the completed M2 slice; matched performance evidence is still pending.

## Implemented

- Format-2 documents open a lazily loaded CodeMirror 6 body editor. The document page receives a discriminated DTO containing canonical `markdown`, revision, format version, header fields and server-defined byte limits. Historical JSON is excluded from format-2 page responses. Unknown formats and missing format-2 source return HTTP 409.
- Newly created normal and database child documents start with empty Markdown and format version 2. Both creation paths already use `ManageHierarchy`. Existing format-1 documents keep Tiptap and the JSON save endpoint. Existing format-2 M1 scratch documents can now open normally. There is no implicit JSON conversion or dual write.
- One EditorView remains mounted per retained document surface. CodeMirror owns text, selection, undo/redo and editor scroll state; React does not receive the full body on each keystroke. Theme and editing permissions change through compartments. Inactive views lose editing permission and active-document keyboard handlers; visible reactivation requests geometry measurement.
- Source mode includes Markdown highlighting, line numbers, soft wrapping, native list/quote continuation, selection drawing, keyboard history, accessible editor naming, save status and explicit retry. The editor has a bounded internal scroll area (`clamp(240px, 65dvh, 900px)`) for this source-mode evaluation. It does not mount document-wide block previews.
- Autosave stores immutable CodeMirror Text snapshots, applies size-aware debounce (700/1300/2200 ms) and a 10-second scheduling deadline during continuous edits, and serializes only at save time. One request runs at a time, newer edits stay pending, successful saves advance the revision, and failure retains the latest available source. Retry uses the current revision and never automatically overwrites conflicts. IME snapshots stay dirty while composing; scheduled saves wait for composition to finish.
- Mod+S and Save now flush; navigation, app-tab close/split and browser unload guard pending/in-flight saves, including empty-body deletion. Hidden tabs can finish persistence. Failed saves show the server's revision, Markdown or version error. Corrected source schedules another save; Retry save explicitly retries an unchanged failed snapshot.
- Browser preflight checks the server-supplied 2 MiB source / 128 KiB line limits and NUL/malformed UTF-16 before a request. The M1 inspector still validates reserved syntax, ownership, index derivation and complexity. The client does not claim a second authoritative dialect validator.
- The floating finder counts source matches after 150 ms, highlights matches using CodeMirror search, moves next/previous using Enter/Shift+Enter, and supports `?find=` jumps. Hidden views stop count timers. Empty queries do not invoke CodeMirror's separate search panel. This source-mode finder includes literal Markdown syntax, code and metadata; the later logical-text mapping decision remains open.
- Retained Inertia navigation placeholders preserve the format discriminant and limits while omitting the body. Existing full cached page objects continue to own mounted editor state.
- Existing development/profile instrumentation adds `codemirror.module-load`, `codemirror.mount`, `codemirror.activation-frame`, `codemirror.autosave.payload`, `codemirror.autosave.request`, per-document mounted/first-frame marks, and `codemirror.mounted-editors`. The Markdown save endpoint supplies local-environment Server-Timing validation/save durations, matching the existing JSON endpoint; inspect these in Network separately from client request duration. Activation-frame measures from a React visibility effect to the next animation frame; it is not click-to-interaction latency or a complete layout measurement.

## Library decision

The user selected official CodeMirror packages after reviewing the recommendation and limitations:

| Package | Locked version | Role / limitation |
| --- | --- | --- |
| `@codemirror/lang-markdown` | 6.5.2 | Incremental source highlighting and Markdown editing commands. Its GFM-oriented base also recognizes some extra inline syntax; highlighting is not Orbium semantic validation. It does not supply our reserved metadata parser, authorization or rich previews. |
| `@codemirror/search` | 6.7.2 | Literal source cursor/counts, match highlighting and next/previous selection. It does not map server-derived logical text back to source. |
| Existing state/view/commands/language packages | unchanged | Lifecycle, history and presentation. All consumers deduplicate to state 6.7.6 and view 6.43.13. |

A small Orbium-owned adapter follows the existing CSS editor pattern. No React wrapper or additional virtualization layer is added. See the [official Markdown package API](https://github.com/codemirror/lang-markdown#api-reference), [search package source/API](https://github.com/codemirror/search), and locally installed declarations in `node_modules/@codemirror/{lang-markdown,search,view,state}/dist/index.d.ts`. The upstream Markdown repository redirects development to its new hosting location; the GitHub archive alone is not evidence of package abandonment.

## Persistent format and development-data plan

No new migration, reset, existing-body rewrite or archive change. The agent applied M1's existing additive `2026_10_07_000001_add_markdown_to_documents.php` to the local database after confirming it was pending (DONE, 8.50 ms). It adds nullable TEXT only; existing bodies and versions are retained. The old non-null JSON column receives its existing empty placeholder on creation and is never treated as Markdown authority.

Use new scratch documents to review M2. Preserve the existing TEST document and its original Markdown source. Do not replace existing bodies through the convenience Markdown exporter or manually edit format versions to reinterpret JSON. Canonical archives and full existing-data cutover remain later gates.

## Commits

No commits or pushes created in this turn. Suggested logical commit messages:

1. `feat(editor): add retained codemirror markdown source editing`
2. `docs(editor): document M2 manual review and benchmark procedure`

## Actual validation

- `npx vp fmt --check` on changed/new TypeScript and package files: **PASS**.
- `npm run lint`: **PASS**, including repository formatting and lint checks (274 formatted files, 210 linted files).
- `npm run types:check`: **PASS**.
- `./vendor/bin/pint --test`: **PASS** across the repository.
- `php -l` on `ManageHierarchy.php` and `DocumentController.php`: **PASS**.
- `npm run build`: **PASS**. Existing large-chunk / ineffective dynamic-import warnings remain; plugin timing information was also emitted. The new loader lives outside the pages directory, avoiding a new page-discovery warning.
- `git diff --check`: **PASS** after final documentation updates.
- Automated tests: **not written or run**, as instructed. Browser tests/benchmarks: **not run**; the user performs manual verification.
- `npm install` completed and reported 12 vulnerability findings (1 low, 6 high, 5 critical). A subsequent detailed `npm audit --json` attempt failed because the registry could not resolve (`EAI_AGAIN`); package-specific attribution and comparison with the prior lockfile were not established. No unrelated dependency upgrade was attempted.
- The sandboxed `php artisan migrate:status` check failed to connect to PostgreSQL (`SQLSTATE[08006]`). The request to repeat that read-only check with local network access was not executed: automatic approval review failed because its selected model was at capacity. This was a review availability failure, not a determination that the command is unsafe. A later read-only retry succeeded and showed the M1 migration as Pending. The targeted `php artisan migrate --path=database/migrations/2026_10_07_000001_add_markdown_to_documents.php` then succeeded; no other migration/reset/conversion was run.

## Exact manual checklist

Use development scratch documents. Expected results are acceptance criteria, not claims that these checks have passed.

1. **Prerequisite.** Start PostgreSQL using the repository README setup and run `php artisan migrate:status`. If `2026_10_07_000001_add_markdown_to_documents` is pending, run `php artisan migrate` (or use the normal Docker startup which runs migrations). Start/restart the PHP app and use `npm run dev` or the latest built assets. Expected: the M1 migration is marked Ran and document creation succeeds without a missing-column error. No reset is needed.
2. **Creation/DTO.** Create a normal scratch document named `M2 Source Review` and open it. Inspect the Inertia document response in Network. Expected: the editor says Markdown source and Saved; source is empty; format version is 2; `markdown_limits` is `{source_bytes:2097152,line_bytes:131072}`; historical `content` is absent. Repeat by creating a database row/document. Expected: the same source editor opens and its existing database property header still works.
3. **Source fidelity/reload.** Paste the following body, wait for Saved, then reload. Expected: all source characters, H6, indentation, fences, blank separators and metadata remain; no artificial title appears in the body. A successful PUT goes to `/markdown`, sends only Markdown/revision/version, and advances revision by one. Browser paste/CodeMirror normalize line endings to LF. Source-mode HTML remains text and does not execute.

   ```markdown
   ###### Sixth heading

   A **bold**, *italic*, ~~struck~~ paragraph with `code`.

   - [ ] Pending
   - [x] Done
     - Nested item

   > [!NOTE]+ Review title
   > Body

   :::orbium {"kind":"block","dir":"rtl","align":"center"}
   مرحبا Orbium 123
   :::

   :orbium[Colored]{"color":"preset:red","underline":true}

   | Name | Value |
   | :--- | ---: |
   | Alpha | 42 |

   Inline $x_1$.
   ```

   Also paste this separately as literal fenced Markdown:

   ````markdown
   ```mermaid
   graph TD
     A --> B
   ```

   <script>window.orbiumM2Executed = true</script>
   ````

   Expected: `window.orbiumM2Executed` remains undefined; tables/math/diagrams stay editable source without rich previews in M2. Optionally review the broader M1 fixture; replace its real semantic node/attachment IDs with authorized references first, following the M1 checklist. Its example IDs are not guaranteed to exist or belong to this scratch document.
4. **History/caret.** Type two separate short edits with a pause between them. Undo twice with Ctrl/Cmd+Z and redo with the platform shortcut. Select across several lines, replace text, undo, and use Home/End/arrow keys. Expected: source and selection restore naturally and edited snapshots save; list/quote Enter continues markup; ordinary code/plain lines remain editable. Selecting all inside the source editor targets its body.
5. **Retained tabs/scroll.** Add enough lines to scroll, select a phrase near the bottom, wait for Saved, switch to another app tab and return. Expected: source, selection, undo history and internal editor scroll position remain. After returning, one Undo reverses the prior edit. Hidden editors do not respond to Ctrl/Cmd+F or Ctrl/Cmd+S sent in another tab. In a profile-enabled build, mounted-editor count stays stable across warm switches and falls when tabs are closed (development Strict Mode may produce two mount samples).
6. **Theme.** With a selection and history present, change appearance between Light/Dark/System and return. Expected: source highlighting/caret remain legible, selection and history remain, and no body reset/save is caused by changing appearance alone.
7. **Finder.** Paste `needle` on three separate lines, plus one `needle` inside a fenced block. Save. Open Ctrl/Cmd+F, enter `needle`, then Enter/Shift+Enter repeatedly. Expected: four source matches, next/previous wrap and scroll to offscreen matches; closing clears highlight/count. Search literal `**` in formatted source: it can match syntax in M2. Clearing the query and pressing Enter must not open a second CodeMirror finder. Repeat a URL with `?find=needle`; expected: the floating finder opens and selects a source match. Logical text split by Markdown marks is a documented later mapping limitation.
8. **In-flight edits.** Set Network throttling to Slow 3G. Type `first`, press Ctrl/Cmd+S, then type ` latest` while Saving is visible. Expected: requests never overlap; the second uses the revision returned by the first; final status becomes Saved. Reload after the last response: `first latest` remains.
9. **Failure/retry.** Set Network Offline, edit source, and save. Expected: Save failed with an error and Retry save; source/history remain. Return Online and click Retry save. Expected: Saved; reload contains the latest edit. No repeated automatic request loop occurs while an unchanged snapshot remains failed.
10. **Conflict.** Open the same scratch document in a second browser tab, save an edit there, then edit/save the stale first tab. Expected: the stale editor displays the revision conflict, retains local source and blocks close/navigation; Retry does not overwrite the newer revision. Copy any local text you need before reloading the stale tab, since explicit reload discards unsaved local state after browser confirmation.
11. **Dialect and bounds.** Add an unclosed `:::orbium {"kind":"block"}` directive and save. Expected: a server Markdown error appears, source is retained, and revision/index are unchanged. Close it around exactly one paragraph and save: expected success. In a scratch editor, paste a single line of 131,073 ASCII characters: expected a client line-limit error without a PUT. Remove the oversized line and retry: expected Saved. A source over 2,097,152 UTF-8 bytes similarly fails before a PUT. Multibyte text counts bytes, not JS characters.
12. **Empty save and navigation guards.** Under Slow 3G, select all source, delete it, then immediately try closing the app tab. Expected: close is blocked while the empty snapshot saves; after Saved, closing succeeds. Reopen: source is empty. Repeat a dirty edit followed by navigation to another page, browser reload/unload, or split/end-split. Expected: unsaved/in-flight work prompts or blocks according to the existing shell flow; retrying after Saved succeeds. Switching to a hidden dirty tab must not redirect saves into the active document.
13. **IME and bidi.** Use a real OS composition input method (for example Japanese or Chinese) to enter and commit text; also paste/type Arabic mixed with English/digits and select/copy it across line boundaries. Expected: no lost/duplicated composition characters, history/caret work, composed text persists after reload, and changing app tabs does not reset source. Source-mode direction is CodeMirror's default text layout; per-block Auto/LTR/RTL presentation/inheritance remains an M5 gate. While composing, unfinished source stays dirty and close/navigation remains guarded.
14. **Split/header/legacy.** Split two saved Markdown documents, edit/save each, close/end the split and reopen standalone. Expected: saves address the correct node, source persists, and property/header controls remain usable. Update title/cover/icon and reload: expected header persistence without body changes. Open an existing format-1 Tiptap document: expected its previous editor and JSON endpoint continue to work; no conversion or new Markdown body is silently introduced.

## Matched performance baseline procedure (pending user measurements)

Do not use a shortened synthetic document or convenience export as evidence of TEST parity. Obtain the original logical TEST Markdown source (~163k characters / 6,608 lines) used for the historical editor review and retain an unchanged copy for comparisons. Use a **new format-2 scratch** document for CodeMirror. If its source contains internal references, use valid scratch-owned attachments and corresponding semantic IDs; do not reuse another document's attachment IDs or globally replace numeric text. If the original source/asset mapping is unavailable, mark the matched baseline pending. An unsaveable pasted body is not an accepted persistence benchmark.

Record browser/version, OS/hardware, app commit/build, viewport, device scale, appearance/account CSS, reduced motion, background choice, throttling, source character/line/byte counts, asset/diagram count, warm-cache state and DevTools settings. Profile both editors on the same machine/build conditions and original logical content, plus the same small control source. Source-mode measurements exclude rich widget costs; this difference must remain visible in every comparison.

1. For a production profile build, run `VITE_ORBIUM_PROFILE=true npm run build`, stop the Vite development server, and reload the app using built assets. Do not commit this environment setting. Development timings include React Strict Mode and compiler tooling; report them separately.
2. Cold-open the saved TEST scratch document with Chrome Performance recording. Record from navigation click through the first usable caret/typing frame, module-load and editor-mount duration, layout/style/paint, long tasks and total DOM. Repeat at least five times, explicitly controlling whether HTTP/code/asset caches are cold. Record first-preview as **not implemented / M4 pending**, not zero milliseconds.
3. Warm-switch from the same small tab back to TEST at least five times and record click-to-usable interaction, UpdateLayoutTree, Layout and PrePaint. Capture traces and median/min/max. `codemirror.activation-frame` is supplemental only; it does not replace the click trace or historical full interaction protocol.
4. Scroll TEST continuously for ten seconds, move the caret to distant lines, type for ten seconds, select across offscreen ranges, undo, and jump to a late finder match. Record frame/input latency, style/layout, long tasks and editor DOM counts at top/middle/bottom. Count rendered lines/descendants with the console snippet below. Expected architectural evidence: rendered DOM remains related to viewport content rather than all 6,608 lines; actual counts and latency remain to be measured.
5. Retain five Markdown tabs, switch to a small control, close finders, wait for all autosaves, then record ten seconds idle. Expected: no recurring hidden search-count jobs or autosave requests once saved. Record CPU/main-thread activity, mounted views, heap/DOM and GC conditions. Initial bounded parsing/measurement is not the same as recurring idle activity.
6. Record a large save with the latest-source/in-flight scenario, then repeat the interaction sequence in split panes. Record autosave payload/server/network timings separately from input/layout. Do not call the source-mode result an M4/M6 rich parity win.
7. Capture the same small-document controls. Use the measured medians/spread to agree numeric improvement/regression limits **before tuning or declaring GO**. The historical 198.2 ms interaction / 66.45 ms UpdateLayoutTree / 47.83 ms Layout reference is context; unmatched old hardware/build/trace conditions are not a current control.

Read-only console capture in a profile-enabled page (in a split, choose the corresponding iframe console):

```javascript
window.__ORBIUM_PERF__?.summary();
window.__ORBIUM_PERF__?.snapshot();
Array.from(document.querySelectorAll('[data-orbium-markdown-editor]')).map(host => ({
    nodeId: host.dataset.orbiumMarkdownEditor,
    visible: host.getClientRects().length > 0,
    renderedLines: host.querySelectorAll('.cm-line').length,
    descendants: host.querySelectorAll('*').length,
}));
document.querySelectorAll('*').length;
```

| Evidence | M2 result |
| --- | --- |
| Matched TEST/source identity | Pending user setup/confirmation |
| Cold mount / first interactive frame | Not measured |
| Warm full interaction / layout/style/paint | Not measured |
| Scroll, typing, selection, IME correctness | Pending manual checks |
| Viewport DOM / five-tab idle / retained memory | Not measured |
| Large-save overhead / split behavior | Pending manual checks |
| Numeric acceptance thresholds | Pending matched baselines and agreement |
| Full rich-preview parity/performance | M4/M6 pending |

## Known limitations and stop gate

M2 is raw Markdown source mode. Live Preview, rich table/media/math/Mermaid widgets, slash/@ pickers, block controls, per-block direction presentation, saved `.orbium-*` style parity, Markdown file import/export UI and archive integration are not implemented here. The source can preserve these valid constructs and the server inspects them, but editing source is not evidence of interaction parity. Source highlighting is not a complete Orbium AST/source-position map. Search Master jumps into visible source may miss a logical term separated by marks/metadata.

Existing JSON writing remains supported during the evaluation; this is a temporary boundary, not acceptance of indefinite dual engines. No Tiptap dependencies are removed, no lossless existing-body converter is claimed, and no performance improvement is asserted without matched user evidence.

Stop at M2 manual review and measurements. Fix M2 findings here; begin M3 only after explicit user approval. Final CodeMirror replacement acceptance remains M6, and product portability remains separately gated.
