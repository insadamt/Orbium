# Navigation tab entry refinement

Date: 2026-10-13. Phase 5 review correction.

## Implemented

Opening tabs now mirror the closing motion: a 140 ms scale/fade from 0.84 to
normal size, using ease-out as the reverse of the closing ease-in. The 1.025
overshoot is removed so tabs settle without bouncing. Ordinary tabs and split
groups share this motion. Left alignment and rearrangement motion remain.

## Validation

- `npx vp fmt resources/css/navigation-tab-motion.css`: PASS.
- `npm run lint`: PASS, including repository formatting checks.
- `npm run types:check`: PASS.
- `npm run build`: PASS, with large-chunk and ineffective-dynamic-import warnings.
- `git diff --check`: PASS.
- No automated tests written or run, per user instructions. Visual acceptance
  remains pending manual review.

## Manual test checklist

1. Reload Orbium and click plus to open a tab, then close it.
   Expected: opening smoothly grows/fades in without bouncing; closing shrinks/
   fades out with matching timing.
2. Ctrl+click a document to open a tab, then switch between existing tabs.
   Expected: the new tab uses the refined entry; switching does not replay it.
3. Quickly open and close several tabs, then form and end a document split.
   Expected: the same entry style applies to split groups without lingering tabs
   or interference with rearrangement motion.
4. Enable browser/OS reduced motion and repeat opening and closing.
   Expected: changes are immediate without scale/fade animation.

## Compatibility and review gate

No dependencies, migrations, or persistent-format changes. No commits created.
Remain in Phase 5 for manual review.

Suggested commit: `fix(navigation): mirror tab closing motion on entry`.
