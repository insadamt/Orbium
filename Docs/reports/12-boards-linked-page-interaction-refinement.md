# Boards phase 4 — Linked-page interaction refinement

## Implemented

- Replaced pixel-only Markdown restoration with a visible source-block anchor and viewport-relative offset. Optional DOM source ranges connect the existing rich preview to the existing editor; no content format changes.
- Restores after initial editor layout and corrects once more after estimated offscreen heights update. Double-click activation focuses near its pointer position without browser scrolling; keyboard/menu activation uses the anchored block.
- Keeps the rendered preview visible while waiting for source. Reuses the preview's loaded snapshot when its ID/revision match the target summary, while retaining original-Document save/conflict protection.
- Reduced the header to icon/title, Open and one actions menu. Refresh moved into the menu. Hosted Markdown actions include Finish editing, Refresh and existing import/export/source controls. Finish is disabled while saving, unsaved or importing; session guards remain authoritative for other pending operations.
- Saved status remains accessible to screen readers; saving/unsaved/error states stay visible. Removed the permanent subtitle, icon tile and extra shadow.
- Compact header and shared 40px gutter leave more space for content, with block controls available during editing.
- Kept inactive cards on lightweight rendered previews, hosted Markdown drag targets local-only and original Document persistence unchanged.

No commits, migrations, stored-format changes or later-phase work.

## Validation

- Targeted formatting/lint: passed after correcting a JSX cleanup error found by the formatter.
- `npm run lint`: passed; 655 files formatted, 549 linted without warnings/errors.
- `npm run types:check`: passed.
- `npm run build`: passed; large-chunk, mixed static/dynamic import and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run. Manual browser verification remains pending.

## Manual checklist

1. Create a long linked Markdown Document with uniquely named paragraphs, headings, nested lists, table, image and diagram. Scroll a named paragraph partly into view, double-click its text and immediately type. Expected: the same source block stays at its viewport offset, the caret appears near the pointer, and typing updates the original Document.
2. Repeat near the bottom at 50%, 100% and 150% Board zoom and with a narrow card. Expected: the visible block is anchored even when preview/editor wrapping differs; no jump to the first paragraph.
3. Edit and scroll, wait until saved, then use menu → Finish editing. Expected: preview returns to the same visible source block. Repeat using the Board's existing finish control.
4. Start editing with Enter and with menu → Edit content. Expected: focus enters near the visible anchored block without scrolling to the start.
5. On a cold load/slow connection, start editing before source finishes loading. Expected: existing preview stays visible while the request is pending; the replacement preserves the viewed section. With a loaded matching preview, editing avoids a duplicate source request.
6. Inspect the header before/during/after editing. Expected: compact title/icon, Open and one menu; no permanent Saved label, subtitle or duplicate Refresh button. During typing, Unsaved/Saving appears; a save failure stays visible with Retry.
7. Open the editing menu and exercise export and source/Live Preview toggles. Expected: existing actions remain functional. Refresh updates the linked preview without replacing an unsaved editor draft; Finish remains guarded during pending work.
8. Drag an internal block and undo/redo. Expected: compact handles remain usable, internal scrolling stays contained and outer card geometry stays fixed.
9. Open the original in another tab and edit it before saving an older card session. Expected: existing revision-conflict behavior protects newer content.
10. Check standalone Documents and legacy linked Documents. Expected: standalone controls retain their usual layout; legacy editing and pixel-offset continuity remain available. Database/Board cards still navigate normally.
11. Check light/dark appearance, keyboard focus and screen-reader labels. Expected: quiet border/background, readable transient statuses and accessible menu actions. Resize and drag the outer card by its header: selection/resize controls remain visible.

## Limits

This refinement preserves source-block position, not identical pixels for every rich
block renderer. Content edits before the anchor, asynchronously loaded media and
very large blocks can still change visible layout; unavailable anchors fall back
to scroll offsets. Legacy Documents retain pixel-based continuity. The existing
preview size/depth limits remain. No inactive full editors are introduced. Visual
and interaction acceptance must be performed manually using the checklist above.

Suggested commit: `feat(boards): anchor linked-page editing and simplify card chrome`
