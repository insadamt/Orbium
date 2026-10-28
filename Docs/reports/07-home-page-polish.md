# Home explorer polish — 2026-10-28

This report explains the approved desktop home-page fixes, their dependencies, validation, and manual acceptance steps. It depends on the floating workspace shell, shared navigation/page-search state, node media URLs, and natural Gallery measurements. It follows the investigation in `07-home-page-polish-investigation.md` and the user’s narrowed scope.

## Implemented

- Filtered-empty feedback uses a large centered No matching pages state with an 88 px icon surface, 28 px heading, short guidance, and a labeled Clear search and filters action. The user requested this middle-of-page presentation after reviewing the compact toolbar version. Shared floating surfaces retain Normal/Frosted and Light/Dark styling. Clearing restores the title query and type filter together, retaining view and sort.
- Reveal reads the current Inertia page URL, temporarily includes a direct-child target that filters would exclude, and shows Revealed outside filters in the same toolbar status. Its close icon offers Return to filters through the shared tooltip. Saved type/sort/view preferences are preserved. A subsequent nonempty search change or type-filter change ends the exception; Return to filters dismisses it immediately.
- A focused target scrolls to the center after layout begins settling. Resize observation follows initial Gallery measurements for up to one second. Wheel, pointer, or keyboard input stops pending reveal scrolling so the user keeps control. Scrolling is immediate, including with reduced motion.
- Unavailable uploaded card icons fall back to an existing emoji or the standard type icon. Changing the attachment ID allows the new image to load; reloading also retries the image. No saved media data is changed by a load failure.
- Updated the UI documentation and investigation scope. Empty containers retain the approved blank presentation.

## Scope boundaries

The user explicitly excluded mobile/touch work, screen-reader semantics, and RTL context-menu changes. The interface remains English; authored content can contain other languages. No new first-use hints, navigation redesign, or backend performance changes were added.

The explorer orchestration remains below 500 lines. Filter feedback and reveal scrolling have their own small files. New/modified source files include purpose/dependency summaries and comments explaining the non-obvious behavior.

## Persistence and commits

- No migration, schema, archive, or content-format changes.
- Clear search and filters intentionally saves All types using the existing container preference mechanism. Reveal alone does not modify it.
- No commits created.

## Validation

- Targeted `vp fmt`: passed.
- `npm run lint`: passed; all 863 files correctly formatted, no warnings/errors across 694 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 24.19 seconds. Warnings: chunks exceeding 500 kB, mixed static/dynamic imports for the image crop dialog, database property header and document editor loader, and plugin timing diagnostics.
- `git diff --check`: passed.
- No automated tests, Playwright, browser automation, or manual browser verification were run.
- Concurrent changes appeared in `inline-icons.css` and `mindmap-inline-icons.css` during this task; they were left untouched and are outside this home-page change.

## Manual acceptance checklist

1. **No search matches:** open a populated workspace, expand Search, and enter `orbium-no-match-92841`. Expected: a large centered No matching pages state appears in the empty explorer area with guidance and a labeled Clear search and filters action. Click it; the full direct-child list returns and the query is empty.
2. **Type-filter recovery:** in a container with documents but no Boards, choose Boards. Expected: the same feedback and recovery action appear. Click Clear search and filters, then reload. Expected: All types remains selected; the existing view and sort remain selected. Repeat steps 1–2 in Grid, List, uniform Gallery, and natural Gallery.
3. **Reveal below the fold:** use a long container in List view. Find a child ID by opening a disposable page and noting its numeric ID in the URL. Open its parent with `?focus=<child-id>` appended (for example `/workspaces/1?focus=42`, using real IDs). Expected: the target scrolls into view and has the existing dashed Reveal outline. Repeat in Grid, uniform Gallery, and natural Gallery with mixed cover ratios.
4. **Reveal through a saved filter:** select Boards in a container containing a document, then open that parent URL with `?focus=<document-id>`. Expected: the document appears alongside matching Boards, the type filter remains Boards, and Revealed outside filters appears in the toolbar. Scroll upward if necessary to inspect it. Hover its close icon to see Return to filters, then click it. Expected: the document disappears and only filtered results remain; if there are no Boards, no-results feedback appears. Reload the parent URL without `?focus=`. Expected: Boards is still the saved filter.
5. **New input takes priority:** repeat step 4, then type an absent title or choose another type filter. Expected: the temporary exception ends and ordinary filtering applies. Typing non-Latin titles should still filter their matching cards; labels and settings stay English.
6. **Invalid target:** try `?focus=not-a-number`, `?focus=-1`, and a nonexistent numeric ID. Expected: no crash or unexpected scrolling; ordinary explorer results remain. A target outside this parent’s direct children must not be inserted.
7. **User controls scrolling:** open a long parent with a valid `?focus=` and immediately use the wheel or press a navigation key. Expected: pending reveal scrolling stops. With OS reduced motion enabled, repeat step 3; scrolling should be immediate.
8. **Broken uploaded icon:** give a disposable document, folder, database, or Board a custom uploaded icon. In browser developer tools, block only its icon-image URL, then reload the parent. Expected: a normal type icon or existing emoji appears instead of a broken image. Check Grid, List, and Gallery. Unblock the URL and reload. Expected: the uploaded icon returns. Change to a different icon attachment after a failure; the new image should load.
9. **Empty container and themes:** inspect a genuinely empty workspace/folder with no filters. Expected: no permanent empty-state panel. Repeat the feedback/icon checks in Light/Dark and Normal/Frosted at desktop widths. Expected: the centered no-results state uses the app’s monochrome type, rounded icon/action surfaces, selected solid/frosted appearance, and ordinary hover treatment. Reveal continues to use a compact toolbar notice with its tooltip. No overlap with cards occurs.
10. **Explorer regression:** open cards, use Ctrl/Cmd+click selection, open an overflow menu, rename a disposable item, reorder it in Manual order, cancel a drag, move it into a folder, and delete/restore it. Expected: existing actions behave normally and saved changes survive reload.

## Known limitations and stop

Browser behavior remains subject to the manual checks above. Reveal’s initial layout-following period is bounded to avoid a persistent observer or unexpected later scrolling. This pass covers home/workspace/folder explorer cards, not icon rendering on unrelated pages.

Remain on home-page review; do not begin the next page until the user directs it.

## Suggested commit messages

- `fix(explorer): improve search recovery and reveal navigation`
- `fix(explorer): fall back when uploaded card icons fail`
