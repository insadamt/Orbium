# Document columns report

Summary: Records the approved side-by-side Document-block implementation, compatibility boundaries, actual static checks and exact manual acceptance steps. It depends on `../phases/16-document-columns.md`, the CodeMirror editor and the existing Markdown persistence/transfer contracts.

## Phase

`Document columns — first feature slice`, approved on 2026-10-30 with “okey go ahead do it”. Stop here for manual review.

## Implemented

- **2 columns** / **3 columns** in the slash menu; `/columns` filters both choices. Insertion uses the existing rich-block activation to focus the first column.
- Side-drop creation of two-column layouts, a vertical drop indicator, insertion/reordering inside columns, same-document transfers between column bodies and returning individual blocks to Document flow.
- Two/three independently editable Markdown block stacks using existing writing shortcuts, selection formatting/colors, inline icons, mentions, Library/upload insertion and rich block controllers. Column histories publish to the owner Document rather than creating independent undo stacks.
- Divider pointer previews with one accepted history change, keyboard resizing, minimum widths, Escape/cancel/blur handling, **Add column**, **Equal widths** and **Stack blocks**.
- Container-based stacking in narrow Documents, split panes and hosted Document cards. Two columns stack at 520px or less; three at 680px or less. Saved widths survive stacking.
- Read-only column rendering for linked Document previews, contextual controls and reduced-motion treatment.
- Versioned `columns`/`column` Markdown directives, server/client width validation, child-count/parent validation, nesting rejection and a stale-client capability guard. The guard parses actual directives and ignores code samples, including escaped JSON spellings of directive kinds.
- Column text follows existing recursive search, attachment, mention and statistics processing. Nested text search highlighting follows the owner search query; H1/H2 headings participate in the existing Document outline and use mounted column positions for navigation.
- Formatting-preserving native exports/packages retain layout; standard Markdown and Word/PDF use the existing readable column-order fallback. Export format descriptions explain that fallback.

## Commits

No commits created. Changes remain available for review.

Suggested commit messages:

- `feat(editor): add side-by-side document columns`
- `feat(documents): support resizable Markdown column layouts`

## Migrations and persistent formats

- No database migration.
- Document content format remains 2. New reserved `columns` metadata requires `version: 1` and two/three integer widths of at least 1500, totaling 10000.
- Column count must equal the width count. Only direct `column` children are accepted. Empty bodies are valid. Nested column layouts and orphan column directives are rejected.
- Markdown save requests advertise `editor_features.columns: 1`. A client missing this capability cannot overwrite a saved columns Document or introduce one; the response asks it to reload.
- Native `.orbie`, package and account-archive envelope versions are unchanged. Older servers reject the new reserved directive rather than flattening it.
- Deploy matching server/frontend and reload open editors.

## Actual validation

| Check | Actual result |
|---|---|
| Changed frontend formatting/lint (`vp check` on all 26 changed TS/TSX/CSS files) | PASS: all 26 formatted; no warnings/lint errors in 24 lintable files |
| `npm run types:check` | PASS |
| `npm run build` | PASS, final build completed in 20.07s; chunk-size, ineffective dynamic import and plugin timing warnings remain |
| `./vendor/bin/pint --test` | PASS (PHP formatting check) |
| `php -l` on all four changed PHP files | PASS |
| `git diff --check` | PASS |
| `npm run lint` | FAIL: formatting issues in 14 unchanged existing files, listed below |

The full-lint failures are in `resources/css/explorer-views.css`, `resources/css/workspace-navigation.css`, the Board files `board-keyboard.ts`, `board-properties-panel.tsx`, `board-shape-block.tsx`, `board-shape-data.ts`, `board-shapes.css`, `board-toolbar.tsx`, `use-board-tools.ts`, the navigation files `workspace-navigation-preferences.ts`, `workspace-navigation-settings.tsx`, `workspace-sidebar-tree.tsx`, `workspace-sidebar.tsx`, and `resources/js/layouts/app-layout.tsx`. Those paths have no working-tree diff; they were left unchanged rather than mixed into the columns feature.

No automated tests or browser automation were written or run. Browser interaction and visual acceptance remain unverified until the user follows the checklist below.

## Manual validation checklist

Use a disposable Markdown Document in Live Preview. Reload the app first so the client advertises the new capability. Use a desktop document content width above 680px for the side-by-side steps.

1. On an empty line type `/columns`, choose **2 columns**, and press Enter.
   - Expected: two equal-width editable columns; the caret enters the first. Ordinary writing before/after the layout remains available.
2. Write a heading and two paragraphs on the left; write a checklist on the right. Use Enter, lists and Ctrl/Cmd+B / Ctrl/Cmd+I both before typing and on a selected phrase.
   - Expected: normal Markdown writing/formatting works independently in each column without changing the other body or moving its caret.
3. Add an image on one side through `/image` and the Library/upload flow, then a caption. Add a code block or table on the other side. Also try an inline icon and a page mention.
   - Expected: existing block controls work; media fits the column; long code/table content stays usable; icon formatting and page navigation retain existing behavior.
4. Wait for **Saved**, then reload.
   - Expected: all content, references, captions and the two-column layout return without duplication or missing blocks.
5. Hover/focus the layout and choose **Add column**. Put a short paragraph in the third column. Separately insert `/3 columns` below the first layout.
   - Expected: three equal columns; no fourth-column action. Both layouts edit/save independently.
