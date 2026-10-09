# Phase 5 review — split motion and held-tab preparation

Date: 2026-10-09.

## Manual review correction — height, scrolling, and frosted popup

The user accepted the movement animation and requested normal document height/scrolling plus correction of the brief transparent background during popup. This section supersedes the original fixed-pane scrolling behavior and its checklist expectations below.

Split pages now use natural content height, start at the same responsive top gap as standalone pages, and align at the top without stretching a short document to match a long one. The main page and browser scroll remain unlocked; scrolling moves both columns in normal document flow. Entering a split no longer resets page scroll, and tab scroll persistence records the outer page position. Markdown source retains its existing inner editor scroller, as in standalone mode.

Prepared database and fallback document iframes resize to their embedded content through a frame-owned ResizeObserver, coalescing measurements after a frame. A host-viewport CSS variable keeps their document/editor minimum heights tied to the main viewport instead of the growing iframe, avoiding viewport-height feedback. Observers and resize listeners are disconnected on cleanup.

Popup motion now changes transforms without fading the pane wrapper. [MDN's backdrop-filter documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) explains that an ancestor with opacity below one becomes a backdrop root, preventing a child from blurring the background behind that ancestor. Removing those opacity writes addresses the identified cause of the frosted/transparent switch. Popup scale originates near the visible viewport center so long natural-height documents do not jump around their full content midpoint. Browser confirmation remains pending.

Correction validation: targeted formatting, TypeScript, lint, build, and `git diff --check` passed. Existing build warnings remain. No automated or visual tests were run. No new dependencies were added; this repair uses the existing GSAP animations and native ResizeObserver.

Focused manual checklist after reloading assets:

1. Compare one document standalone and split. Expected: the same top gap and minimum-height behavior; narrower text can wrap into a taller document.
2. Split a short and a long document. Scroll the page over either column. Expected: both pages move in document flow, the short page ends naturally, and the longer page remains accessible below it; only the navbar stays fixed. End the split and check the selected document's position.
3. Repeat with a database pane and a fallback/restored document pane. Expected: iframe content grows with its contents rather than leaving a fixed viewport-sized scroll box. Check Markdown source mode against standalone source mode.
4. Use Frosted appearance with a wallpaper and repeat left/right split and merge, including while scrolled into a long document. Expected: the surface stays frosted throughout the popup, without a transparent flash or a large scale-origin jump. Check Normal appearance and reduced motion too.

Suggested correction commit: `fix(navigation): restore split page flow and stable frosted motion`

## Change

Holding an eligible tab starts preparation on pointer-down, before the drag threshold. Keyboard drag activation also prepares it. Loaded document tabs are reused. Cold document tabs fetch their authenticated Inertia page in the background, download the appropriate editor module, and register a hidden retained document surface without changing the active tab, URL, or history. Duplicate requests for the same tab/location/account share one promise. Responses are rejected if the account or tab location changed, and cannot overwrite an already-loaded document snapshot.

Dropping waits for any document preparation still in flight before creating the split, with an Opening status while waiting. Changing the selected tab or its location during this wait cancels the delayed split. A failed request or a 15-second network timeout falls back to the existing iframe path. First network and editor construction cannot be guaranteed to finish within a very short hold.

Database tabs prepare an eager hidden iframe. Split frames are now keyed by tab rather than by split pair and stay under the same React parent when revealed, so a prepared database frame is reused on drop. Restored inactive groups remain unbooted until selected. Warmed frames remain available while their tab is open; document frames can be replaced by a retained document surface. Holding a tab can therefore consume memory and start downloads even when the drag is cancelled.

GSAP coordinates the transitions: the main surface moves/scales horizontally into its pane over 460 ms; the dropped pane fades and scales in over 380 ms with a 60 ms overlap. Ending a split first pops the outgoing pane out over 180 ms, then returns the selected surface to its centered layout. Components stay mounted. The exit commit occurs before the next paint to avoid showing the outgoing surface again between phases. Repeated exit clicks do not create competing exit animations, and an exit abandoned by changing the selected tab does not commit stale navigation. Reduced motion applies the layout immediately.

## Library review

GSAP is already installed and was explicitly requested. No dependency was added or upgraded. Its [Flip plugin](https://gsap.com/docs/v3/Plugins/Flip/static.from()/) supports automatic layout transitions; width/height animation can repeatedly reflow long documents, while full-axis scaling can also distort their height. This implementation uses a small GSAP service with measured positions and horizontal transform scaling, preserving the bounded grid and avoiding width/height writes every frame. Brief horizontal text scaling during movement remains a tradeoff; smoothness and frame rate are not measured.

[Inertia prefetching](https://inertiajs.com/docs/v3/data-props/prefetching) prepares responses, but does not construct the retained editor or reuse an iframe application. The focused document preparer uses the existing Inertia GET protocol and tab cache, followed by editor-module loading and hidden mounting. It avoids issuing a navigation merely to prepare a held tab.

## Validation

- Targeted formatting: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS; existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: PASS.
- No automated tests were written or run. No browser/visual testing was performed, per user instruction.
- No backend changes, migrations, dependency changes, or commits.

## Manual checklist

Reload the assets once. Use disposable documents for edits.

1. Load documents A and B. Select A, hold B, and drop it at the right edge, then repeat at the left edge. Expected: A moves into the opposite pane while B pops into the chosen pane; neither loaded editor reloads, the navbar stays clear, and both panes scroll independently.
2. End the split with A selected, then repeat with B selected. Expected: the other pane pops out, the selected document returns to the centered layout smoothly, and its scroll position and undo history remain.
3. Reload with several ordinary document tabs persisted. Hold an unvisited restored document tab before dropping it. In Network, expect its document GET and editor download to start while held. After preparation completes, expect its prepared content on drop without a second document GET. A very fast drop or slow network may wait; failed preparation uses the loading fallback.
4. Hold a document tab and release without splitting, then repeat the hold/drop. Expected: current content and URL remain unchanged while preparing, tab ordering still works, and the prepared document is reused. Clicking Close must not initiate preparation.
5. Hold a database tab before dropping it. Expected: the iframe starts loading while held and is revealed in its pane without creating a second iframe application. Change the standalone database tab's location before a later hold and check that the correct database is prepared.
6. Edit both document panes, switch focus, use Ctrl+S and Undo/Redo, then split/merge while saving. Expected: edits and save protection continue to work. Click End split repeatedly or switch to another tab during exit. Expected: no stuck transparent pane, stale split removal, or competing motion. Retest two split groups and narrow-screen stacking.
7. Enable operating-system reduced motion and repeat split/merge. Expected: immediate placement with no popup or movement animation; preloading still works.

Suggested commit: `feat(navigation): animate split panes and prepare held tabs`

Remain in Phase 5 for manual acceptance.
