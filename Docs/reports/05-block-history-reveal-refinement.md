# Phase 5 review — reveal both history locations and settle motion

Date: 2026-10-18.

## Problem and change

The first history animation played immediately after updating content. CodeMirror applied its history scroll request during a later measure, moving the viewport underneath the staged snapshots and potentially canceling the animation. The companion history operation also lacked an explicit reveal target, so it could leave the relevant block off screen or reveal an unrelated old caret position.

Linked undo/redo now prepares the restoration anchor from the actual history transaction, reveals that site and the outgoing block in their respective panes, and waits for CodeMirror's measurement loop. Both histories, editor availability, and move phases are checked again before applying the paired edit. Requests arriving during reveal queue in order; newer edits abort stale paired operations instead of partially applying them. Editor destruction releases pending reveal waits.

Every block-history transaction supplies an explicit centered reveal target for the restored block or removal site. History motion stages only after scroll/layout measurement settles. Sibling snapshot coordinates exclude programmatic reveal scrolling, while the outgoing ghost remains at its captured screen position. Rich layout is refreshed within the existing widget-retention scope before deferred animation, preserving loaded media. Repeated undo/redo, edits, hidden views, and editor destruction cancel stale motion through the existing revision and cleanup path.

The existing pop/slide/pop timings and reduced-motion behavior remain. Ordinary typing history, independent pane scrolling, pointer activation, TOC behavior, paired-history safeguards, and autosave retain their existing roles. No dependency, backend, migration, or persisted-format changes. No commit created. New and modified source files remain below 500 lines.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; 559 files correctly formatted and 465 files linted without warnings or errors.
- `npm run build`: PASS (13.43 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- New viewport helper: 54 lines; motion service: 337 lines; linked history service: 336 lines.
- No automated tests were written or run. Browser animation and navigation acceptance remain pending manual review; static checks do not establish that the visual glitch has been eliminated.

## Manual checklist

1. Hard-refresh. Split long Markdown documents A and B. Move a block from deep in A into a distant section of B. Scroll both panes away from those sites, then undo. Expected: both panes reveal their relevant sites; B's block pops out and A's restored block pops in, with no late caret jump that cancels playback.
2. Scroll both panes elsewhere again and redo. Expected: A reveals the outgoing block, B reveals its destination, and the pop/slide/pop sequence plays at those locations. Repeat with different current caret positions in both documents.
3. Repeat a same-page reorder, block deletion/restoration, and linked move while the affected block is already visible. Expected: animation starts after layout settles, with no one-frame flash, oversized sibling slide, duplicate ghost, or invisible live block.
4. Hold Undo for several linked moves, then redo several times; alternate Undo/Redo quickly. Expected: pending requests run in order, animations may be interrupted cleanly, and the final content matches the requested history steps without stranded requests or half-moves.
5. Type or close/switch a document while a linked location is being revealed. Expected: stale history is rejected with its notice, no partial paired edit occurs, and a subsequent valid undo/redo still works.
6. Repeat with a tall PDF, video/audio, table, Mermaid, and math block, including blocks near either document's end. Expected: the relevant block start/removal site is visible, outgoing media keeps its captured frame, retained player state survives, and reveal scrolling does not masquerade as sibling animation.
7. During playback, manually scroll, click, type, or resize. Expected: temporary visuals clean up immediately and normal editing, independent scrolling, background synchronized scrolling, and each TOC continue to work.
8. Enable reduced motion and undo/redo from distant locations. Expected: both sites are revealed and content changes without pop/slide effects. Ordinary typing undo still follows its original behavior.
9. Wait for both Saved indicators and reload. Expected: final block placement persists and normal fresh editor history starts empty.

Suggested commit: `fix(editor): reveal both block history locations before animating`

Remain in Phase 5 for manual review.
