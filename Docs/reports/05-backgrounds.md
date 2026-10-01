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

## Manual review fix — Theme-independent animated wallpapers (2026-10-01)

Ghost Fibers and Molten Metal no longer receive the app's Light/Dark mode. Their shader palettes now remain on their selected settings when the app theme changes. The theme still changes the surrounding UI and surface materials.

Manual check: select each animated wallpaper, leave its color controls unchanged, and switch Light → Dark → Light. Expected: the animation's background, colors, and brightness stay the same throughout, while panels and text change theme.

## Manual review fix — Opaque Molten Metal output (2026-10-01)

Molten Metal was still theme-sensitive because its dark shader path emitted transparent pixels. The app's changing page color showed through those pixels. The shader now composites its output over the existing Molten Metal Background color control and emits opaque pixels. The unused light-mode shader branch and prop were removed.

Manual check: select Molten Metal, then switch Light → Dark → Light with a custom Background color and default settings. Expected: its background and glow colors stay the same in each theme; only the UI surfaces change. Adjust Opacity and Background color afterward. Expected: both controls still affect the animation.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. No automated tests were run. The local Docker app was rebuilt and is healthy; nginx responds at `/settings/appearance` with the expected unauthenticated HTTP 302. The build retains its large-chunk warning.

## Phase 5 extension — Additional React Bits wallpapers (2026-10-01)

Added Gradient Waves, Web Threads, Light Tunnel, Scanner, Lightfall, Liquid Ether, Prism, Dark Veil, Light Pillar, Silk, Soft Aurora, Aurora, Plasma, Grainient, Prismatic Burst, Hyperspeed, and Iridescence through the requested shadcn React Bits registry entries. Each appears in Appearance with saved controls and Reset. Effect settings extend the existing `orbium.backgrounds.v1` browser preference with defaults for older saved preferences. Only the selected component is mounted, and it loads on demand. The app keeps the animated wallpaper palette independent of Light/Dark mode.

### Library decision and limits

Used the requested React Bits source instead of reimplementing 17 shaders and scenes. The registry added Three.js, React Three Fiber, and `postprocessing`; OGL was already present. These effects use WebGL and may tax lower-end GPUs, especially Liquid Ether, Light Pillar, Silk, and Hyperspeed. Orbium shows the selected effect's fixed background color when reduced motion is requested, and falls back to that color if an effect fails. Browser-local settings do not sync or enter account archives. The imported upstream Liquid Ether and Hyperspeed source files exceed the project's usual 500-line guideline; splitting their vendor code would complicate future upstream updates. The existing React Bits license notice applies to these components.

### Manual test checklist

1. Open Settings → Appearance. Select each of the 17 new named wallpapers. Expected: the selected effect fills the viewport behind app surfaces, and its own controls appear. No other animation remains mounted.
2. For each effect, change a color, a numeric control, and a checkbox or mode selector when available. Expected: the background responds. Select Reset. Expected: that effect returns to its initial values.
3. Select Liquid Ether and move the pointer, select Prism and change Offset X/Y, select Iridescence and change Color, then select each Hyperspeed preset. Expected: pointer, offset, color, and preset changes affect the right component without a crash.
4. Reload with one new effect selected. Expected: the selection and its adjusted settings persist. Switch to another effect and back. Expected: the first effect retains its settings.
5. Switch Light → Dark → Light with several new effects selected. Expected: wallpaper colors do not change with the app theme; only UI surfaces and text change.
6. Enable Reduce Motion. Expected: the new effects stop rendering motion and retain a static background color. Disable it. Expected: the selected effect returns.
7. On a device without WebGL support, or if an effect cannot initialize, select a new effect. Expected: the app remains usable with a static background color.

Suggested commit message: `feat(appearance): add configurable React Bits wallpapers`.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. No automated tests were written or run, per project instructions. Docker rebuilt with `npm ci`; app and PostgreSQL are healthy, and nginx returns the expected unauthenticated HTTP 302 for `/settings/appearance`. The build warns about large chunks. `npm audit --omit=dev --audit-level=high` reports five high advisories in the existing Mermaid → Chevrotain → lodash-es dependency chain; they are unrelated to the newly added wallpaper packages and a suggested forced fix would downgrade Mermaid across a major version.

## Manual review fix — React Bits wallpaper mounting (2026-10-01)

