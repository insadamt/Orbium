# Orbium — Codex implementation handoff

This package is the authoritative implementation brief for **Orbium v0.1.0**.

Current feature task (2026-10-18): the user approved the native Board correction and authorized phase 4 with “okey go ahead”. Follow `phases/12-boards-resource-cards.md` and `docs/24-boards.md`: live resource cards, original Document persistence and sibling Document creation, while preserving independent native Board blocks. Phase-4 implementation and manual acceptance are recorded in `reports/12-boards-resource-cards.md`. Boards now use the normal Orbium app bar/tabs and page surface, superseding the earlier full-screen default; see `reports/12-boards-native-app-shell.md`. Presentation, smart guides, arrangement and properties are documented in `reports/12-boards-spatial-refinement.md`. The latest investigation, navigation correction, indexed-field editor fix and unresolved block interaction problems are recorded in `reports/12-boards-investigation.md`. The user subsequently approved all UX-audit corrections with “okey fix all that”; the native editing, history, gesture, overlay, responsive and performance-work refinements are recorded in `reports/12-boards-ux-correction.md`. The subsequent approved block-presentation pass is recorded in `reports/12-boards-block-presentation.md`, with a standalone visual gallery and representative-board checklist. Stop for manual review before any Mind Map/later phase.

Latest Board review correction (2026-10-18): the user approved redesign work and requested the same styling as Document blocks without six-dot handles. Follow the Document-style presentation correction in `docs/24-boards.md` and `reports/12-boards-document-style.md`; this supersedes the spatial-notebook proposal. Remain in phase-4 manual review.

The follow-up request also adopts Document-like editing ergonomics: native click-to-edit, nearby selection formatting, writing commands/shortcuts and focused source editing. See `reports/12-boards-document-editing.md`. Independent native blocks and the phase-4 stop gate remain in force.

Stabilization review (2026-10-19): the user reported widespread glitches and authorized repairs. A reproduced code-editor unmount crash, portal/canvas event interference, delayed edit focus and native editor synchronization were repaired. Read `reports/12-boards-editing-stabilization.md` for the browser-observed results and remaining manual acceptance gaps. Do not treat earlier static checks as full Board acceptance.

Selection/resizing review (2026-10-19): the user approved the proposed block correction with “okey go ahead”. Single-click selects; double-click/Enter edits. All eight resize handles, text corner scaling, tight content sizing, image natural proportions and nondestructive cropping are described in `docs/24-boards.md` and `reports/12-boards-selection-resizing.md`. This supersedes the earlier click-to-edit ergonomics. Remain in phase-4 manual review.

Whole-block sizing clarification (2026-10-19): the user reported that corners still expanded frames and requested automatic growth for added rows/content. Corners now scale complete block surfaces, including tables/technical/resource blocks; manually sized content can grow rather than hide additions. See `reports/12-boards-scale-auto-growth.md`. This supersedes writing-only corner scaling and fixed-height clipping. Remain in phase-4 manual review.

Zoom clarity repair (2026-10-19): the user reported poor block resolution during zoom. Camera rendering now uses native layout zoom rather than scaling a cached world layer; PDF page rendering follows effective camera/block density within its pixel budget. See `reports/12-boards-zoom-clarity.md` and `docs/24-boards.md`. Remain in phase-4 manual review.

Automatic height review (2026-10-19): the user approved removing manual expansion from content blocks. Content determines height in both directions; side handles control width and corners scale the whole surface. Vertical content handles and Fit height are removed; image crop frames remain. Legacy manual heights no longer prevent shrinking. See `reports/12-boards-automatic-height.md` and `docs/24-boards.md`. Remain in phase-4 manual review.

Live height border repair (2026-10-19): content-driven height is measured during the resize pointer preview so the selection border tracks wrapping before release. See `reports/12-boards-live-height-border.md`. Remain in phase-4 manual review.

