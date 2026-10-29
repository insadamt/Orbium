# Competitive UI/UX investigation — manual validation

This file provides exact manual checks for the [competitive investigation](07-ui-ux-competitive-investigation.md), why each check matters, and its expected result. It depends on a running current Orbium build, disposable user-owned content, and a desktop browser. These checks have not been performed in this investigation. Proposed acceptance criteria describe a future approved polish pass; they are not claims about the present app.

## Setup

Use a disposable workspace with two folders, Alpha and Beta. In Alpha create `Research summary` and a database `Reading list`; in Beta create `Reference notes`. Add a unique body phrase `violet telescope` to Reference notes and favorite it. Add a Reading list document titled `Paper A` with a text/select property containing `Quantum optics`. Create a Board with one native text block and a live card referencing Research summary. Use document copies for save-failure and conflict checks.

For layout checks use 1366×768, 1440×900, and the previously reviewed desktop width around 1657 px, with 100% browser zoom. Repeat essential checks in Light/Dark and Normal/Frosted. Use a still background first; use a busy/animated background only for the specific readability/performance comparison.

Record build/asset mode, browser, viewport, content size, task completion, wrong turns, errors, and elapsed time. Run checks manually; do not run automated tests or Playwright.

## Current-behavior checks

1. **First use and creation discovery.** In a fresh disposable account or empty workspace, ask a person unfamiliar with Orbium to create a document and type two sentences without coaching. Record the first control they try, discovery time, and whether they use right-click/account search. Current source expectation: the no-workspace dashboard has shell controls; workspace creation is in its selector; node creation is in existing menus/Search Master. Proposed success: a clear start path and useful text within approximately 60 seconds, without replacing the approved blank presentation accidentally.

2. **Tab plus meaning.** Click the plus beside app tabs. Expected current behavior: workspace home opens in a new app tab. It must not be described as New document. Hover it and confirm the tooltip explains its actual function.

3. **Local versus workspace search.** Open Alpha and use the top magnifier to search `Reference notes`, then open Search Master with Ctrl+Space and repeat. Expected current behavior: local search excludes the Beta child; workspace search finds it. Proposed success: scopes are understandable before typing, and local no-results offers a clear route to workspace search.

4. **Body and property retrieval.** In Search Master search `violet telescope`, then `Quantum optics`; open each result. Expected: appropriate body/property results are found, title/path identify the source, and body results open the intended Document/find context. Compare with Reading list's local search for `Quantum optics`. Current local database source checks titles only; record the mismatch. Proposed success: title-only scope is explicitly labeled or approved property search finds Paper A.

5. **Favorites location.** While in Alpha apply Favorites; then open Beta and repeat. Expected current behavior: favorites are limited to direct children of the current container. Proposed success: the UI explains this scope; a workspace-wide collection is only expected if separately approved.

6. **Search pending/error/empty states.** With normal network speed, type several short queries quickly, erase them, and search an absent title. Repeat with manual network throttling and a blocked search request. Expected quality: no misleading no-results before completion; no stale result can open for another query; failure differs from an empty response; retry is available or the recovery path is explicit. Source currently permits a debounce-time empty-message flash; confirm or reject that hypothesis. Restore normal network settings afterward.

7. **Command discovery.** In Search Master type `New document`, then `>New document`, then clear the query. Expected current behavior: nonempty ordinary queries search content; the prefix/empty state exposes commands. Proposed success: this distinction is clear without relying on a remembered prefix. Verify creation destination in Alpha and from an open Document.

8. **Recent-page return.** Visit documents in both folders, navigate elsewhere, then use Search Master without a query. Expected: recently opened content can be recognized by title/path and opened with arrows/Enter. Record whether a newcomer discovers this route. Check app-tab switching preserves the right title, URL, scroll, caret, and Undo history.

9. **Core home regressions.** In Grid, List, and natural Gallery, apply a type filter and a nonmatching query, then clear only the chip and finally clear the query. Expected: chips reveal persisted filters; clearing a chip retains unrelated preferences; no-results is visible without decorative empty scrolling. Reveal a below-fold target excluded by a saved filter. Expected: target appears and scrolls into view temporarily; saved filters remain recoverable. Verify a failed custom icon uses its fallback.

10. **Document save failure.** On a disposable copy, wait for Saved, block only its save request through browser developer tools, type a unique marker, and wait. Try navigating/closing its app tab; cancel any browser unload. Expected: Save failed/error and guards are visible; pending text remains available; never show Saved for unconfirmed work. Unblock, retry, wait for Saved, reload, and verify the final marker. Do not force-close unsaved content to test crash recovery unless its recoverable copy has first been exported.

11. **Revision conflict.** Open the same disposable Document in two separate browser tabs. Save one edit in the first, then a different edit in the stale second. Expected quality: no silent overwrite; the rejected draft remains recoverable and the resolution is understandable. Current standalone recovery parity is unproven. Copy/export both versions before choosing any load-latest action.

12. **Header versus body status.** On a disposable Document block its header PATCH request, rename the title, and separately save body text. Expected: header failure is visible even if body Saved appears. Restore the request and verify that the displayed title matches the persisted title after reload. Record whether retry requires re-entering the title.

