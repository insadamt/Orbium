# Phase 5 review — align split document starting positions

Date: 2026-10-17.

## Problem and change

The screenshot shows the right document island, cover, icon, and title starting 56px below the left document. Embedded iframe pages rendered a 44px Statistics button in a normal-flow row with a 12px bottom margin. Retained document surfaces had no equivalent row, creating the mismatch.

The embedded Statistics action now sits at the upper right of its relatively positioned workspace, outside normal flow. The button remains accessible and retains its existing action. Both rendering paths use the existing shared page gap and island padding without an extra toolbar row. Pane scrolling remains independent; pages scrolled to different positions are not forced into alignment.

No backend, dependencies, migrations, or persisted-format changes. No commit created. Earlier navigation and cover-cutout fixes remain in the working tree.

## Validation

- `npm run lint`: PASS, including formatting of 549 files and lint of 455 files.
- `npm run types:check`: PASS.
- `npm run build`: PASS (22.52 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- No automated tests were written or run, per user instructions. Browser review remains pending.

## Manual checklist

1. Hard-refresh and open two document tabs. Select A and drag inactive B to the right split edge. Scroll each pane to its top. Expected: both document islands and default covers start on the same horizontal line, with matching icon/title positions for equivalent headers.
2. End the split and repeat with B on the left. Expected: alignment is independent of which page occupies either side.
3. Reload with the split saved, then repeat with a previously unvisited document. Expected: embedded pages have no extra 56px gap above their document surfaces; after loading, both top edges align.
4. Click the Statistics button in an embedded pane when present. Expected: its existing Statistics destination opens and the button does not push the document down.
5. Scroll one pane, then return both panes to the top. Expected: independent scrolling still works, and the starting edges align again. Content below differently sized headers can naturally begin at different heights.
6. Repeat with a document/database split and resize to narrow-screen stacking. Expected: no reserved Statistics toolbar row or new overlap with cover editing; document/database actions remain usable.

Suggested commit: `fix(navigation): align embedded and retained split page tops`

Remain in Phase 5 for manual review.
