# Editor review — Smoother outline rail motion

Date: 2026-10-12. Follow-up to the accepted rail design within the current editor review.

## Changes

- Rail opacity/background use a gentle 220 ms easing curve. Marks expand slightly on opening and transition their emphasis over 220–240 ms as the current reading section changes.
- The panel uses reversible CSS transitions for fade, slide and a subtle scale on both opening and closing. Rapid hover changes continue from the current visual state rather than restarting an entrance animation.
- The panel stays mounted to finish its closing transition. It becomes inert, hidden from assistive technology and unable to receive pointer input immediately upon closing; visual visibility ends after the transition.
- Title and control highlighting also fade. Reduced motion removes transitions and geometric effects while preserving current-section emphasis.
- No changes to heading extraction, navigation scrolling, pin behavior or split-pane isolation. No dependencies, automated tests, commit or push.

## Validation

- Targeted `npx vp fmt`: passed for both modified source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 378 files correctly formatted, 310 linted without warnings/errors.
- `npm run build`: passed in 8.72 seconds. Existing chunk-size/dynamic-import warnings and plugin-timing advisory remain. Log: `/tmp/orbium-toc-rail-motion-build.log`.
- `git diff --check`: passed.

Visual smoothness has not been browser-verified; manual acceptance is pending. No automated tests were written or run as requested.

## Manual checklist

1. Hover the rail and cross into its panel. Expected: marks expand gently and the panel fades/slides out from the rail without changing document scroll position.
2. Move away, then return during closing. Repeat quickly several times. Expected: closing fades/slides back and reverses smoothly when reopened, without a flash or abrupt disappearance.
3. Scroll through headings while the panel is closed and while pinned. Expected: rail emphasis fades between current sections; heading lengths remain distinguishable and each split pane updates independently.
4. Use Tab to open, arrows/Enter to navigate, and Escape/Close/outside click to dismiss. Expected: the panel retains keyboard behavior; closing controls cannot be focused or clicked during their exit animation.
5. Enable reduced motion and repeat hover, scroll, dismissal and navigation. Expected: immediate state changes with no scaling/sliding; current-section marking remains visible.
6. Check narrow split panes, touch pin/unpin, light/dark appearance and tab switching during a transition. Expected: no overflow, stuck panel or animation over another page.

## Suggested commit

`fix(editor): smooth document outline rail transitions`

Remain in the current editor review pending manual feedback.
