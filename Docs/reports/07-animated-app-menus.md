# Animated application menus

Phase 7 — UI polish, requested 2026-10-14.

## Implemented

- Installed `@animate-ui/components-radix-dropdown-menu` using the requested shadcn command and registered the Animate UI registry. Source reference: [Animate UI dropdown menu](https://animate-ui.com/docs/components/radix/dropdown-menu).
- Kept the installed sources under `resources/js`, splitting the highlight and dropdown primitives by responsibility so each new source file stays below 500 lines.
- Routed workspace/account, page-media, Library, database/property, document-action and Trash dropdowns through one shared adapter with the existing frosted surface, 200 ms fade/scale entrance/exit, and animated item highlights.
- Replaced explorer, navigation-tab, Library, editor-block and table-axis context menus with the same menu components. Block conversion, alignment and direction use submenus.
- Replaced shared application selects and native export selects with dropdown radio choices and selection indicators. Code-language controls use the shared selector through an explicit DOM/React mount with update and cleanup methods.
- Migrated the text-color popup, retaining custom color selection and captured editor selection. Slash/mention suggestion lists retain their completion semantics and receive matching entrance motion.
- Added Lucide action icons, kept disabled choices noninteractive, and disabled menu movement/highlight transitions when the OS requests reduced motion.
- Preserved the existing explorer layout edits and the intent of its focus-without-scrolling correction.

## Persistence and commits

No migrations, document format changes, or archive changes. No commit created.

Suggested commit messages:

- `feat(ui): unify app menus with Animate UI dropdowns`
- `feat(ui): add animated context menus and selection controls`

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; formatting and lint report no warnings/errors.
- `npm run build`: PASS, with bundle-size and ineffective dynamic-import warnings.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, as instructed. Browser behavior remains for the user's manual review.

## Manual test checklist

Use disposable pages/files for destructive-action checks.

1. Open the workspace and account menus; move the pointer between entries, switch a workspace, and open Settings/Trash. Expected: the same fade/scale motion, a moving highlight, visible action icons, and the selected destination opens.
2. In workspace/folder Grid, List and Gallery, right-click a page and empty space. Test Open, Open in new tab, Rename, create actions and Export. Expected: appropriate actions, viewport-aware positioning, no card movement or page scroll on menu focus, and successful actions. Open Delete and cancel its confirmation; the page stays present.
3. Right-click a navigation tab and toggle Pin/Unpin. Press Escape after reopening. Expected: the pin state changes; Escape closes the menu and returns focus without scrolling.
4. Open Library file overflow and right-click menus. Test details, download and rename. Open Delete and cancel. Expected: both menus share motion and icons; unavailable downloads stay disabled; confirmation remains required for deletion.
5. Open database column/document menus and Select/Multi-select property pickers. Sort/reorder a column, choose/clear an option, create a new option, and choose multiple values. Expected: existing behavior remains, selected values are indicated, and multi-select stays open where its action prevents closing.
6. Open shared selects in database filters/view settings, Library filters, workspace navigation and appearance backgrounds. Scroll long choice lists and choose with Arrow keys/Enter. Expected: choices remain reachable, the current value is indicated, disabled choices cannot be chosen, and changes persist as before.
7. Open Export, change Orbium/Markdown/Word/PDF, then change paper size and orientation for an office format. Switch to Package. Expected: all choices use the animated dropdown; office formats are unavailable in Package; selections reach the export request. During export, controls remain disabled.
8. In a document, open the block menu and its Turn into, Text alignment and Text direction submenus. Try Move up/down, Duplicate, Copy and Delete on a disposable block. Expected: commands affect the intended block, boundary actions stay disabled, submenus remain usable, and the editor receives focus on close.
9. Open table row and column handle menus; sort, move and insert/delete a disposable row/column. Expected: the intended axis changes, protected actions stay disabled, drag behavior still works, and the selected-axis styling clears after dismissal.
10. Change a code block's language, type in it, switch pages/tabs and return. Expected: language labels/icons and syntax highlighting update; editor content and selection remain intact. Unknown language labels remain available.
11. Select document text and apply a preset color, custom color, then Default. Expected: only the captured text range changes; the picker remains usable; preset/custom colors stay visible. Type `/` and a mention to check that completion lists still filter and insert correctly.
12. Open menus near all viewport edges in light/dark themes and an RTL document. Use Arrow keys, Home/End, Enter, Escape and outside clicks. Scroll the page while a context menu is open. Expected: menus stay on screen, focus remains usable, context menus dismiss on page scroll, and internal menu scrolling does not dismiss them.
13. Enable the OS reduced-motion setting and repeat workspace/select/submenu interactions. Expected: movement and highlight travel are removed while every action remains available.

## Review boundary

This change remains within the requested Phase 7 menu polish. Manual visual and interaction acceptance is pending. No later phase was started.
