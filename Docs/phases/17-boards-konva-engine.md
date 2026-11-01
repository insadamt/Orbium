Summary: Defines the authorized Board engine migration review phase. Depends on existing native Boards, record/history/persistence contracts, the Konva architecture plan and manual profiling; it does not authorize a redesign or a new default renderer.

# Board Konva hybrid engine migration

Authorized 2026-11-01 by the attached migration brief and “go ahead”. Carry out its A–G internal milestones within this migration. Preserve all current native UI, interactive HTML content, supported saved data, graphics ordering, history and original/Instant Scene overrides.

Read `../plans/board-konva-engine.md`, `../reports/17-boards-konva-feature-parity.md`, the required Board performance plans and `../docs/24-boards.md`. Add direct MIT Konva, bounded graphics composition, incremental stroke preparation, drawing-only eraser candidate filtering, shared camera painting and an independent compatibility fallback. No saved format/API/migration/archive change.

No automated tests, browser automation or hardware measurements are authorized here. Run relevant formatter, lint, TypeScript, production build and whitespace checks. Report their actual results and exact manual acceptance/performance steps in `../reports/17-boards-konva-engine.md`.

Stop for manual review after this opt-in implementation. Performance and complete feature parity require actual manual evidence. Changing the default, removing original graphics or expanding product features requires later explicit approval.
