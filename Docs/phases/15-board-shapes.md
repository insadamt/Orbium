# Native Board shapes — first version

Summary: This phase adds six editable vector shapes for Board layouts and diagram building. It depends on native object records, format-8 compatibility, existing camera/history/autosave contracts and the approved scope in `../plans/board-shapes.md`.

Approved by “okey go ahead” on 2026-10-29 after the first-version proposal. Implement rectangle, rounded rectangle, ellipse, diamond, triangle and hexagon, drag/click/keyboard placement, equal proportions with Shift, fill/outline controls and centered rich labels. Use the existing selection, movement, resizing, layers, clipboard, history, ownership and saves.

Persist native `shape` objects through additive Board format 9. Preserve supported older snapshots with explicit guards and refuse downgrade while shapes remain. Render cheap native SVG in both original and Instant Scene modes. Connected arrows, rotation, persistent grouping, arbitrary SVG import and new export formats are outside this phase.

Do not write or run automated tests or browser automation. Run formatting, lint, TypeScript, PHP syntax, build, migration SQL inspection/application and whitespace checks. Record actual results, known limits, deployment requirements and exact manual acceptance in `../reports/15-board-shapes.md`. Stop for user review; no later feature phase is automatically approved.
