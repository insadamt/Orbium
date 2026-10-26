# Mind Map single selection border — 2026-10-26

The user reported two borders around a selected branch. The topic frame had a border plus an outer selection shadow; its focused button and inline editor could also add their own outlines.

Removed the selection shadow and nested text-editor outline. Selection and keyboard text focus now change the existing topic frame's border color. Only the topic-content button's redundant focus outline is suppressed; collapse buttons, toolbar actions and header controls retain their own focus indicators. This is a CSS-only correction in the existing Mind Map review phase.

## Checks

Formatting, `npm run lint`, `npm run types:check`, `npm run build` and `git diff --check` passed. Lint checked 636 source files without warnings/errors; all 752 checked files were formatted. Build transformed 5,575 modules in 15.15 seconds, with the existing chunk-size/mixed-import/plugin-timing warnings. Log: `/tmp/orbium-mindmap-single-border-build.log`. No PHP code changed.

No automated tests, Playwright or browser automation ran. Browser acceptance remains manual.

## Manual checklist

1. Open a Mind Map editor and click the root and several child topics. Expected: one selected topic border, without a second outer ring.
2. Navigate topics using Tab/arrows. Expected: visible keyboard focus through that same frame; no additional border around the inner label button.
3. Double-click a topic, select text, type and finish editing. Expected: one frame throughout; text formatting, automatic height and selection still work.
4. Tab to collapse, toolbar and header controls. Expected: their individual focus indicators remain visible. Repeat in light/dark themes and at different map zoom levels.

No commit was created. Suggested commit: `fix(mindmap): use one border for topic selection and focus`.
