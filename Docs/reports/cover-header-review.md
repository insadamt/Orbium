# Cover header layout review and Library media editing

## Scope

Current branch: `codex/database-portrait-header`. Implements the user's approved alignment, sizing, wrapping-title, and media-control details, plus the agreed placement of database controls and document properties.

## Changed

- Side headers vertically center the icon above the title beside the cover.
- The existing image height bounds and aspect-ratio preservation remain in place.
- A shared auto-sizing title textarea supports wrapped titles on documents, folders, and databases. Enter or blur saves; pasted newlines become spaces. Width changes resize the field without clipping text.
- Database views and action buttons are back in their full-width row immediately above Table/Gallery, outside the cover/title header.
- Document properties are below the entire header and above the editor at normal document width. Their existing collapse control remains available; a long property list no longer stretches the side header.
- Cover Edit remains attached to the displayed image.
- The page-media menu is controlled and non-modal. Opening Library explicitly closes it and suppresses dropdown focus restoration while the picker opens. This addresses the modal dropdown/dialog handoff that can leave media controls blocked after Library selection.
- Narrow panes retain the existing stacked fallback: cover, icon/title, properties where present, then content. The user asked what this meant; no new narrow-pane design was introduced.

## Validation

- Targeted source/CSS formatting: passed.
- npm run types:check: passed.
- npm run lint: passed, including repository formatting; no warnings or lint errors.
- npm run build: passed with bundle-size, static/dynamic-import, and plugin-timing warnings.
- git diff --check: passed.
- Automated tests: not written or run, per project instructions.
- Visual and interaction confirmation: requires the user's manual checklist below, especially the reported Library interaction.

## Manual checklist

1. Open document, folder, and database pages with landscape or square covers in a wide window.
   - Expected: cover left; icon above title on the right; their combined group is vertically centered beside the image. Images retain their proportions and height limit.
2. Enter a long title on each page type. Save with Enter, refresh, then narrow/widen the page.
   - Expected: title wraps without clipping, persists, and grows/shrinks to fit the available width. Enter saves rather than inserting a newline.
3. Open a database and switch Table/Gallery, open Filter/Sort/settings, and create a document.
   - Expected: all controls remain in a full-width row directly above the data view for both wide and side headers, and keep their existing behavior.
4. Open a database document with many properties, expand/collapse Properties, and edit a value.
   - Expected: properties span the normal document width below the complete header and above the editor; they do not lengthen the right-hand header column. Values still save.
5. For each page type, select a cover through Edit → Choose from Library. After Saving finishes, reopen cover Edit without refreshing. Choose a second Library image, then use Change cover and Reset to default.
   - Expected: Edit reopens every time, replacement/upload/reset remain usable, and the rest of the page remains clickable.
6. Repeat the previous step for icons on each page type, including replacing an icon twice and resetting it.
   - Expected: icon Edit remains usable after every Library selection without refreshing.
7. Open Library from a cover or icon menu and cancel/close it, then reopen Edit using both pointer and keyboard.
   - Expected: no blocked page or leftover modal layer; the menu and picker can be opened again.
8. Change a cover between panoramic, landscape, and square, and refresh after saving.
   - Expected: arrangement follows the image shape, controls stay reachable, and saved media persists.
9. Use a narrow window or split pane below 600px of header width.
   - Expected: the header stacks vertically without horizontal overflow; title wraps, properties remain below it, and database controls remain above the table/gallery.

## Compatibility and commits

No migrations, dependencies, saved-format changes, or commits.

Suggested messages:

- `feat(headers): refine cover layouts and support wrapping titles`
- `fix(media): keep edit menus usable after Library selection`

## Stop

Code checks complete; awaiting manual review. No phase advancement.
