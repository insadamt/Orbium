# Phase 5 review — Orbium logo

Date: 2026-10-12

## Implemented

Replaced the placeholder SVG in the shared app logo component with the supplied
`public/imgs/logos/orbium-black.png` and `orbium-white.png` assets. The floating
workspace home control and authentication pages use the black logo in Light
appearance and the white logo in Dark appearance, including System appearance.
Images retain their proportions and cannot initiate native image dragging.
The authentication logo link has the accessible name "Orbium home".

Size follow-up: enlarged the navigation logo image from 28px to 44px (36px on
narrow screens), preserving the existing home control dimensions. Enlarged the
authentication logo image and its container from 36px to 80px. The supplied
assets include transparent margins, so these dimensions describe the image box.
Formatting/lint, type checking, production build, and diff checks were rerun
and passed; the same build warnings remain.

The browser favicon also uses the supplied assets: black by default, white when
the browser prefers a dark color scheme. Browser favicon appearance follows the
browser preference independently of the app's explicit appearance selection.

## Validation

- `npm run lint`: PASS; all 395 files correctly formatted, no warnings or lint
  errors in 326 files.
- `npm run types:check`: PASS.
- `npm run build`: PASS; existing large-chunk and ineffective dynamic-import
  warnings remain.
- `git diff --check`: PASS.
- No automated tests written or run, per the user's instructions.

## Manual test checklist

1. Open a workspace and choose Light appearance from the account menu.
   Expected: the supplied black Orbium logo appears in the top-left home control.
2. Choose Dark appearance, then System appearance. With System selected, change
   the operating system's light/dark preference.
   Expected: the logo switches to white on dark appearance and black on light
   appearance without requiring a page reload.
3. Open a folder, document, database, Trash, and Settings. Click the logo.
   Expected: the same logo remains visible and opens the applicable workspace
   home, or the dashboard when no workspace is selected.
4. In a nested folder, drag an item onto the logo control to move it to the
   workspace root.
   Expected: the existing root drop indicator and move behavior still work.
5. Sign out and open the login, registration, and password confirmation pages
   where available.
   Expected: the supplied logo appears above the form with correct contrast;
   its link is named "Orbium home" for assistive technology.
6. Repeat the logo check in a narrow browser window.
   Expected: the larger logo keeps its proportions, fits inside the home control,
   and does not overlap the workspace selector. On authentication pages, the
   larger logo stays centered above the heading without overlapping the form.
7. Reload and inspect the browser tab icon in browser light and dark appearance.
   Expected: the Orbium favicon appears with the corresponding black/white
   asset. A cached old favicon may require a hard refresh or reopening the tab.

## Commits and compatibility

No commit created. Suggested commit messages:

- `feat(branding): use Orbium logos across the app and favicon`
- `feat(ui): add theme-aware Orbium branding`
- `fix(branding): enlarge navigation and authentication logos`

No migrations, persisted data, or document/archive format changes.
Manual visual acceptance remains pending. Remain in Phase 5 review; no later
phase was started.
