# Phase 5 review — diagrams preparing after arrival

Date: 2026-10-05. Follow-up to [predictive editor performance](05-predictive-editor-performance.md). Remain in Phase 5. No commits created.

The later [layout stability follow-up](05-mermaid-layout-stability.md) adds responsive height reservation before SVG mounting to address tall diagrams pushing following blocks.

## Finding

The user still saw “Preparing diagram…” briefly after reaching a diagram. Inspection found avoidable scheduling delays:

- Every scroll/wheel event reset the same 140 ms interaction pause used for typing and cancelled pending preparation. Continuous scrolling could prevent preparation in the three-viewport window from running until scrolling stopped.
- Ordinary pointer movement also cancelled preparation even without selection or dragging.
- Cached sanitization and mounting an already-prepared result shared the single local-render gate and its 80 ms inter-render pause. A prepared source could wait behind unrelated rendering.
- Replacing an idle callback when it had too little time restarted its timeout instead of retaining the original deadline.

These are findings from code inspection. This follow-up does not claim a measured before/after placeholder duration or scroll FPS.

## Change

- `mermaid-preview-session.ts` tracks scrolling separately from typing. Nearby preparation can proceed during scrolling; distant local renders still wait for a scroll pause. Pointer hovering does not count as editing. Composition, selection, and dragging retain their suspension behavior.
- Cache retrieval remains limited to four requests. Cached sanitization has its own single-job gate and can proceed independently of a local Mermaid render. Sanitization still precedes insertion.
- `mermaid-preview-entry.ts` distinguishes cached preparation from local rendering. Display candidates consider only connected, non-editing, undisplayed subscribers when prioritizing.
- `mermaid-preview-display.ts` mounts one ready subscriber per animation frame. This path does not inherit the typing/inter-render timer or wait for another source's local render. SVG IDs remain independent for duplicate sources.
- `mermaid-preparation-scheduling.ts` contains editor-specific timing and cancellation. Foreground idle work has a 120 ms timeout; background work retains 1,500 ms. Re-requesting idle time preserves the deadline. Timer/animation-frame fallbacks and destruction cancellation remain explicit.
- Ordinary viewport updates do not restart an equally urgent job. More urgent work replaces a pending job, and execution always selects using the current viewport.

The preparation distance remains three viewport heights. Increasing it alone would not fix jobs being repeatedly cancelled. No dependencies, persistence schema, endpoint, or authorization changes were introduced.

## Libraries and limits

Existing Mermaid/DOMPurify remain in use. Browser-native scheduling is sufficient for this fix. Reviewed [idle callback timing and timeout behavior](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) and [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). Idle callbacks have incomplete browser support, so the timer fallback remains. An idle timeout can force a task to start during a busy period; it cannot interrupt Mermaid after rendering starts. The nearby timeout therefore improves availability without guaranteeing smooth rendering of arbitrary diagrams.

Cached retrieval, sanitization, DOM insertion, and an uncached render still take time. A jump beyond the prepared region can show a placeholder. This change removes unnecessary scheduler waits; it does not hide them with a different loading state or promise zero latency on every jump.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed; 224 files formatted correctly, 163 linted without warnings/errors.
- Targeted `vp fmt`: passed.
- `npm run build`: passed; final build completed in 5.26 seconds. Existing large-chunk warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. No PHP changed.

Browser review used the existing disposable 70-source document, workspace 1/node 61, after reloading the normal production build. Initial diagrams were mounted ahead of the visible viewport. At inspected forward destinations, diagrams 6–8, 9–11, 12–14, and 16–17 were ready; the reverse destination showed ready diagrams 11–12. The first coordinate-based gesture timed out, though its destination was inspected; subsequent DOM-based scrolling completed. Browser gestures and inspection have latency, so these observations confirm destination readiness, not that no placeholder ever appeared at first entry. No content was typed or changed during this follow-up.

The user should verify their actual scrolling speed, especially uncached complex sources. Continuous-typing/IME/drag and cache-failure regression checks remain manual.

## Exact manual checklist

1. Hard reload the application to load the rebuilt editor. Open the large document, wait only for editor readiness, and scroll down continuously at normal reading speed without pausing at diagrams. Expected: nearby preparation continues while scrolling; normally reached diagrams are already displayed.
2. Reverse direction and move the pointer over document text without clicking. Expected: nearby diagrams continue preparing; ordinary pointer movement does not postpone them.
3. Reopen the same document after previews have been cached, then scroll again. Expected: cache hits are displayed without local Mermaid rendering and do not wait for unrelated render jobs.
4. Drag the scrollbar or use search to jump to a distant section. Expected: destination work takes priority; prepared results mount promptly. A genuinely uncached destination can still need rendering time.
5. In a disposable document, create several distinct Mermaid sources and begin scrolling before preparation completes. Expected: preparation progresses ahead of reading, only one local render runs, and cache upload does not block display. Include one complex source to check actual responsiveness.
6. Type, compose text with an IME, select across blocks, and drag a block while diagrams remain pending. Expected: no new expensive local render during typing's pause or active composition/selection/drag; preparation resumes afterward. Save/reload confirms content preservation.
7. Duplicate an identical source, edit one copy, switch Edit/Preview, delete/undo a copy, and navigate away during preparation. Expected: correct individual SVG IDs, source updates, preview recovery, and no stale previous-document update.

Suggested commit: `fix(editor): keep Mermaid previews ready during scrolling`
