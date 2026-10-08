# M5 — Editor browser audit and repair priorities

Date: 2026-10-08. Status: **Investigation completed for the exercised cases; editor acceptance remains blocked by confirmed writing defects.**

## Scope and method

The user requested browser investigation of every block category, the apparent duplicate math/Mermaid blocks, oversized typing cursors, broken interactions and UI/UX improvements. This report records actual observations, distinguishes rendering from editing coverage, and identifies remaining checks. It does not claim exhaustive editor acceptance.

Used the connected Chrome browser against Orbium at `http://127.0.0.1:8000`, in the existing desktop viewport (1867 × 957), dark appearance with a frosted document surface. Inspected the user's document 73 without editing its content. Created the disposable **Editor audit — 2026-10-08**, document 74, for edits. Loaded the [M5 UI fixture](../examples/orbium-markdown-m5-ui-review.md) through the visible Source editor, then used smaller source examples to isolate writing behavior. Clicks, key presses, clipboard actions, DOM measurements and screenshots were used; no editor internals or hidden application state were invoked through page evaluation.

Changes were limited to the disposable document, one synthetic uploaded image, temporary evidence under `/tmp/orbium-editor-audit`, and this report. Browser control was released and the audit tab retained for review. No implementation changes, dependencies, migrations, automated test suite, commit or push were made in this investigation. Source reviewed includes `9833425`, the existing code-style/block-handle repair.

The browser file-chooser flow timed out, and later page-interaction calls timed out despite recovery attempts. Final reload, navigation and remaining attachment checks could not be completed. These transport failures are not classified as editor bugs.

## Main diagnosis

The largest confirmed problem is the boundary between the outer Markdown editor and rich widgets. Clicking a math or Mermaid preview can focus the outer document at a hidden source boundary. The document draws its caret across the whole replacement widget instead of treating it as a selected block. Typing then edits the hidden Markdown delimiter instead of opening the rich editor or writing in a separate paragraph.

The reported “two blocks” appearance has two confirmed contributors: the outer rich frame plus a second framed source field in Edit mode, and source separator lines that expose their own empty paragraph controls. One math widget and one Mermaid widget were observed for one corresponding source block; persistent duplicate saved content was not established. Whole-block math selection replaced the preview with source rather than displaying two math widgets simultaneously. KaTeX's semantic and visual markup should not be counted as two authored blocks.

## Confirmed defects, ordered by priority

### E1 — Rich preview focus permits hidden-source edits (high)

**Steps:** Put a display equation in the document. Click inside its rendered preview, away from Edit/Preview. Type `X`, then inspect Source.

**Actual:** The equation's opening `$$` became `X$$`. The rendered math block disappeared; typing modified its hidden delimiter. The same outer-document focus was observed on Mermaid preview clicks. This is a writing correctness defect, not just a cosmetic cursor issue.

**Expected:** Clicking the preview selects the block or opens the intended editor. Typing must enter a visible editing surface or a deliberate paragraph, preserving the fence/directive. Selection, typing, Enter, Delete/Backspace and navigation need one consistent contract for all rich atoms.

**Evidence:** [Captured math source after typing](/tmp/orbium-editor-audit/math-preview-typing.md). Source inspection: [rich-blocks.ts](../../resources/js/components/editor/markdown/rich/rich-blocks.ts) uses block replacement decorations and atomic ranges; [rich-widget.ts](../../resources/js/components/editor/markdown/rich/rich-widget.ts) creates non-editable roots and returns true from `ignoreEvent`. These do not, by themselves, provide the required block-selection and typing behavior. The precise corrective event/selection policy still needs implementation review.

### E2 — The parent caret spans a whole rich block (high)

**Actual measurements:** Mermaid preview click produced a **210px** `.cm-cursor`; display math produced **160.58px**. An uploaded image also visibly produced a vertical caret beside the full image block. The focused element was the outer `Document body`, not a math/Mermaid source field. Code's nested `Code source` field had normal editing behavior in the exercised case; giant-caret behavior across every code boundary is not pre-claimed.

**Expected:** A selected non-text block has a clear, bounded selection outline. An insertion caret appears only at a real writing position and has text-line height. Fix alongside E1; merely shrinking or hiding the cursor would leave the hidden-source editing defect.

### E3 — Enter twice does not actually leave a bullet list (high)

**Steps:** Start with `- First bullet` and `- Second bullet`. Place the caret at the end of the second item, press Enter twice, and type `After bullets`.

**Actual source:**

```markdown
- First bullet
- Second bullet
After bullets
```

Live Preview still placed `After bullets` inside the list. The marker was removed, but there was no blank separator to end Markdown's list continuation.

