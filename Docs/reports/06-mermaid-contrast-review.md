# Mermaid shared style and text contrast correction

Date: 2026-10-09. Follow-up to [the preview redesign](06-mermaid-modern-preview.md), within the current editor review. No later migration phase started.

## Changes and cause

The previous theme handled only a short list of exact six-digit colors. Mermaid also emits shorthand hex, RGB/RGBA, named colors, inline styles and diagram-specific derived colors. Consequently a label could adapt to Dark while its background stayed light, or a derived label color could stay dark against an adapted dark surface.

- Extracted `mermaid-theme.ts` to give diagram families the same typography, restrained geometry, and explicit text/surface/border roles. Gradients and renderer shadows are disabled.
- Added explicit roles for sequence notes/loops/number badges, class members, ER attribute rows, states, requirements, Gantt tasks/sections, pie legends/slices, timelines, journeys, mindmaps, git branches/commits/tags, chart axes/regions, architecture edges, and event-model shapes. Shared indexed palettes use six neutral shades with readable labels; chart data still determines geometry.
- C4 uses separate element-background settings and hardcoded white label styling in the installed renderer. Its background/border configuration now follows the shared palette, and scoped label rules give its text the matching foreground.
- Display adaptation now covers embedded styles, inline style attributes, fill/stroke attributes, three/six-digit hex, comma-form RGB/RGBA and black/white. Derived near-neutral light/dark shades are adapted too; alpha is preserved with CSS color-mix. It does not depend on per-label layout reads or repeat Mermaid layout when appearance changes.
- Strengthened ordinary text to `#18181b` in Light and `#fafafa` in Dark. Existing black Light-mode connector rules remain.
- Added [19 diagram examples](../examples/mermaid-style-review.md) for manual comparison. They are a review document, not an automated test suite; browser rendering of the examples remains pending.

## Contrast evidence and limits

Calculated luminance ratios for the default opaque palette pairs:

| Pair | Ratio |
|---|---:|
| Light text / darkest default chart surface | 6.91:1 |
| Dark text / lightest default chart surface | 4.63:1 |
| Light text / default node | 16.12:1 |
| Dark text / default node | 14.27:1 |

These are palette calculations, not browser measurements. They do not establish contrast for translucent overlaps, external icons, labels rendered by every experimental diagram, or authored color/theme overrides. Custom non-neutral colors remain authored; authored neutral colors may follow the app palette. HSL, eight-digit hex and space/percentage-form RGB are outside this adapter. No claim of universal visual acceptance is made.

## Libraries and compatibility

Reused the user's approved Mermaid, DOMPurify and shared viewer; no new dependency. Reviewed the installed Mermaid 12 base theme implementation, configuration types, and diagram-specific styles, including C4's separate configuration. Mermaid supplies diagram geometry; Orbium supplies shared presentation and theme adaptation.

Both PHP and frontend renderer versions are now `mermaid-12.0.0-orbium-contrast-strict-v3`. Existing previews regenerate once through the established cache workflow; obsolete versions are pruned on save. No migration, canonical source edit, source format change, or export change.

## Actual checks

- Targeted `npx vp fmt`: PASS.
- `npm run types:check`: PASS. An initial optional-color typing failure was corrected.
- `npm run lint`: PASS; 354 formatted files and 288 linted files. A string-spread warning was corrected.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS. Existing large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: PASS.
- All new source files are below 500 lines.
- No automated tests written or run. No browser screenshots or interaction checks performed; the supported in-app browser was unavailable in the preceding review.

## Exact manual checklist

1. Create an empty disposable Markdown document and import `Docs/examples/mermaid-style-review.md`. Expected: each diagram renders with shared monochrome typography and surfaces while retaining its native symbols and layout. Report any syntax error with its diagram heading; the source must remain editable.
2. In Light mode inspect flowchart edge/group labels, sequence notes/loop headings/number badges, class members, ER alternating attribute rows, state labels and requirement fields. Expected: dark readable text on light surfaces and black default connector arrows.
3. Switch to Dark and repeat. Expected: light readable text on adapted dark surfaces; no dark-on-dark labels or white text against an unchanged light row. Check sequence number badges separately: the number must contrast with its marker background.
4. Inspect pie legends/percentages, XY axis labels/title/bars, Gantt task/section labels, timeline/journey labels, git branch/tag/commit labels, mindmap branches and quadrant regions. Expected: the same text scale/palette and readable labels on every default region shade.
5. Inspect block, architecture, packet, Sankey and C4 diagrams. Expected: labels remain readable, C4 no longer uses white text on a light default node, and connections retain their diagram-specific meaning.
6. Open Full preview for each family, zoom in/out and pan, then Fit/close. Expected: presentation and text colors match inline previews; geometry and source are unchanged.
7. Reload the saved document, switch Light/Dark again and reopen several previews. Expected: the new cache version persists, adaptation works on cached SVGs, and appearance changes do not edit/save diagram source.
8. Repeat representative flowchart, sequence and class/ER diagrams in an existing legacy Tiptap document. Expected: the same style and contrast as Markdown. Compare diagrams in a nested callout/table too.
9. In a disposable diagram add authored saturated node colors and labels, plus an explicit diagram theme override. Expected: authored non-neutral styles can still take precedence; review these separately because default-palette contrast numbers do not guarantee custom contrast.

## Commit suggestion and stop gate

No commit created. Suggested message: `fix(editor): unify Mermaid themes and improve text contrast`.

Remain in the current editor review for manual acceptance.
