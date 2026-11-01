Summary: Records the V3 stage-1 source audit, actual baseline checks, unverified runtime behavior and exact manual regression/performance capture steps. It depends on `../phases/orbium-v3-document-editor.md`, `../plans/orbium-v3-integration-map.md` and the unchanged editor at the baseline revision.

# V3 stage 1 — baseline and regression map

## Phase and authorization

On 2026-10-31 the user requested “implement it all” for the supplied V3 editor specification. Stage 1 follows that specification's section 12 and the root `AGENTS.md` phase discipline: complete one reviewable stage and obtain explicit approval before advancing. The user will perform manual testing; no automated tests or browser automation are allowed for this task.

Baseline: branch `main`, commit `02c64ec6f995800bafbae049df50694377a55250`, initially clean working tree. This report describes an audit/documentation deliverable, not an implemented V3 runtime. Source audit and static baseline checks are ready for review; browser baseline capture and regression reproduction remain pending the manual steps below.

## Delivered

- Preserved the complete supplied specification in `../phases/orbium-v3-document-editor.md`, with a repository execution note explaining manual-testing precedence and the active stage. Four trailing-space Markdown line breaks were replaced with equivalent backslash line breaks for the whitespace gate.
- Added `../plans/orbium-v3-integration-map.md` with owner/history, parser-coupled edits, source/live, embedded inputs, columns, server derivation, format guards and all discovered transfer/hosted readers.
- Established the untouched revision and actual formatting/type/lint/build baseline before implementation.
- Prepared exact baseline/regression steps and a repeatable manual performance protocol. These steps have not been executed by the agent and are not passing runtime results.
- Updated `../START_HERE.md` and `../phases/README.md` to make the active V3 stage and review gate discoverable.

## Key source findings

1. `markdownBlockAt` infers block boundaries from Lezer ancestry. Its range DTO has no persistent ID or explicit type; merely inserting hidden header text would leave parser-coupled edits/rendering unsafe.
2. Existing Enter inserts paragraph separators and Shift+Enter inserts a hard break in paragraphs. The approved V3 rules require changes in text editing and separate delegation from nested code/textarea editors.
3. Two-stage Ctrl/Cmd+A exists. It should be adapted to explicit body ranges, while consecutive block selection and structured paste into nonempty blocks need dedicated integration.
4. Column layouts currently store widths and body strings, without persistent layout/column/child IDs. A child edit invokes a whole-layout serialization/replacement in the owner. The V3 path needs precise child edits while keeping current nested UI/history.
5. Frontend/backend save contracts are format 2. Normal and Board-hosted rendering contain additional hard-coded format-2 checks; changing only `MarkdownContract` would leave readers inconsistent.
6. Package manifest version is already 3 while its native document entries use envelope version 2. Package validation derives the expected native version with `min(packageVersion, 2)`. A V3 native envelope must be versioned independently without silently changing released package definitions.
7. Native export currently reserializes an AST. It must gain explicit identity/empty-block preservation; clean Markdown/Office/search/statistics must exclude real structural headers while retaining literal examples inside code.
8. List conversion currently strips task markers and indentation. V3's lossless boundary conversion must preserve checkbox meaning and all item content instead of reusing that behavior unchanged.
9. The maintained downloadable document-creation skill still teaches format 2. It must be updated with supported V3 output during feature integration so the application does not distribute stale authoring guidance.

These are source findings. The supplied bullet/checklist and divider corruption cases are user-reported motivating bugs; this stage did not reproduce them in a browser or claim they are fixed.

## Commits and persistent data

No commits created. All changes are documentation and remain available for review. No application source, dependencies, schema, document data, stored format, uploads or user preferences were changed. Build tooling regenerated local build artifacts and route types through its existing script; the final tracked diff contains documentation only.

Suggested commit message:

```text
docs(editor): audit V3 block structure and integration boundaries
```

## Actual validation

