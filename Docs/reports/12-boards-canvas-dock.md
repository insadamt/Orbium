# Board phase 4 review — Expanded canvas and drawing dock

Date: 2026-10-24. Requested during the existing Board phase-4 review. No later
product phase started.

## Changes

- Removed the visible Board title/header row and gave its height to the canvas.
  Board details still provides title, icon and appearance editing. App tabs retain
  the Board title. Fullscreen and Options float at the top right.
- Moved creation tools and Undo/Redo into a centered left glass pill with circular
  controls, a filled monochrome active state, focus styling and right tooltips.
  Add is icon-only, identifies the active placement kind and opens to the right.
- Removed the heading portal/host plumbing; tools now belong to the Board stage.
  The dock overlays the canvas without consuming its width or shifting content.
- Replaced the broad bottom drawing panel with a slim palette beside the dock.
  Pen, Highlighter and Eraser use small original SVG illustrations inspired by
  the supplied reference, retaining Orbium's restrained glass and line styling.
  Pen nib/highlighter tip follow the chosen ink; active/hover tools extend gently.
- Retained labeled drawing controls, ink checkmarks, visual width presets,
  smoothing, stroke preview, Done, keyboard dismissal and whole-stroke guidance.
- Bounded dock/palette heights scroll on short viewports. Coarse-pointer controls
  remain at least 42px; ink uses a three-column grid for those pointers. Reduced
  motion disables palette and illustrated-tool movement.
- Simplified fullscreen CSS so it uses the same floating layout without title
  space. Kept mounted editors/camera and existing fullscreen transition logic.

## Compatibility and scope

Presentation only: no backend, migration, API, dependency, drawing algorithm or
saved-content changes. Spatial format remains 5. Unrelated pre-existing working
changes were preserved. No commit was created.

## Validation

- Focused formatting: passed.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed; 713 files correctly formatted, no warnings/errors in
  601 analyzed files.
- `npm run build`: passed (exit 0). Existing ineffective-dynamic-import,
  large-chunk and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run. No Playwright/browser automation used.
- No PHP changes in this task; PHP checks/migrations are not applicable.

An initial portal-removal syntax error was caught by formatting/type/lint checks,
corrected, and the final checks above passed. Browser layout, touch feel and
visual acceptance remain unverified. Short canvases require scrolling the dock
or palette. No performance improvement is claimed.

## Manual test checklist

Reload the frontend and use a disposable Board.

1. **Expanded canvas:** open the Board. Expect no title row above the canvas,
   a vertically centered left tool pill, top-right Fullscreen/Options and
   bottom-right zoom. Existing objects should retain their saved positions.
2. **Tool placement:** hover Select, Hand, Text, Draw, Add, Undo and Redo. Expect
   right-side tooltips and visible focus/active states. Choose Text and click free
   canvas space: expect a text block at the clicked location. Finish editing,
   open Add, select a heading and click again: expect correct heading placement.
   Add should open beside the dock and identify its active placement tool.
3. **Drawing palette:** choose Draw. Expect the narrow glass palette beside the
   dock with illustrated Pen/Highlighter/Eraser, without a canvas shift. Hover and
   select each tool: expect clear selection and gentle illustration movement.
   Eraser should replace brush settings with whole-stroke guidance.
4. **Brush settings:** select Pen, Blue and Bold (6px), then draw. Expect blue
   ink and an updated preview/selected swatches. Select Highlighter and draw over
   it: expect translucent broad ink. Change Off/Light/Strong and draw again:
   expect the existing direct/gentle/strong smoothing behavior. Older ink should
   remain unchanged when settings change.
5. **History and dismissal:** erase a stroke, then use Undo and Redo in the dock.
   Expect whole-stroke removal/restoration. Choose Done: expect Select and a
   hidden palette. Reopen Draw and press Escape while idle: expect Select. Start
   drawing and press Escape before release: expect only that gesture canceled.
6. **Canvas interaction:** use Hand, Space+drag, zoom and Fit all. Expect ordinary
   pan/zoom behavior and controls staying fixed on the surface. Switch to Select,
   move/resize a stroke and edit a text block: expect existing behavior and tools
   disabled while editing. Finish editing to restore creation controls.