6. Drag a divider left/right and release. Focus it with Tab and use ArrowLeft/ArrowRight, Shift+Arrow and Home. Use **Equal widths** afterward.
   - Expected: columns resize live, text reflows and neither adjacent column becomes smaller than 15% of the available column content width. Keyboard steps work; Home balances that pair; Equal widths balances the layout.
7. Begin another divider drag, press Escape, and repeat with window blur while dragging.
   - Expected: the unaccepted preview returns to its saved widths, without adding an undo step. Pointer cancellation also cancels.
8. Resize a layout, then undo/redo from within a column using Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y). Repeat after adding a third column and after typing.
   - Expected: the owning Document restores the previous content/layout with no independent column-history trap. One accepted resize or layout transfer is one undo action.
9. Add two ordinary paragraphs outside the layouts. Drag one by its grip to the left/right edge of the other until a vertical indicator appears, then release. Try the middle of another block separately.
   - Expected: a side drop creates two columns containing the original complete blocks. A middle/top/bottom drop keeps ordinary vertical reorder behavior.
10. Drag an ordinary heading/list/image into an existing column. Drag it between columns and reorder it within a column. Drop into an empty column and into blank space beneath a shorter column.
    - Expected: the horizontal indicator identifies the target; exactly one complete block moves, including nested list content and metadata. Source/target changes undo together.
11. Drag a block from a column above/below an ordinary Document block. Move several ordinary blocks into columns consecutively.
    - Expected: individual blocks can leave columns without being copied or lost. Repeated transfers do not accumulate extra empty paragraphs in the ordinary flow. Empty layout columns remain available for writing.
12. During a block drag, press Escape or release outside a valid destination. Repeat a valid drag while using wheel/edge scrolling.
    - Expected: cancellation changes no content; scrolling follows the Document and the indicated destination stays usable.
13. Choose **Stack blocks**, then undo/redo and reload after saving.
    - Expected: the layout becomes ordinary blocks in left-to-right column reading order, including all nonempty content. Undo restores columns; redo restores the stack; reload preserves the accepted result.
14. Open the Document in split view and narrow its pane, or narrow the window. Check both two/three-column layouts, then widen again.
    - Expected: layouts stack at the documented container widths without horizontal page overflow; reading order stays stable; widening restores saved proportions. Another pane's layout is independent.
15. Find a distinctive word from each column using document search. Check global search and existing attachment/mention references after saving.
    - Expected: column text is counted/found; matching text inside editable column bodies is highlighted. Saved media/page references remain associated with the Document.
16. Check the outline rail after adding H1/H2 headings in several columns.
    - Expected: every column heading appears in column reading order; choosing a visible/mounted heading scrolls to that heading in its own column. A layout outside the rendered viewport uses the owner Document position until its column surface mounts.
17. Export `.orbie`, then a package including its media and related pages, and import into a disposable destination. Export standard Markdown; export Word/PDF if the local converter is configured.
    - Expected: native exports/imports preserve columns and widths; included references remap. Markdown/Word/PDF retain the content stacked in column order. A standalone export's omitted assets use the existing missing-reference behavior.
18. Open the Document from a Board linked-page card in preview/edit modes. Also switch Source/Live Preview, tabs and light/dark appearance on the normal Document.
    - Expected: hosted preview shows columns or responsive stacks; editing uses the same owner saves/history. Source exposes explicit directives; returning to preview retains all content. Controls/selection remain legible and hidden tabs do not accept edits.
19. In a column type `/columns`, then try pasting a real column directive copied from another layout. Separately try pasting that syntax inside a fenced code block.
    - Expected: nested layout commands are absent; a real pasted nested layout is rejected with a notice and existing content stays intact. Literal code samples remain editable text.
20. Use an IME/composition input in a column, including a rich block that supports composition. Wait for saving, reload and check text. Enable OS reduced motion and repeat hover/drag/cancel actions.
    - Expected: composition finishes without stale source replacement or premature saving; accepted text survives reload. Reduced motion removes the new control transitions without affecting editing.
21. Optional compatibility check in developer tools on the disposable Document: copy a current Markdown PUT, remove `editor_features.columns`, and send it against the saved columns Document, including an attempted body replacement with plain text.
    - Expected: 422 with a reload message and unchanged saved source/revision. The ordinary current client can intentionally delete/stack columns and save.

## Known limitations

- This slice targets Markdown/CodeMirror Documents, including hosted Documents. Legacy format-1 Documents and native Board objects do not gain a new column schema.
- Two/three columns only; no nested layouts or new page-width setting.
- Individual column transfers stay within the same Document. A complete layout remains an ordinary rich block for existing cross-document split dragging.
- Cross-column transfers reconstruct rich previews; active media playback state is not transferred between column editors.
- Standard Markdown and Word/PDF flatten the layout deliberately; they do not round-trip column widths.
- Outline navigation resolves exact nested positions for mounted column layouts. A layout outside the rendered viewport initially uses its owner Document position until the column surface mounts.
- Visual interaction, pointer placement, hosted/IME behavior and export round trips still require the user's manual acceptance. Static checks are not browser verification.

## Review corrections

Static review corrected ownership checks so nested editor offsets cannot target an outer block, deferred nested React disposal, installed the inline-formatting state required by the existing writing shortcuts, preserved source when directives are incomplete, and placed the compatibility guard exclusively on the Markdown endpoint. No saved user data was changed during implementation.

## Stop gate

Remain in Document-column manual review. Fix reported problems within this feature phase; do not start another phase without explicit approval.
