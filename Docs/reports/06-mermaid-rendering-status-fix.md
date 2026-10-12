# M4/M5 review — Mermaid stuck on rendering status

Date: 2026-10-12. Status: fixes implemented; affected-document manual validation pending. This stays within the current editor review.

## Reported issue and findings

The user reports that Mermaid blocks stay on “Rendering diagram…” immediately after opening a document.

Code inspection identified two ways preview work can stall. Preparation ranking and SVG mounting both depend on IntersectionObserver membership, so a connected, visible block can be withheld while membership is missing. Pointer-down also pauses the queue until a release event reaches window through bubbling. A control that consumes the release event, or a release outside the browser, can leave that interaction pause set.

These are code findings. The in-app browser was unavailable, so neither the reported document nor its runtime state could be inspected. The changes address these failure paths; confirmation that they resolve the user's particular document remains pending.

## Changes

- Use the existing geometric preview visibility calculation as a fallback when observer membership does not identify a visible diagram. Apply the same fallback to preparation ranking and SVG mounting.
- Observe pointer release, cancellation and drag completion during window capture, before editor controls can consume them.
- Clear interaction pauses when the browser window loses focus; recover a missed release when pointer movement reports no pressed buttons. Ordinary child-element blur does not reset the queue.
- Retain source-preserving errors, SVG sanitization, background preparation and session cleanup.

No dependency, migration, persisted content or archive-format changes. No commit created. Unrelated existing work was preserved.

## Validation

- Targeted `npx vp fmt`: passed for all four changed source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 393 files correctly formatted, 323 files linted without warnings or errors.
- `npm run build`: passed in 10.09 seconds. Large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: passed before this report; checked again after writing it.
- No automated tests written or run, as instructed. No PHP changes. Browser verification unavailable; manual acceptance remains pending.

## Manual test checklist

1. Hard reload with Ctrl+Shift+R, then open the originally affected document in Live Preview without clicking or scrolling. Expected: visible valid diagrams replace “Rendering diagram…” with their SVG after preparation finishes; no interaction is required to reveal them.
2. In a disposable document, insert the following fenced block in Source mode, then switch to Live Preview:

   ````markdown
   ```mermaid
   flowchart TD
       A[Open document] --> B[Render diagram]
   ```
   ````

   Expected: two connected nodes appear. Wait for Saved, reload and reopen the document. Expected: the same diagram renders again.
3. Edit the Mermaid source, click Preview, drag a document block, then release the pointer. Expected: pending diagrams render after interaction ends, and the moved block retains its source.
4. While a diagram is preparing, press inside the editor and release outside the browser, then return and move the pointer without holding a button. Repeat by switching applications during the interaction. Expected: rendering resumes rather than remaining paused.
5. Scroll past several diagrams, return, and switch Source/Live Preview and document tabs. Expected: diagrams render when visible; inactive documents resume when activated; prepared previews remain reusable.
6. Replace the sample source with `flowchart TD` followed by `A[`, then switch to Preview. Expected: a readable error appears and the source remains editable. Restore the valid sample. Expected: rendering recovers.
7. Open Full preview for a successfully rendered diagram. Expected: the same graph appears with working preview controls.

If step 1 still fails, capture the affected source and the browser console error, if any, so the remaining runtime failure can be traced.

## Commit suggestion and stop gate

Suggested commit: `fix(editor): prevent Mermaid previews from stalling on rendering status`.

Await manual review. No next phase started.