7. **Metadata/fullscreen:** open Options → Board details and rename the Board.
   Expect normal metadata saving and the tab title updating. Close the dialog:
   expect focus to return to Options. Enter fullscreen, draw/pan, then exit.
   Expect floating controls in both layouts, no reserved heading gap, and the
   live canvas/editor preserved. Check favorite toggling in Options.
8. **Responsive/accessibility:** repeat at roughly 375px width and a short window,
   in light/dark appearances, with coarse pointer and reduced motion settings.
   Expect usable palette/dock scrolling, no horizontal page overflow, readable
   tool labels/colors, 42px coarse targets and no brush/palette travel with reduced
   motion. Tab through controls and activate them with Enter/Space.
9. **Persistence:** draw several strokes, wait for Saved, reload the Board.
   Expect all strokes, positions, colors and widths retained. Brush settings
   remain session-local as before.

## Commit suggestions

- `feat(boards): expand canvas and add a centered vertical tool dock`
- `feat(boards): refine the drawing palette with illustrated brush controls`

## App-style and transparency correction — 2026-10-24

User review requested closer app styling, fixing transparent backgrounds and
removing unnecessary buttons/text. This correction supersedes the glass/circular
active styling and Done/footer/preview descriptions in the original report above.

- Changed the dock to rounded rectangular app controls with a quiet accent active
  state, normal border and restrained shadow. Retained the centered left position.
- Added `board-surfaces.css` to give Board overlays opaque theme card/popover
  backgrounds even under the app's global frosted rules. Included floating actions,
  selection/formatting surfaces, drawing palette and portal-rendered Add, view,
  smoothing and context menus. Canvas background is solid. Other app pages retain
  their appearance settings.
- Removed the repeated Drawing heading, Done button, footer/hints, eraser paragraph,
  separate brush sample and selected-ink name. Kept the illustrated tools and their
  labels, accessible tooltips, ink checks, exact width and Smoothing label.
- Shortened smoothing choices to Off / Light / Strong. Removed the duplicate Reset
  menu item; the zoom percentage button still resets the view.
- The active Draw button now returns to Select. Select and idle Escape still exit
  drawing, including for touch users without a keyboard via the dock.
- No dependencies, persisted fields, schema, drawing algorithms or backend changes.
  No commit created; unrelated working changes preserved. Remain in phase 4.

### Actual checks

- Focused formatting: passed.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed; 714 files formatted, no warnings/errors in 601 files.
- `npm run build`: passed (exit 0), 16.99 seconds. Existing dynamic-import,
  large-chunk and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests or browser automation written/run. Browser visual acceptance
  remains pending. PHP checks/migrations do not apply to these frontend changes.

### Manual correction checklist

1. Open a Board in light and dark appearances. Expect the left dock to use the
   app's rounded rectangular controls, soft active background and subtle border.
2. Place text/drawings under the controls, then enable frosted appearance. Expect
   the dock, drawing palette, selection controls and top-right actions to remain
   opaque; text/grid/ink beneath them should not show through. Pan and zoom:
   expect a solid canvas background and controls fixed in place.
3. Open Add, View options, Smoothing and right-click the canvas. Expect readable,
   opaque menu backgrounds in both normal and frosted appearance settings.
4. Click Draw. Expect illustrated Pen/Highlighter/Eraser and compact color/width/
   smoothing controls, with no Drawing title, Done, footer or separate sample.
   Select Eraser: expect only the tool choices, without irrelevant brush settings.
5. Change color/width/smoothing and draw. Expect selected checks and width updates,
   correct new ink, and existing strokes unchanged. Erase a stroke; Undo/Redo
   should restore/remove it as before.
6. Click the active Draw button: expect Select and the palette hidden. Reopen and
   exit through Select, then repeat with Escape. Start an unfinished stroke and
   press Escape: expect only that stroke canceled, keeping drawing active.
7. Zoom in and click the percentage: expect reset to 100%. View options should
   omit its former duplicate Reset item while retaining fit/grid/snap/help.
8. Repeat at a narrow width and short height, in fullscreen and reduced motion.
   Expect reachable controls through scrolling, no page overflow, visible keyboard
   focus and no illustration/palette movement with reduced motion. Save/reload:
   expect existing drawings retained.

### Updated commit suggestions

- `fix(boards): use opaque app-style toolbar surfaces`
- `refactor(boards): simplify drawing controls and remove redundant chrome`