13. **Board recovery.** On a disposable Board block save requests, change its native text, and inspect Not saved. Expected: download local draft is available; retry is available for a recoverable connection error; Load latest requires confirmation. Download the draft first, then cancel Load latest and verify content remains. Restore requests and save. Session draft recovery must not be presented as a durable backup guarantee.

14. **Database failed value.** Block only a disposable property's save request, enter a unique new value, and commit with Enter/blur. Expected current source behavior: the cell returns to its previous value and reports an error. Proposed success: the attempted value remains available for retry without retyping. Restore requests; retry/re-enter and verify persistence after reload.

15. **Database editing continuity.** Edit text, number, select, multi-select, date, and checkbox properties in quick succession using Tab/Enter/Escape where supported. Expected quality: focus stays understandable, unrelated drafts do not revert, saves report failures locally, and filters/sorts/Table/Gallery still operate on the intended records. Record any delay caused by reloads; do not infer speed from source alone.

16. **Select, edit, and nested Escape.** In the explorer click/modified-click a page. On a Board click its native block, then double-click/Enter to edit. Select text and format it. Enter a Mind Map, edit a topic, then dismiss its nested controls in order. Expected: selection/editing/formatting are distinct; each Escape affects the nearest relevant layer; Undo returns the intended last content action, not an unrelated page.

17. **Split focus ownership.** Split two disposable Documents. Place the caret in A, move the pointer over B without clicking, then type a harmless marker and use find/Undo. Expected current behavior: hover activates B and focuses its editor. Record whether that matches the user's intent. Repeat with a menu open, a text selection, a held-button drag, and pure keyboard navigation. Expected: no unexplained edits, stolen popup focus, or shortcut interception by hidden editors.

18. **Linked original ownership.** Edit Research summary through its live Board card; save, then open the original. Expected: the original contains the edit. Remove only the card using the intended card action. Expected: the original Document still exists. Ask the tester what they expected before each action. Proposed success: visible linked/original wording makes both outcomes predictable.

19. **Canvas help accuracy.** Open Canvas controls and follow each instruction, especially Properties. Expected current investigation: help still names Object properties despite approved inspector removal. Acceptance after correction: every instruction names an available command/gesture; no removed inspector is restored merely to satisfy stale help.

20. **Reading density and keyboard location.** At each setup viewport open a short Document, database, settings, and split Documents. Record how much useful content is visible before scrolling. Tab through controls and dismiss dialogs. Expected quality: readable text, identifiable focused control/active pane, and predictable focus return, preserving the approved absence of focus rings. Compact headers are expected only after separate approval.

21. **Theme and motion.** Repeat menus, save errors, active/disabled buttons, selection, and long titles in Light/Dark and Normal/Frosted over a busy background. Enable OS reduced motion during a transition. Expected: essential labels stay readable; motion stops/skips without blocking actions; no control overlap. Preserve centered desktop tabs and original responsive wrapping, including while opening page search.

22. **Export/import scope.** Export one disposable Document as Markdown, .orbie, and a supported linked-page package with assets; import supported formats into a separate disposable destination. Expected: the advertised scope matches the imported content, and missing/unsupported assets or rich content are understandable. An arbitrary Notion ZIP or Obsidian vault is not a supported Orbium package by implication. Full account/Board/database restore remains unverified until its own approved implementation and acceptance.

## Future feature acceptance, only after approval

- **Backlinks:** mention B in A, save, open B, and follow Mentioned in back to A's context. Repeat with multiple references, Trash, and a hosted original Document. Expected: accurate attribution, no duplicates that imply extra source pages, no hierarchy mutation, and no access to another account's content.
- **Whole-account portability:** export a disposable account containing hierarchy, databases, Boards, mentions, and media; validate/preview and restore into a disposable destination. Expected: supported complete round trip with remapped links/assets. This is a separate feature gate, not an available workflow asserted by this audit.

## Manual performance evidence

Use the same representative small/large Documents, database, and rich Board on built frontend assets. Record foreground DevTools traces manually for cold opening, warm tab switches, typing, search results, database commits, repeated Board pan/zoom/revisits, and settled idle. Repeat a representative trace three times and record content/object counts, actual elapsed timings, and relevant long tasks. Compare still/animated backgrounds and Normal/Frosted separately so changes can be attributed.

Expected quality: responsive input, no blank-content flashes, stable selection/scroll/Undo, and no repeated unnecessary rich-preview preparation. Treat roughly 100 ms feedback / 200 ms ordinary interaction latency as proposed investigation budgets, not a claimed result. Report cold-server time separately. Idle CPU and thermal outcomes require foreground measurements with comparable conditions; a build check does not establish them.

## Actual investigation checks

- Automated tests, Playwright, browser automation, runtime manual checks, and performance traces: not run.
- Source formatting/lint/type/build: not run; this change adds Markdown investigation documents only.
- `git diff --check`: passed. Focused local Markdown-link and trailing-whitespace checks for both new reports: passed.
- Existing application changes: preserved. Commits: none created.

Suggested documentation commit: `docs(ui): add competitive UX investigation and manual review plan`.
