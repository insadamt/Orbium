Summary: Records the screenshot-driven empty-row and writing-hint layout repair; depends on V3 empty-paragraph decoration, measured wrappers, writable spacers, rich-input focus and existing owner cleanup/history.

# Empty-row layout and writing hint — 2026-11-01

The user reported glitches around empty blocks and misalignment of “Write, or press /…”, showing a hint above code/image content and a text row moving vertically after typing. This is a stage-6 review repair. Findings below come from source tracing; no browser reproduction or pixel measurements were performed.

## Findings and changes

1. **Empty paragraphs had no block frame.** Normal paragraphs acquire `orbium-markdown-block-layout` through syntax nodes, with 0.375rem padding above and below. Empty bodies have no paragraph node. Their hint therefore occupied an unpadded row; typing added the frame and moved the visible baseline. Empty plain paragraphs now receive an explicit body-only frame, including when unfocused. The frame excludes identity headers. Selection-only updates reuse the frame ranges.
2. **The hint was a real inline widget.** The inherited CodeMirror placeholder style uses `inline-block` and `vertical-align: top`, contributing width and line geometry. The hint is now a CSS pseudo-element on the actual empty line, with inherited text style/alignment and no content selection, pointer interception or layout contribution. It appears only for a collapsed caret in an empty plain paragraph. Handle/text range selections do not generate a stale prompt.
3. **Spacers used different text metrics.** Their outer row and textarea were fixed to 24px, while ordinary text uses the editor's inherited line height and paragraph frame. Both live and hosted read-only spacers now use one inherited line plus the shared frame padding. Promotion to a one-line paragraph retains the same footprint instead of acquiring extra padding/height on first typing. This intentionally supersedes the earlier fixed 24px presentation; persisted spacer bodies and identities are unchanged.
4. **Rich focus could leave the logical caret behind.** Interactive code/table/math controls can receive native focus while the owning view still points at an earlier empty paragraph. A scoped deferred focus listener now resolves the containing rich widget and moves only the logical owner/projection caret to that body. It supports nested code CodeMirror views. Existing cleanup can then remove an abandoned empty paragraph, using its normal guards and quiet history path. The listener does not call `focus()`, and column layouts leave their child projections responsible for local focus. Active block-handle selections remain protected.
5. **Empty controls could measure or hover the wrong surface.** Empty-row handle positioning now measures that block's actual empty line or spacer input. Spacer block geometry resolves its identified widget, and pointer hover resolves the stable spacer ID before falling back to source-coordinate hit testing. This avoids treating an atomic blank widget as a neighboring code/image block.

No schema, backend, dependencies, migration, source-format or Enter-rule changes were made. Intentional spacers remain writable and are not automatically removed for being blank. Existing cleanup still skips selected ranges, composition, pending uploads/moves and unsupported bodies. Existing multiline blank source is not rewritten by the layout renderer. These repairs address concrete source paths; they do not establish that every possible editor glitch is resolved.

## Checks actually run

- Changed-file formatting/lint: passed for the eight changed/new TypeScript files and the changed CSS file.
- `npm run types:check`: passed.
- `npm run build`: passed, with existing chunk-size, mixed-import and plugin-timing warnings.
- `npm run lint`: fails on 16 existing formatting files elsewhere. The changed block-geometry file was one of the previous 17; formatting it as part of this repair removed that entry. No other baseline files were reformatted.
- `git diff --check` and changed-file summary/size/whitespace inspection: passed. Changed source files retain top summaries and remain below 500 lines.
- No PHP source changed; PHP checks were not repeated.
- No automated tests, fixture runners, Playwright, browser automation, runtime interaction checks, staging or commits were performed. Manual checks below remain unverified.

## Exact manual checklist

Reload the updated application and use a disposable V3 Document.

- [ ] **Screenshot text/hint alignment:** Type `how i ca`, press Enter and observe the hint in the new paragraph. Type `sd` without clicking elsewhere. Expect the text to replace the hint at the same baseline and horizontal text origin. Existing text and following blocks must not jump down when the first character appears. Backspace to empty again; expect the same row height and hint alignment.
- [ ] **Blank row promotion:** Create several blank spacers with repeated Enter. Click an intermediate spacer and type one line. Expect the same row footprint before and after promotion, no missing first character, and no repeated hints in other spacer rows. Click away from another spacer without typing; its spacing must remain.
- [ ] **Screenshot rich arrangement:** Place a plain paragraph/empty writing paragraph above a code block, followed by an image. Leave the caret in the empty paragraph, then click directly inside the code editor and type. Expect its input to keep focus, the old paragraph's hint to disappear, and the abandoned empty paragraph to be removed by normal cleanup. Code text and the image must remain intact. Repeat with a table cell and math input.
- [ ] **Blank-row controls:** Hover each empty paragraph and spacer, including immediately above/below code and image blocks. Expect the plus/grip controls to align with that row rather than the neighboring block. Open the menu, delete a spacer, undo, and drag another spacer. Expect the intended identified block to be targeted each time.
- [ ] **Selection guards:** Select text across rows and Shift-click handles across a spacer. Expect no extra hint on another block and no cleanup that deletes selected content. Clicking a rich control while a handle range is active must preserve the guarded range behavior until ordinary editing retires it.
- [ ] **Direction and alignment:** Repeat the hint-to-text transition with LTR and RTL text and the supported alignment controls. Expect the hint, caret and first typed text to use the intended text alignment. Styled empty paragraph inputs must retain their existing presentation and editing behavior.
- [ ] **Columns and hosting:** Repeat hint-to-text, spacer promotion, rich focus and blank-row hover in both columns and a Board-hosted Document. Expect local handles, no focus jump to the outer layout and no content written into another column. Narrow the pane and repeat.
- [ ] **History and persistence:** Undo/redo the first spacer text and the abandoned-row cleanup; verify the expected content order and IDs in Source. Save and reload; expect text and intentional blank rows to remain. Read-only hosted previews must show matching blank-row spacing and no writing hints.
- [ ] **Composition and read-only:** Use a real IME in a blank spacer and code input. Expect composition to finish without lost text or focus, and no cleanup of a protected composing body. Confirm read-only surfaces cannot mutate content.

## Commit message suggestions

- `fix(editor): stabilize empty rows and writing hint alignment`
- `fix(editor): synchronize rich focus and blank block controls`

No commits were created. Remain at stage-6 manual review.
