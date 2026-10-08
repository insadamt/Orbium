# M5 — Mouse precision investigation

Date: 2026-10-08. Status: **Investigation complete; a rich-widget layout defect is identified and both reported symptoms are reproduced. No fix applied.**

The user subsequently authorized the repair. See the [mouse precision fix report](06-codemirror-mouse-precision-fix.md) for implementation and the focused before/after browser evidence. The observations below remain the pre-repair baseline.

## Finding

The Markdown Live Preview's visible vertical layout disagrees with CodeMirror's measured block layout. Rich widgets have external vertical margins. CodeMirror measures their bounding-box heights, which exclude those margins, and uses those measurements to map mouse Y coordinates to document positions. The unmeasured gaps accumulate through the document. A pointer on visible text can therefore resolve to a later block or the document end.

This is a high-confidence explanation of the observed caret and six-dot handle failures. A controlled comparison with corrected spacing remains necessary before declaring the repair verified. No temporary style override or implementation change was made during this investigation.

## Browser evidence

Inspected the user's already-open Orbium Markdown document in connected Chrome. No text, account settings or persisted document data was edited. Browser actions were limited to inspection, hover, selection clicks and scrolling. The original scroll position was restored after comparison.

At the inspected viewport:

| Observation | Actual result |
|---|---|
| Hover the inline-equation paragraph at `(720, 240)` | Its visible line spans Y=228.06–256.91, but the gutter appears on the following display-math block at Y=285.27. |
| Click the H6 heading at `(600, 690)` | Heading spans Y=668.22–701.92; the final paragraph becomes the active line and the settled caret appears at Y=747.13. |
| Hover and click `First movable paragraph.` before the first rich widget | Correct paragraph becomes active; gutter Y=573.59 and settled caret Y=577.59 agree with that paragraph's bounds. |
| Inspect ten editor ancestors | All have `transform: none`, CSS `zoom: 1`, `contain: none` and `content-visibility: visible`. |

Measured rich-widget root margins:

| Widget | Top margin | Bottom margin | Total |
|---|---:|---:|---:|
| Callout | 16 px | 16 px | 32 px |
| Code | 20 px | 20 px | 40 px |
| Mermaid | 16 px | 16 px | 32 px |
| Display math | 16 px | 16 px | 32 px |
| Table | 16 px | 32 px | 48 px |
| Total | | | 184 px |

The total describes this document's measured margins, not a universal correction offset. Margin collapsing, different content and account styles can change the resulting displacement. Hardcoding a mouse offset would be incorrect.

## Source trace

1. [rich-widget.ts](../../resources/js/components/editor/markdown/rich/rich-widget.ts) assigns `my-5` to code/images and `my-4` to files, tables, callouts, diagrams and display math at lines 17–26. These classes sit on the actual CodeMirror widget root.
2. [rich-blocks.ts](../../resources/js/components/editor/markdown/rich/rich-blocks.ts) registers these roots through `Decoration.replace({ block: true, widget: ... })` for non-inline widgets, around line 242.
3. [editor-document.css](../../resources/css/editor-document.css) additionally sets `margin-bottom: 2rem` on the table widget root at line 337. This accounts for its measured 32 px bottom gap.
4. Installed `@codemirror/view/dist/index.js`, `measureVisibleLineHeights`, around line 3318, reads each block's `getBoundingClientRect().height`. It handles internal wrapper spacing, but ordinary root-to-root external margins are absent from those heights.
5. The same package's `posAtCoords`, around line 3818, selects a block using the height map before scanning its inline text. If the map is shorter than the visual layout, it selects a later block; coordinates beyond the modeled document height return the document end.
6. [markdown-block-gutter.ts](../../resources/js/components/editor/markdown/interactions/markdown-block-gutter.ts), lines 241–269, uses `view.posAtCoords` for ordinary text, resolves that position to a block, then positions the grip at that block's real DOM bounds. This explains why the grip is neatly aligned to the wrong block. Direct widget hits instead use `data-rich-from`, so they can behave correctly while neighboring prose fails.
7. Native CodeMirror mouse selection also calls its coordinate mapping, so fixing only the gutter would leave caret targeting broken. Drag/drop and dropped-file anchors also use `posAtCoords` and need review after the shared layout fix.

