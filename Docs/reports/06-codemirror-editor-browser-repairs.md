# M5 — Editor browser audit repairs

Date: 2026-10-08. Status: **Audit repairs implemented and targeted browser checks completed. The final presentation-wrapper exit correction awaits manual verification. Full M5 acceptance remains pending.**

The user authorized the repairs in the [browser audit](06-codemirror-editor-browser-audit.md). This work stays in M5. No automated tests were written or run.

## What changed

| Audit finding | Repair |
| --- | --- |
| E1/E2: preview clicks focus hidden Markdown and draw a block-height caret | Rich preview surfaces now have a focusable block owner and selection outline. Typing or text paste creates a visible paragraph below; Enter writes below, Shift+Enter above. Arrows navigate to adjacent content, Delete/Backspace remove the complete selected block, and Ctrl/Mod+Shift+A deliberately reveals its source. Nested code/cell/callout inputs and controls retain their own input handling. A parent input handler also redirects insertion at a hidden atom boundary. |
| E3: double Enter leaves prose inside a list | Empty-marker exit retains CodeMirror's list-level handling, then adds the Markdown separator needed for ordinary prose. Nested lists exit one level at a time. Empty quote exit similarly preserves the outer quote level. |
| E4: source separators expose phantom block menus | The first empty separator line after authored content has no gutter/context menu. Additional intentional empty writing lines and the final writing line remain usable. Paragraph menus identify their current type. |
| E5: fast slash Enter accepts stale results or leaves literal commands | Enter/Tab resolve slash options against the current source query synchronously. A selected option is retained only when it matches that query. Async mention completion remains with the existing completion source. |
| E6: inline math accessible label is stale | The edit button's accessible name updates with its equation. |
| E7: initial image width reads 0px | A resize observer measures the rendered frame. The label shows Auto before measurement, then the actual width. Auto-sized images use their natural width within the document's available width. Resize calculations start from the displayed width, and all four corners have distinct accessible names. |

Math/Mermaid source fields now share a transparent, compact writing surface with bounded height and a single focus accent. They no longer add another rounded background/frame inside the rich block. The outer block remains the visual owner.

Rich source ranges now exclude insertions immediately before/after the atom while still including edits that replace its source. This prevents adjacent prose from briefly becoming part of the preceding image/math/code model. Content bounds that coincide with the atom bounds follow the same mapping.

The bottom writing target sits after actual content rather than after a second 45vh minimum-height content area. During review, immediate writing after image resize exposed another defect: dismissing the empty caption moved the target between pointer-down and pointer-up. The target now activates on pointer-down, before that collapse; keyboard activation uses its click handler. A parser fallback was investigated and removed after the layout cause was identified.

Table options/actions participate in layout instead of floating over the preceding block. When cells span columns/rows, the options show why structural controls are disabled and instruct the user to split the spanning cells. The existing span-editing limitation remains.

Selecting a rich preview also clears stale native text highlighting left by Source-mode selection; deliberate source selection remains available through Ctrl/Mod+Shift+A.

## Libraries and implementation ownership

