# App viewport fit — 2026-10-28

This report explains the app-wide empty/short-page scroll correction requested during home-page review. It depends on the measured floating navigation spacer, retained-page wrappers, existing theme surfaces, and the Board viewport-sizing hook. The goal is to consume the remaining viewport once, preserving scrolling when actual content is taller.

## Cause and changes

The shell already occupied a viewport, but explorer content separately required nearly another viewport of height before accounting for the app bar, view controls, folder header and outer padding. Filtered-empty feedback had an additional viewport-based minimum. Library also reserved header space inside its page despite already sitting below the app bar. Documents, databases and statistics added their own viewport-fraction minimums.

- Added `resources/css/viewport-layout.css`, loaded after shared feature styles. Normal pages use a flex column through the existing retained-page wrapper, so the header spacer, margins and padding participate in one layout.
- Explorer content grows into the remainder and expands naturally for real cards. Centered no-results feedback uses that remainder without its former viewport/minimum-height allowance.
- Short Settings, Trash and database islands fill available space without a separate viewport minimum. Empty Trash uses smaller padding and centers within the available island space.
- Library removes its duplicate header allowance and bottom padding; its empty state fills the remaining page instead of reserving 330 px independently. Library detail keeps its existing fixed viewport and internal preview/panel scrolling.
- Empty document editors and outline containers no longer reserve 45% of a viewport on top of the document header. Markdown source mode sizes naturally up to its existing 65%-viewport cap, retaining inner scrolling for longer source. Nested code/rich inputs retain their sizing.
- Statistics insights drop their redundant minimum; standalone insights grow naturally instead of imposing another viewport under their back navigation.
- Desktop windows shorter than 760 px use smaller decorative top gaps. No global overflow-hiding workaround was added.
- Board height measurements use document coordinates (`top + scrollY`) so a scrolled browser position does not enlarge the canvas on resize. Existing Board fullscreen and its minimum canvas size remain.
- Split-pane viewport scroll owners and retained editor lifecycle are preserved. Embedded database islands no longer impose their old viewport-fraction minimum.

## Scope and persistence

This is the user-authorized shared sizing correction across existing pages, within the ongoing polish review. No new page features, mobile redesign, migration, persisted content or archive changes. Previously staged changes were left staged; no staging or commit was performed for this correction.

## Validation

- Targeted formatting: passed.
- `npm run lint`: passed; all 865 files formatted correctly, no warnings/errors across 695 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 13.71 seconds. Warnings remain for large chunks, mixed static/dynamic imports, and plugin timing diagnostics.
- `git diff --check`: passed.
- No automated tests or browser automation were written/run. Actual viewport/scroll behavior remains for manual verification.

## Manual checklist

Use desktop windows at 1440×900, 1280×720 and 1024×600, starting at 100% browser zoom. In each case, inspect the browser’s actual vertical scroll range rather than whether the operating system draws an overlay scrollbar.

1. **Empty home:** open an empty workspace, then an empty folder. Expected: no scrollable blank area below the page when visible header/content fits. Expand/close page search and resize the window; controls remain accessible.
2. **No results:** search for an absent title in a populated workspace. Repeat Grid, List, uniform Gallery and natural Gallery. Expected: the large no-results group centers in the available area; wheel input does not move through extra blank space. Clear search and filters restores cards.
3. **Short/long explorer:** inspect a workspace with one card, then enough cards to exceed the viewport. Expected: the short page fits; the long page scrolls to its last card. Repeat in a folder with a cover/title and with long titles wrapping the header.
4. **Documents:** open a blank Markdown document, then a legacy document if available. Check Live Preview, source mode and the opening placeholder. Expected: no additional 45%-viewport blank section below the header; typing and caret visibility still work. Add sufficient paragraphs to overflow; expected: the last paragraph remains reachable. Long source keeps its inner scrolling. Open a code block/table to verify nested editors retain their own sizing.
5. **Databases:** open an empty database in Table and Gallery. Expected: no blank viewport-fraction section below the content. Add enough documents/properties to exceed the visible area; expected: rows and columns remain reachable with their normal scrolling.
6. **Library:** open an empty Library or apply a filter returning no files. Expected: heading, controls and empty state use the space under the app bar once. Populate/scroll a long gallery and open a file. Expected: all files remain reachable; the detail viewer and metadata panel retain their internal scrolling/zoom.
7. **Settings/Trash:** inspect Security, Editor styles, an empty Workspaces list if available, empty Trash, and filtered-empty Trash. Expected: short content fits without blank overflow. Long Appearance/settings forms and populated Trash remain fully reachable by scrolling.
8. **Statistics:** open overview, a side insight, and a standalone insight. Expected: short/loading/empty panels do not force another viewport under their navigation. Long metrics remain reachable; side insights retain their body scroll.
9. **Boards:** open an empty Board, resize the browser, toggle fullscreen and return. Expected: canvas fits beneath navigation with its bottom controls visible. Repeat after navigating from a scrolled long page. Canvas pan/zoom remains independent of browser page scroll.
10. **Tabs/splits:** switch repeatedly between short pages and long documents, reload, and split two documents or a document/database. Expected: normal scroll restoration, independent split scrolling, and access to each pane’s final content; hidden retained pages add no visible scroll area.
11. **Themes:** repeat the home/Library/Trash empty states in Light/Dark and Normal/Frosted. Expected: layout remains the same and surface appearance is preserved.

## Limits and stop

Pages whose actual forms, covers, wrapped navigation or content exceed a short viewport must still scroll. The correction removes redundant layout minimums and padding; it does not clip or scale real content to force it onto one screen. Board’s existing 280 px minimum remains for canvas usability in extremely short windows. Browser acceptance is pending the manual checklist.

Remain in this polish review until the user approves moving on.

Suggested commit: `fix(layout): fit short pages to the available viewport`