The new effects now mount from the component module already loaded by the selector. This avoids showing an empty Suspense frame during the circular wallpaper reveal. Each effect also receives a full viewport container, so its canvas and percentage-sized wrapper can measure a stable area. The renderer no longer removes every new effect when Reduce Motion is enabled; effects that support pausing receive the paused flag. Some upstream effects do not expose a pause control and can still animate under Reduce Motion; this remains a limitation requiring a later source-level adaptation.

Manual check: select Gradient Waves, Dark Veil, Silk, and Hyperspeed in Settings → Appearance. Expected: the selected button and settings appear, and the effect becomes visible behind the page after the centered reveal. Change a color and speed setting, navigate to another page, then reload. Expected: the chosen effect and settings persist. Repeat with Reduce Motion enabled. Expected: the wallpaper remains visible. The user should confirm whether any specific effect still fails or displays a browser error.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, and `./vendor/bin/pint --test` passed. The production build retains its large-chunk warning. No automated tests were written or run.

Suggested commit message: `fix(appearance): mount React Bits wallpapers during selection`.

## Manual review fix — Reload and rendering cost (2026-10-01)

The wallpaper host now uses one explicit component loader for both selection and page refresh. It keeps one in-flight import per effect and mounts the resolved component after the import completes, without a separate `React.lazy` path on reload. Hyperspeed no longer initializes after being removed while its assets are still loading, and its canvas rule is scoped to the wallpaper. High-density WebGL canvases are capped at 1.25 device pixels per CSS pixel across the affected React Bits components; Plasma's default cap is also 1.25. This reduces fill work on high-density displays, with a possible slight loss of sharpness. No additional library was needed: the installed effects already expose their renderers and quality settings.

Manual check: select Gradient Waves, Silk, Liquid Ether, Hyperspeed, and a simpler effect such as Dark Veil. Refresh after each selection. Expected: the selected wallpaper returns and animates without opening Appearance again. Switch rapidly away from Hyperspeed while it is loading, then use the app. Expected: the previous Hyperspeed scene does not continue consuming resources. On a high-density display, compare scrolling and typing with a heavy wallpaper active before and after this update; expected: smoother interaction, with the wallpaper still filling the viewport. Test Light/Dark switching and settings changes to confirm the effect stays visible.

Suggested commit message: `fix(appearance): restore wallpapers on reload and reduce GPU load`.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. The build still reports large chunks. No automated tests were written or run, per project instructions. The Docker app was rebuilt; the app and database containers are healthy, nginx is running, and `/settings/appearance` returns the expected unauthenticated HTTP 302. Authenticated visual refresh and performance remain for the user's manual review.

## Manual review extension — Appearance selection UX (2026-10-01)

Grouped the original and uploaded image under Still backgrounds and the shader wallpapers under Animated backgrounds. Choices now have static palette previews, a selected mark, and a loading indicator while a selected effect is imported. On wide screens the selected effect's controls remain in a sticky column beside the catalog. The image choice opens upload when no image is saved, and the page explains browser-only storage and reports saved-image load failure. React Bits controls show a small set of common controls first and place the remaining controls in a keyboard-accessible disclosure. Ghost Fibers and Molten Metal controls also start collapsed. A browser-local Pause animated wallpapers preference, as well as the operating system's reduced-motion preference, now avoids mounting animated renderers and displays a still color. Live control changes remain immediate while local-storage writes are deferred for 250 ms and flushed when the page is closed or reloaded.

### Library decision and limits

Reviewed Radix Collapsible and Tabs and the existing React Bits catalog. Used the already installed Radix Collapsible for advanced controls; native details is sufficient for the two legacy effects. No new dependency is needed. The cards show representative palette gradients, not captured frames from each shader. Paused animations show a solid fallback color rather than a frozen frame. This pass does not add the separate 3D Orbit quality preference from Phase 7. Wallpaper settings and uploaded images remain browser-local.

### Manual test checklist

1. Open Settings → Appearance at desktop and narrow widths. Expected: Still and Animated groups, readable palette cards, no sideways overflow, and a visible mark on the current choice.
2. Select a React Bits effect, then rapidly select another while the first loads. Expected: the last choice wins, the loading indicator clears, and the selected effect fills the background.
3. Change a common control, open Customize all settings with mouse and keyboard, then change an advanced control and Reset. Expected: live effect updates, advanced controls stay reachable, and Reset restores defaults.
4. Select Ghost Fibers and Molten Metal. Open each Customize disclosure, change a color and speed, then Reset. Expected: controls respond and restore defaults.
5. Select an animated background and turn Pause animated wallpapers on and off. Repeat with the operating system's reduced-motion setting. Expected: the animated renderer is replaced by a still color and resumes when both pause sources are off.
6. Upload, replace, and remove a PNG or JPEG. Expected: the image card shows the saved image, upload selects it, removing an active image restores Orbium default, and an invalid file gives a clear error.
7. Drag a slider, reload immediately, and reload after a brief pause. Expected: the final value persists in both cases. Navigate away and back; the selected background and pause preference remain.
8. Switch Light and Dark over bright and dark wallpapers. Expected: wallpaper palettes remain unchanged while interface text and surfaces remain readable.