**Expected:** An ordinary paragraph outside the list, with a blank source separator. Numbered lists, checklists, nested items and quote exit must receive the same boundary review; their double-Enter exit was not independently verified here. Bullet/numbered/quote continuation worked when creating another item/line.

**Likely cause:** [markdown-writing-commands.ts](../../resources/js/components/editor/markdown/preview/markdown-writing-commands.ts) excludes list items/quotes from the ordinary paragraph command, leaving their exit semantics to the configured Markdown key handling. Orbium needs to ensure that a visual exit also creates the correct Markdown boundary.

### E4 — Structural separators expose phantom paragraph menus (medium)

**Steps:** Hover the small empty separator line between rich blocks/prose, then open its six-dot menu using the visible handle.

**Actual:** A block menu appeared for an empty source range, with Turn into, Duplicate/Delete and both movement actions disabled. This makes the gap feel like an additional authored block and makes control ownership unclear.

**Expected:** Structural spacing should be distinguished from a deliberately authored empty paragraph. Keep intentional empty writing lines editable; avoid exposing a full block menu for every Markdown separator. The preceding-block ownership fix must remain intact for actual trailing writing paragraphs.

**Evidence:** [Separator menu screenshot](/tmp/orbium-editor-audit/separator-block-menu.png). [markdown-block-actions.ts](../../resources/js/components/editor/markdown/interactions/markdown-block-actions.ts) falls back to a Paragraph for a document gap; no semantic distinction is currently made for structural blank lines.

### E5 — Fast slash typing followed by Enter can miss insertion (medium; timing-sensitive)

**Actual:** Rapid keystrokes spelling `/math` followed immediately by Enter left literal `/math` plus a paragraph separator. The completion list briefly retained the unfiltered choices with Text selected. After waiting for the filtered Math block option, Enter inserted one math block and activated its source editor correctly.

**Expected:** Enter should act on the current query or provide predictable handling while results update. Confirm this with normal typing speed as well as rapid typing before deciding the exact fix. Single bulk text insertion also behaved differently from ordinary keystrokes and is not counted as proof that normal slash commands always fail.

**Implementation area:** [markdown-slash-commands.ts](../../resources/js/components/editor/markdown/markdown-slash-commands.ts), completion update/acceptance timing and Enter priority.

### E6 — Inline math retains its old accessible label after editing (low)

**Actual:** Editing `E = mc^2` to `a^2 + b^2 = c^2` changed the canonical source, while the button remained named `Edit inline math: E = mc^2` in the browser snapshot.

**Expected:** The label tracks the current equation. [inline-math-input.ts](../../resources/js/components/editor/markdown/rich/inline-math-input.ts) sets the label during mounting but does not refresh it in `update`.

### E7 — Image size readout initially reports 0px for a visible image (low)

**Actual:** The synthetic image had natural size 240 × 120 and displayed at **720 × 360**, but its side controls displayed **0 px**. After a keyboard resize the label correctly became 710px.

**Expected:** Display measured width or Auto until a reliable width is available. The initial [media-widget.ts](../../resources/js/components/editor/markdown/rich/media-widget.ts) update reads root width before attachment to the document; the label needs a post-layout refresh.

**Evidence:** [Initial image size readout](/tmp/orbium-editor-audit/image-caret.png). The saved crop shows the incorrect readout; cursor blinking means that crop is not visual proof of the oversized caret.

## UI/UX enhancements and transient glitches

1. **One visual block surface for math/Mermaid:** Reduce the nested-frame effect. Use a single block outline and a compact source area, preserving a visible focus indicator. Math currently reserves four textarea rows for a one-line equation; Mermaid reserves six. Auto-growing source height with a sensible maximum would improve density. [Math Edit screenshot](/tmp/orbium-editor-audit/math-edit-double-frame.png) shows the reported double-frame appearance.
2. **A consistent selection model:** Distinguish block selection, source editing and ordinary paragraph focus. Keep one gutter/menu owner across the preview and its embedded input. Make Escape and before/after arrow navigation predictable.
3. **Spacing with clear ownership:** Rich margins, layout wrappers and explicit Markdown separator lines combine into fairly large gaps. Consolidate visual spacing without reintroducing the earlier mouse-height mismatch. Keep the layout wrapper's measurement containment.
4. **Bottom writing affordance closer to content:** In a short document containing only math, `Click to write below` appeared far beneath the block because the editor keeps a minimum content height. The button and clickable blank area should communicate one writing destination more clearly.
5. **Table options placement:** The expanded options panel sits above the table and can cover the preceding equation. Anchor/clamp it to available viewport space and reduce overlapping content. The tested table actions themselves worked.
6. **Clearer image defaults and controls:** The 240px-wide synthetic image was enlarged to 720px, visibly softening it. Consider defaulting to its natural width bounded by available space. Give the four resize handles distinct corner labels instead of two repeated left labels and two repeated right labels.
7. **Avoid transient false diagnostics:** Immediately after writing below an image, a snapshot showed `Source is incomplete or has changed block type` and temporarily omitted the new paragraph. Captured Source was valid; after mode switching/settling, the image and paragraph rendered correctly. This requires an isolated repeat without mode switching to distinguish an ordinary parser refresh from a persistent defect. Do not present a corruption warning while a normal transaction is still being reconciled.
8. **Show current block type:** Ordinary paragraph menus displayed Turn into… rather than identifying the current type. Showing Text/Heading/Code would make menu state easier to understand.
9. **Explain actual table limits:** Merging cells disabled structural row/column controls; splitting restored them. This is consistent with the documented span limitation, but disabled actions should explain the reason and the recovery path.

