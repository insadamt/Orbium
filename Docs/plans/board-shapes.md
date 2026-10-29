# Native Board shapes

Summary: This plan defines the approved first shape slice, giving Boards editable vector objects for layouts and diagrams. It depends on the native Board record/history/autosave model, existing pointer/camera controls and format-8 compatibility contracts in `../docs/24-boards.md`.

## Approved scope

The user approved the proposed first version with “okey go ahead” on 2026-10-29. Add rectangle, rounded rectangle, ellipse, diamond, triangle and hexagon, with fill (including transparent), outline color/width, solid/dashed outlines and centered editable labels. Connected arrows and rotation remain outside this phase.

## Interaction and rendering

- A Shapes dock button opens a visual picker. Choosing a shape arms placement. Click inserts a 240 × 160 frame; Enter inserts at the view center. Drag in any direction sizes a transient preview. Shift creates equal width/height. Escape, tool changes, history, pointer cancellation and pinch discard the preview without a saved object.
- Successful placement returns to Select and selects the shape without opening its editor. Double-click, Enter or Edit enters the existing native inline editor for the label. Labels retain marks, links, inline icons and Board-owned history. Shape editing cannot convert the shape into a writing block.
- Existing object movement, multi-selection, duplicate, deletion, layers and alignment apply. Shapes resize freely by default; Shift on corners preserves proportions. Resizing does not scale label typography. Long labels scroll inside their reserved area without changing shape geometry.
- Render validated geometry with native SVG and existing React text adapters in both renderer modes. No arbitrary SVG input, new rendering dependency, continuous animation or background preparation is required. Existing motion and reduced-motion behavior apply.

## Persistence and compatibility

- Add native `shape`, content version 1, with `data.shape` holding kind, fill, stroke, stroke width and stroke style. Label inline content, alignment/direction and optional text scale use existing fields. Shape colors accept `currentColor` or six-digit hex; only fill accepts `none`.
- An additive migration advances the Board envelope to 9 and extends the database object-type constraint. Preserve all old rows/revisions. Downgrade refuses while saved shapes exist, including in Trash.
- Explicitly adapt supported older snapshots/drafts; reject shapes inside envelopes below 9, and unknown versions. Update every snapshot writer so older clients cannot save through current endpoints. Keep native inline-icon ownership/reference validation in use for labels.

## Acceptance boundary

No automated tests or browser automation. Run relevant formatter, lint, TypeScript, PHP syntax, build, migration inspection/application and whitespace checks. Record actual results, deployment requirements, limits, exact manual steps and commit suggestions in `../reports/15-board-shapes.md`. Stop for manual review before connectors/rotation or another phase.
