# Phase 7 review — Text backgrounds

The later [unified frosted review](07-unified-frosted-glass.md) supersedes this
report's panel/raised/inset material differences. All app surfaces now share the
original panel tint and blur.

## Implemented

The user requested backgrounds behind all app text. Text shares a background with
its card, panel, or compact label group. This keeps document paragraphs and inline
formatting inside their existing document surface.

- Added theme-aware backgrounds to folder titles, details and errors; explorer
  search feedback and parent drop targets; Library headings, collection status,
  filenames and empty states; page-media edit buttons; workspace errors; and
  split-pane loading and placement labels.
- Normal explorer cards and view controls now use solid surfaces.
- Review correction: restored the original frosted tint opacity after the user
  rejected the stronger tint: light 61%/73%/48%, dark 53%/67%/43% for panels,
  raised surfaces and inset controls. Explorer cards and view controls receive
  the shared frosted treatment. Selected cards and active drop targets retain
  their accent backgrounds.
- Retained reduced-transparency and unsupported-backdrop-filter fallbacks.
- Kept the new styling in a focused 68-line stylesheet.

## Commits

No commit created. Suggested messages:

- `fix(ui): add readable backgrounds behind app text`
- `fix(appearance): preserve frosted transparency behind text surfaces`

## Migrations / persistent format changes

None. No server, editor-content, or archive format changes.

## Validation

- Targeted `npx vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; formatting passed for 434 files, no warnings or lint
  errors across 354 files.
- `npm run build`: passed. Reported chunks above 500 kB and ineffective dynamic
  imports for existing crop-dialog, property-input, database-property-header,
  document-opening-preview, and document-editor-loader modules.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. No PHP changes, so PHP
  formatting was not applicable. Browser/manual validation remains pending.

## Manual validation

1. In Settings → Appearance, choose Light, Normal, and a detailed image wallpaper.
   Open a workspace and switch through Grid, List, and Gallery. Expected: every
   item name sits on a solid card, including gallery labels; view controls have
   backgrounds.
2. Open a folder and rename its title, including a long title. Expected: the
   title and any details have padded backgrounds, typing and saving still work,
   and covers/icons remain visible.
3. Search the explorer for a nonexistent name. Expected: the no-results message
   has a rounded background. Drag an item toward the parent drop area without
   releasing. Expected: its label has a background and the active target retains
   its accent. Cancel the drag; select an item and check its selection cue.
4. Open Library with files. Expected: workspace name, heading, description,
   collection status and every filename have backgrounds. Search for a
   nonexistent filename. Expected: the empty-state text shares a background.
   Clear search; open a file, its menu, and its rename dialog. Expected: details,
   actions and dialog text remain readable and usable.
5. Open a document, database Table/Gallery, Trash and each Settings page. Open
   Search Master and account/workspace menus. Expected: text stays within its
   panel/card/popover, with no wallpaper directly behind text. Hover cover/icon
   edit controls; their labels have backgrounds.
6. Split two tabs using an edge drop. Expected: the placement label has a
   background; if loading is visible, its text has a compact background. Both
   panes remain usable and scroll independently.
7. Repeat steps 1–6 in Dark and Frosted modes with bright/dark wallpaper areas.
   Expected: frosted backgrounds retain their original transparency,
   and selection/hover cues remain distinct. Reload; appearance persists.
8. Repeat Library/folder checks in a narrow window and with RTL/long names.
   Expected: labels remain contained, filenames truncate, and no horizontal
   overflow appears. If supported, enable OS reduced transparency; expected:
   surfaces become solid and explorer blur is disabled.

## Known limitations / stop gate

Visual confirmation is pending the user's manual review. User-authored editor
CSS can still override document styling. This finishes the requested appearance
review; no subsequent phase has been started.
