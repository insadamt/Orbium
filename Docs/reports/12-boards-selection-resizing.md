# Boards — Selection, resizing and image correction

2026-10-19. Phase-4 manual review. Authorized by “okey go ahead” after discussing block selection, resizing, image framing and excess padding. No later phase started.

## Implemented

- Removed native single-click edit activation. Click selects; double-click/Enter/Edit enters editing. Inactive block bodies retain dragging; explicit links, checkboxes and media controls retain their actions. Updated help, canvas guidance and empty text guidance.
- Added all four edges and four corners to selected inactive objects. Corner targets take priority over edge targets. Desktop and coarse-pointer targets retain screen-space size across zoom. North/west resize keeps the opposite edge anchored after dimension clamping, within world coordinate bounds. Alt bypasses snapping; the existing six-screen-pixel gesture threshold remains.
- Writing corners scale text and frame together, with a persisted 0.25–8 scale. Horizontal edges change wrapping; vertical edges set fixed frame height. Automatic text measurements cannot immediately undo intentional vertical sizing. Writing may expand during active editing to keep new content reachable. Fixed smaller frames retain overflow access.
- Added shared content measurement/sizing helpers. Writing, tables, code, math, Mermaid and attached file/media blocks fit their actual rendered child content unless vertically resized. Removed the extra text bottom allowance, reduced ordinary outer padding to 4px/table outer padding to 2px, and tightened outline offset to 1 screen pixel. Internal callout/code/player padding retains its Document presentation.
- Corrected Fit height to measure the content instead of its already stretched parent. It restores automatic sizing for supported content blocks. Resource geometry remains independent; resource data stays reference-only. Size properties and keyboard resizing respect the same fixed-height rules.
- New/replacement images use loaded natural dimensions to fit their frame within existing size limits. Existing images have explicit Reset proportions. Image corners preserve the frame ratio; edges and Shift-corners crop to fill the frame without stretching pixels. Crop exposes focal-position sliders. Cropping changes presentation only; the original attachment is preserved.
- Moved media Upload/Replace, Library, caption and crop controls to the contextual toolbar, so editing no longer consumes image frame space. Empty captions reserve no space. Image loading/failure, upload, ownership and Library paths remain in use.
- Live resize paints text scale and image fit as well as geometry. Rejected layout commits restore the original painted geometry/presentation.

## Commits

None created. Existing unrelated working-tree changes were preserved. Suggestions:

- `fix(boards): unify block selection and eight-handle resizing`
- `fix(boards): tighten content bounds and improve image framing`

## Migrations / persistent format changes

No migration, attachment-byte rewrite or format-version change. Native content format 1/spatial format 4 gain optional validated presentation metadata: `text_scale`, `manual_height`, `image_fit`, `image_position`. Missing values use ordinary scale, automatic content sizing and centered image fill. Both client and server validate finite/ranged presentation values; the server normalizes numeric/boolean values. The crop position requires both coordinates. Resource objects cannot carry these native presentation fields.

Existing snapshots remain readable. Saving snapshots with the new optional fields requires the updated server validator; an older server may reject them rather than silently discard them. Existing content-sized frames without an explicit fixed-height marker can tighten on opening. Existing image frames default to fill-cropping; use Reset proportions to reveal the complete image in a natural frame.

## Actual validation

| Check | Actual result |
|---|---|
| Targeted `vp fmt` | Passed for modified frontend sources/styles |
| `./vendor/bin/pint --test app/Services/Boards/BoardBlockData.php` | Passed |
| `php -l app/Services/Boards/BoardBlockData.php` | Passed |
| `npm run types:check` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0; 637 formatted files, 534 files without warnings/errors |
| `npm run build` | Passed, exit 0; 15.67s |
| `git diff --check` and explicit whitespace scan of Board source/report files | Passed |
| Changed source sizes | Below 500 lines; canvas 473, pointer hook 465, media block 318 |

Build retains mixed static/dynamic-import, large-chunk and plugin-timing notices. Logs: `/tmp/orbium-board-resize-format.log`, `/tmp/orbium-board-resize-lint.log`, `/tmp/orbium-board-resize-types.log`, `/tmp/orbium-board-resize-build.log`.

