# Phase 5 follow-up — Backgrounds

## Implemented

- Added Backgrounds to Appearance with the original background, Ghost Fibers, Molten Metal, and an uploaded image.
- Installed both requested React Bits JS/CSS components and their OGL dependency. Kept the required React Bits license notice.
- Exposed the animation parameters, colors, quality controls where supported, reset actions, and reduced-motion behavior.
- Applied the chosen background behind authenticated app surfaces. Uploaded images use browser IndexedDB; selection and animation settings use browser local storage.

## Library decision and limits

The requested React Bits components provide the shader effects and live parameter updates. Recreating them would duplicate substantial shader code. Both require WebGL 2 and can use GPU resources; Orbium shows its normal background if an effect fails to initialize. The source is installed in the repository under the React Bits MIT + Commons Clause license. The component bundle itself cannot be sold or redistributed separately.

## Commits and persistent formats

No commit created. Suggested message: `feat(appearance): add adjustable backgrounds and browser image uploads`.

No database migration or archive format change. Browser keys: `orbium.backgrounds.v1` in local storage and `orbium-backgrounds` in IndexedDB. The uploaded image does not travel with an account or portable archive.

## Validation

- `npm run check:fix`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS. Existing large-chunk warning remains.
- `./vendor/bin/pint --test`: PASS.
- `git diff --check`: PASS.
- Automated tests were not written or run, per repository instructions. Visual appearance and WebGL performance await manual review.

## Manual test checklist

1. Open Settings → Appearance. Select Ghost Fibers. Expected: the animated fiber background appears behind the app and the Ghost Fibers controls open.
2. Change Speed, Layers, Line color, Glow color, and Resolution. Expected: the live background changes. Select Reset. Expected: all Ghost Fibers values return to their initial values.
3. Select Molten Metal. Change Speed, Detail, Color mode, colors, Pointer interaction, and Opacity. Expected: the effect responds to each control. Select Reset. Expected: Molten Metal values return to their initial values.
4. Upload a PNG or JPEG under 10 MB. Expected: it is selected as the background. Navigate to a workspace, document, database, and settings page. Expected: the image remains behind the app surfaces and controls stay readable.
5. Reload the page. Expected: the chosen effect or image and adjusted values remain. Replace the image, then remove it. Expected: the new image appears, then the original Orbium background returns if the image was active.
6. Try a non-image file and an image larger than 10 MB. Expected: the upload is rejected with a clear message, and the previous background remains.
7. Enable operating-system Reduce Motion while an animated background is active. Expected: animation stops on a still frame. Disable it. Expected: animation resumes. Hide and return to the browser tab. Expected: the animation pauses and resumes without losing the selected settings.
8. Switch Light, Dark, and System, and resize the browser. Expected: the chosen background fills the viewport and all settings and floating controls remain usable.
9. If a browser/device lacks WebGL 2, select either animation. Expected: the app remains usable with its base background.

## Known limitations

- Background preferences and uploaded images are browser-local. They do not sync across devices or appear in portable archives.
- Exact performance and text contrast over arbitrary uploaded imagery require the user's browser review.

## Manual review fix — 2026-10-01

The first manual review found that selecting a background did not change the page. The `useSyncExternalStore` hook returned the fixed default preferences as its live snapshot, so subscribers never received the selected value. The hook now returns the current preferences for live renders and reserves the default value for server rendering. Recheck the selector, live controls, image upload, and reload steps above.

Fix validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. The Docker app was rebuilt and started; app and PostgreSQL are healthy, nginx is running, and `http://localhost:18082/settings/appearance` responds with the expected unauthenticated redirect (HTTP 302). The build still reports large chunks. No automated tests were written or run, per repository instructions.

## Stop gate

Wait for the user's manual review before extending this feature or starting another phase.

## Manual review extension — Frosted glass and appearance reveal (2026-10-01)

- Added Normal and Frosted glass surface choices to Appearance. Normal uses solid panels; Frosted glass uses translucent, blurred panels in both themes, with stronger opaque fills when backdrop blur or reduced transparency support requires them. The browser stores the choice under `orbium.surface-style.v1`.
- Adapted Achelife `codex/v1.4.0`'s centered, 1100 ms circular View Transition for light/dark, surface, and background switches. The new image is decoded before it is revealed. Reduced motion, hidden tabs, and browsers without View Transitions apply changes immediately.
- Reviewed the `transition-style` library and existing GSAP. `transition-style` supplies many CSS effects but does not manage the app's state or screenshot timing; GSAP cannot snapshot a whole theme change. The native API fits this one reveal and adds no dependency. The API and backdrop blur need browser support; both have immediate/opaque fallbacks.
- No commit created. Suggested message: `feat(appearance): add frosted surfaces and centered reveal transitions`.

### Manual test checklist

1. Open Settings → Appearance. Select Frosted glass, then Normal. Expected: each change starts as a small circle at the viewport center and reaches the corners in about one second; panel translucency and blur appear only in Frosted glass.
2. Select Frosted glass and switch Light, Dark, and System while changing the operating system theme. Expected: every resolved light/dark change uses the same centered reveal; choosing System when it already matches the current theme keeps the appearance stable.
3. Switch among Orbium default, Ghost Fibers, Molten Metal, and an uploaded image. Expected: each wallpaper change uses the centered reveal and the selected wallpaper remains visible after the animation. Replacing and removing an active image does the same.
4. Navigate through workspace, folder, document, database, Settings, Search Master, and menus. Expected: Frosted panels and floating controls show the wallpaper through a blur; Normal panels remain solid; text, focus rings, and controls remain readable.
5. Reload after selecting Frosted glass and a background. Expected: the chosen style and wallpaper return without a startup reveal.
6. Enable Reduce Motion, then repeat a theme, surface, and background change. Expected: changes are immediate. In a browser without View Transitions, expected: the same immediate behavior without an error.
7. If available, enable Reduce Transparency or disable backdrop blur, then inspect both themes. Expected: Frosted surfaces become more opaque and controls remain usable.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. The build still reports existing large chunks. Automated tests were neither written nor run, per repository instructions. Visual timing and contrast on arbitrary uploaded imagery need manual review.

## Manual review fix — Untinted wallpapers (2026-10-01)

Removed the global white overlay in Light mode and black overlay in Dark mode from selected wallpapers. Images and shader effects now display their own colors; Frosted glass panels retain their local blur and tint.

Manual check: select each background in Light and Dark. Expected: the wallpaper itself keeps the same colors and brightness when switching themes, while app panels remain readable. Compare an uploaded image with the original file to confirm there is no full-screen wash.
