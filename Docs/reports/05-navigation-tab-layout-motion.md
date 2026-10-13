# Navigation tab rearrangement motion

Date: 2026-10-13. Phase 5 review follow-up.

## Implemented

- The floating tab row centers its contents while they fit. Appending a tab shifts existing tabs left; overflowing rows use start alignment so every tab stays reachable.
- Existing tabs slide from their previous screen positions to the new layout over 240 ms with a smooth ease-out curve. New tabs retain the existing scale/fade pop.
- Closing tabs retain their exit motion; remaining tabs slide into place after the outgoing layout space is released. Split groups participate in layout motion.
- Interrupted slides resume from their current visible positions. Scrolling updates stored positions, and active-tab reveal uses layout geometry before animation begins.
- Layout translation is separate from entry/exit scale and sortable drag transforms. Layout motion is skipped during dragging, immediately after a drop, and during viewport width changes.
- Reduced motion disables slides and cancels running layout animations when the preference changes. Unmounting cleans up animations and listeners.

## Validation

- Changed frontend files formatted with `npx vp fmt`: PASS.
- `npm run lint`: PASS, including repository formatting checks.
- `npm run types:check`: PASS.
- `npm run build`: PASS; warnings reported for chunks over 500 kB, ineffective dynamic imports, and time spent in plugin hooks.
- `git diff --check`: PASS.
- No automated tests written or run, per user instructions. Visual/manual acceptance remains pending.

## Manual test checklist

1. Refresh Orbium with one unpinned tab, then click plus.
   Expected: the new tab pops in while the original tab smoothly slides left; its width stays unchanged when X appears.
2. Add two more tabs, then close a middle tab.
   Expected: existing tabs slide left on insertion. Closing retains the short shrink/fade, then remaining tabs smoothly settle into the centered row.
3. Quickly add and close several tabs before previous animations finish.
   Expected: motion continues from visible positions without snapping back, lingering tabs, or disabled live controls.
4. Switch existing tabs and open a long-titled document with Ctrl+click.
   Expected: switching does not replay entry motion; the new document pops in and neighboring tabs slide without changing title truncation.
5. Drag tabs to reorder, then form and end a split with eligible document tabs.
   Expected: sortable dragging and split actions remain usable; unrelated tab layout changes slide smoothly without fighting the drag preview.
6. Add enough tabs to overflow, use both scroll arrows, activate an offscreen tab, and close tabs until the row fits again.
   Expected: all tabs remain reachable, active-tab reveal works, and the row returns smoothly to centered alignment without page overflow.
7. Enable browser/OS reduced motion, including while a slide is running, and repeat opening/closing.
   Expected: tab layout changes become immediate; no slide or pop animation remains.
8. Repeat opening/closing in light and dark themes and at narrow and wide desktop widths.
   Expected: labels stay readable and the row remains within the navigation island.

## Compatibility and review gate

No dependencies, migrations, or persistent-format changes. No commits created.
Visual smoothness is pending user review. Remain in Phase 5.

Suggested commit: `feat(navigation): animate tab rearrangement on open and close`.
