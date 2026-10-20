# Boards phase 4 — Preserve linked-page position when editing

## Change and cause

Replacing a scrolled preview with a short loading message collapsed the resource
viewport's scroll range before the editor mounted. Its scroll offset therefore
clamped to zero, leaving editing at the top of the Document.

The card now records horizontal/vertical offsets and content height. During a
surface transition, a temporary minimum height preserves the scroll range through
network and lazy-module loading. A scoped mutation observer waits for the preview,
Markdown editor, legacy editor or error state; restoration runs after initial
layout, rechecks readiness, then removes the placeholder height and observer.
Subsequent user scrolling is recorded normally. Leaving editing, explicit Refresh,
revision changes and confirmed editor reloads use the same mechanism. Pending
animation frames/observers are canceled on transition replacement or unmount.

No migrations, persistent format changes or commits. Phase 4 remains in review.

## Validation

- Targeted formatting/lint: passed.
- `npm run lint`: passed; 653 files formatted and 547 linted.
- `npm run types:check`: passed.
- `npm run build`: passed, with large-chunk, mixed-import and plugin-timing warnings.
- `git diff --check`: passed.
- No automated tests written or run. Manual browser verification remains pending.

## Manual checklist

1. Add a long linked Document. Scroll its preview halfway down, then double-click ordinary text. Expected: the editor opens at the retained vertical offset, without jumping to the top during loading.
2. Scroll further while editing, wait for save and finish editing. Expected: the preview returns at the latest offset rather than the top.
3. Repeat near the bottom, with a cold editor module/network load. Expected: the loading stage retains the scroll range and the editor restores it after mounting.
4. Scroll and click Refresh; edit the original in another tab and return. Expected: refreshed/revised content retains the card's offset, clamped only if the content becomes shorter.
5. Reorder blocks and undo/redo while scrolled in the editor. Expected: ordinary editor scrolling remains usable and no pending restoration pulls the user back after the transition has finished.
6. Resize the card narrowly and use horizontal scrolling on wide content. Enter/leave editing. Expected: horizontal offset is restored within the replacement surface's available width.
7. If available, repeat opening/closing editing on a long legacy Document. Expected: restoration waits for its ProseMirror surface.
8. Open/close editing quickly and remove a card after its session allows removal. Expected: no delayed scroll restoration or errors from an unmounted surface.

## Limits

The preserved position is a pixel offset, not a semantic block anchor. Different
preview/editor wrapping, newly loaded media and content edits can shift the exact
line at that offset. A shorter surface clamps naturally to its available range.
Positions are local to the mounted card and do not persist across page reloads or
canvas culling. No new scroll persistence format is introduced.

Suggested commit: `fix(boards): preserve linked-page scroll position when editing`
