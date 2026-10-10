# Editor review — source scroll boundaries

Date: 2026-10-10. Implemented for manual review within the current editor review; no later phase started.

## Finding and change

The user reported scrolling until the editor disappears. The exact view was not specified; a clarification was presented and remains unanswered. Code inspection found a concrete scroll-chaining path in Source mode: its bounded CodeMirror scroller used default overscroll behavior, allowing further wheel/touch scrolling at its endpoints to move the containing document page.

Source mode now uses vertical scroll containment. Live Preview explicitly retains automatic overscroll behavior because its content participates in natural document-page scrolling. The split workspace's custom wheel routing now respects nested scrollers with `contain` or `none`, including at endpoints, rather than forwarding their wheel input to the containing pane.

This addresses the identified Source-mode path. It is not browser-confirmed as the cause of the user's report. No content, persistence, dependency or backend changes were made. No commit was created.

## Library/API assessment

Reviewed installed CodeMirror theme code and the official [CodeMirror styling guide](https://codemirror.net/examples/styling/) reference, whose web fetch failed. Reviewed [MDN overscroll behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior).

Native CSS supplies boundary containment; another scrolling library would duplicate browser gesture handling for this repair. CSS does not automatically constrain application-written wheel handlers, so the existing split handler checks computed containment. Containment applies to scroll containers, not arbitrary visible-overflow content or iframe elements. Browser support and touch behavior need manual acceptance. No new-feature library choice or dependency installation is required.

## Actual validation

- Targeted `npx vp fmt`: passed for all three changed source files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 367 correctly formatted files and 301 linted files without warnings/errors.
- `npm run build`: passed, exit 0, 8.44 seconds; existing large-chunk and mixed static/dynamic import warnings remain.
- `git diff --check`: passed, exit 0.
- Automated tests were neither written nor run, as instructed. PHP checks are not applicable.
- Browser acceptance is pending; no browser verification is claimed.

## Exact manual checklist

1. Reload Orbium, open a disposable long Markdown document and enable Source mode. Position the page so the source editor is visible. Wheel inside it to the last line and keep wheeling down. Expected: the editor stops at its last line and the containing page does not move. Repeat at the first line while wheeling upward.
2. Move the pointer outside the source editor and wheel. Expected: the document page still scrolls normally, allowing access to the title, cover and footer.
3. Repeat step 1 with a short/empty source document, a trackpad and touch where available. Expected: boundary gestures remain within the source scroll area; editing still works.
4. Split two documents and enable Source mode in one. Wheel inside its source editor at both boundaries. Expected: neither its containing pane nor the other pane starts moving. Wheel over the outer pane content: expected only that pane scrolls. Wheel over the background/gutter: expected both panes still follow existing synchronized wheel behavior.
5. Switch back to Live Preview and scroll from the title through the final block. Expected: natural page scrolling remains available throughout. Repeat inside a split pane and with a scrollable code block or menu.
6. Edit a disposable paragraph, undo/redo, wait for Saved and reload. Expected: content persists normally. End the split and navigate between tabs: expected source containment and ordinary document scrolling remain appropriate to each view.

If the disappearance occurs in Live Preview or involves scrolling into empty space, report that view and whether split mode is active; that would require further diagnosis beyond the Source-mode path repaired here.

Suggested commit: `fix(editor): contain source scrolling at editor boundaries`

Remain within the current review phase and await manual review.

## Follow-up — editor is the final page area

The user clarified that a margin remained after the editor and that the editor's
end should be the final scrollable area. The previous containment fix addressed
Source-mode scroll chaining but did not remove this layout spacing.

Removed the shortcut footer from both Markdown and legacy editors. A focused
`editor-scroll-layout.css` stylesheet removes document-island bottom padding and
its minimum-height extension, document-page bottom padding, and document split
pane bottom padding. Active split workspaces also omit outer page bottom padding,
which previously extended the host page beyond the viewport-height panes. Rules
apply after the shared desktop, responsive and embedded layout styles. The
existing empty writing area inside Live Preview and the target for adding text
after a final special block remain usable.

No dependency is needed: this repair corrects existing CSS box spacing and JSX
placement. No content format, persistence, backend or migration changes. No
commit created. Remain in the current editor review phase.

### Actual follow-up validation

- Targeted `npx vp fmt`: passed for all five changed source files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 368 formatted files, 301 linted files without warnings/errors.
- `npm run build`: passed, exit 0, 8.46 seconds; existing large-chunk and mixed import warnings remain.
- `git diff --check`: passed, exit 0.
- No automated tests written or run. Browser/manual acceptance remains pending.

### Follow-up manual checklist

1. Hard reload and open a long Markdown document in Live Preview. Scroll to the bottom, then keep wheeling down. Expected: the editor's bottom is the final page area; no shortcut footer or additional blank padded strip appears after it.
2. Enable Source mode and repeat, first inside the editor and then with the pointer outside it. Expected: source scrolling stops at its boundaries, and the page ends at the source editor's bottom without additional footer spacing.
3. Split two long documents and repeat over each pane and the outer background. Expected: each document pane ends at its editor, and the host page has no additional bottom padding beyond the panes. Repeat with a document/database split; the database retains its own internal spacing.
4. Repeat at desktop, tablet and phone widths, and on an existing legacy-format document. Expected: responsive padding does not restore the removed document bottom gap. On narrow screens, the stacked second pane remains reachable through normal outer scrolling.
5. In a disposable document ending in code, a table or a diagram, use Click to write below and type. Expected: the writing target still works. Try an empty document and type at its bottom: expected the editor's empty writing area remains available. Save and reload: expected content persists normally.

Suggested commit: `fix(editor): remove trailing document scroll space`

## Follow-up — remaining viewport-height gap

The user supplied a screenshot showing a large background area below the
document island after scrolling down. The earlier padding repair left the
floating page's `min-height: 100dvh` and the shell's `min-h-screen` in place.
These can extend the page beyond a shorter document even when bottom padding
is zero. The document page and its shell now use natural content height.
Active split workspace hosts receive the same override; their panes retain
their existing viewport heights and scrolling behavior.

This is an existing layout repair using native CSS, with no new feature,
dependency, persistent format change or migration. Existing editor writing
space and the Click to write below target remain available. No commit created.

### Actual validation

- `npx vp fmt resources/css/editor-scroll-layout.css`: passed, exit 0.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 368 correctly formatted files and 301 linted files without warnings or errors.
- `npm run build`: passed, exit 0, 9.97 seconds. Large-chunk and mixed static/dynamic import warnings remain.
- `git diff --check`: passed, exit 0.
- No automated tests written or run. No PHP code changed.
- Browser inspection could not proceed because the in-app browser backend was unavailable. The screenshot's exact rendered cause and visual acceptance remain unverified.

### Manual checklist

1. Hard reload the document shown in the screenshot. Scroll all the way down and continue wheeling with the pointer over the background. Expected: the document ends at the editor island; no additional scrollable background strip appears below it.
2. Open a short and an empty document, then resize between desktop and phone widths. Expected: no forced page-height gap follows the island; the empty editor remains writable. A document shorter than the viewport can still leave visible background without allowing extra scrolling.
3. Open a long document in Live Preview, then Source mode. Scroll each mode to its bottom. Expected: all content remains accessible, the page ends at the island, and Source-mode wheel gestures remain contained inside the editor.
4. Split two documents, then switch back to a single tab. Repeat bottom scrolling and resize to a narrow stacked layout. Expected: each pane ends at its document; both stacked panes remain accessible, and returning to a single tab does not restore trailing scroll space.
5. In a disposable document ending with an image, click Click to write below, type a paragraph, wait for Saved, and reload. Expected: the paragraph is editable and persists.

Suggested commit: `fix(editor): remove viewport minimums below document content`

Remain within the current editor review; wait for manual acceptance.

## Follow-up — fill the screen with a small bottom margin

The user confirmed the gap remained and clarified that the editor should reach
the bottom of the screen with a small margin. Simply removing minimum heights
did not establish that layout: a short island could still end well above the
bottom of the viewport. This follow-up supersedes the natural-height-only
approach above.

The document page now fills at least the viewport and passes its remaining
height through the retained workspace and visible tab to the document island
using a flex column. The island grows into that space. Longer content still
uses natural window scrolling. The page ends with 16px of outer spacing and
the island retains 16px of internal bottom padding. Retained document split
panes likewise grow short islands and retain a 16px bottom margin. Embedded
frame documents keep content-based sizing to avoid iframe measurement feedback.
Hidden retained tabs remain hidden.

Native CSS handles the existing layout repair; no dependency or new feature
library is needed. No content, persistence, backend or migration change. No
commit created. Browser visual acceptance remains pending because the in-app
browser was unavailable during the previous inspection attempt.

### Manual checklist

1. Hard reload the document from the screenshot and scroll fully down with the pointer over the background. Expected: the island's bottom sits 16px above the viewport bottom, with no large trailing background gap.
2. Open an empty and a short document. Expected: the island fills the remaining screen height and ends with the same small margin. Resize between desktop and phone widths: expected the margin remains 16px.
3. Open a long document and switch between Live Preview and Source. Expected: the final block remains reachable and the island ends at the small margin; Source scrolling remains contained.
4. Split two documents, including one short document, then return to a single tab. Expected: short document islands fill their panes, long documents remain scrollable, and the small bottom margin remains. At phone width, expected both stacked panes remain reachable.
5. In a disposable document ending in an image, click Click to write below and type a paragraph. Wait for Saved and reload. Expected: the paragraph persists and the writing target remains usable.

Suggested commit: `fix(editor): fill viewport with a small bottom margin`

### Actual validation

- Targeted `npx vp fmt`: passed for both changed source files.
- `npm run types:check`: passed, exit 0.
- Final `npm run lint`: passed, exit 0; 368 formatted files and 301 linted files without warnings or errors.
- Final `npm run build`: passed, exit 0, 7.72 seconds; existing large-chunk and mixed import warnings remain.
- `git diff --check`: passed, exit 0.
- No automated tests written or run. PHP checks are not applicable.
- No browser verification claimed; manual acceptance is pending.

Remain within the current editor review; no later phase started.

## Confirmed root cause — external CodeMirror tooltip host

The previous layout changes did not address the actual trailing element.
Inspected the user's connected Chrome tab for the editor audit document using
the browser skill. The current frontend assets and the layout overrides were
already loading correctly. A direct child of `body`, outside the application,
had CodeMirror theme classes, no children, and a height of 430.640625px.
The document's scroll height was 2425px while its main content height was
1994.78125px.

Installed CodeMirror source confirms that a tooltip configured with an external
parent creates a container and assigns `view.themeClasses` to it. Orbium places
the selection toolbar under `document.body` to preserve backdrop blur. Both
Markdown themes used the root selector `&`, so editor height/minimum-height
rules also applied to that empty tooltip container: Live Preview reserved 45%
of the viewport after the app, and Source mode could reserve its fixed height.

Both root theme selectors now use `&.cm-editor`. Editor dimensions remain
unchanged, while external tooltip hosts receive no editor height. This is a
focused repair to the existing library integration, with no new dependency,
content change, migration or commit.

### Actual validation and browser observations

- Targeted `npx vp fmt`: passed for both changed theme files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 368 formatted files and 301 linted files without errors or warnings.
- `npm run build`: passed, exit 0, 8.00 seconds; existing large-chunk and mixed import warnings remain.
- `git diff --check`: passed, exit 0.
- Reloaded the already-saved open document after building. The rebuilt assets loaded, the empty tooltip host measured 0px, and document scroll height became 1995px for 1994.78125px of main content.
- Scrolled the existing document to the bottom without editing content. The viewport was 957px high and the island bottom was 940.78125px, leaving 16.21875px of visible bottom margin. Screenshot inspection confirmed the large background gap was gone.
- No automated tests written or run. Source, split, mobile and editing acceptance remain for the user's manual review.

### Manual checklist

1. Refresh the affected document and scroll fully down. Expected: only about 16px of background below the editor island, including after continued wheel input.
2. Select a few words to show formatting controls, then click outside to dismiss them and scroll down again. Expected: the toolbar works and no blank trailing area appears.
3. Switch to Source mode and repeat bottom scrolling with the pointer outside the editor. Expected: no extra editor-height gap after the island; scrolling inside Source remains contained.
4. Repeat on a short document, at phone width and in split view. Expected: document islands retain the small margin and all content remains reachable.

Suggested commit: `fix(editor): exclude tooltip hosts from editor height rules`

Remain in the current editor review; no later phase started.