Suggested commit message: `feat(appearance): simplify wallpaper selection and customization`.

Validation: `npm run check:fix`, `npm run lint`, `npm run types:check`, `npm run build`, and `git diff --check` passed. The build retains its existing large-chunk warning. No automated tests were written or run. Authenticated visual behavior awaits the user's manual review.

## Manual review correction — Appearance layout and controls (2026-10-01)

The user's screenshot showed that the 680px settings content limit squeezed a second two-column layout and three wallpaper cards into too little width. Appearance now uses the full settings island width. Wallpaper choices are compact neutral rows with small palette swatches in two columns; the chosen effect's controls have a wider, single-column panel. Theme and surface choices use the app's neutral selection treatment. Numeric sliders, color inputs, checkboxes, select fields, and the pause switch share Appearance-specific styling and visible focus. Image actions are beside the still-background choices. Frosted settings panels have a stronger tint for readable controls over colorful wallpapers.

Manual check: compare Appearance in Normal and Frosted surfaces at desktop, tablet, and narrow widths. Expected: no tiny three-across cards, no clipped control labels, clear selection, and no horizontal overflow. Open every advanced control panel and check keyboard focus, slider operation, select menus, color inputs, and reset actions. Switch among light and dark themes and colorful wallpapers; text and controls should remain readable.

Suggested commit message: `fix(appearance): align wallpaper settings with the app shell`.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. The local Docker app was rebuilt; app and PostgreSQL reported healthy, nginx remained running, and the Appearance route returned the expected unauthenticated HTTP 302. The build retains its existing large-chunk warning. No automated tests were run. Authenticated visual review remains for the user.

## Manual review correction — Wallpaper dialog (2026-10-01)

All Settings categories now use an 1100px outer island. Profile, Security, and Appearance keep their form controls at a readable width inside it. Appearance replaces the long wallpaper grid with one Wallpaper control. The dialog provides search, upload, a gallery, and an editor with draft controls on the left and a live preview on the right. Apply writes the chosen wallpaper and settings; Cancel and Escape leave the existing background unchanged. A selected gallery miniature becomes live on open, and hover or keyboard focus moves the live miniature to another wallpaper after a brief delay. Only one miniature renderer runs at a time, and the main app wallpaper renderer pauses while the dialog is open. Uploaded images are validated and decoded for preview before saving on Apply. Dialog transitions, card hover, and preview fade respect reduced motion.

### Library decision and limits

Reviewed Radix Dialog and React's deferred update option. Used the already-installed Radix Dialog for focus trapping, Escape, and accessible title/description; simple local filtering needs no search library or deferred rendering. Reused Orbium's existing React Bits wallpaper modules. Running all 19 animated miniatures at once would create too many WebGL scenes, so only the current hover/focus miniature runs live. A few upstream effects may frame differently in the small thumbnail because their shaders use viewport measurements; the larger editor preview is the place to judge the final appearance. No new dependency or persistent format was added.

### Manual test checklist

1. Open Profile, Security, Appearance, and Workspaces. Expected: the outer Settings island has the same width on each route; forms remain readable and Workspaces can use the wider area.
2. On Appearance, select Wallpaper. Expected: a centered dialog opens with a search field, upload button, and wallpaper gallery. Tab through controls and press Escape; focus returns to Wallpaper.
3. Search for a wallpaper by name and a word in its description. Expected: matching tiles remain; an unmatched query shows a no-results message.
4. Hover or focus several animated miniatures, including a heavy effect. Expected: the active miniature animates after a brief delay, the previous one stops, and the gallery remains responsive. With system reduced motion, thumbnails remain still.
5. Select Ghost Fibers, Molten Metal, and a React Bits wallpaper. Expected: draft controls appear on the left and the live preview on the right. Adjust a color and speed. Expected: only the preview changes while the page background stays as it was.
6. Select Cancel, close, or press Escape after changing controls. Reopen Wallpaper. Expected: the previous applied wallpaper and values remain. Repeat and choose Apply wallpaper. Expected: the new wallpaper appears behind the app and survives reload.
7. Upload a valid image. Expected: it appears in the editor preview but is not applied until Apply. Cancel leaves the previous wallpaper. Try an invalid file or corrupt image; expect a clear error.
8. Open the dialog at narrow widths and with Light, Dark, Normal, and Frosted styles. Expected: gallery and editor remain usable without horizontal overflow. Modal and hover transitions stop with reduced motion.

