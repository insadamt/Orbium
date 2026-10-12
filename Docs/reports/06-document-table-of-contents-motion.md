# Editor review — Animated document outline

Date: 2026-10-12. User-requested correction within the current editor review.

The full-document replacement below was superseded by the navbar/floating-modal correction. See [the floating contents report](06-document-table-of-contents-floating.md) for current behavior and checks.

## Changes

- Contents now switches the entire document island into a full outline view. Title, cover, database properties and body are visually replaced together. The editor remains mounted, inert and hidden from assistive technology while the outline is shown, preserving local content and autosave state.
- The outline reveals with a fade/slide and staggered titles. A single animated background moves between hovered or keyboard-focused titles. Initial highlighting follows the caret's section. H1/H2/H3 aliases remain absent; hierarchy uses indentation, size and weight, and titles wrap.
- Selecting a heading fades out the outline, restores the document, animates the owning scroll area to the heading and briefly reveals the destination heading. The outline disappears after selection. Return to document and Escape restore the pre-outline scroll position and focus Contents without moving the caret.
- Each document owns its transition timeline, highlight and navigation cancellation. Split navigation targets its own pane. Hidden tabs cancel pending motion and navigation. Rapid selections replace pending transitions; wheel, touch, pointer and scrolling-key input interrupt automated scrolling.
- Reduced motion performs immediate view switching and navigation, omitting title, indicator and destination animation.
- Reused installed GSAP, editor parsers and existing CodeMirror scrolling. CodeMirror navigation waits two animation frames for the destination to render and measure before tweening from the original scroll position. No dependencies, data migrations, content-format changes, commit or push.

## Validation

- Targeted `npx vp fmt`: passed for all ten revised/new source and CSS files; the initial lint formatting finding was corrected.
- Final `npm run types:check`: passed.
- Final `npm run lint`: passed; all 376 checked files correctly formatted, 308 linted without warnings or errors.
- Final `npm run build`: passed in 8.63 seconds; existing large-chunk and ineffective-dynamic-import warnings remain. Build output: `/tmp/orbium-toc-motion-build.log`.
- `git diff --check`: passed, including the documentation update.
- All revised/new feature source files remain below 500 lines.

Automated tests were neither written nor run. Browser animation, layout and timing acceptance remains pending manual review.

## Manual checklist

1. **Whole-document switch:** Open a document with a cover, title and several heading levels; scroll halfway down and click Contents. Expected: the whole island becomes the outline, with no visible editable body or side panel. Heading labels reveal smoothly, remain readable and omit H1/H2/H3 badges. Unsaved edits remain intact.
2. **Moving highlight:** Move the pointer slowly and rapidly between different titles, including wrapped titles and different levels. Then Tab into the list and use Up/Down and Home/End. Expected: one highlight moves smoothly to the hovered/focused title, fits its height and leaves readable text without stacked highlights.
3. **Select destination:** Select a distant heading. Expected: the outline disappears, the document returns, its scroll position animates to the chosen heading below the floating controls, and that heading briefly reveals. The editor receives focus at the chosen heading. Repeat near the beginning/end and with duplicate titles.
4. **Cancel outline:** Open Contents from a known scroll position, then choose Return to document. Repeat using Escape while focused in the outline. Expected: the document returns to the earlier position; Contents receives focus, the caret remains unchanged and no document edit/undo step is introduced.
5. **Split isolation:** Open different documents in both panes, switch each to Contents, and select a heading in one. Expected: only that pane switches back and scrolls; the other pane keeps its outline and scroll position. Repeat on the other side and on a database document.
6. **Interrupted/rapid motion:** Select a long-distance destination, then wheel, touch-scroll, click in the document or press PageDown. Expected: automated scrolling stops and user input takes control. Try rapid successive selections while the outline fades, then switch tabs during opening/closing/scrolling. Expected: no delayed jump in another tab, no hidden document after return and no stale faded titles.
7. **Reduced motion:** Enable the operating system/browser reduced-motion setting before opening Contents. Expected: immediate outline/document switching and heading navigation, with no stagger, moving highlight or destination reveal. Disable it and repeat; motion should resume.
8. **Long Markdown/source:** Navigate to an offscreen heading near the end of a long Markdown document in Preview, then Source. Expected: all eligible headings appear and the scroll settles at the selected heading without a late second jump. Include code/math containing fake headings; expected: no false outline entries. Repeat core switching/navigation in a legacy JSON/Tiptap document if available.
9. **Responsive/appearance:** Try narrow split panes, mobile viewport, light/dark, Normal/Frosted and RTL headings. Expected: the whole outline stays inside its document island; titles wrap with clear hierarchy, its list scrolls independently, and Return remains reachable.
10. **Persistence:** Make an unsaved edit, switch into/out of Contents, wait for Saved and reload. Expected: the edit persists, previews and document search remain functional, and the document starts in its normal view. Repeat with database properties and cover/title visible before switching.

## Limitations

- No browser motion/performance measurements were taken. The two-frame CodeMirror measurement handoff and long-document landing need particular manual attention.
- Initial section selection follows the caret; pointer/keyboard focus controls the visible outline highlight. There is no scroll-based section tracking.
- User view state is transient and resets on reload. Outline extraction retains the existing full-source parse when the source snapshot changed.

## Suggested commit

`feat(editor): animate full-document contents navigation`

Remain in the current editor review; wait for manual feedback before starting another phase.