| Command | Actual result |
| --- | --- |
| `./vendor/bin/pint --test` | PASS, exit 0; PHP formatting check only, not an automated behavior test. |
| `npm run types:check` | PASS, exit 0. |
| `npm run lint` | FAIL, exit 1; formatter reported 18 existing files listed below. This run did not establish a clean full lint gate. |
| `npm run build` | PASS, exit 0; 5709 modules transformed, completed in 17.77 s. Chunk-size, ineffective dynamic import and plugin timing warnings remain. This duration is a build observation, not an editor runtime benchmark. |
| `git diff --check` | PASS after documentation changes. New Markdown files were separately checked for whitespace because they are untracked. |
| Specification preservation / documentation review | PASS: complete original content retained after the local preamble, with only the four Markdown line-break spellings normalized; new documentation paths and audited source paths checked. |

`Docs/**` is explicitly ignored by the repository formatter and linter in `vite.config.ts`. Documentation was reviewed for content, links, conflict precedence and whitespace; no formatter pass over these Markdown files is claimed.

Existing full-lint formatting findings:

```text
resources/css/explorer-views.css
resources/css/workspace-navigation.css
resources/js/components/boards/board-keyboard.ts
resources/js/components/boards/board-properties-panel.tsx
resources/js/components/boards/board-shape-block.tsx
resources/js/components/boards/board-shape-data.ts
resources/js/components/boards/board-shapes.css
resources/js/components/boards/board-toolbar.tsx
resources/js/components/boards/use-board-tools.ts
resources/js/components/editor/markdown/columns/columns-widget.ts
resources/js/components/editor/markdown/interactions/markdown-block-drag.ts
resources/js/components/editor/markdown/interactions/markdown-block-gutter.ts
resources/js/components/editor/markdown/preview/markdown-writing-commands.ts
resources/js/components/navigation/workspace-navigation-preferences.ts
resources/js/components/navigation/workspace-navigation-settings.tsx
resources/js/components/navigation/workspace-sidebar-tree.tsx
resources/js/components/navigation/workspace-sidebar.tsx
resources/js/layouts/app-layout.tsx
```

Those files were clean in the working tree before the checks and remain unmodified by this task. No unrelated formatting cleanup was performed.

`php artisan test`, `npm run test`, Playwright and all other automated behavior tests were neither written nor run, following the user's overriding instructions. No browser interaction was performed.

## Manual preparation

Use disposable documents in a workspace you control. Keep real content separate. These are baseline observations on the current format-2 editor; V3 identities and keyboard changes are not available yet. Record current behavior even when it differs from the future V3 expectation.

1. Run `git diff --stat`, `git status --short` and `git diff --check`.
   - Expected: only the documentation listed in Delivered is changed/new; no application source or migrations; no whitespace errors. New files appear in status even before staging.
2. Read the preserved specification, execution note and integration map.
   - Expected: one owner document, explicit block identity, preserved UI/motion, maximum three columns, no arbitrary nesting, no historical migration and manual-testing precedence are all recorded. Every later stage has a review gate.
3. Record browser/version, OS, hardware, development/production build, viewport, theme, reduced-motion setting and current revision. Open a new normal Document and a database Document.
   - Expected: the current editor opens unchanged. No `++block` headers should have been inserted by this task. Save a native baseline export for later comparison.
4. Prepare a small document with a paragraph, heading, bullet list, checklist, divider and quote. Add a callout, code block, Mermaid, math, table, Mind Map, inline icon, mention and uploaded image/file through the existing controls. Add a two-column layout with heading/text in one column and checklist/code in the other.
   - Expected: the existing controls remain available; source/save/export behavior is unchanged by the audit. Record any current defects separately instead of treating this expectation as already verified.

## Manual regression checklist

For every case, record current source before/after, visible result, focus/selection, undo/redo result and save/reload result. A failed baseline case is evidence to retain, not an instruction to discard content. The V3 column below describes later acceptance, not present implementation.

