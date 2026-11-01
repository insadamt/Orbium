Summary: Records the follow-up repair for attached empty paragraph rows and Enter-triggered viewport blinking; depends on the stage-6 spacer implementation, checked owner transactions, presentation-aware cleanup and existing deliberate block motion.

# V3 Enter row and blink repair — 2026-10-31

## What the previous repair missed

The user's new screenshot shows a caret on a bare row after a two-line paragraph and before a heading. The previous cleanup deliberately skipped the block containing the caret. Paragraph Enter still created an internal empty final line, so that row could remain until the user exited or left the block. Cleanup also preserved mapped selections after removing whitespace, which could leave a caret at the next hidden header rather than at visible text.

The blinking has a separate concrete code path. Every checked owner operation except a native column edit captured and played document-wide block-motion snapshots. `edit-text`, paragraph exit, spacer advancement and body cleanup therefore entered the same animation machinery as block moves. That machinery creates outgoing/incoming copies and temporarily masks live rows with opacity zero. It also records animation effects for undo/redo. Ordinary Enter must not use that path.

These findings are based on source tracing. No browser reproduction or runtime animation measurement was performed.

## Resulting behavior

- Enter at the end of a nonempty **paragraph** now opens a separate writing paragraph immediately, trimming the previous body's unused trailing rows. Enter in the middle of paragraph content still adds an internal line. Existing list continuation and heading/quote/callout editing rules remain; dedicated code/math/table editors retain their own Enter handling.
- This paragraph-end choice is the implementation interpretation of the user's remaining empty-row complaint. A preference question was presented during the work; no answer had arrived when this interpretation was implemented. The implementation does not claim that the user explicitly confirmed a broader change to every block's Enter rule.
- A compatible following empty paragraph is focused instead of inserting another unused paragraph before it. Presentation differences and opaque bodies keep the checked insertion path. Focus-only navigation creates no new content/history action; existing trailing-row cleanup can then remove the old paragraph's unused tail.
- At a final body without an ending newline, the old-body replacement and following-block insertion share one separator. They no longer each add their own newline and recreate an empty row.
- Enter in an empty paragraph continues the requested spacer behavior: a non-editable spacer plus the next writing paragraph. One current writable paragraph remains available for typing; intentional spacer rows remain.
- Clicking/navigating into an existing unused trailing row of nonempty text now permits cleanup even when the caret remains in that same block. The caret moves to the last visible content position. Internal blank rows before later content and active empty writing paragraphs remain intact.
- Cleanup on blur can update the owner's selection without stealing DOM focus from a toolbar or other control. If the caret was inside removed whitespace, it uses visible-end focus instead of retaining a position mapped onto the next identity header. Otherwise the existing selection is preserved.
- Ordinary body edits, text Enter/exit, spacer advancement, rich-frame typing/Enter and automatic cleanup do not capture/play block-motion snapshots or record those effects for history. Enter and Shift+Enter mark their checked structural operations as quiet, including the projection path. Undo/redo of these new quiet edits does not replay block-move fades.
- Deliberate block operations—such as drag/reorder and menu insertion/deletion—retain the established motion path. Direction/alignment controls retain their separate existing alignment animation. Reduced-motion handling is unchanged.

No file-format, saved-version, backend, database, dependency or migration changes were made. Previous uncommitted work was preserved. This remains stage-6 review.

## Checks actually run

- `npm run types:check`: passed.
- Changed-file `npm exec -- vp check`: passed after formatting, with no formatting issues, warnings or lint errors in the 13 changed source files.
- `npm run build`: passed. Existing large-chunk, mixed-import and plugin-timing warnings remain.
- `npm run lint`: failed on the same 17 pre-existing formatting files listed in the stability repair report. No unrelated formatting cleanup was made.
- `git diff --check` and a changed-file whitespace/summary/size audit: passed. All changed source files have top summaries and remain under 500 lines.
- No PHP source changed, so PHP checks were not repeated for this frontend-only repair.
- No automated tests, fixture runners, Playwright, browser automation, runtime data writes, staging or commits were performed. Manual results below remain unverified.

## Exact manual checklist

Reload the matching editor build first so both the old animation code and its in-memory history entries are gone. Use a disposable V3 document.

- [ ] **Screenshot arrangement:** Put a two-line paragraph before a heading. To retain two lines inside the paragraph, place the caret between existing text and press Enter. Then press Enter at the paragraph's actual end. Expect a separate current writing paragraph and no additional empty row attached to the old paragraph. Type immediately; it must appear in the current writing paragraph.
- [ ] **Existing bare row:** In Source, give a nonempty paragraph an extra trailing blank line before the next header. Return to Live and click/navigate into that blank row. Expect the unused row to disappear and the caret to rest at the paragraph's visible text end. Type one character; it must appear there, without a structural-boundary rejection.
- [ ] **Leaving/blur:** Add an unused trailing row to a nonempty paragraph, then click another block or a toolbar control. Expect the row to be removed without stealing focus. Re-enter the editor and type; the caret must be in visible content. Selecting text across rows must not trigger cleanup or remove selected content.
- [ ] **Immediate paragraph and reuse:** Type `Alpha`, press Enter once, and type `Beta`. Expect separate paragraph IDs, each with its text. Repeat Enter at `Alpha` when a compatible empty paragraph already follows it; Source should show reuse of that paragraph rather than another empty ID inserted before it.
- [ ] **Unterminated final body:** In Source, remove the final newline after the last paragraph's text. Return to Live, put the caret at its text end and press Enter. Expect one separate writing paragraph and no doubled separator/extra row in the preceding body. Repeat with a styled final paragraph.
- [ ] **Spacing:** From an empty paragraph press Enter repeatedly, then type. Expect the intended non-editable spacer rows and one current writing target. Clicking a spacer and typing must not edit it. Spacers must not be mistaken for unused trailing paragraph rows and deleted.
- [ ] **No blink:** Keep several paragraphs, headings and rich blocks visible. Press Enter repeatedly in text and in an empty paragraph; repeat Shift+Enter. Existing rows must remain visible throughout. Blocks below may move to accommodate new content, but must not disappear/pop as animated copies. Repeat in a column and from a rich frame.
- [ ] **Dedicated inputs:** Type several lines inside code, table cells and math-source inputs. Expect their specialized Enter behavior and no document-wide fade. Root paragraph Enter must not change dedicated code newlines or remove blank lines inside code.
- [ ] **Undo/redo:** Undo/redo paragraph-end Enter, an internal paragraph line break, spacer advancement and a rich body edit. Expect correct content/IDs and no block-move fade for these new quiet edits. A focus-only jump into an existing empty paragraph must not add an artificial content undo step.
- [ ] **Preserved motion:** Drag/reorder a block, use a block menu to insert/delete one, and change alignment. Expect their established command-specific animations to remain. With reduced motion enabled, the existing reduced-motion behavior must remain.
- [ ] **Style, columns and persistence:** Repeat paragraph-end Enter and tail cleanup in aligned/directed text, a column and a Board-hosted Document. Expect compatible paragraph presentation, correct scope and stable focus. Save, wait for Saved and reload; expect no surplus old paragraph tail and no lost text.
- [ ] **Guarded content:** Repeat with a pending upload, linked move and real IME composition. Cleanup must keep protected origins/drafts intact. Internal blank lines with real text after them must remain; unsupported opaque presentation should retain source rather than being flattened.

## Commit suggestions

- `fix(editor): keep Enter and body edits out of block motion`
- `fix(editor): remove attached empty rows and preserve visible caret focus`

No commits were created. Remain at stage-6 manual review; do not start a later phase based on static checks alone.
