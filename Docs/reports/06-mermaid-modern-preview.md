# Mermaid modern style and full preview — M5 review

Date: 2026-10-09. User-requested enhancement within the current editor review; no M6 work or legacy-editor removal.

## Result

Mermaid now uses its Neo geometry with a custom monochrome base theme, system sans-serif typography, softer connectors, and restrained node/container colors. The initial white-canvas presentation was rejected by the user. The revised UI uses the app surface in both Light and Dark appearance, with cached default diagram colors mapped to inherited CSS palette variables during display. The diagram geometry remains Neo. Authored colors outside the default palette remain unchanged.

Both legacy Tiptap and Markdown rich widgets now offer an expand icon with the **Full preview** tooltip after a sanitized SVG is ready. Nested Mermaid in Markdown rich bodies also gets this control. The nearly full-window Radix dialog reuses the prepared SVG with fresh IDs, rather than rendering Mermaid again. Controls include zoom out/in, a percentage display, Fit, Close, wheel zoom anchored at the cursor, pointer drag panning, and keyboard navigation. Canvas shortcuts: `+`/`-` zoom, arrow keys pan, `0` fits. Escape closes and restores focus to the launch button when it still exists.

Viewer subscriptions, wheel listeners, size observers and React roots are disposed when closed or when the source/widget changes. SVG dimensions are parsed once per viewer, not on every pan. Existing scheduling, source editing, strict rendering, sanitization, and responsive inline-height reservations remain in use.

## Library decision

Reviewed [Mermaid themes](https://mermaid.js.org/config/theming.html) and the installed Mermaid 12 declarations for `look: neo` and custom base-theme variables. Reviewed [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch), which offers React zoom/pan/pinch controls but requires integration into the imperative Markdown widget lifecycle. The user selected our own shared viewer. Reused installed React/React DOM, Radix Dialog, Lucide and browser Pointer Events/ResizeObserver. No package additions or lockfile changes.

## Compatibility

Frontend and PHP cache renderer identifiers now both use `mermaid-12.0.0-orbium-neo-strict-v2`. Old SVG previews are ignored and rebuilt through the existing cache workflow; obsolete versions are pruned on save. No migration or content-format change. Source and Markdown exports remain unchanged.

## Actual validation

- Targeted `npx vp fmt`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 353 formatted files and 287 linted files, no warnings/errors.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS. Existing large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, per user instruction. Browser interaction and visual validation remain for the user.

## Manual test checklist

Use disposable documents in both editors: a new Markdown document and an existing legacy Tiptap document.

1. Add a Mermaid block containing `flowchart LR` followed by `A[Draft] --> B[Review] --> C[Publish]`. Switch Preview. Expected: monochrome nodes, clean sans-serif labels, softer geometry/connectors, and an enabled expand icon beside the grouped Edit/Preview controls once ready. Compare a sequence diagram and an ER diagram too; each retains its appropriate symbols and labels.
2. Open Full preview. Expected: a nearly full-window dialog with the complete diagram centered and fitted; the document does not change or save merely from opening it.
3. Click zoom in/out, then scroll over a node. Expected: percentage and drawing size change; wheel zoom keeps the point under the cursor stable. Drag the canvas, then click Fit. Expected: the drawing moves and Fit restores the centered view.
4. Tab to the canvas. Press `+`, `-`, arrows, and `0`. Tab through controls, press Escape, and reopen/close with the Close button. Expected: focus stays inside the dialog while open, shortcuts work, Escape/Close dismiss it, and focus returns to Full preview.
5. Open a wide/tall diagram, zoom/pan to its edges, resize the window, and try a narrow mobile-sized viewport. Expected: controls remain reachable, resize refits the drawing, and zoom changes do not change inline document height. For exceptionally large diagrams, the 5% minimum can prevent fitting all content; pan remains available.
6. Edit a diagram label, switch Preview, wait for Saved, and reload. Expected: updated source and modern SVG persist; Full preview matches the inline diagram. Enter invalid Mermaid and recover with Undo. Expected: source is preserved, error is readable, and Full preview is disabled until a valid new SVG exists. While editing, a previously prepared preview may remain available until the changed source is processed.
7. Reopen a document with old cached diagrams. Expected: diagrams prepare under the new cache version once, then use the new saved previews on subsequent reloads. Scroll through repeated/tall diagrams; prepared inline SVG mounting retains existing reserved dimensions.
8. In Markdown, add a diagram inside a callout or rich table cell using the existing source controls. Expected: its nested preview also has Full preview and shows the correct diagram. Close, switch Source/Live Preview and navigate away/reopen; expected: no stale dialog or widget updates.
9. Repeat in Light/Dark appearance and with reduced motion enabled. Expected: app controls and diagram colors follow appearance; no bright white panel in Dark mode, and every action works without animation.

## Limits

Zoom is bounded to 5%–800%; initial Fit never enlarges beyond 100%. Window/canvas resizing refits the drawing. Touch supports single-pointer panning; touch pinch zoom and inertial panning are not implemented. Authored colors that exactly match the default monochrome palette also follow appearance. Other authored colors remain fixed. Derived renderer colors outside the palette can remain fixed. A complex first uncached render can still occupy the main thread. No visual, performance or manual acceptance claims are made from build checks.

## Commit suggestion

No commit created. Suggested message: `feat(editor): modernize Mermaid diagrams and add zoomable full preview`.

Stop in the current editor review for manual validation.

## UI correction after user rejection

- Removed the hardcoded white inline panel and dotted full-preview canvas.
- Replaced the text expand button with a matching SVG expand icon, accessible label, and tooltip. Markdown Edit/Preview and expand now sit together rather than spreading into three columns.
- Removed the extra legacy inline frame. Full preview uses a calm theme surface, a small title and separate close control, and one floating bottom zoom/Fit toolbar. Fit leaves space for those overlays.
- Default SVG colors inherit Light/Dark CSS variables without another Mermaid render, source edit or cache invalidation. Palette substitution happens only in embedded styles and fill/stroke attributes.
- No new dependency, migration, or content-format change. The user-approved shared viewer remains in use.
- Browser skill setup found Chrome but no supported in-app `iab` browser. No screenshot or interaction verification was performed; manual visual acceptance remains pending.

Revised manual review: repeat steps 1–9 above, especially the grouped inline controls, floating bottom toolbar, focus restoration, fit clearance and theme colors. Suggested follow-up commit: `fix(editor): align Mermaid preview surfaces with Orbium UI`.

## Light-mode arrow correction

Changed the default connector palette to black in Light mode and explicitly styled flowchart/sequence arrow lines and filled arrowheads in both inline and full previews. Dark-mode colors remain unchanged. No dependency or cache version change.

Manual checklist: in Light mode, open a flowchart and sequence diagram inline and in Full preview; expect black connector lines and arrowheads. Switch to Dark; expect the existing readable dark-theme colors. Reload and repeat on cached diagrams.

Suggested commit: `fix(editor): use black Mermaid arrows in light mode`.

## Shared contrast follow-up

The subsequent [shared style and contrast report](06-mermaid-contrast-review.md) supersedes the partial color adapter and v2 renderer version above. It includes the final family-wide theme configuration, actual checks, palette ratios, limitations and a 19-diagram manual review document.
