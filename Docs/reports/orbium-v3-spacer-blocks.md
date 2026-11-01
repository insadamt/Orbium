Summary: Records the user-requested V3 empty-space block, empty-row cleanup, actual static checks and manual acceptance; depends on the stage-6 editor, checked owner history, additive spacer capability and matched readers/exporters.

# V3 empty-space blocks — 2026-10-31

## Request and cause

The user supplied screenshots of a spare writing row below a block and repeated “Write, or press /…” prompts. They explicitly requested automatic empty-row cleanup and a new blank block that cannot accept text. This is the specific stage-6 scope amendment documented in the V3 phase; the original restriction against new block types is superseded for this request only.

Two code paths caused the symptoms. The empty-final-line exit inserted a new paragraph but left the old body's trailing newline rows behind. Repeating Enter in a wholly empty paragraph created another writable paragraph each time, and the placeholder field rendered a hint for every empty paragraph.

## Implemented behavior

- A new explicit `spacer` block owns one non-editable 24 px blank row. Its body may contain only spaces, tabs and newlines; body text and presentation directives are rejected by client/server admission. A native example is `++block {"id":"space-1","type":"spacer"}++` followed by a blank line.
- Enter or Shift+Enter in an empty paragraph converts that ID to `spacer` and inserts a fresh writable paragraph after it in the same scope and one undoable owner transaction. Compatible presentation moves with the fresh paragraph. Repeated Enter creates spacing rows and one current writing target instead of a stack of writing prompts.
- Enter inside nonempty text still creates an internal line as before. Exiting an empty final row removes that trailing temporary row from the previous block before creating the next paragraph. Typed empty list/quote/heading markers remain valid rather than leaving an unsavable blank typed body.
- Moving to another block, or blurring nonempty text, removes unused trailing writing rows. Leaving a wholly empty paragraph removes it when another sibling remains. Blur alone does not delete an empty paragraph, so opening a menu does not destroy its target. Internal blank lines between real content remain.
- Cleanup is deferred until CodeMirror finishes updating and resolves the current ID again. It skips active text/handle selections, composition, pending uploads, pending linked moves, opaque bodies and unavailable owners. It does not run as a bulk rewrite of imported/saved documents.
- Only the current plain empty paragraph gets the writing hint. The lookup uses the active block directly rather than scanning every block on each caret move.
- Clicking/tabbing into a spacer selects the block. Ordinary typing and paste do not edit it. Enter creates a writing paragraph after it; Backspace/Delete removes it or its selected handle range. Block clipboard/drag paths retain its native type and ID lifecycle. Initial focus skips spacing when a writable/rich body exists.
- Column projections use the authoritative owner for spacer paragraph insertion. Hosted previews render the same blank row. Native files/packages retain the exact spacer source and identities. Clean Markdown emits blank lines; Office export emits an empty paragraph with an 18 pt/24 px line height. Normal Markdown viewers may visually collapse extra blank lines.
- Saves advertise the additive `spacers: 1` capability. The server checks both current and submitted source for actual spacer IDs before allowing an older client to save. Literal header examples inside code are not mistaken for actual spacers. Saved/native version 3 remains; no migration or database reset was added. Deploy matching server/frontend and reload existing editors.

The downloadable authoring guidance lists the new type and distinguishes a styled writable empty paragraph (`kind:empty`) from a non-editable spacer. Installed external plugins were not modified.

## Checks actually run

- `npm run types:check`: passed.
- Targeted `npm exec -- vp check` for changed frontend/contract/export-script paths: passed after formatting, with no warnings or lint errors.
- `npm run build`: passed. Existing chunk-size, mixed import and plugin timing warnings remain.
- `./vendor/bin/pint --test`: passed repository-wide.
- `php -l` on the five changed PHP files: passed.
- `node --check scripts/document-export/blocks.mjs`: passed; the Office renderer was not executed.
- `git diff --check` and changed-file whitespace checks: passed. New/touched source files have summaries and remain under 500 lines.
- `npm run lint`: failed on the same 17 existing formatting issues recorded in the stability repair report. No unrelated formatting cleanup was included.

No automated tests, fixtures, browser automation, runtime reproduction, document imports, export generation, database writes, staging or commits were performed for this change. Build/type/syntax checks do not establish visual or interaction acceptance. The manual cases below remain unchecked.

## Exact manual checklist

