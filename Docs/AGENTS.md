# Orbium repository instructions

These rules are mandatory for Codex and other implementation agents.

## Phase discipline

- Work on one phase at a time.
- Never start a later phase until the user explicitly approves the current phase.
- At the end of every phase, stop after presenting:
  - what changed;
  - commit list;
  - automated test/build results;
  - known limitations;
  - exact manual validation steps.
- Bugs discovered during the user's phase review belong to the current phase. Fix them before requesting approval again.
- Do not use a later phase as an excuse to leave a broken current-phase behavior unless the phase document explicitly marks that behavior as deferred.

## Git discipline

- One commit per logical task.
- Do not create temporary "WIP" commits with the intention to squash later.
- Do not mix unrelated cleanup with a feature commit.
- Before each commit, run the relevant formatter, linter, type checks, build, and focused tests.
- Before phase completion, run the complete phase quality gate.
- If a defect is discovered after a logical task was already committed, make a focused fix commit rather than rewriting unrelated history.
- Use intention-revealing conventional commit messages, for example:
  - `feat(hierarchy): enforce node containment rules`
  - `feat(editor): add markdown block shortcuts`
  - `test(portability): reject unsafe archive paths`

## Backward compatibility

- Persisted data, migrations, editor content formats, portability archives, configuration, and deployment workflows are compatibility contracts.
- Never rewrite an already-released migration to change historical meaning.
- Never mutate an already-released archive format definition.
- Add explicit migrations, format versions, adapters, or safe defaults.
- A newer app may read explicitly supported older formats.
- An older app must reject newer unsupported formats with a clear upgrade message.
- Never perform best-effort restoration of an unknown archive shape.
- Add regression fixtures/tests whenever compatibility behavior changes.

## Scope control

- `docs/01-v0.1.0-scope.md` is binding.
- Do not add deferred features because they are easy or attractive.
- Do not add Redis, Meilisearch, Elasticsearch, queues, WebSockets, MinIO, object storage, collaborative editing, AI, or a physics engine unless the active phase explicitly requires them.
- Prefer PostgreSQL capabilities and the existing Laravel application before adding infrastructure.
- Avoid premature abstractions. Extract a reusable abstraction only after the concept is established by real use.

## Code quality

- Prefer readable high-level flows.
- Extract low-level details into focused services/functions.
- Avoid hiding writes behind query-like method names.
- Use DTOs/value objects when a method's arguments become ambiguous.
- Add comments only when they explain **why** a non-obvious decision exists.
- Keep new or substantially modified source files under roughly 500 lines. Split by responsibility before they become monoliths.
- Keep domain rules out of React components and controllers when they belong in application/domain services.
- Controllers should validate/authorize/orchestrate; services/actions should own domain behavior.
- React components should be decomposed by behavior rather than arbitrary visual fragments.

## Database and data integrity

- Use database constraints where they can express an invariant safely.
- Enforce cross-row hierarchy rules in application services and cover them with tests.
- All user-owned queries must be scoped to the authenticated user/workspace as appropriate.
- Prevent hierarchy cycles.
- Moves across workspaces are rejected unless an explicit future feature defines migration behavior.
- Soft-deleted/trash data remains owned data and must not become orphaned.

## Frontend state

- Laravel/PostgreSQL is the source of truth for persistent state.
- Zustand is for transient client interaction state such as selected orbit node, camera state, open Search Master, and local tab UI.
- Do not duplicate server-domain state into a large client store.
- Use Inertia for application navigation/pages; use focused JSON endpoints only where highly interactive behavior benefits from them.

## Motion

- CSS/Tailwind: microstates and simple transitions.
- GSAP: deliberate/choreographed transitions.
- React Three Fiber/Three.js render loop: continuous 3D motion.
- Never run continuous world motion through React state updates.
- Respect reduced-motion settings from the beginning.

## Testing

At minimum, every behavior-changing task requires appropriate coverage from:

- Pest/PHP feature or unit tests;
- frontend unit/component tests where useful;
- Playwright for critical integrated flows.

Before a phase is presented for manual approval, run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run test
npm run build
git diff --check
```

If the repository defines a stricter verification script, use it in addition to the commands above.

## Security

- Never trust uploaded archive paths, MIME types, filenames, checksums, row shapes, or foreign keys.
- Sanitize rendered content and Mermaid/SVG output as necessary.
- Never expose server secrets or authentication credentials in portable archives.
- Do not commit `.env`, credentials, user exports, real databases, or private attachments.
- Security-sensitive behavior requires negative-path tests.

## Documentation

- Read the relevant docs before implementation.
- Update docs when implementation intentionally changes an agreed technical detail.
- Product behavior changes require user approval; do not "update the spec" to justify an unapproved behavior.
