# Phase 5 review — first performance and microinteraction pass

Date: 2026-10-02

## Scope and outcome

Implemented the first, low-risk batch of the approved performance plan within the current explorer review. The broader optimization plan is not complete. No later project phase was started.

### Backend loading

- Workspace explorer eager loading now selects only document identity and cover/icon attachment IDs. It no longer hydrates document JSON or body text just to render explorer metadata.
- Ancestor traversal uses a node-ID lookup instead of repeatedly scanning the entire workspace collection. Missing ancestors remain invisible; a visited set also prevents malformed cycles from hanging traversal. Breadcrumbs reuse the lookup after visibility validation.
- Database views load document identity, cover ID, and at most 240 characters of body preview directly from PostgreSQL. They no longer hydrate full document JSON or full plain text for a short gallery preview.
- Existing response shapes, workspace scoping, ordering, hierarchy write validation, and attachment routes are preserved. The explorer still sends the lightweight workspace hierarchy needed by current drag/drop consumers.

### Editor and wallpaper work

- Mermaid source changes settle for 200 ms before preview rendering. Pending timers are canceled, obsolete imports cannot start a render, and obsolete render results cannot replace the current preview. Source persistence and SVG sanitization remain unchanged. Already-running Mermaid rendering is not interruptible by this change.
- Editor block hover measurements run at most once per animation frame using the latest pointer location. Pending work is canceled when leaving the editor, opening the block menu, or unmounting. Right-click positioning and final drop calculations remain synchronous.
- Aurora caches converted colors until its color array changes. Amplitude/blend/theme updates use the existing live uniform path instead of recreating the WebGL renderer. Its animation loop explicitly stops while the browser document is hidden and restarts on return.

### Motion

- Added a small CSS motion stylesheet with shared feedback/entry/exit durations.
- Floating icon, add-tab, and search buttons, plus standard shell buttons, have a short press response and color transitions.
- Menu items have short highlight transitions.
- Shared navigation dialogs, including Search Master, fade in over 160 ms and out over 100 ms using Radix presence. Opacity-only motion avoids changing the coordinate system of positioned descendants.
- All newly added motion is restricted to `prefers-reduced-motion: no-preference`. No route visit or save operation waits for animation completion.

## Library decision

No dependencies added. The approved recommendation uses native CSS and the already-installed Radix dialog primitive for these simple states. Existing GSAP remains available for later coordinated motion.

Research from the planning pass:

- GSAP matchMedia supports reduced-motion conditions and cleanup: https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/
- Motion supports lazy feature loading but adds another animation system: https://motion.dev/docs/react-lazy-motion
- TanStack Virtual supports measured virtual items, but editable-cell focus, drag/drop, and backend payload reduction still need separate integration: https://tanstack.com/virtual/latest/docs/api/virtualizer

The small changes here do not warrant a new animation or debounce package. Virtualization remains a separate decision after profiling large datasets.

## Validation actually performed

- `npm run types:check`: PASS.
- `npm run lint`: PASS; 191 files formatted, 131 files linted, no warnings/errors in that configured scope.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS. Existing chunks above 500 kB still produce a warning. Build also reports plugin timing information.
- `git diff --check`: PASS.
- Targeted formatting applied with Vite Plus and Pint.
- Automated tests: neither written nor run, per user instructions.
- Browser interaction checks, live PostgreSQL request profiling, FPS measurements, and memory traces: not performed. Build success does not establish runtime smoothness or query correctness against a live database. The configured lint scope excludes vendor-style wallpaper JSX, including Aurora; it is formatted and processed by the build.

## Manual checklist

Use disposable content for moves/deletes and compare with the previous revision on the same device when evaluating performance.

1. Open a workspace containing folders, documents with icons/covers, and databases. Switch Grid/List/Gallery and refresh. Expected: the same children, images, labels, order, and selected layout remain available.
2. Open a folder several levels deep; follow every breadcrumb back to root. Expected: correct ancestors and contents, without missing metadata or errors.
3. Move a document into a folder and database, reorder siblings, then refresh. Try an invalid containment move. Expected: valid changes persist and invalid containment remains rejected.
4. Trash a test folder with children, return to root, and restore it through Trash. Expected: hidden descendants stay hidden while trashed and return with their hierarchy on restore.
5. Open a database with long document bodies, emoji/non-Latin text, covers, and property values. Compare Table and Gallery; change body/cover/none preview. Expected: covers and first 240 characters are correct; values, sorting, filtering, and edits still work. Open a child document and confirm its complete body is intact.
6. In a long document, move the pointer rapidly between paragraphs, lists, tables, and code blocks. Move outside the editor before the next frame. Expected: handles follow the correct block without reappearing after leaving. Use Add below, right-click, and block drag/drop. Expected: the correct block is edited or moved.
7. Edit a Mermaid source quickly; pause, then open Preview. Expected: the latest source renders after the short settling delay. Enter invalid syntax, then repair it. Expected: an understandable error and recovery, with source preserved. Navigate away while a render is pending; return and verify saved source.
8. Select Aurora through Appearance's wallpaper dialog. Move amplitude/blend/color controls repeatedly. Expected: live changes with no renderer-reset flash. Apply, switch browser tabs, then return. Expected: the background resumes correctly. Repeat Apply/Cancel and light/dark changes.
9. Click floating Search, its close button, add-tab, and standard form buttons. Open/close Search Master and creation dialogs repeatedly using pointer, Enter, and Escape. Expected: short feedback, prompt focus, correct dismissal, no blocked clicks, and no delayed navigation.
10. Enable OS/browser reduced motion and repeat step 9. Expected: the new fades and press scaling disappear, while keyboard focus and all actions still work. Animated wallpaper follows the existing static fallback behavior.
11. Repeat core interactions at wide and narrow widths in light/dark mode. Expected: no new overlap, shifted overlays, or page overflow.
12. Regression-check typing, undo/redo, Ctrl+S, immediate navigation after editing, and multiple split groups. Expected: existing save guards, document contents, and tab state remain intact.

## Performance measurement follow-up

Record browser Performance traces using a production build for the same long document, large database, and deep workspace before and after this pass. Compare pointer-handler frequency, Mermaid work during rapid typing, Aurora renderer creation while adjusting settings, server request duration, and server memory. Separate static-background and animated-background runs. No numeric runtime improvement is claimed yet.

## Remaining plan

- Autosave serialization and document-search work during typing.
- Memory/background activity in inactive split panes, preserving unsaved edits.
- Large table/gallery virtualization if supported by measurements.
- Remaining wallpaper lifecycle differences and shader costs.
- Initial/document bundle analysis and search query-plan profiling.
- More coordinated tab/reorder/page transitions after baseline behavior is manually accepted.

## Compatibility and commits

No migrations, persistent-format changes, new packages, or commits. Existing save/revision behavior was not modified.

Suggested commits:

- `perf(hierarchy): narrow document loading and index ancestor lookups`
- `perf(editor): coalesce hover measurements and debounce diagram previews`
- `perf(wallpaper): reuse Aurora renderer and pause hidden animation`
- `feat(motion): add reduced-motion-aware control and dialog feedback`

Stop for manual review of this batch. The repository's current Phase 5 instructions require review before moving beyond the current scope.
