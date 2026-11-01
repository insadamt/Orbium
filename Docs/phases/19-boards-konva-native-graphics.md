Summary: Defines Boards V2 Phase 2 after the user's Phase-1 approval. Depends on the native Stage foundation, existing drawing/shape records and manual profiling; native HTML integration remains separately gated.

# Boards V2 — Phase 2: drawing and graphical transformations

Authorized 2026-11-01 by “go ahead” after the Phase-1 delivery. Continue from `4ec6dff` on `feat/boards-konva-native-stage`; preserve the current default and independent rollback renderers.

Implement Pen, Highlighter, Path Pen, partial erasure, existing colors/widths/smoothing/limits, all seven validated shape kinds, graphical selection/movement/resizing/formatting and grouped scratch history. Reuse canonical numeric drawing records and exact eraser geometry. Separate raw input, bounded stroke preparation, completed raster chunks, the changing live tail and final serialized records. Ordinary live ink must not redraw completed Board objects.

Retain the development/profile-only unsaved scratch boundary. Existing saved Boards, V3 Documents, autosave/recovery and data formats remain unchanged. Phase 3 owns native HTML editors, including rich shape labels; retain label fields without converting them to canvas text or approving a stacking compromise. Phase 4 owns complete Board interactions and persistence coordination.

Do not write/run automated tests or browser automation. Run relevant formatting, lint, types, normal/profile production builds and whitespace checks. Report actual results, source evidence, remaining costs, exact manual acceptance and long-stroke/eraser/resize benchmarks in `../reports/19-boards-konva-native-graphics.md`.

Stop after Phase 2 for manual acceptance. HTML integration and default replacement require further explicit approval.
