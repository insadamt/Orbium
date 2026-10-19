# Boards — Canvas block redesign investigation

2026-10-18. Investigation and design proposals for the current phase-4 review. No application code or agreed product specification changed; these ideas require design review before implementation.

## Finding

The current architecture already provides independent typed Board objects. The visual problem is how those objects use space and communicate their purpose. The previous presentation pass improved typography and consistency, but retained broad insertion sizes, shared card surfaces and document-like reading density.

This investigation is based on current source and project documentation. No live browser inspection or manual visual acceptance was performed. Visual conclusions below are design judgments to validate on an actual Board, rather than confirmed runtime defects.

## Evidence

| Current source | Observation | Design implication |
|---|---|---|
| `resources/js/components/boards/board-resource-layout.ts` | All linked resources start at 600 × 420. | Navigation-only Board/Database cards occupy the same area as editable Document previews. |
| `resources/js/components/boards/use-board-objects.ts` | Code, table, file and Mermaid start at 520 × 300; math starts at 360 × 300; images at 400 × 300. | Initial geometry follows broad categories rather than actual content. Short equations and ordinary file links can have substantial empty frames. |
| `resources/js/components/boards/board-object-card.tsx` | Text, heading, list, quote, image and divider are bare; other types share the content-surface category. | Different types already have some distinction, but math, diagrams, files and notes can still receive a similar container treatment. |
| `resources/js/components/boards/board-block-presentation.css` | Body text is 16px/1.65; list rows have a 32px minimum; quotes use a reading-style left rule. | Writing is comfortable in isolation, but can feel loose when scanning many objects together. |
| `resources/js/components/boards/board-resource-block.tsx` | Resource headers permanently show Refresh/Open; non-Document previews use a navigation instruction. | Small cards spend valuable space on controls and instructions rather than useful identity. |
| `resources/js/components/boards/board.css` | Every object body uses an overflow container; selected/editing states use solid/dashed outlines. | Bounded panels remain necessary, but preview sizing and state presentation deserve review per type. Actual clipping requires manual verification. |

The latest Board-specific contract intentionally preserves transparent writing and images. Earlier general text-background guidance should not be used to add cards around every Board object.

## Three directions

1. **Spatial notebook — recommended.** Bare headings/text establish sections; neutral notes hold emphasis; images stay prominent; links become compact navigation tiles; technical content gets purpose-built panels. Best fit for mixed knowledge work and Orbium's restrained monochrome identity.
2. **Research wall.** Stronger visual emphasis on images, quotes and source cards, with concise annotations. Good for collecting references; less suitable as the universal treatment for tables, equations and code.
3. **Uniform card grid.** Consistent card widths and denser padding. Easy to align, but weakens the distinction between writing, media and navigation and makes the Board feel more like a dashboard.

Use the spatial notebook as the common system. Support research layouts through composition of existing blocks, without introducing a separate Board mode.

## Proposed block treatments

All sizes below are starting points in canvas units at 100% zoom, not implementation requirements. Preserve existing saved positions and user-sized frames. Judge body text at 100%, and hierarchy at 50%.

| Block | Proposed treatment | Starting geometry |
|---|---|---|
| Heading | Bare section label; clear size hierarchy; no card or permanent type label. | About 320–480 wide, height follows content. |
| Text | Bare annotation with tighter 1.45–1.55 leading; retain readable 16px body size initially. | About 280–320 wide, height follows content. |
| List/checklist | Compact item rhythm and consistent marker gutter; show task actions when selected. | About 280–320 wide, height follows content; target 28px row minimum before touch review. |
| Quote | Distinct quotation mark and restrained inset, without a full surrounding card. Attribution remains ordinary authored text initially. | About 300–360 wide, height follows content. |
| Callout | A deliberate neutral note surface, soft 8px corners, balanced 16px inset and a small visual accent. | About 280–320 wide, height follows content. |
| Image | Image dominates; minimal frame; caption secondary. Initial frame should respect uploaded image proportions. | About 320–400 wide, derive height from image and caption. |
| Ordinary file | Compact attachment tile with filename, type/size when available and a download action. | About 280–320 × 80–96. |
| Audio/video/PDF | Media-specific treatment; sufficient space for usable player controls or reading. | Derive from player type; avoid forcing compact file geometry onto players. |
| Document reference | Clear icon/title, a short bounded excerpt and a quiet linked-resource cue. Keep existing original-Document editing behavior. | About 340–380 × 220–260 for preview; editing size needs a separate prototype. |
| Database/Board reference | Compact navigation tile, recognizable type and title; omit large instructional body. | About 280–320 × 88–112. |
| Code | Purpose-built panel; compact language/Copy strip; readable monospaced body and deliberate overflow for long lines. | About 440–520 wide; initial height based on a bounded number of lines. |
| Table | Compact data grid with subtle internal rules and contextual structural actions. Avoid an extra decorative wrapper. | About 440–520 wide for a small table; initial height based on rows. |
| Math | Equation on the canvas, with a surface only if contrast requires it; source editor appears during editing. | About 240–320 wide, fit rendered equation initially. |
| Mermaid | Diagram dominates; renderer controls stay secondary. Measure initial dimensions within limits. | Start around 400–520 wide; fit diagram aspect ratio within bounds. |
| Divider | Quiet spatial separator, with controls only when selected. | Thin horizontal object; retain existing format and geometry limits. |

