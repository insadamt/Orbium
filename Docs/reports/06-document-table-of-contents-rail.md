# Editor review — Fixed document outline rail

Date: 2026-10-12. Implemented for manual review within the current editor work; no phase advancement.

The [rail motion follow-up](06-document-outline-rail-motion.md) records smoother mark transitions and reversible panel opening/closing after the user's design acceptance.

The [complete H1/H2 rail follow-up](06-document-outline-full-rail.md) supersedes three-level extraction and twenty-mark sampling below. The current rail includes every H1/H2 and scrolls to follow the reading section.

## Changes

- Replaced the navbar Contents toggle and paired floating modal windows with a small fixed outline rail at the right of each visible document pane. The rail remains reachable while scrolling. Non-document pages have no rail.
- Three mark lengths represent the three heading levels. The current reading section is highlighted as the document scrolls. Outlines longer than twenty headings sample the rail, always including the current section; the panel lists every heading.
- Hover or keyboard focus opens a compact panel. Click/tap pins it open; Pin/Unpin, Close, Escape and outside clicks control dismissal. A short pointer-leave delay allows crossing the gap between rail and panel.
- The document stays readable and editable. Opening does not replace, dim, block or resize its content. Split panes have independent outlines and scroll destinations, including the same-origin iframe fallback.
- Titles use indentation and weight without H1/H2/H3 aliases. Long labels wrap, the list scrolls independently, and arrows/Home/End supplement Tab and Enter navigation.
- Selecting a heading collapses an unpinned preview and smoothly scrolls that document. Pinned panels remain open. User scrolling/pointer input interrupts navigation. Reduced motion disables the panel fade and uses immediate navigation.
- Markdown/CodeMirror and legacy JSON/Tiptap use their existing parsers/editor APIs. Source extraction is cached by document snapshot and updates are debounced by 150 ms while the document is visible. Scrolling reuses the heading cache; hidden tabs unsubscribe and cancel navigation.
- No dependencies, migrations, persisted-content changes, commit or push. Existing unrelated table-toolbar changes were preserved.

## Validation

- Targeted `npx vp fmt`: passed for the revised feature files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 378 files formatted correctly and 310 linted without warnings or errors.
- `npm run build`: passed in 8.33 seconds. Existing large-chunk/ineffective-dynamic-import warnings and a plugin-timing advisory remain. Log: `/tmp/orbium-toc-rail-build.log`.
- `git diff --check`: passed.
- New feature source files remain below 500 lines.

No automated tests were written or run, as requested. Browser, visual, touch and iframe acceptance remain pending manual review.

## Manual checklist

1. **Fixed access:** Open a long document containing all three heading levels. Scroll near its bottom. Expected: the small rail remains at the right below the navbar, without needing to scroll back up. Different mark lengths and a highlighted reading section are visible. Visit a folder/database/settings page with no visible document; expected: no rail.
2. **Preview:** Hover the rail, then cross into the panel and hover several headings. Expected: a compact panel shows readable, wrapped and indented titles without H1/H2/H3 aliases. Moving away closes an unpinned preview after a short delay. Opening and closing preserve document scroll position.
3. **Pin and navigation:** Click the rail or Pin, then select a distant heading. Expected: the document scrolls to that heading, the panel remains open, and editing still works. Unpin and select another heading; expected: the preview closes and navigates. Check that there is no distracting jump before smooth scrolling starts.
4. **Dismissal and keyboard:** Close the panel, reopen, press Escape, then leave and return with Tab. Expected: Close/Escape collapse it; returning keyboard focus opens it again. Use arrows, Home/End and Enter within the list. Click outside a pinned panel; expected: it closes without stealing focus from the clicked editor.
5. **Split independence:** Split two documents with different headings. Expected: each has its own fixed rail. Open one, then the other; each lists its own headings. Navigate and scroll the left document; expected: only its reading marker/scroll position changes. Repeat with a document/database split; expected: only the document has a rail.
6. **Long/empty outlines:** Use more than twenty headings and scroll throughout the document. Expected: the rail remains compact, includes the current section, and the full panel retains every heading. Open an empty document; expected: subtle placeholder marks and a helpful empty state. Add, rename and remove headings; expected: the list settles after editing without stale entries.
7. **Content formats:** Repeat navigation in Source/Preview, a database document and an available legacy JSON/Tiptap document. Add heading-looking text inside fenced code/math; expected: it is excluded. H4–H6 are excluded; real H1–H3 outside the rendered viewport remain listed.
8. **Appearance and touch:** Resize to narrow/mobile and short viewports, expand Search, and check light/dark and Normal/Frosted appearance. Expected: the rail stays below the navbar, the panel fits its pane with reachable controls, and there is no horizontal overflow. On touch, tap the rail; expected: it pins open without hover.
9. **Iframe fallback:** Restore a split containing a document not already retained/opened, then open its rail after loading. Expected: rail/panel positioning follows the parent pane while scrolling/resizing; selecting a heading scrolls that pane without moving its neighbor.
10. **Motion and lifecycle:** Start distant navigation, interrupt with wheel/touch/PageDown, then repeat with reduced motion enabled. Expected: navigation yields to input; reduced motion is immediate. Switch tabs during navigation and return; expected: no orphan panel or late scrolling. Edit, wait for Saved and reload; expected: content persists and pin state resets.

## Limitations

- Visual and interaction behavior is not browser-verified in this pass; use the checklist before acceptance.
- The rail samples at most twenty marks; all headings remain accessible in the panel. Pin state is transient.
- Visible Markdown documents parse the full source after content changes, with snapshot caching and debounce. No measured performance improvement is claimed.
- Iframe support targets the application's same-origin document panes.

## Suggested commit

`feat(editor): add fixed per-pane outline rails`

Remain in the current editor review pending manual feedback.