Suggested commit message: `feat(appearance): add searchable wallpaper preview dialog`.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. The production build still reports its large-chunk warning. No automated tests were written or run, per project instructions. The local Docker app was rebuilt; app and PostgreSQL reported healthy, nginx remained running, and unauthenticated `/settings/appearance` returned the expected HTTP 302. Authenticated visual behavior awaits the user's manual review.

## Manual review correction — Autoplay gallery miniatures (2026-10-01)

The user requested live miniature playback without hover. Visible animated wallpaper tiles now start automatically when the dialog opens or the gallery is scrolled; tiles stop their renderers when they leave the scroll area. The page background remains paused while the dialog is open. Miniature effects use a lower resolution and frame rate where supported, while the editor preview keeps its normal settings. Reduced motion, the browser-local Pause animated wallpapers preference, and a hidden browser tab keep thumbnails still.

### Library decision and limits

Reviewed `react-intersection-observer` and the browser's Intersection Observer API. A shared native observer covers this single gallery without adding a dependency. The React library offers reusable hooks and observer management, but those benefits are limited here. Each visible React Bits tile can still create a WebGL context; on low-end hardware, many visible effects may render slowly or a browser may limit simultaneous contexts. Offscreen unmounting and smaller preview quality reduce the cost but cannot eliminate that upstream limitation.

### Manual test checklist

1. Open Appearance → Wallpaper without moving the pointer. Expected: visible animated miniatures begin moving automatically.
2. Scroll through the gallery. Expected: newly visible miniatures start, and effects that leave the visible area stop consuming a renderer. Scroll back and expect them to resume.
3. Search for an effect. Expected: matching visible tiles animate without hovering; filtering out an effect removes its renderer.
4. Enable Pause animated wallpapers, then reopen the gallery. Expected: miniatures stay still. Disable it and reopen; expected: visible miniatures autoplay.
5. Enable system reduced motion and hide the browser tab while the dialog is open. Expected: animations stop or remain still until motion is allowed and the tab is visible.
6. On a slower device, scroll through the gallery and open a heavy effect. Expected: the dialog remains usable and the large editor preview still responds to controls.

Suggested commit message: `feat(appearance): autoplay visible wallpaper miniatures`.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. The production build still reports its large-chunk warning. No automated tests were written or run, per project instructions. The local Docker app was rebuilt; app and PostgreSQL reported healthy, nginx remained running, and unauthenticated `/settings/appearance` returned the expected HTTP 302. Authenticated visual behavior awaits the user's manual review.

## Manual review correction — Remove miniatures (2026-10-01)

The user removed the miniature requirement. The Wallpaper control and searchable gallery now use text labels only, with a Current marker for the selected wallpaper. The gallery no longer mounts preview renderers or observes tile visibility. The full editor preview remains available after selecting an option, and Apply still commits the draft. No library was needed for this simplification; keeping the existing Radix dialog avoids a new dependency.

### Manual test checklist

1. Open Settings → Appearance. Expected: the Wallpaper control names the current wallpaper without a thumbnail.
2. Open Wallpaper. Expected: all choices appear as text rows with no miniature images or animation; the saved choice says Current.
3. Search by name or description. Expected: matching choices remain and an unmatched query shows the empty message.
4. Select an animated wallpaper. Expected: its controls appear on the left and one large live preview appears on the right.
5. Select a different wallpaper, then Cancel. Expected: the saved wallpaper remains unchanged. Repeat and Apply; expected: the chosen wallpaper becomes the app background.
6. Upload an image. Expected: the editor displays the uploaded image in the large preview and applies it only after Apply.

Suggested commit message: `refactor(appearance): replace wallpaper miniatures with text choices`.

Validation: `npm run check:fix`, `npm run types:check`, `npm run lint`, `npm run build`, `./vendor/bin/pint --test`, and `git diff --check` passed. The build still reports a large-chunk warning. No automated tests were written or run, per project instructions. The local Docker app was rebuilt; app and PostgreSQL reported healthy, nginx remained running, and unauthenticated `/settings/appearance` returned the expected HTTP 302. Authenticated visual behavior awaits the user's manual review.