Use disposable V3 documents and reload the matched editor build first. For save checks, wait until Saved before reloading. Repeat the relevant text cases in a column and in a Board-hosted Document.

- [ ] **Original extra row:** Create a paragraph, heading and bullet list. In the paragraph/heading press Enter once to reach a blank final row, then click the next block. Expect the unused trailing row to disappear without removing text. Repeat clicking outside the editor; nonempty text's trailing row should be removed on blur. Source should retain one structural separating newline, not an extra writable blank row.
- [ ] **Exit a block:** Type `Alpha`, press Enter, then Enter again. Expect a new writable paragraph, with no empty row left attached to `Alpha`. Repeat with a list containing a nonempty item followed by an empty final item; the final empty item should disappear while the nonempty list saves correctly.
- [ ] **Repeated Enter:** Start in one empty paragraph and press Enter five times. Expect five blank spacer rows and one current writable paragraph, with one writing hint. Type `Beta`; it must appear only in that final paragraph. In Source, expect five distinct `type:"spacer"` IDs with whitespace-only bodies, followed by a paragraph ID.
- [ ] **Undo/redo:** Immediately undo the last repeated-Enter action, then redo. Expect exactly one spacer/new-paragraph transition to reverse/return. No unrelated IDs or text should change. Save and reload; expect the same spacing and content.
- [ ] **No typing in spacing:** Click one blank spacer row and type ordinary characters or paste text. Expect no inserted text or writing caret inside the spacer and no structural corruption. Press Enter while it is selected; expect a separate paragraph after it. Press Delete/Backspace while the spacer is selected; expect that spacer to be removed. Undo must restore it.
- [ ] **Multi-block selection:** Use handles/Shift to select text blocks and a spacer. Copy/paste into another position; expect the native spacer type and copied IDs to be retained/remapped. Delete the selected range; expect the entire selection to disappear. Deleting the last document block must leave a usable paragraph.
- [ ] **Abandoned paragraph:** Use gutter + between two real blocks, leave the new paragraph empty, then click the other text block. Expect the unused paragraph to disappear. Keep the new paragraph focused and type instead; expect normal writing. Opening a menu without changing blocks must not delete its empty target.
- [ ] **Styled empty paragraph:** Apply alignment/direction to an empty paragraph, press Enter several times, then type. Expect non-editable spacing rows and one writable styled paragraph, with no lost characters or wrapper-boundary caret. Save/reload must preserve spacing and the new paragraph's presentation.
- [ ] **Columns:** In the last child of a column, repeat Enter from an empty paragraph. Expect the spacer and new writing paragraph in that same column. Click a spacer in the column and press Enter; the next paragraph must stay in that column. Confirm parent scope in Source after saving and check narrow-pane stacking.
- [ ] **Preserved internal spacing:** In a paragraph, keep real text both before and after an internal blank line, then click elsewhere. Expect that internal line to remain. End-of-block temporary blank rows should be removed. Code, math, table data and literal header examples must remain byte-for-byte unaffected by text-row cleanup.
- [ ] **Selection/menu safety:** Select text across multiple lines or blocks and release the mouse. Expect selection alone not to rewrite source. Select blocks by handles and open their menus. Expect no cleanup to remove selected targets. Repeat with real IME composition; committed text must remain intact.
- [ ] **Asynchronous safety:** Start an upload into an empty paragraph, then move the caret to another block while the upload is pending. Expect cleanup to retain its origin so ordinary successful completion can insert there. Start a cross-document move with destination saving delayed; expect cleanup not to delete a pending moved empty paragraph before persistence finishes.
- [ ] **Preview and portability:** Save text separated by spacers, reopen its Board-hosted preview, export/import native `.orbie`, and export DOCX/PDF. Expect blank rows in preview/Office and retained spacer IDs/source in native files. Clean Markdown should contain blank lines and no structural headers; its external visual spacing may collapse according to Markdown rendering.
- [ ] **Invalid spacer / stale client:** In Source, put ordinary text inside a spacer body and Save. Expect a clear rejection retaining the source; undo/correct it before continuing. If an older tab was kept open before deployment, saving a document that now contains spacers must ask it to reload rather than overwrite them.

## Commit suggestions

- `feat(editor): add non-editable V3 spacer blocks`
- `fix(editor): remove abandoned empty rows and repeated writing hints`

The workspace also contains earlier uncommitted V3 implementation/stability work. Review/stage logical changes deliberately; no commits were created. Remain at stage-6 manual review before starting another phase.
