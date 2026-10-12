# UI review — Remove app focus borders

Date: 2026-10-12. Current review fix; no phase advancement.

## Changes

Removed focus-only Tailwind outlines, rings, and border colors from shared controls, navigation, hierarchy, settings, dialogs, both editor implementations, and database views. Removed corresponding CSS outlines, database cell inset rings, rich-source underlines, and focus-only wrapper borders. The global base focus rule suppresses browser-default outlines.

Ordinary component borders, hover styling, selection/drag indicators, validation errors, background/text focus cues, focus management, and keyboard navigation remain. Updated the UI/UX documentation to record the user-authorized change, which supersedes earlier focus-border guidance. No persistence or migration changes. No commit or push was made.

## Validation

- Targeted `node_modules/.bin/vp fmt`: passed on 46 files; shared UI components retain their existing formatter-excluded style.
- `npm run types:check`: passed.
- `npm run lint`: passed; 395 files correctly formatted and 325 files linted without warnings or errors.
- `npm run build`: passed in 8.73 seconds. Existing chunk-size and ineffective-dynamic-import warnings remain. Log: `/tmp/orbium-focus-build.log`.
- `git diff --check`: passed.
- Source review: no focus-border/ring/outline utility classes remain in app resources.

No automated tests were written or run. Manual interaction verification remains pending.

## Manual checklist

1. Hard-refresh the app. On the sign-in form, use Tab and Shift+Tab through email, password, password visibility, and submit controls. Click and type in both fields. Expected: no focus outline, ring, or focus-only border change; typing, focus movement, and Enter submission still work.
2. After signing in, use Tab through floating controls, tabs, workspace menus, explorer items, and Search Master (`Ctrl + Space`). Open a create/rename dialog and type in its field. Expected: no focus border on controls or surrounding wrappers; menus and keyboard activation remain usable.
3. Open a document and focus its title, body, Contents rail/panel, and editor controls. Edit code, Mermaid, math, a table, and an image caption where available; open a full preview. Expected: no focus border around blocks, source inputs, toolbars, or preview controls; editing and keyboard actions work. Repeat in split panes and a legacy JSON document if available.
4. Open a database in Table and Gallery. Edit a document title and property cells, then focus a gallery card and column menu. Expected: no editing/focus ring or outline; values save normally and ordinary table separators remain.
5. Open Settings, Manage workspaces, the Wallpaper dialog, and Trash. Tab through selects, checkboxes, sliders, search fields, wallpaper tiles, and action buttons. Repeat in Light/Dark and Normal/Frosted appearances. Expected: no focus-only borders in any appearance; selected options, normal borders, hover cues, and validation-error styling remain visible.

## Suggested commit messages

- `style(ui): remove focus borders and rings across the app`
- `fix(ui): remove focus-only control and editor outlines`
