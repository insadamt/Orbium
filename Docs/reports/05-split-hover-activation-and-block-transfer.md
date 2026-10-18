# Phase 5 review — pointer activation and split block transfers

Date: 2026-10-18.

## Problem and change

Markdown editability was tied to the active tab. Every split therefore had one non-editable editor, while block transfer correctly rejected non-editable destinations. Linked undo/redo also required both editors to be editable. The same activity gate prevented block hover controls in the companion until a click selected it.

Markdown editability now follows visibility; both visible native split editors can accept block transfers and linked history operations. Hidden editors remain non-editable, while read-only, visibility, workspace, and document-identity transfer guards remain in place. Current-pane activity still selects the sole owner of document-wide shortcuts and background work. Activity handling is extracted into a small hook so the editor source remains below 500 lines.

Mouse or pen movement over a document surface selects the pane and focuses its editable body with preventScroll. Empty pane gaps and outer background do not change selection. Touch retains click activation, and keyboard focus retains the existing activation path. Hover activation is suppressed while buttons are held, preserving pointer capture, text selections, and block drags. Successful cross-document drops focus their destination, making it the current pane for subsequent editing.

Independent pane scrolling, outside-document synchronized scrolling, and TOC behavior remain intact. No backend, dependency, migration, or persisted-format changes. No commit created. Existing editor/media/transfer work in the shared working tree was preserved.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; formatting checked 557 files and lint checked 463 files without warnings or errors.
- `npm run build`: PASS (13.71 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- Changed source files remain under 500 lines; the Markdown editor is 483 lines after extracting activity handling.
- No automated tests were written or run, per user instructions. Manual browser acceptance remains pending; the checks above do not verify pointer interaction or block transfer visually.

## Manual checklist

Use two disposable Markdown documents A and B in the same workspace, both in Live Preview, with several separated paragraphs and headings.

1. Select A, then move the mouse over a block in B without clicking. Expected: B becomes the selected pane, its block controls respond to hover, and neither pane jumps vertically. Move back to A; expected the same behavior there. Moving over the gutter or empty space outside the document surfaces does not change the current pane.
2. Place different caret positions in A and B. Hover from one document to the other and type a short marker; try Ctrl+F and Ctrl+S. Expected: editing and document-wide shortcuts target the pane under the pointer, with a single search/save response. Touch/click and keyboard focus still select panes.
3. Select A and drag a paragraph by its grip into B without clicking B first. Expected: the insertion line appears in B, the block moves exactly once, and B becomes current after drop. Repeat B → A. Hover switching must not cancel the captured drag while the button is held.
4. Drop at the start/end of B and into an empty B. Repeat with a list, table, code block, Mermaid, image, and PDF/video block. Expected: complete source and presentation survive; existing transfer motion and retained previews still work. Moving the last source block leaves an editable empty page.
5. Undo a move once in the destination, then redo. Repeat from the source after hovering into it. Expected: both documents reverse/reapply the move together without requiring both panes to be selected at once. Newer unrelated edits retain their existing history safeguards.
6. During a drag, wheel and hold near the destination pane's edges, then drop; cancel another drag with Escape or outside both editors. Expected: destination scrolling and insertion remain accurate, successful moves happen once, and cancellation leaves both documents unchanged.
7. Drag a text selection across the divider. Expected: holding a button does not switch the active editor or cancel selection. Release and move the pointer normally; expected: hover activation resumes.
8. Switch to an ordinary tab while both documents are retained, then return. Expected: hidden editors do not respond to typing or accept transfers. Source mode, legacy pages, other workspaces, and another view of the same document remain invalid block-transfer destinations.
9. Scroll A, B, and the gutter; navigate with each TOC. Expected: document scrolling stays independent, outside scrolling moves both, and each TOC navigates only its own pane. Repeat core hover/move behavior with reduced motion and after reloading a saved split.
10. Wait for both Saved indicators and reload. Expected: transferred blocks exist only in the destination and all edits persist.

Suggested commit: `fix(editor): enable split block transfers and pointer-following activation`

Remain in Phase 5 for manual review.