Avoid fake Database rows, Board thumbnails or extra resource metadata that the current preview API does not supply. Richer previews would be a separate behavior proposal.

## Interaction and visual rules

- Keep content origin, wrapping and frame stable when entering or leaving editing. Height growth from actual authored content remains appropriate.
- Retain the existing contextual editing lane above the dock for the first prototype; evaluate its distance from selected objects before redesigning it too.
- Show secondary actions on hover, selection and keyboard focus, and make them accessible through selection on touch. Keep essential playback/task controls directly usable.
- Give selection and editing distinguishable but quiet cues. Preserve working multi-selection, resize targets and zoom-aware handles.
- Use a restrained family of surfaces: bare writing/media, neutral notes/navigation, and structured technical panels. Reuse shared Normal/Frosted appearance tokens; test content contrast in both.
- Prefer content-aware initial sizing and explicit fit actions. Do not continually resize existing objects as metadata/previews refresh: that would disturb deliberate layouts.
- At lower zoom, recognizable silhouettes and heading hierarchy should carry the layout. Zoom-specific replacement previews are an optional later behavior, not necessary for the first redesign.

## Recommended sequence within current review

1. Prototype one representative composition containing a section heading, annotation, checklist, callout, image, Document card, Database/Board tiles, file, equation and technical panels. Review the composition at 100% and 50% before styling every block.
2. Redesign surfaces, spacing and contextual secondary actions against that composition. Preserve persistence formats and independent native blocks.
3. Adjust insertion geometry by content/type. Implement render-dependent initial fitting separately from user resize and existing saved geometry; review history and delayed metadata handling.
4. Review edit transitions for Document cards, source blocks and media. Any temporary expansion must restore geometry predictably and respect dirty/upload/conflict guards before adoption.

The redesign can stay in phase 4. Mind Maps, drawing, persistent grouping, new node hierarchy and block-to-Document conversion are outside this proposal.

## Manual review checklist

These checks are pending. Current-state checks can be performed now; proposed outcomes apply to a future prototype/implementation.

1. **Baseline:** create a disposable Board with a Document, Database and Board reference, a short equation and an ordinary file. Expected now: confirm the broad insertion frames described above; record which feel unnecessarily empty.
2. **Composition:** arrange the representative blocks in three loose clusters: thinking/writing, references/media and technical content. Expected after redesign: sections and block purposes are distinguishable at 100% without reading every item.
3. **Density:** compare a five-item checklist, a two-line annotation and a short quote. Expected after redesign: compact rhythm with readable markers and comfortable editing/touch targets.
4. **Geometry:** add a portrait image, a landscape image, a one-line equation, a short file link and a large table. Expected after redesign: useful initial proportions; ordinary attachments stay compact; players and large tables retain reachable controls/overflow.
5. **Editing:** enter/leave each block, type, undo and finish. Expected: content stays anchored; controls do not push content unexpectedly; authored growth and any deliberate expansion are predictable.
6. **Actions:** use mouse hover, keyboard navigation and touch selection. Expected: Refresh/Open/download remain discoverable and reachable when secondary actions are hidden at rest.
7. **Zoom and themes:** inspect at 50%, 100% and 200% in Light/Dark and Normal/Frosted. Expected: distinct hierarchy, readable content at normal zoom and usable selection/resize indicators.
8. **Persistence:** resize/reposition objects, wait for Saved, reload, refresh resource previews and exercise undo/redo. Expected: intentional geometry persists; refreshed content does not rearrange the Board; removing a reference preserves its original resource.

## Validation and handoff

Only this investigation report was added. No application checks, builds or automated tests were run because application code was unchanged. Report whitespace was checked with `git diff --no-index --check /dev/null Docs/reports/12-boards-redesign-investigation.md`.

Suggested commit for this report: `docs(boards): investigate canvas block redesign`.

Suggested future implementation commits, if approved: `style(boards): redesign block surfaces for spatial layouts` and `fix(boards): size new blocks for their content`.
