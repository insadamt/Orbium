# Orbium UI/UX and competitive investigation — 2026-10-28

This report explains which UI/UX improvements would most strengthen Orbium, why they matter, and what should be polished next. It depends on the current working-tree implementation, the product/scope/domain documents, the latest UI/navigation overrides, and official competitor documentation checked on 2026-10-28. It is an investigation and proposal, not an implementation approval or a phase completion. The accompanying [manual checklist](07-ui-ux-competitive-manual-checklist.md) separates current-behavior checks from proposed acceptance criteria.

## Main recommendation

Prioritize **finding, creating, and safely resuming work**. Orbium has substantial functionality, but too much of that functionality requires knowing a shortcut, a hidden menu, or the current interaction mode. A user should quickly understand where they are, how to start, what a search includes, which document they are editing, and whether their changes are safe.

The strongest competitive direction is a calm, self-hosted workspace connecting writing, structured information, and spatial thinking. This is a positioning hypothesis to validate with users. More backgrounds, icon catalogs, animation variants, or block types would have less immediate value than making the existing daily workflows dependable and discoverable.

## Evidence and limits

- Read repository instructions, `START_HERE.md`, product/scope/domain specifications, phase-7 polish guidance, current UI/navigation documentation, and relevant review reports.
- Inspected the active shell, explorer, search, document headers/editors/autosave, retained split documents, Board help/resource/recovery controls, database search/property editing, settings, and document import/export.
- Compared published workflows from Notion, Obsidian, Anytype, Capacities, and AFFiNE using official sources linked below. These are documented capabilities, not independently tested performance or usability results.
- No live app walkthrough, screenshots, user study, browser automation, or performance traces were performed. Visual hierarchy, contrast, focus behavior, and perceived speed need manual confirmation. Source observations are distinguished from inferred user impact.
- Existing uncommitted home-control/motion changes were included in the review and left untouched. No application code, configuration, schema, or data changed.
- Current desktop/English-interface scope remains primary; multilingual authored content still matters. Mobile, screen-reader redesign, and RTL-menu work were previously excluded from the home pass and are not silently reintroduced here.

## Preserve the decisions already made

The current product is the floating Grid/List/Gallery explorer, not the removed orbital explorer. Preserve centered desktop tabs, genuinely blank containers, the approved frosted treatment, passive inline icons, and existing selection/drag semantics while evaluating proposals. The user has explicitly rejected some earlier alternatives.

The latest reports already address filtered-empty feedback, Reveal visibility, uploaded-icon fallbacks, viewport sizing, active-filter chips, tooltips, and bounded home motion. They remain manual acceptance items; this report does not present them as missing implementations.

A visible New control, a workspace-wide Favorites view, new onboarding, compact page headers, or different focus behavior would change product decisions. They are proposals requiring agreement before implementation. Changing a default must not be disguised as a bug fix.

## Competitive comparison

The tradeoffs below are design inferences from each product's documented model. They are not claims that every user has these problems.

| Product | Documented strength relevant to Orbium | What Orbium should learn | Tradeoff to avoid copying |
|---|---|---|---|
| Notion | Sidebar search and navigation; pages as database entries; multiple database views and page-opening modes | Keep important actions findable; expose view/filter state; preserve context when opening an entry | A large feature/navigation surface can demand setup and attention; Orbium should keep its smaller scope legible |
| Obsidian | Local Markdown files, keyboard Quick switcher, contextual backlinks | Fast retrieval, recoverable ownership, and a useful path back from every reference | Plugin/configuration choices can become an additional setup task; common Orbium workflows should work immediately |
| Anytype | Local-first encrypted ownership, linked objects, multiple export scopes | Explain ownership and export scope clearly; make relationships useful without forcing a graph | Types, properties, links, and views introduce concepts; reveal concepts when the task requires them |
| Capacities | Object types, daily capture, integrated search/commands, backlinks, reusable queries | Offer an obvious place to begin and several ways to rediscover information | A type/date-centered organization model is a commitment; Orbium can support simpler folder/document use |
| AFFiNE | Paper and Edgeless views of a document; linked/synced content; self-hosting | Make writing and spatial work feel connected, with clear original-content ownership | Multiple spatial/text modes need explicit editing and selection boundaries |