No automated tests were written or run. No browser/manual UI verification was performed by the agent; the following acceptance review is for the user. Static checks do not certify gesture or visual correctness.

## Manual validation for the user

Use a disposable Board at 100% zoom. Add heading, paragraph, list, callout, table, code, math, diagram, portrait/landscape images, file/media and resource examples.

1. **Selection/editing:** finish editing, then single-click the body of each block. Expected: selected outline and eight handles, no caret/editor. Double-click writing at a word and type; repeat with Enter and Edit. Expected: editing at the clicked location, working input and Done/Escape to return to selection. Existing explicit links, checkboxes and player controls remain actionable.
2. **All resize directions:** select a table or code block and drag each of the four sides and four corners inward/outward. Expected: correct resize cursor and direction; north/west move the origin while the opposite edge stays anchored; shrinking stops at geometry minimums without flipping. Existing text/source remains accessible through overflow when its frame is smaller.
3. **Text sizing:** drag paragraph/heading left and right edges. Expected: wrapping changes. Drag a corner outward then inward. Expected: text and frame become visibly larger/smaller together. Drag top/bottom, finish and deselect/reselect. Expected: chosen frame height remains. Type more text into a short frame. Expected: authored content remains reachable and the active frame can grow.
4. **Tight bounds:** inspect heading, paragraph, list, callout, table and short code/math/diagram examples. Expected: a small outer gap rather than unexplained bottom space. Add/remove lines or table rows. Expected: automatic height follows content. Set a taller frame, then use Selection options → Fit height. Expected: it shrinks to content and follows subsequent content changes again.
5. **Image insertion/replacement:** upload one landscape and one portrait image, then replace one through Library. Expected: natural image proportions, no stretched pixels, a frame closely following the image and no blank caption row. Double-click: controls appear in the toolbar without squeezing the image.
6. **Image resizing/cropping:** finish editing and drag each image corner. Expected: frame proportions stay stable. Drag a side or Shift-corner. Expected: the frame changes shape and the image fills it by cropping. Edit → Crop; move horizontal/vertical crop sliders on a frame whose shape differs from the original. Expected: visible framing changes. Reset proportions. Expected: complete original image and a matching frame return; the Library original is unchanged.
7. **Captions/media:** add a caption, finish editing, then remove it. Expected: caption only occupies space while present. Open ordinary downloads/audio/video/PDF and use their controls. Expected: file/player controls remain usable; upload/error/status UI remains reachable.
8. **History/persistence:** move/resize/scale/crop objects, undo and redo each completed gesture. Wait for Saved, reload and inspect. Expected: position, dimensions, text scale, fixed-height choice, image framing and captions survive; undo/redo restores authored content and layout. Image replacement and its asynchronous natural-size adjustment can be separate history entries.
9. **Zoom/touch:** repeat edge/corner grabs at 50%, 100% and 200%, with grid on/off and Alt held. If available, repeat on a touch/coarse-pointer device. Expected: stable handle targets, predictable snapping/bypass, no accidental typing while selecting, and pan/pinch retain their behavior.
10. **Selection/resources/locks:** Shift-select multiple objects. Expected: existing group selection/arrangement behavior and no individual resize handles. Resize a resource card using mouse, Alt+arrows and properties, then save/reload. Expected: geometry persists without reference-validation failures. Repeat disabled actions during upload or dirty linked-Document ownership. Expected: locks continue protecting the active operation.

## Known limitations

- Browser appearance, gestures, touch, theme variants, IME and conflict/upload concurrency still require manual acceptance.
- Explicit smaller frames can scroll; fixed-height blocks do not force all content to remain simultaneously visible.
- Image proportions are bounded by 80px minimum width, 32px minimum height and 4000px maximum dimensions. Extremely narrow/wide images can retain fit space at those limits. Nonempty captions participate in the overall frame, so corner resizing preserves frame proportions including caption space.
- Crop is frame fill plus focal-position adjustment; it does not export a new bitmap or modify the Library attachment. Choose frame shape after finishing editing; re-enter Crop to adjust focal position.
- Multi-object resizing is not added. Existing multi-selection movement/arrangement remains.

## Stop gate

Remain in phase-4 manual review. No Mind Maps or later phase is authorized.
