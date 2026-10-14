# Phase 7 review — Fixed viewport background

## Implemented

- Default gradients now render in the same fixed, full-viewport layer as image
  and animated wallpapers. Long content no longer defines their dimensions.
- Authentication pages use the shared background and surface preference.
- Shell stacking keeps content above the background. Split document panes
  continue to show the parent viewport background through transparent shells.
- Manual review exposed the actual Frosted-mode cause: the shared
  `bg-background` rule applied `backdrop-filter` to the page shell. That creates
  a containing block for fixed descendants, making the wallpaper cover and
  scroll with the tall shell. The rule now excludes `.orbium-shell`; content
  surfaces retain their glass treatment.

## Commits and compatibility

No commit created. Suggested message:
`fix(appearance): anchor backgrounds to the viewport across pages`

No migrations, stored preference changes, or document/archive format changes.

## Validation

- Targeted `npx vp fmt`: passed.
- `npm run lint`: passed, including repository formatting.
- `npm run types:check`: passed.
- `npm run build`: passed with chunk-size, ineffective-dynamic-import and
  plugin-timing warnings.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. No PHP changes.

## Manual checklist

1. In Settings → Appearance, choose the default wallpaper. Visit workspace,
   folder, document, database, Library, Trash and Settings pages. Scroll long
   pages to the bottom. Expected: the gradients stay anchored to the viewport,
   without moving, stretching with content, or exposing an uncovered area.
2. Choose an image wallpaper. Repeat navigation and scrolling. Expected:
   the image stays centered and covers the viewport throughout.
3. Choose an animated wallpaper, then resize the window and scroll a long
   document. Expected: the animation fills the viewport while content scrolls.
   Pause animations in Appearance: expected, the still background remains fixed.
4. Repeat with Light/Dark and Normal/Frosted surfaces. Expected: default colors
   follow the theme and content remains above the background and usable.
   In Frosted mode, use browser developer tools to inspect `.orbium-shell`:
   expected computed `backdrop-filter` is `none`. Inspect `.orbium-background`
   before and after scrolling: expected its bounding rectangle starts at
   top/left zero and stays the size of the viewport, regardless of page height.
5. Split two document tabs and scroll each pane. Expected: one background
   remains behind both panes, with no separate wallpaper inside either pane.
6. Sign out and inspect Login and Register, including a narrow window that
   requires scrolling. Expected: the saved browser wallpaper covers the viewport
   and stays fixed; forms remain interactive. Reload to verify persistence.

## Limitations and stop gate

Visual verification is pending the user's manual review. Animated wallpapers
continue to animate unless paused; fixed positioning does not freeze them.
No subsequent phase was started.
