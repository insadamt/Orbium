# Editor review — Navbar Contents and floating outlines

Date: 2026-10-12. Requested correction within the current editor review; no phase advancement.

Superseded by the user-approved [fixed outline rail](06-document-table-of-contents-rail.md). The navbar toggle, modal behavior and paired opening described below are historical.

## Changes

- Moved Contents out of the editor toolbar into an icon button immediately beside Search in the floating navbar. It is shown for a visible document, including a document in a mixed split; it remains accessible while outlines are open.
- Replaced full-document swapping with floating cards over the intact documents. The cards have a compact icon/header, document title, Close button, rounded surface and shadow. Three-level hierarchy uses indentation and text weight; labels wrap without H1/H2/H3 aliases.
- One navbar click opens every visible document outline. A document/document split shows two independently named cards, each bounded by its own pane and positioned below the navbar. A mixed split opens a card only for the document. Cards are portaled to the body, avoiding ancestor glass/transform clipping.
- Opening does not resize the editor or change its scroll position. The underlying editor remains mounted and inert while its card is open. The list scrolls independently; wheel/touch input over the dimmed surround does not scroll the underlying document.
- Each card supports Close, Escape, backdrop dismissal and keyboard navigation. The navbar toggle closes all visible cards when any are open. Selecting a title closes that card and retains the existing animated section navigation; the other split card remains open.
- Reused installed Zustand for transient open-state reporting and installed GSAP for card reveal, title highlight and heading navigation. Same-origin iframe-backed panes receive scoped navbar commands; message handling verifies origin and the sending frame. Their geometry/heading navigation uses the parent scroll pane.
- No dependencies, migrations, persisted-content changes, commit or push. Pre-existing table-toolbar work remains separate.

## Validation

- Targeted `npx vp fmt`: passed for all ten revised/new source and CSS files; an initial formatting finding was corrected.
- Final `npm run types:check`: passed.
- Final `npm run lint`: passed; 379 checked files correctly formatted, 311 linted without warnings or errors.
- Final `npm run build`: passed in 8.16 seconds; existing large-chunk and ineffective-dynamic-import warnings remain. Build output: `/tmp/orbium-toc-floating-build.log`.
- `git diff --check`: passed, including documentation.
- All revised/new feature source files remain below 500 lines.

No automated tests were written or run. Visual, interaction and iframe acceptance remain pending the manual checklist.

## Manual checklist

1. **Navbar visibility:** Open a document. Expected: a Contents icon sits immediately beside Search and stays visible while scrolling and while its card is open. Visit a folder, workspace, database and settings without a visible document split. Expected: no Contents icon. The former editor Contents button is absent.
2. **Floating design:** Scroll a document, note its position and open Contents. Expected: a compact centered card floats above the document with its title, clear Close button, wrapped labels and indented hierarchy. The title, cover and body remain visible underneath; the document's dimensions/scroll position do not change.
3. **Split windows:** Split two documents with different titles/headings and press the navbar icon once. Expected: two cards appear, one over each pane; neither crosses the divider or covers the navbar. Each lists only its own headings. Repeat with a document/database split; expected: one card over the document.
4. **Independent destinations:** Select a distant heading in the left card. Expected: that card closes, only the left document scrolls to its heading, and the heading reveals; the right card remains open. Repeat on the right. The icon remains visible throughout.
5. **Dismiss/toggle:** Open both cards, close one with its Close button, then press the navbar icon. Expected: the remaining card closes. Press again; expected: both open. Repeat with Escape and a click on a pane's dimmed surround; expected: only that pane's card dismisses and navbar focus is restored.
6. **Outline interaction:** Hover/focus titles of different levels and lengths. Expected: one highlight moves smoothly and matches the wrapped row's height. Use Tab, arrows, Home/End and Enter; expected: focus/navigation work. Scroll a long outline; expected: it scrolls internally without moving the document or neighboring pane. Wheel over the surround; expected: background scroll is blocked.
7. **Responsive/appearance:** Resize, expand Search, test narrow split panes/mobile, light/dark and Normal/Frosted appearance. Expected: cards remain below the wrapped navbar, fit their pane, keep readable text and a reachable Close button, and do not introduce horizontal overflow.
8. **Persistence/lifecycle:** Edit without waiting for save, open/close outlines, switch tabs and return. Expected: content/selection remain intact, no orphan card appears over another page, and Saved/reload preserves the edit. Repeat Source/Preview, a database document and a legacy JSON/Tiptap document if available.
9. **Iframe fallback:** Restore a split containing a document not already retained/opened, wait for both editors to load, then open Contents. Expected: both cards are visible within their panes, the parent navbar reflects their state, and a selected heading scrolls the correct parent pane. Close/reopen and resize while scrolled.
10. **Motion:** Navigate far down a long document, then interrupt with wheel/touch/PageDown/click. Expected: scrolling yields to the user. Enable reduced motion and repeat opening/highlight/navigation; expected: immediate transitions and no reveal animation. Rapidly toggle or switch tabs mid-animation; expected: no stale fade, jump or leftover window.

## Limitations

- No browser screenshots or measured motion/performance results were taken in this pass; visual and iframe behavior need manual acceptance.
- The navbar icon can appear before a lazily loaded editor is ready. Outline commands require the editor to have mounted.
- Initial section marking follows the caret; hover/keyboard focus controls the moving highlight. There is no scroll-based section tracking.
- Same-origin iframe support does not apply to arbitrary external embedded content. Open state is transient and resets on reload.

## Suggested commit

`feat(editor): open floating document outlines from the navbar`

Remain in the current editor review and wait for manual feedback before starting another phase.