| Case | Exact baseline action | Future V3 acceptance / compatibility expectation |
| --- | --- | --- |
| Bullet/checklist corruption | Create a two-item bullet list with `BULLET-ALPHA` and `BULLET-BETA`. Exit it; use slash insertion to add a checklist immediately after it, type `TASK-GAMMA`, toggle it, then edit the bullets. Repeat with checklist before bullets. Undo/redo, save and reload. | Lists remain independent explicitly typed blocks; no unrelated item changes/disappears. Record current reproduction and source spelling. |
| Divider ambiguity | Put `PARAGRAPH-DELTA` immediately before a slash-created divider. Edit its last line, change divider appearance, move the divider, undo/redo, save and reload. | Paragraph remains a paragraph and divider remains a divider; preceding text never becomes a setext heading. |
| Presentation fidelity | Apply color/underline to a phrase and center/RTL to a compatible block, including Arabic mixed with Latin. Move it, switch Source/Preview twice, save and reload. | Same content, presentation and inline metadata; V3 keeps its block ID through all actions. |
| Enter | In a paragraph, heading, quote and callout, press Enter at the middle/end; then press Enter on an empty final line, including a slow pause between presses. Repeat on the final list item. | Enter makes an internal line/item; an empty final line/item exits to a new paragraph. No time-window rule or missing suffix text. Record existing behavior without expecting the V3 change yet. |
| Shift+Enter | In paragraph and heading text, place caret at start/middle/end and press Shift+Enter, undoing between cases. Repeat in code, Mermaid/math source and a column child. | Original whole block stays unchanged; new paragraph after it, focused in the same column when applicable; one undo action. This differs from current paragraph hard-break behavior. |
| Boundary delete | At start of a heading, quote and checklist containing nested and later items, press Backspace once, undo/redo, then press again. Try Delete at the prior paragraph's end and empty paragraph removal. | Conversion retains ID/content/checkbox meaning; later merge is separate; opaque rich content is never flattened. |
| Embedded source | Enter repeated blank lines and paste multiline code into Code, Mermaid and math source controls. Include `++block {"id":"literal","type":"paragraph"}++` inside a code fence. | Source stays literal; Enter never exits an embedded editor. Later V3 parsing must ignore literal header-like lines. |
| Two-stage selection | Put caret inside a paragraph, press Ctrl/Cmd+A twice, repeat inside a code input and a column. Select text across an inline icon/mention using pointer drags. | First selects focused block content, second owner content; hidden headers excluded in Live Preview; existing inline atomicity retained. |
| Consecutive blocks | Click a handle, Shift+Click a later handle, then copy/cut/delete and undo. Repeat dragging the selected range; cancel once with Escape. Record which operations the current editor supports. | Consecutive block range operations preserve order/styles; cancelled drag changes nothing. V3 adds any currently missing range behavior. |
| External paste | In `prefix suffix`, select the space and paste three external paragraphs. Repeat with bullet/numbered/checklists and inside a column/code editor. Undo once. | Separate paragraph blocks preserve prefix/suffix; lists retain structure/check states; code remains literal; one undo action. |
| Internal copy | Copy a styled checklist plus rich block; paste below and inside a column. Save/reload and undo/redo. | Content and metadata survive; copied V3 blocks/descendants get fresh IDs while media/page IDs retain meaning. |
| Drag/motion | Move list/image/code by grip, cancel once, then drag near the document edge while scrolling. Repeat the existing split transfer with two disposable documents. | Same preview, insertion line, dimming, edge scrolling, placement and cancel cleanup; moved IDs stable and linked undo intact. |
| Column identity/resize | Create two/three columns, resize by pointer and keyboard, cancel a resize with Escape/blur, narrow/widen the pane and save/reload. | Maximum three, minimum width 15%, total 10000; saved proportions unchanged by stacking; V3 layout/column/child IDs remain stable. |
| Column moves/dissolution | Move a child between columns, outside and back. Empty a column by moving its final block, then undo/redo. Repeat with three columns. | Cleanup/rebalance/dissolution and promotion preserve child IDs/content in one owner action; no stale writes or sibling changes. |
| Rich controls | Edit table cells/reorder rows and columns, change code language, open Mermaid/math previews, resize image/caption, edit map topics. Repeat one action inside a column. | Existing controls/rendering, animation and references retained; no extra ordinary block editors or opaque data loss. |
| Search/outline | Find distinctive text from each column and image caption, navigate H1/H2 outline entries, save and search globally. Open statistics. | User content found/counted; no real headers/IDs in snippets, outline labels or ordinary block statistics. |
| File transfers | Export native `.orbie`, clean `.md`, package with an included asset/related document, and Word/PDF if configured. Import native/package into a disposable destination. | Native V3 retains structure/IDs/metadata; readable formats hide real headers and flatten columns; packages remap relationships and retain assets. Record converter availability/current baseline results. |
| Hosted/read-only | Open the same document through a Board card; edit then preview, switch tabs/splits and try editing through an existing read-only context. | Original Document saves/history; previews/permissions and mounted lifecycle remain intact; no native Board format change. |
| IME/save/conflict | Compose mixed-script text in ordinary and column inputs; keep typing through autosave. In two independently loaded views edit/save the same disposable Document to exercise conflict handling. | No premature composition save, stale overwrite or lost latest input; existing conflict/dirty-navigation messages preserved. |
| Visual/reduced motion | Record a brief normal-motion handle/menu/toolbar/table/drag session in light/dark themes. Enable reduced motion, repeat, then return to the initial setting. | Existing visuals, focus and menus unchanged; reduced-motion path works, no leaked ghosts/handlers, jump or duplicate editors. |

