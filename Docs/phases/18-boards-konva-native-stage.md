Summary: Defines the authorized Phase-1 native Konva foundation and its manual review gate. Depends on existing Board contracts, Konva 10.9.1 and the user's Boards V2 rebuild brief; later migration phases require separate approval.

# Boards V2 — Phase 1: native Stage foundation

Continuation authorized 2026-11-01: the user's “go ahead” after delivery approves starting [Phase 2](19-boards-konva-native-graphics.md). Phase 1 is committed as `4ec6dff`. This approval does not manufacture browser/performance evidence or approve an HTML stacking compromise.

Authorized 2026-11-01. Start from the latest verified `feat/boards-konva-engine`, preserve its V3 editor work and create `feat/boards-konva-native-stage`. Build an independently selected Stage rather than extending the hybrid graphics adapter. Existing renderer defaults and saved Boards remain unchanged.

Deliver a native Stage lifecycle, viewport-sized buffers, Stage camera, navigation, basic grid/shapes, native selection/dragging and on-demand diagnostics. Include a separate empty-Stage baseline and 10/100/500/1,000-shape scratch fixtures. Mount neither old Board orchestration nor native editor services in the experiment. Keep the selector development-only, with an explicit local optimized-build profiling flag.

This phase is a disposable scratch vertical slice. Use existing shape records and `BoardRecordStore` without server writes. Do not present partial loading of existing Boards as feature parity. Saved drawing formats, autosave, recovery and V3 Documents remain with the existing implementation until their approved migration phases.

Before HTML migration, review arbitrary DOM/graphics ordering, partial occlusion, editor event ownership and the cost of extra surfaces at 500+ objects. A single graphics plane cannot interleave arbitrary live DOM blocks. No stacking compromise or bounded fallback is approved for the new engine.

Do not write/run automated tests or browser automation. Run formatter, lint, types, production build and whitespace checks; report actual results and exact manual benchmarks in [the Phase-1 report](../reports/18-boards-konva-native-stage.md). Hardware measurements remain manual and must never be invented.

Stop after Phase 1 for manual acceptance. Phase 2 drawing/transforms, Phase 3 native HTML, Phase 4 full interactions and Phase 5 replacement/default changes remain gated.
