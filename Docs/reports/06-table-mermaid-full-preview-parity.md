# Editor review — Table fullscreen matches Mermaid full preview

Date: 2026-10-12. Current Markdown editor review; manual acceptance pending. No next phase started.

## Changes

The user requested the same fullscreen experience for tables as Mermaid. Tables now use the same Radix modal viewer as diagrams: an inset rounded window, blurred backdrop, quiet title, top close icon, and floating bottom zoom/Fit toolbar. Wheel zoom anchors at the pointer, dragging pans, and the focused canvas supports plus/minus, arrows and zero to fit. Resize refits the content. Escape and Close restore focus to the original expand control when it remains mounted.

Extracted the existing Mermaid viewer into `content-full-preview.tsx`. Mermaid supplies its sanitized SVG and dimensions; tables supply a rendered snapshot with editing controls removed, current table dimensions and table-specific accessible labels. The existing corner launch button remains. Closing the source widget disposes its viewer. Fullscreen remains a reading view; edits and sorts stay in the document.

Removed the superseded native table dialog styles and adapted SVG sizing for the shared content wrapper. No dependency, migration or persisted content changes. No commit created; unrelated work preserved.

## Validation

- Targeted `npx vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 395 formatted files, 325 linted without warnings/errors.
- `npm run build`: passed. Existing large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: passed, repeated after writing this report.
- No automated tests written or run, per user instruction. No browser/visual acceptance claimed.

## Manual test checklist

1. Hard reload a Markdown document containing a table and Mermaid diagram. Open each fullscreen view. Expected: matching inset dialog, background blur, close icon and floating bottom toolbar; titles identify Table preview and Diagram preview.
2. Open a wide/tall table. Expected: its full contents fit initially with room for the title and toolbar. Click zoom in/out, then use the mouse wheel over a cell. Expected: the percentage and table size change; wheel zoom preserves the point beneath the cursor.
3. Drag the table canvas, then click Fit to view. Expected: drag pans and Fit restores the centered table. Resize the browser. Expected: the table refits.
4. Tab to the canvas; press plus, minus, arrows and zero. Expected: zoom, pan and fit work. Tab through the controls, then press Escape. Expected: focus remains in the open modal and returns to the table expand button on close. Repeat with the close icon.
5. Edit a cell, sort a column, and reopen fullscreen. Expected: current formatted content and sort indicators appear; editing/add-row/add-column controls remain in the document. Closing does not change document content.
6. Repeat with merged cells, a read-only table, RTL content, Light/Dark appearance and a narrow viewport. Expected: cell structure and content remain readable, controls remain reachable, and fullscreen stays available.
7. Open Mermaid fullscreen and exercise zoom, wheel, drag, Fit and Escape. Expected: the shared-viewer extraction preserves diagram rendering, colors, fitted sizing and focus restoration.
8. Open a preview, close it, switch Source/Live Preview, and navigate away/reopen. Expected: no leftover backdrop or stale viewer.

## Limits and commit suggestion

Zoom retains Mermaid's 5%–800% limits. Extremely large content may not fit entirely at minimum zoom; panning reaches its edges. Single-pointer touch panning is supported; pinch and inertia remain outside this existing viewer's behavior. Table fullscreen shows a snapshot refreshed on each opening.

Suggested commit: `feat(editor): share Mermaid zoomable full preview with tables`.

Await manual review before starting another phase.