Reused the installed, previously approved CodeMirror view/state/commands/Markdown/completion packages, KaTeX and the existing Mermaid/widget adapters. No dependency was added. Examined the installed package declarations and Markdown continuation implementation, and checked the [CodeMirror reference](https://codemirror.net/docs/ref/).

CodeMirror supplies atomic cursor movement, custom input handling, widgets, commands and completion state. Atomic ranges do not prevent every programmatic selection from entering their source bounds; widgets do not define Orbium's block-selection or paragraph-boundary policy. Those behaviors belong in the application. A second editor/selection library would add another state boundary without solving the canonical Markdown ownership problem.

The new responsibilities are split into small files: rich selection/input ownership, rich range mapping, compact source inputs, and container exit. Changed source files remain below 500 lines.

A final contract review caught an additional problem in the exercised RTL-list exit: its captured source placed the list and following paragraph inside one `kind:block` wrapper. The server requires exactly one child per wrapper. Container exit now creates separate wrapped blocks and focuses the existing Empty paragraph input immediately, preserving direction and removing list-only metadata from the new paragraph. This final correction passed formatting/type/build checks; its browser acceptance is still pending. The earlier source-only observation is not a passing save/render check for that case.

## Actual browser verification

Used Chrome at `http://127.0.0.1:8000`, dark appearance, in the original desktop viewport and an existing split layout. Editing was confined to disposable document 74, **Editor audit — 2026-10-08**, and its synthetic attachment 81. A separate browser tab was used for the later checks. No original user document body was edited.

| Case | Observed result |
| --- | --- |
| Math preview click, then `X` | Focus belonged to `math block`; parent cursor height was 0. Canonical `$$` fences remained intact and `X` became a separate paragraph. |
| Math Edit/Preview | One compact transparent source field, measured 48px for a short equation. Invalid LaTeX showed a render error while preserving editable source. Returning to Preview focused the block. |
| Mermaid preview Enter/type | Created ordinary prose below the diagram with its fence intact. Source editing to Start/Finish and Preview worked. |
| Mermaid Delete, then Undo | Deletion removed the widget; Undo restored the complete canonical diagram source. Decoration restoration is scheduled, so an immediate count alone was not treated as the final result. |
| Arrow navigation / source reveal | ArrowUp from math returned to preceding prose; typing appended there. Ctrl+Shift+A exposed the math source once. |
| Bullet, numbered, checklist and quote exits | Enter twice followed by prose produced a blank Markdown separator and prose outside the container. |
| Nested list exit | Enter twice changed nested writing into a parent-level sibling; repeating at that sibling created prose outside the list. |
| RTL wrapper | Initial source inspection preserved direction but exposed a two-child wrapper. Corrected after contract review; final save/render verification remains pending. |
| Structural spacing | Hovering the first separator showed no grip; an extra blank writing line showed one. A paragraph context menu displayed Text. |
| Fast slash commands | Rapid `/math` keystrokes plus immediate Enter inserted one equation and activated Math source. Immediate `/mermaid` and `/code` insertion also worked, with their corresponding source inputs activated. |
| Inline math | Editing to `a^2 + b^2 = c^2` updated the accessible button name. |
| Image sizing and focus | Natural 240px image displayed at 240px and reported 240px; keyboard resize reported 230px. Selection focused `image block`; typing preserved its source and created prose below. |
| Immediate image bottom writing | Resize, immediately click the bottom target, then type: valid image directive plus a separate paragraph, including in a split pane. |
| Code | Enter/edit, TypeScript language change and Copy worked; clipboard contained code without fences. Writing below final code preserved its fence. |
| Table | Literal pipe entry, added row, Tab/Shift+Tab, options, Merge right and Split cell worked. The span explanation appeared with disabled structural controls. Writing below produced separate prose. |
| Callout | Direct editing still opened the nested input; Enter/typing produced a second quoted paragraph in canonical source. |
| Persistence | Saved a combined review document and reloaded. Source copied through the visible editor matched the captured source exactly, including after the final build. |
| Final visual review | Math selection had its outline, no giant caret and no stale native text highlighting in the split-pane screenshot. |

Browser application logs inspected during the checks contained no warnings/errors. Browser-control networking messages were tooling output. A reload issued while a build was replacing its manifest briefly showed Laravel's missing-manifest error; reloading after build completion restored the page. Later Playwright frame inspection timed out; the documented DOM browser controls completed the final visual/source checks.

Evidence: [final review source](/tmp/orbium-editor-repairs/review-source.md), [selected math in the split pane](/tmp/orbium-editor-repairs/rich-selection-split.png). These temporary artifacts contain disposable review content and are not repository fixtures.

## Validation

- `npm run check:fix`: PASS; no warnings/errors in 280 linted files.
- Final `npm run lint`: PASS; all 345 checked files correctly formatted, no warnings/errors in 280 linted files.
- `npm run types:check`: PASS.
- Final `npm run build`: PASS, 6.25 seconds. Existing large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: PASS.
- Automated tests: neither written nor run, as instructed.
- No commit or push was made.

## Manual acceptance checklist

Use a disposable format-2 document or [the retained review document](http://127.0.0.1:8000/workspaces/1/documents/74). Use Source to inspect boundaries after each case; undo destructive checks before continuing.

1. **Math click/type:** Click the equation preview, type `X`, and inspect Source. Expected: intact opening/closing `$$`, one equation, and a separate `X` paragraph below. No block-height typing bar.
2. **Mermaid click/type:** Repeat with Mermaid. Expected: intact code fence and a separate paragraph, with one diagram widget. Edit its labels and return to Preview; focus should belong to the selected block.
3. **Source design:** Open Math/Mermaid Edit. Expected: one compact field inside the outer surface. Try a long multiline source and invalid source; scrolling/error feedback must preserve the text.
4. **Selected-block keys:** Select each math/Mermaid/code/table/image/file frame. Try Enter, Shift+Enter, arrows, Shift+arrows, Escape, Delete/Backspace and Undo/Redo. Expected: a visible destination, whole-block operations and intact neighboring source. Test the frame separately from its nested input.
5. **Explicit source selection:** Select math and press Ctrl/Mod+Shift+A. Expected: one source representation; moving away restores the preview without a stale duplicate.
6. **List/quote exit:** At the end of a bullet, numbered item, task or quote, press Enter twice and type prose. Expected: prose outside the container, separated by a blank source line. Nested lists exit one level per empty-item exit. **Priority follow-up:** repeat inside an RTL/list-type wrapper. Expected: a separately wrapped paragraph/empty writing input, no wrapper containing two blocks, inherited direction, no list-only paragraph metadata, and Saved followed by identical reload content. Repeat with nested presentation wrappers and Undo/Redo.
7. **Gutter ownership:** Hover a normal separator and then an extra intentional empty line. Expected: no phantom menu on the separator; the intentional writing line remains editable with accurate controls. Open a paragraph menu; its type should read Text.
8. **Fast insertion:** Rapidly type `/math`, `/mermaid` and `/code`, then Enter. Repeat using arrows to choose a filtered option and using Tab. Expected: current result inserted once, with visible editing focus and no literal command left behind.
9. **Code:** Type, Enter, change language and Copy. Expected: padded monospace code, normal caret, exact code clipboard text, preserved fence and working Undo/Redo.
10. **Table:** Type formatted content and a literal pipe, Tab/Shift+Tab between cells, add row/column, merge/split and open options. Expected: no lost focus/source; controls occupy their own space. Spanning cells explain disabled structural edits and splitting restores them.
11. **Inline labels:** Change inline math and close with Enter/Escape. Expected: the edit button's accessible name uses the current equation.
12. **Images:** Upload a small image, select it, resize with each corner and keyboard arrows, align, caption, replace and download. Expected: measured width, four distinct corner labels, bounded sizing and valid source.
13. **Bottom writing:** End with code/table/math/Mermaid/image, with zero, one and two trailing newlines. Click below and type. Expected: ordinary prose with the required separator. Repeat immediately after resizing an image with an empty caption; the first click must work. Keyboard-activate the target too.
14. **Save/reload:** Wait for Saved, copy Source, reload and compare. Expected: identical Markdown and working previews. Repeat in split panes and retained tabs.
15. **Broader acceptance:** Complete the audit's remaining mobile/light-theme/zoom, IME, drag, file/PDF, mentions, finder, offline/conflict, export/reimport and long-document checks before M5 acceptance. These have not all been certified by this repair pass.

## Remaining browser restriction

The file chooser opened, but Chrome rejected `setFiles` for the synthetic test file. Actual file/PDF upload, replacement and download verification remains pending; this is not an established application upload defect.

The [Browser skill](/home/insayd/.codex/plugins/cache/openai-bundled/browser/26.707.31428/skills/control-in-app-browser/SKILL.md) requires following its referenced upload troubleshooting. That guide says: “If file upload fails while setting files through a file chooser, tell the user exactly this”:

To enable file upload, go to chrome://extensions in Chrome, click Details under the ChatGPT Chrome Extension, and enable "Allow access to file URLs." See [here](https://developers.openai.com/codex/app/chrome-extension#upload-files) for details.

## Commit message suggestions

- `fix(editor): protect rich block focus and Markdown writing boundaries`
- `fix(editor): simplify rich sources and stabilize block controls`

Remain in M5 for manual review.