Notion sources: [navigation](https://www.notion.com/help/navigate-with-the-sidebar), [search](https://www.notion.com/en-gb/help/search), [database views](https://www.notion.com/help/views-filters-and-sorts). Obsidian sources: [storage](https://obsidian.md/help/data-storage), [Quick switcher](https://obsidian.md/help/plugins/quick-switcher), [backlinks](https://obsidian.md/help/plugins/backlinks).

Anytype sources: [ownership and local-first model](https://doc.anytype.io/anytype), [linking](https://doc.anytype.io/anytype/create/links.md), [export scopes and exclusions](https://doc.anytype.io/anytype/data/import-and-export.md). Its documentation index lists sidebar/widgets, but those detail pages were unavailable during this review; no detailed widget behavior is inferred from them.

Capacities sources: [object types](https://docs.capacities.io/reference/content-types), [daily capture](https://docs.capacities.io/reference/use-cases/daily-notes), [search](https://docs.capacities.io/reference/search), [queries](https://docs.capacities.io/reference/use-cases/queries-in-practice), [backlinks in a reading workflow](https://docs.capacities.io/reference/use-cases/reading-workflow). AFFiNE sources: [first document and Edgeless workflow](https://affine.pro/blog/getting-started-with-affine), [document concepts](https://docs.affine.pro/core-concepts/elements-of-affine/docs), [page information/backlinks](https://docs.affine.pro/core-concepts/elements-of-affine/doc-info), [self-hosted backup](https://docs.affine.pro/self-host-affine/administer/backup-and-restore).

Notion also documents offline page availability and editing. Treating Notion as having no offline capability would be an outdated comparison. Availability and limitations depend on the documented workflow: [Notion offline pages](https://www.notion.com/en-gb/help/use-pages-offline).

### What each rival teaches through a real workflow

**Notion — preserve context while organizing work.** A person can find a database, choose a filtered view, and open a row in a side or center peek while retaining database context. The documented interaction reduces the need to reconstruct a list after inspecting an entry. Orbium already has database documents and split tabs, but those mechanisms should be evaluated for the same outcome: inspect, edit, and return without losing place. A new peek component is not automatically necessary. Copying additional database layouts before getting search, cell commits, and return navigation right would dilute the near-term improvement. This interpretation is based on [Notion's view and opening-mode documentation](https://www.notion.com/help/views-filters-and-sorts).

**Obsidian — make returning to knowledge inexpensive.** Quick switcher supports recent-note access, fuzzy name/alias matching, opening another tab, and creating a note from a query. Backlinks supply the reverse journey from a referenced idea to its source. Files remain ordinary local Markdown files. Together these offer a useful standard for repeated retrieval and understandable ownership. Orbium has fuzzy global search and mentions already; the missing opportunity is making their value obvious and completing the return path. Matching Obsidian's full customization ecosystem is a much larger product commitment. The near-term task is a reliable default workflow, not that ecosystem. Sources: [Quick switcher](https://obsidian.md/help/plugins/quick-switcher), [backlinks](https://obsidian.md/help/plugins/backlinks), and [storage](https://obsidian.md/help/data-storage).

**Anytype — communicate ownership through product behavior.** Anytype documents local-first storage, encryption, and links between objects. Its export UI distinguishes one object, a view, multiple objects, and a whole channel, with options for linked objects and files plus explicit exclusions. The transferable lesson is precise scope: “What does this action affect, what remains elsewhere, and what can I take away?” Orbium needs that clarity for live Board cards and its different export formats. Self-hosting alone does not provide Anytype's local-first or encryption model; Orbium should explain its actual server-based guarantees. Sources: [ownership](https://doc.anytype.io/anytype), [links](https://doc.anytype.io/anytype/create/links.md), and [export](https://doc.anytype.io/anytype/data/import-and-export.md).

**Capacities — give capture and rediscovery a repeatable rhythm.** Daily notes provide a consistent capture destination. Object types, backlinks, search, and queries supply other ways back into the same material. The useful lesson is reducing the number of organization decisions before writing. Orbium could first reduce contextual creation friction and improve Recent/Favorites access without adopting a new object-type system or building a calendar. A daily-note feature would need its own scope discussion. The usability hypothesis to test is whether users can capture now and find later without deciding among Document, Board, folder, and database prematurely. Sources: [daily capture](https://docs.capacities.io/reference/use-cases/daily-notes), [object types](https://docs.capacities.io/reference/content-types), and [queries](https://docs.capacities.io/reference/use-cases/queries-in-practice).

**AFFiNE — connect writing with spatial work.** Its getting-started workflow writes a brief, adds supporting material in Edgeless, and returns to the paper view of the same document. Orbium's model differs: a Board is its own leaf node, native blocks belong to it, and linked Documents remain originals elsewhere. The opportunity is a smooth transition with clear identity, rather than pretending these models are identical. A user should arrange a document on a Board, edit it, and return to its standalone page with confidence about where it lives. Rewriting Orbium into AFFiNE's content model is unnecessary for that goal. Sources: [the walkthrough](https://affine.pro/blog/getting-started-with-affine) and [document concepts](https://docs.affine.pro/core-concepts/elements-of-affine/docs).

## Findings, ordered by practical importance

### 1. Primary actions are difficult to discover

**Evidence: confirmed source structure; impact is a usability hypothesis.**

The active floating shell exposes local page search. Content creation is inside the Account menu on explorer pages or the empty-space context menu; Search Master is another creation route. The tab-strip plus opens workspace home in a new app tab. It does not create a page. With no workspaces, the dashboard renders the shell without explorer content.

Sources: `floating-top-controls.tsx:249,271,303,327`, `explorer-context-menu.tsx`, `pages/dashboard.tsx`, and `WorkspaceController.php:18`.

The visible controls give strong access to Settings, Statistics, and Library, while the daily writing entry point is less evident. New users must infer where creation lives; the visible plus has a different purpose from the one they may expect.

**Proposed polish:** agree on one recognizable creation entry near workspace controls, with destination stated explicitly. Keep the tab plus's current function and tooltip. A conservative alternative is a dismissible hint anchored to an existing control, preserving blank containers. Creation from an open Document/Board should state whether the destination is the workspace root or a containing folder.

**Acceptance:** a first-time desktop user can create a document in the intended folder without instruction, right-click discovery, or memorized shortcuts. A proposed research target is first useful text within 60 seconds; this is not a measured baseline.

### 2. Search scope and return paths do not form one clear system

**Evidence: confirmed source behavior.**

`NavigationEvents` opens Search Master through `Ctrl + Space` or a custom event. The active floating shell's magnifier opens page search, not Search Master. Explorer search and Favorites filter only direct children. A favorite in another folder will not appear in that folder's Favorites filter. Search Master supports commands on an empty query or through `>`, but ordinary nonempty command wording is treated as content search.

Sources: `navigation-events.tsx:147,154`, `floating-navigation-buttons.tsx`, `use-explorer-filters.ts:106`, `search-master.tsx:143`.

This can make existing content feel missing. The current placeholders are an improvement, but they appear after opening the field. Recent pages exist in Search Master, yet discovering that return path still depends on finding Search Master.

**Proposed polish:** expose an unmistakable workspace-search entry while retaining local filtering. Display the active workspace in global search; label local filtering as “This folder” or “Page titles here.” Until a workspace-wide Favorites surface is approved, clarify that the existing filter means favorites here. Add a clear route from local no-results to searching the workspace. Consider a compact Recent/Favorites popover rather than restoring a permanent sidebar.

**Acceptance:** users can explain what will be searched before typing, find a nested document from another folder, and return to a recently used page without reconstructing its path. Never silently broaden searches across workspaces.

### 3. Saving and recovery have different guarantees across surfaces

**Evidence: confirmed implementation difference; no data-loss incident reproduced.**

Standalone Markdown and legacy document autosave retain pending edits in React refs, retry failures, and block navigation/unload while dirty. The inspected hooks do not implement the Board session-draft recovery path. Boards and their hosted Documents have sessionStorage draft recovery and download helpers; Board errors expose Retry where safe, Download local draft, and confirmed Load latest.

Sources: `markdown/use-markdown-autosave.ts:28,139`, `use-document-autosave.ts:32,191`, `boards/board-recovery.ts`, `boards/board-document-recovery.ts`, and `boards/board-save-status.tsx`.

A browser unload prompt is useful protection, but it is not persisted recovery. sessionStorage is also not a durable backup or a promise to survive every crash/device failure. Document header saves and body saves are separate, so body “Saved” alone does not prove that a title/cover change succeeded.

**Proposed polish:** define one visible language for pending, saving, saved, failed, and conflicting changes, with actions that explain what is retained and where. Preserve failed text for retry/export. Show conflicts differently from temporary connection errors; do not offer blind overwrite. Investigate bounded document recovery as a separate implementation slice. Distinguish header failure from body status.

**Acceptance:** on disposable content, a failed save never claims success; retry retains the latest draft; a conflict preserves a recoverable copy before loading server content. Recovery limits are explicit. This does not require implementing offline sync.

### 4. Editing modes and focus ownership demand too much implicit knowledge

**Evidence: source and explicitly requested behavior; risk needs manual validation.**

Explorer click opens a page; modified click selects. Board click selects, double-click/Enter edits, and Escape finishes. Mind Map topics introduce another nested editing surface. In split documents, pointer movement over a visible document can activate the pane and focus its editor without a click.

Sources: `floating-item.tsx:92`, `board-help-dialog.tsx:58`, `retained-document-workspace.tsx:75,113`, and `05-split-hover-activation-and-block-transfer.md`.

Different surface semantics can be appropriate. The problem is uncertainty about which surface owns typing, search, selection, or Undo. A small pointer movement during keyboard work may be surprising; this is a hypothesis, not a reproduced focus defect. Hover activation was explicitly requested and should not be reversed automatically.

**Proposed polish:** keep existing gestures but show a restrained active-pane/editing cue and consistent Finish editing action. Publish a short interaction contract for select, edit, pan, nested fullscreen, and Escape. Verify menus and rich editors retain shortcut ownership until dismissal. Offer an alternative activation preference only if observation shows a real problem and the user approves it.

**Acceptance:** text, Undo, find, and paste always affect the intended visible editor; crossing a pane accidentally does not produce unexplained edits. Closing a nested editor returns focus predictably.

### 5. Database retrieval and failed edits need practical polish

**Evidence: confirmed source behavior.**

Local database search filters `document.title` only. Search Master separately searches supported property values. A user searching a visible select/text value in a database can therefore see no local match even though a global search finds it. Each property save triggers a partial `values`/`fileReferences` reload. `PropertyInput` restores the previous value when saving fails, discarding the attempted value from its displayed draft.

Sources: `databases/show.tsx:91,167,193`, `databases/property-input.tsx:64`, and `Services/Search/WorkspaceSearch.php`.

**Proposed polish:** immediately clarify title-only scope; if approved, include supported displayed property values in database search. Keep a failed attempted value available for retry, with a precise cell-level error. Manually inspect quick successive edits before changing reload architecture. Establish Enter/Tab/Escape behavior across property kinds and retain focus after save.

**Acceptance:** a user understands why a row matches; failed edits can be retried without retyping; rapid edits do not lose focus or revert another cell. Existing filters, sorts, hidden properties, and Table/Gallery configurations remain intact.

Additional views, formulas, templates, and relation systems are separate features. They should not block polishing the existing Table and Gallery.

### 6. Connected-note value is not surfaced enough

**Evidence: source search and inspected page composition; product gap.**

The domain documents define a mention index suitable for “mentioned by.” The inspected Document page does not render a backlinks section, and searches of current frontend/controllers/routes did not find an implemented backlinks UI. Do not infer its presence from the data model.

Sources: `docs/02-domain-model.md`, `components/documents/document-page.tsx`, and current route/controller/frontend searches.

Obsidian and Capacities document useful incoming-link workflows. Orbium's mentions currently offer less visible help for answering “Where else did I use this idea?” See the backlink sources in the competitive section.

**Proposed next feature, after polish:** a collapsed “Mentioned in” section showing source page, location, and context, beginning with indexed saved mentions. Define ownership, Trash exclusion, deduplication, and hosted-Document attribution first. Do not promise unlinked mentions or a full graph in this slice.

**Acceptance:** mention B in A, save, open B, and return to the relevant context in A. Neither mention nor Board reference changes hierarchy. This proposal requires scope approval.

### 7. Linked Board cards should make original-content ownership visible

**Evidence: confirmed source presentation; misunderstanding is a hypothesis.**

`BoardResourceHeader` exposes Open original and linked-page actions, but “Editing original Document” is screen-reader-only text. The model correctly edits the original Document, and removing its card does not delete that Document. A sighted user may still confuse a linked original with an independent native Board block or copy.

Source: `boards/board-resource-header.tsx:55`, `docs/24-boards.md`, and `docs/02-domain-model.md`.

**Proposed polish:** show a small “Linked document” indicator in relevant states, plus “Editing original” while editing. Use action wording such as “Remove from Board” where appropriate, and explain that the original remains. Keep the compact header and existing Open original action.

**Acceptance:** users can predict whether editing/removing a card changes or deletes the original before acting. A marker changed in the linked card appears in the standalone document after saving.

### 8. Default page decoration may delay access to writing and data

**Evidence: confirmed composition; visual cost is unmeasured.**

Documents render a default/custom cover, overlapping icon, large title, optional properties, and editor controls before the writing area. Folder and database pages use related media presentation. These are intentional design choices.

Sources: `documents/document-page.tsx`, `hierarchy/page-media-cover.tsx`, `floating-workspace.css`, and latest UI/media overrides.

**Proposed polish:** evaluate an optional compact header or writing-focused view on short desktop windows and split panes. Keep default cover behavior until approved otherwise. Prefer content-aware spacing and readable line length to simply shrinking everything. Keep title, location, save state, and essential actions accessible.

**Acceptance:** at 1366×768 and in a split pane, users can reach useful text/data quickly without recurring decorative scrolling. Long content still scrolls normally. This must be checked with actual computed layout; older CSS rules may be overridden later in the cascade.

### 9. Shared styling is improving, but readability and keyboard location need validation

**Evidence: source and documented preferences; no contrast/compliance measurement.**

The new shared control tooltip and home interaction CSS reduce inconsistency. Board and database controls still have their own components/styles, and some actions use native titles. Global CSS removes default focus outlines; local components provide mixed focus treatments. Frosted content sits over potentially complex backgrounds.

Sources: `navigation/control-tooltip.tsx`, `home-interactions.css`, `app.css:233`, `boards/board-toolbar-polish.css`, `databases/database.css`, and `05-ui-ux-system.md`.

**Proposed polish:** inventory common button sizes, tooltip wording, selected/disabled states, popup placement, and keyboard focus cues across the actual surfaces. Preserve the user's rejection of focus rings; a distinct background/text cue can convey keyboard location. Audit actual light/dark/Normal/Frosted combinations before proposing opacity changes. Use theme tokens and existing shared components where their behavior genuinely matches.

**Acceptance:** a keyboard user can identify the focused control, active pane, selected item, and disabled action. Menus and body text remain legible over a busy wallpaper. No blanket component rewrite is justified by this audit.

### 10. Performance needs evidence from complete user journeys

**Evidence: recorded unresolved user feedback and source scaling candidates.**

Board CPU/temperature complaints remain unresolved in the cited reports; subsequent source optimizations are not measured proof of resolution. Retained Document tabs intentionally preserve editors and history, increasing memory use. Workspace explorer responses load the workspace hierarchy before filtering to direct children. Database views map current documents/cells and reload values after saves.

Sources: `12-boards-cpu-followup.md`, `12-boards-instant-scene.md`, `12-boards-instant-scene-pdf.md`, `05-warm-tab-interaction.md`, `WorkspaceController.php:128`, and `retained-document-workspace.tsx`.

**Proposed polish:** manually compare built assets using the same content, viewport, theme, and wallpaper. Measure typing, warm/cold navigation, search, cell edits, canvas pan/zoom, and settled idle. Compare Normal/Frosted and still/animated backgrounds to isolate contributors. Preserve rich-preview continuity and editor state while optimizing the measured offender.

Proposed investigation targets: typical input/action feedback within about 100 ms, ordinary interaction latency below 200 ms, and warm tab switching without blank content or lost caret/undo. Report distributions and content sizes; these are candidate budgets, not existing results or universal guarantees. Cold server navigation needs its own budget.

**Acceptance:** repeatable before/after foreground traces show improvement without content, save, zoom-quality, or selection regressions. Do not infer thermal improvement from build success, source changes, or aggregate CPU while another window is active.

### 11. Portability promises must match reachable product workflows

**Evidence: spec-to-implementation gap in the inspected routes/UI.**

The product spec defines complete account portability and restore onboarding. Current inspected settings expose AI skills, Editor styles, Profile, Security, Appearance, and Workspaces. Searches found document transfer/package workflows, but no complete account archive/restore implementation or settings route. The current Import dialog accepts individual `.md`/`.orbie` documents or an Orbium document ZIP package, not an arbitrary competitor export.

Sources: `layouts/settings/layout.tsx:9`, `document-transfer/import-dialog.tsx`, `document-transfer/export-dialog.tsx`, `routes/web.php`, and `docs/10-portability-protocol.md`.

Treat full account portability as a specified requirement whose end-user completion is not established by this review. Document/package export is useful, but is not equivalent to restoring Boards, database schemas, hierarchy, and settings. Similarly, Markdown support is not proof of complete Obsidian-vault or Notion-ZIP migration.

**Proposed work:** immediately document supported export/import scopes accurately. Plan account backup/restore and competitor migration as separate approved work, with previews, exclusions, asset/link handling, and loss reports. A small pilot import can validate switching friction before building a broad importer. Never use personal production data for destructive restore acceptance.

**Acceptance:** a user knows exactly what an export contains and how to restore it. Only advertise whole-account restore after a supported round trip is manually demonstrated.

### 12. Help still describes a removed Board control

**Evidence: concrete source mismatch, not a visual inference.**

The Board help dialog instructs users to open “Object properties.” The approved later Board review explicitly removed Properties/inspector wiring. This sends users looking for a control the current product intentionally removed.

Sources: `boards/board-help-dialog.tsx:82` and `12-boards-properties-removal-divider-motion.md`.

**Proposed correction:** update that help entry to current resize/selection controls or remove it. Check the remaining help labels against current commands, especially Add, drawing tools, Finish editing, width versus whole-block scaling, and Escape.

**Acceptance:** every instruction in Canvas controls points to an available control or a working gesture. This is a focused correction that does not require restoring the inspector.

## Recommended implementation order

These are candidate batches, not permission to chain phases. Finish and manually review one approved batch before starting another.

| Order | Candidate batch | Why now | Relative size |
|---|---|---|---|
| 1 | Find/Create/Resume: agree on discoverable workspace search and creation; clarify local scope and Favorites; stabilize search state; correct stale Board help | Highest daily reach, low data-format risk, visible benefit to new and returning users | Small to medium |
| 2 | Save confidence: consistent status, retained failed values, clear conflict/recovery actions and header/body distinctions | Protects trust before larger feature work | Medium; recovery storage needs careful design |
| 3 | Editing continuity: active-pane cues, selection/Undo/focus ownership and linked-original clarity | Makes Boards, Mind Maps, and splits feel coherent | Medium |
| 4 | Database flow and density: search scope, quick edits, keyboard continuity, optional compact headers | Improves real work with existing features | Medium |
| 5 | Approved knowledge/migration features: backlinks first; explicit archive/restore and pilot migration plans | Gives users reasons to move existing knowledge into Orbium | Separate feature scope, potentially large |

Measured performance regressions interrupt this order when they prevent ordinary editing/navigation. Performance investigation is a release gate alongside the batches, not permission for another speculative architecture rewrite.

### Exact scope suggested for the next batch

1. Agree on a visible workspace-search entry in the existing shell without moving centered tabs. Keep local filter/find available with precise labels.
2. Agree on creation discoverability: a restrained workspace action or one-time anchored hint. Keep genuinely blank containers and the existing tab-plus meaning.
3. Make global-search waiting/error/empty states truthful. `changeQuery` currently clears results immediately, while Searching starts after the 150 ms debounce; source permits a premature no-results message between them. Use explicit pending state, guard against stale results, and provide a retry path. Confirm the actual flash manually.
4. Clarify local Favorites scope and provide a route from local no-results to workspace search without silently changing saved filters.
5. Correct obsolete Canvas controls instructions. Document current action locations and shortcuts accurately.

Defer source-format changes, new graph/database views, new wallpapers, and new animation choreography from this batch. They are unnecessary to demonstrate its benefit.

## Competitive position and later decisions

For the near-term audience, prioritize desktop researchers, technical writers, students, and individual knowledge workers comfortable with self-hosting. This is a proposed audience, not validated demand. A compelling pilot workflow is: capture a research note, find it later, connect it to another note, arrange the originals on a Board, and export the supported content with confidence.

AFFiNE is the most directly relevant workflow comparison for writing/spatial continuity. Obsidian and Capacities are strong references for connected-note retrieval. Notion supplies useful discoverability and structured-work patterns. Anytype sets a useful ownership/recovery communication benchmark. Orbium should validate its own advantage with the same representative tasks in each app, rather than claim overall superiority from a feature list.

Broader competition for teams or native offline use needs features explicitly deferred in the current scope: collaboration, offline sync, richer database views, and potentially mobile workflows. Better polish improves the current audience's experience; it does not erase those category differences.

## Validation and change report

- Added this investigation and a separate exact manual checklist only.
- Application behavior and existing working-tree changes were not modified.
- No automated tests, Playwright, computer-use sessions, or runtime benchmarks were run.
- Formatting/lint/type/build checks are not applicable to application behavior here because no source/configuration changed; none were run for this report. `git diff --check` passed, and a focused check of both new reports' local Markdown links and trailing whitespace passed.
- No commits created. Suggested report commit: `docs(ui): add competitive UX investigation and manual review plan`.
- Suggested future commits, only after implementation: `feat(navigation): expose workspace search and contextual creation`; `fix(search): clarify scope and pending result states`; `fix(boards): align canvas help with current controls`; `fix(editor): preserve failed drafts and clarify recovery actions`.