## Browser coverage and results

“Worked” below applies only to the listed operation, not every operation on that feature.

| Area | Exercised cases | Result |
| --- | --- | --- |
| Paragraphs | Ordinary text entry and separation; selection of first word | Worked |
| H1–H6 | Rendering all levels; Enter at end of H3 | Rendered; H3 Enter created normal prose |
| Inline formatting | Bold, italic, underline and Blue on the same word; source inspection | Worked; combined canonical source preserved |
| Inline code/strike/colored text | Fixture rendering; toolbar availability | Rendered; all toolbar variants not individually applied |
| Escapes/entities | Escaped brackets and ampersand fixture | Rendered as literal content |
| Bullet lists | Nested rendering, Enter continuation, double-Enter exit | Continuation worked; exit failed (E3) |
| Numbered lists | Imported 3/1/1 displayed sequentially; Enter added item 3 | Worked for the exercised cases |
| Checklists | Checked/unchecked fixture; toggle first task | Canonical task became checked; locator timeout was resolved by inspecting actual state |
| Quotes | Formatted/two-line rendering; Enter continuation | Worked; double-Enter exit pending |
| Callouts | Direct writing, Enter, typing a second paragraph, parent undo | Worked in the exercised sequence |
| Direction/alignment | RTL/right fixture, centered text, alphabetic list; setting center/RTL on an ordinary block | Rendered and metadata preserved |
| Empty formatted paragraph | Enter Arabic text into its textarea | Became editable paragraph; focus moved to Document body |
| Code | Monospace/padding/height measurement, typing, Enter, Copy and language change | Worked; 1rem vertical/horizontal padding, no inherited page minimum height |
| Mermaid | Initial render, source Edit, change labels, Preview, click preview | Editing/rendering worked; preview click produced giant parent caret |
| Display math | Render, Edit, invalid-source feedback, repair, preview click/type, whole-block selection | Error feedback/repair worked; E1/E2 confirmed; whole-block selection exposed source without a duplicate widget |
| Inline math | Open source popup, change equation, Enter to close, inspect Source | Edit worked; stale accessible label (E6) |
| Tables | Formatted cell entry, literal pipe, Tab/Shift+Tab, row/column addition, options, Merge right, Split cell | Worked; 3×2 grew to 4×3; spans disabled structural controls until split |
| Divider | Fixture rendering | Rendered; deletion/navigation pending |
| Images | Synthetic PNG clipboard paste/upload, render, caption, right alignment, keyboard resize, writing below | Worked; E2/E7 and default upscaling observed |
| File attachment | Add file invoked; native chooser observation attempted | Unverified: browser chooser timed out before selecting a file |
| Mentions | Typed @test; workspace candidates appeared | Suggestions worked; subsequent insertion/navigation result unverified after timeout |
| Slash commands | Query filtering, rapid Enter, settled Math block acceptance | Normal settled insertion worked; timing-sensitive failure (E5) |
| Block controls | Visible grip/right-click menu, Copy text, center/RTL, Duplicate | Worked for ordinary paragraphs; separator ownership failed (E4) |
| Move/delete | Invoked on disposable paragraphs | Final result unverified: output lost when browser call timed out |
| Finder | Open page finder; query Formatted cell across table formatting | Count settled to 1; navigation/highlight acceptance pending |
| Final special block | Bottom action after final code with one newline, final table with none, final image | Correct blank separator and ordinary prose in inspected Source |
| Source/Preview | Repeated switching and source copy/inspection | Worked for captured cases; scroll/focus continuity needs more review |
| Autosave | Observed Saving/Unsaved → Saved repeatedly | Save status worked; reload equality not verified |

