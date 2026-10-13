# Phase 7 review — Unified frosted glass

## Implemented

The user requested the same frosted glass across all app components after
rejecting stronger opacity. Shared app surfaces now use the original panel
treatment: light `rgb(250 250 251 / 61%)`, dark `rgb(3 6 9 / 53%)`, 26px blur,
140% saturation, transparent outer borders, and no surface shadow.

- One surface token and one filter token replace panel/raised/inset variations.
  Previous token names alias the shared surface for compatibility.
- One component stylesheet covers floating shell/cards, explorer controls and
  labels, Settings controls, Wallpaper/editor-style dialogs, editor toolbars and
  slash menus, outline, fullscreen previews, Library controls/details/dialogs,
  database controls/cards/menus, Trash drawer/controls, shared neutral utility
  backgrounds, dialogs, popovers, tooltips and notifications.
- Root preference selectors cover body portals and split-pane documents.
- Removed local frosted overrides from Settings, Library, editor and Trash CSS.
- Retained accent hover/selection cues, primary/destructive actions, authored
  content styling, media, wallpaper artwork, and dimming overlays.
- Missing blur uses a shared near-opaque fallback; reduced transparency uses one
  solid theme surface and disables blur through the shared filter token.
- Normal mode retains its existing styling.

## Commits and compatibility

No commit created. Suggested message:
`fix(appearance): unify frosted glass across app components`

No migrations, storage preference changes, editor-content changes or archive
format changes. New source stylesheets remain under 500 lines.

## Validation

- Targeted `npx vp fmt`: passed.
- `npm run lint`: passed, including repository formatting.
- `npm run types:check`: passed.
- `npm run build`: passed with chunk-size and ineffective-dynamic-import
  warnings in existing modules. The build also reported Babel plugin timing.
- `git diff --check`: passed.
- Automated tests were not written or run, per the user's instructions.
- Manual visual confirmation remains pending. No PHP changes.

## Manual checklist

1. Select a detailed image wallpaper, Light and Frosted in Appearance. Open a
   workspace in Grid/List/Gallery, then a folder. Expected: shell controls,
   cards, labels and folder title use the same tint and blur; wallpaper remains
   visible. Select an item and hover controls: accent cues remain visible.
2. Open Settings → Appearance and compare its main island, surface choices,
   control panels and Wallpaper dialog. Expected: no stronger Settings tint or
   separate inset material. Selected choices remain recognizable. Cancel the
   Wallpaper dialog to retain the current wallpaper.
3. Open Library, a file detail page, a file menu, rename dialog and reuse picker.
   Expected: headings, filenames, toolbar, detail panels, menus and dialogs all
   use the same glass. Upload and destructive buttons remain distinct. Cancel
   rename and deletion dialogs without changing user data.
4. Open a document: select text, open `/`, open the block menu and outline, then
   a fullscreen Mermaid/table preview. Expected: toolbars, menus, outline and
   preview window share the glass. Content, diagrams and images remain intact.
5. Open Settings → Editor styles → Customize styles. Expected: dialog, preview
   panel and CSS editor use the shared surface; syntax remains readable. Close
   without applying changes.
6. Open a database in Table/Gallery and inspect its property menu, field controls
   and view settings; open Trash and a details drawer. Expected: all app surfaces
   use the same glass, while active controls and selection remain distinguishable.
7. Open Ctrl+Space, account/workspace menus and a select popover. Expected:
   portaled surfaces match inline surfaces. Trigger a harmless saved-setting
   notification if available: its surface matches too.
8. Repeat in Dark and switch back to Normal. Expected: Dark uses the same 53%
   tint everywhere; Normal restores existing solid surfaces. Reload and split
   two document tabs: the preference persists in both panes.
9. Repeat in a narrow window and, if supported, with OS reduced transparency.
   Expected: layout remains usable; every frosted surface becomes solid with
   blur disabled under reduced transparency.

## Known limitations and stop gate

Nested glass naturally composites with its parent and may look denser even
though its CSS tint and filter match. User-authored document themes can override
content styling. Browser visual confirmation is pending the user's review.
No subsequent phase was started.
