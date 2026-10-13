# Library context menu and hidden bulk controls

Date: 2026-10-13. Current Library review; no phase advancement.

## Implemented

- Temporarily hid bulk selection entry points and actions: toolbar Select/Done, card Select/Deselect, selection circles, selected-count guidance, Select loaded/Clear, and bulk Delete.
- Retained single-file management in three-dot menus and details, and retained single selection with Use image/file in reuse pickers. Server-side bulk validation remains implemented.
- Added right-click menus to Library cards with View details, Download, Rename, and protected Delete review. Missing files cannot be downloaded.
- Added Shift+F10/Context Menu key opening, arrow/Home/End navigation, Enter/Space activation, Escape dismissal with focus restoration, outside-click dismissal, and closing on scroll/resize. Menus are positioned inside viewport edges.
- Reused existing Library menu and dialog appearance. No dependencies, migrations, or persistent data changes.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed formatting and lint checks.
- `npm run build`: passed; existing large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Manual runtime acceptance is pending.

## Manual checklist

1. Open Library and inspect the toolbar and card menus. Expected: no Select/Done, Select/Deselect, selection circles, or bulk action bar. Clicking a card opens its details.
2. Right-click an image and a non-image file. Expected: a menu appears at the pointer with View details, Download, Rename, and Delete. Right-click near the bottom/right edge: all actions remain within the viewport.
3. Use View details and Download. Expected: the correct file opens/downloads, and Back to Library retains gallery filters and remembered position.
4. Rename through the context menu. Expected: the existing centered dialog opens for the correct file, saving updates the gallery, and Cancel/Escape returns focus to the card.
5. On a disposable unused upload, open Delete and cancel. Expected: the normal review dialog opens and nothing is deleted. Confirm on that disposable file: only that file is removed. Repeat review on a used file: saved usage blocks deletion.
6. If a missing-file entry is available, right-click it. Expected: Download is disabled; other actions remain available.
7. Focus a card and press Shift+F10 or the Context Menu key. Use arrows, Home/End, Enter/Space, then Escape. Expected: actions are keyboard usable, disabled Download is skipped, and Escape restores card focus. Click outside, scroll the gallery, or resize: the menu dismisses.
8. Open a Library reuse picker from image/file insertion or cover/icon selection. Expected: select one file and Use image/file still work; no management context menu or bulk actions appear there.
9. Check Light/Dark and touch interaction. Expected: context-menu text/focus remain readable and the three-dot menu remains available for touch users.

## Commit suggestion

No commits created.

`feat(library): add item context menus and hide bulk actions`