No application warning/error logs were reported in the inspected audit snapshots. Browser-control transport and tooling messages are separate from application console errors.

## Checks still required before editor acceptance

- Persistence after full reload, export/reimport equality and revision-conflict/offline recovery.
- Actual file/PDF upload, download, replacement, multi-file order, rejected uploads and attachment lifecycle.
- Every rich block's arrow navigation, Enter, Delete/Backspace, whole-block selection, adjacent typing, undo/redo and move/drag.
- Pointer drag/drop reorder, keyboard reorder result, nested block ownership, conversion restrictions and read-only/inactive-tab behavior.
- Multiline formatting, removing inherited marks/colors, link creation/removal, full color palette and nested rich text.
- Mention insertion/navigation and stale suggestion races; finder stepping/highlight/scroll behavior.
- Mobile/touch, light theme, browser zoom, split panes, custom document style variations, IME composition and mixed-script caret behavior.
- Long-document mount, scrolling, typing latency, memory and retained-tab performance measurements.

## Proposed repair order

1. Define and implement rich-block selection/input ownership; fix E1/E2 together and check every atom type. Use the installed editor APIs and existing widget adapters; no new package is needed merely to fix the confirmed focus bug.
2. Fix Markdown boundary creation for leaving lists/quotes and for adjacent rich-block writing. Preserve existing bottom-writing behavior that passed.
3. Distinguish structural separators from actual empty paragraphs and align gutter/menu ownership with that distinction.
4. Resolve fast completion acceptance, stale labels/readouts and premature diagnostic display.
5. Simplify math/Mermaid surfaces, adjust spacing and improve table/image control placement.
6. Complete the pending browser matrix and persistence checks before M5 acceptance. Do not advance to M6 or remove Tiptap based on this audit.

## Manual reproduction and acceptance checklist

Use a disposable format-2 document; the audit document is available at `http://127.0.0.1:8000/workspaces/1/documents/74`. The steps below describe the required result after repair. Current failures are listed above.

1. **Preview click/type:** Add math and Mermaid separated by text. Click inside each preview and type one character. Expected: a visible editing destination, valid unchanged fence/directive boundaries, and no block-height caret. Repeat with image/table/code border areas.
2. **Rich keyboard boundaries:** From prose before/after each special block, use arrows, Shift+arrows, Enter and Delete/Backspace. Expected: predictable selection and ordinary writing before/after; no invisible source mutation. Undo/redo must restore the complete intended operation.
3. **Duplicate appearance:** Insert `/math` and `/mermaid`, inspect Edit/Preview and then Source. Expected: one authored source block, one outer selection owner and a single clear visual surface. Whole-block selection must not leave a stale second widget.
4. **List exit:** At the end of a bullet, numbered, task and quote item, press Enter twice and type prose. Expected: the new prose is outside the container. Repeat in nested lists and an explicit RTL wrapper.
5. **Spacing ownership:** Hover separators and intentional empty paragraphs around rich blocks. Expected: no misleading phantom menus; a genuine empty paragraph still provides an accurate writing target and appropriate controls.
6. **Fast commands:** Type `/math`, `/mermaid`, `/code` and a mention query rapidly, then press Enter. Expected: the current selected result is inserted once, without leaving literal commands or accepting stale options.
7. **Code/table baseline:** Check code padding, Enter/Copy/language, formatted table cells, literal pipes, Tab/Shift+Tab and row/column/merge/split. Expected: preserve the working behavior recorded in the matrix.
8. **Bottom writing:** End a document with code/table/math/Mermaid/image, using zero, one and two trailing newlines. Click below and type prose. Expected: a correctly separated ordinary paragraph; repeated activation reuses writing space. Save/reload must preserve it.
9. **Labels and diagnostics:** Change inline math, upload/resize an image and write below it. Expected: current accessible names and actual width; no false corruption warning during normal typing.
10. **Final review:** Save/reload, export/reimport a disposable copy, check Light/Dark, a narrow screen and split panes, then complete the remaining coverage list. Expected: no loss, wrong focus, blocked controls or rendering drift. Record any remaining failure before acceptance.

## Validation and commit suggestion

- Browser exploration and source investigation: performed as documented above.
- Automated tests: neither written nor run.
- Formatting/lint/type/build checks: not rerun for this documentation-only investigation; no new implementation result is claimed.
- `git diff --check`: performed before delivery.
- Suggested report commit: `docs(editor): record browser audit and repair priorities`.

Remain in M5 for focused repairs and review.