The installed API declarations explicitly document the restriction at `@codemirror/view/dist/index.d.ts`, lines 136–146. The official [CodeMirror reference manual](https://codemirror.net/docs/ref/#view.Decoration%5Ewidget) states: “block-level decorations should not have vertical margins”. The official [decoration source](https://github.com/codemirror/view/blob/main/src/decoration.ts) documents the same contract.

## Related findings

- The existing widget `ResizeObserver` already calls `requestMeasure`. Repeating that call cannot make an external margin part of a bounding-box height; scheduling alone does not resolve this defect.
- Account styles permit `margin`, `margin-top`, `margin-bottom` and logical margin properties in [compile-editor-styles.ts](../../resources/js/components/editor/styles/compile-editor-styles.ts), lines 54–64. The eventual repair must preserve the documented styling contract while keeping external widget spacing measurable. Disabling all themes is not an adequate permanent repair.
- The gutter's scroll/resize handler only dismisses its menu. It does not re-resolve the hovered block under a stationary pointer. This is a separate source-level issue to review; its independent user-visible impact was not isolated here.
- Source mode omits these rich-widget decorations, making it a useful comparison. Source-mode mouse precision, image/file blocks, split panes, other browser engines and customized account margins were not exercised in this investigation.

## Proposed repair scope

Remain in M5. Keep the current CodeMirror engine and document format. Put visual spacing inside measurable outer block containers, with styled content inside them, rather than leaving vertical margins on block-widget roots. Include the table's bottom space for its edge controls and the account-style application path. Preserve existing appearance, widget controls and whole-block targeting.

Use installed CodeMirror block/widget APIs and Orbium's own layout adapter. No new dependency is needed to correct this integration contract. A different drag library would not repair native caret placement. No library was installed, upgraded or selected for implementation during this investigation.

## Manual checklist

Use a disposable format-2 document with the [M5 fixture](../examples/orbium-markdown-m5.md), or an existing equivalent review document. These steps define the baseline and the required post-fix result; they do not claim the fix has been tested.

1. Hover and click `First movable paragraph.` before any rich widget. Expected: its own grip appears and the caret lands at the clicked text. This baseline passed during inspection.
2. Hover the paragraph `Inline ... and a display equation:` after the code and Mermaid blocks. Current reproduced failure: the grip appears on display math below. Required after repair: grip belongs to that paragraph at every pointer position within its text.
3. Click `Imported H6 remains H6 in Source` after the table. Current reproduced failure: the caret lands in the final paragraph. Required after repair: caret lands in the H6 text near the clicked character.
4. In the disposable document, type one character after clicking that H6, then undo. Required after repair: only the intended heading changes; the following paragraph remains intact.
5. Compare the same text in Source and Live Preview. Expected after repair: both modes target the clicked logical line accurately; returning to Preview preserves the document body.
6. Repeat after scrolling, reloading, switching retained tabs, resizing and using split panes. Expected: no accumulated drift or stale grip on another block. Scroll with the pointer stationary, then move it slightly; verify the handle targets the appropriate block.
7. Exercise code, Mermaid, math, callout, table, image and file widgets with prose immediately before and after each. Resize an image and toggle diagram/math editing. Expected: spacing remains visually correct and following prose stays accurately clickable after every height change.
8. Compare account styles disabled and enabled, including positive paragraph/widget margins, padding and font changes. Expected: the saved appearance is preserved and coordinate targeting remains accurate.
9. Drag a disposable paragraph above/below rich blocks and drop a file beside the intended paragraph. Expected: insertion targets the indicated block, with valid source, undo and save/reload behavior.
10. Repeat text targeting at browser zoom 100%, 125% and 150%, including RTL/mixed-script paragraphs. Expected: the caret and grip continue to match the visible target without a fixed offset.

## Validation and delivery

- Production source, dependencies, APIs, migrations and persisted formats: unchanged.
- Browser evidence: both reported symptoms reproduced; correct targeting before rich blocks also observed.
- No automated tests were written or run, as instructed.
- Formatter, lint, type and build checks were not run: this investigation changes only this report and does not validate a source modification. The repository tooling excludes `Docs/**` from formatting/linting.
- `git diff --check`: PASS. The new-file whitespace check against `/dev/null` emitted no whitespace errors; its exit 1 denotes the added-file difference.
- No commit, push, merge, phase progression or fix performed.

Commit message suggestion for this report: `docs(editor): investigate CodeMirror mouse coordinate drift`.

Suggested message for the future repair, once implemented and verified: `fix(editor): keep rich block spacing inside measured layout`.