Board interface simplification (2026-10-19): the user approved a smaller toolbar, quieter header and contextual selection controls. Images and linked pages are under Add; Board details/favorites are under the header menu; duplication, arrangement, layers and properties are under selection More. History remains visible during editing. See `reports/12-boards-interface-simplification.md` for actual checks and manual acceptance. Remain in phase-4 manual review.

Native app-shell correction (2026-10-19): the user approved integrating Boards with the normal app bar, tabs and app styling. Board viewport takeover and inert/hidden navigation are removed. The shared Node title editor supports a compact toolbar layout, Board tools sit above the canvas, and height follows the actual responsive app bar. This supersedes the separate Board header/Back and full-screen presentation rules. See `reports/12-boards-native-app-shell.md`; remain in phase-4 manual review.

Orbium is a self-hosted spatial knowledge workspace combining:

- hierarchical knowledge organization;
- Notion-like document/database ergonomics;
- Markdown-first writing shortcuts;
- a minimalist 3D orbital navigation model;
- a global Search Master;
- versioned, validated, portable account archives.

## Codex: mandatory workflow

1. Read `AGENTS.md`.
2. Read `docs/00-product-spec.md`, `docs/01-v0.1.0-scope.md`, and `docs/02-domain-model.md`.
3. Read the documentation referenced by the current phase.
4. Start with **Phase 0 only**.
5. Complete tasks in the phase in order unless a dependency requires a documented adjustment.
6. Use one commit per logical task.
7. Run the required validation before each commit.
8. At the end of the phase:
   - run the complete phase quality gate;
   - produce a phase report using `docs/14-phase-report-template.md`;
   - present the manual validation checklist to the user;
   - **STOP**.
9. Do not start the next phase until the user explicitly confirms the current phase.

The user intends to inspect each phase manually before allowing the next one.

## Document precedence

If documents appear to conflict, use this precedence:

1. `AGENTS.md`
2. `docs/01-v0.1.0-scope.md`
3. `docs/02-domain-model.md`
4. feature-specific documentation
5. phase documents
6. implementation convenience

Do not silently invent product behavior to resolve a conflict. Prefer the smallest behavior consistent with the higher-priority documents and record the interpretation in the phase report.

## Phase order

| Phase | Goal |
|---|---|
| 0 | Repository, stack, auth, Docker, quality gates |
| 1 | Workspaces, hierarchy, node CRUD, containment |
| 2 | Document editor, Markdown UX, mentions, attachments |
| 3 | Databases, properties, Table and Gallery |
| 4 | Search Master, workspace selector, tabs, navigation history |
| 5 | 3D Orbit and motion system |
| 6 | Versioned portability protocol and restore |
| 7 | Settings, onboarding, resilience, UX polish |
| 8 | v0.1.0 release candidate and release hardening |

See `phases/README.md`.

## Core vocabulary

- **Relation**: structural parent-child containment.
- **Mention**: contextual reference from one document to another node.
- **Orbit**: 3D visualization of relations only.
- **Search Master**: global search/navigation/command interface opened with `Ctrl + Space`.
- **Workspace explorer**: conventional hierarchy browsing on workspace and folder pages.
- **Database document**: a normal document whose parent is a database and which additionally has structured property values.

## Absolute product rules

- A node has exactly one parent, except workspace-root nodes whose parent is `null`.
- A folder can contain folders, documents, databases, and Boards.
- A database can contain documents only.
- A document cannot contain children.
- A Board cannot contain hierarchical children; see the current feature-phase scope above.
- Mentions never alter hierarchy.
- Mentions are not rendered as lines in the 3D Orbit.
- The initial database views are only **Table, Gallery, Orbit**.
- Database required-properties and templates are not part of v0.1.0.
- The editor uses Notion-like block interaction plus Markdown typing shortcuts.
- The visual identity is monochrome/minimalist 3D with frosted glass UI surfaces; semantic colors are informational only.
- Orbium portability is a versioned protocol, not a raw database dump.