Malformed/duplicate V3 headers, explicit empty-block persistence and header deletion protection must be checked after stage 2/runtime integration. Do not import malformed V3 samples into the baseline format-2 document and mistake ordinary raw text handling for V3 validation.

## Manual performance baseline

Use the same small control and existing representative large document, identical logical content/assets, viewport, browser, build/profiling mode, theme and cache conditions before/after. Record raw UTF-8 bytes, line count, rich-block counts and saved source/export checksum. V3 adds header bytes, so keep logical content identical and record both source sizes. Historical Tiptap timings in earlier reports are not current CodeMirror measurements.

1. In a development/profiling build, open browser developer tools and evaluate `window.__ORBIUM_PERF__?.summary()`.
   - Expected: available profiling builds return existing duration summaries. If undefined, record instrumentation unavailable; do not change production flags or claim zero work.
2. For each document, perform five cold opening runs with the same cache policy. Use the browser Performance panel to record opening to the first usable caret/rich preview; save traces outside tracked source. Capture a screenshot of the settled layout.
   - Expected: five recorded observations per scenario, including browser/build/cache metadata. Separate owner mount/first frame from rich preview readiness.
3. Call `window.__ORBIUM_PERF__?.reset()` to clear old samples before each warm interaction run. Switch away/back five times while recording traces. Inspect `codemirror.activation-frame` and `codemirror.mounted-editors` in `window.__ORBIUM_PERF__?.snapshot()`.
   - Expected: distinct matched warm observations; no accumulation of duplicate owner editors. The diagnostic's bounded 500-sample buffer is not a complete performance trace.
4. Record five runs of typing for 15 seconds in a paragraph, selecting text, pasting the same large text, moving a block, Source/Preview switching and editing a column child. Include one down/up continuous scroll pass and one narrow split-pane pass in each run.
   - Expected: each action has trace evidence for latency, long tasks, style/layout/paint and visible scroll/focus behavior. Recreate the same initial content after destructive actions by undo or use another disposable copy.
5. With five retained tabs, leave the same set idle for 30 seconds and record performance/memory/DOM counts using the browser tools. Repeat the same setup after V3, including hidden tabs and media state.
   - Expected: comparable observations of inactive work and retained editors. Do not compare different cache/media/tab counts or report a thermal change from static checks.
6. Save a table per action containing all five raw values, median, minimum/maximum, trace location and observed defects. Where browser tooling exposes input latency, retained memory or long tasks, include those with the same collection settings. Record unsupported metrics as unavailable.
   - Expected: an actual reproducible current-editor baseline. V3 performance remains unverified until matched follow-up runs; pass/fail requires review of variance and any material regression.

No performance values have been filled in because no runtime measurement was performed. Static analysis/build success cannot establish input latency, visual parity, corruption fixes or content round-trip correctness.

## Known limits and review gate

- This stage supplies the source inventory/static baseline; manual runtime baseline, visual recordings and corruption reproductions are pending.
- The editor remains format 2 with its existing keyboard behavior and defects. V3 syntax, persistent identities and transactions are not implemented yet.
- Existing lint formatting failures remain. Application formatting/type/build success does not substitute for manual acceptance.
- No account restore product was found or implemented; existing document package/Office/hosted integrations are mapped for V3 work.

Review this stage and provide manual observations. Fix any audit gaps within stage 1. Explicit approval is required before stage 2 (V3 syntax, validation and structural index), as required by root `AGENTS.md` and specification section 12. No later stage was started.
