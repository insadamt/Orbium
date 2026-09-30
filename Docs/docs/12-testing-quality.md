# Testing and quality strategy

## Testing pyramid

### PHP unit/domain tests

Use for:

- containment rules;
- cycle detection;
- property value validation;
- search ranking helpers;
- portability row adapters;
- editor content reference inspection/remapping.

### Laravel feature tests

Use for:

- authorization;
- workspace/node CRUD;
- moves;
- document autosave endpoints;
- database CRUD;
- search endpoints;
- file upload/download;
- portability workflow.

### Frontend unit/component tests

Use for:

- menus;
- editor extensions where practical;
- database property editors;
- Search Master keyboard behavior;
- tab state reducers/store;
- reduced motion logic.

### Playwright

Use for critical user flows:

- login/onboarding;
- create workspace/folder/document;
- edit/autosave document;
- mention a node;
- create/use database;
- Search Master jump;
- workspace explorer move;
- Orbit navigation;
- portability preview/restore where test fixture size allows.

## Per-task validation

Before logical commit:

```bash
./vendor/bin/pint --test
# focused php tests
npm run types:check
npm run lint
# focused frontend tests where applicable
npm run build
git diff --check
```

It is acceptable to run focused test subsets during development, but phase completion requires the full gate.

## Phase completion gate

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run test
npm run build
git diff --check
```

Also run phase-specific commands listed in that phase document.

## Migrations

Test both:

- fresh database migration;
- upgrade path from the previous phase/release schema when relevant.

Never depend only on SQLite for PostgreSQL-specific behavior such as:

- FTS;
- `pg_trgm`;
- JSONB semantics;
- repeatable-read portability snapshot;
- advisory locks if used.

Critical DB integration should run against PostgreSQL.

## 3D verification

Automated tests cannot establish visual quality completely.

At minimum automate:

- deterministic layout math;
- scene child data;
- navigation state;
- reduced-motion branches.

Manual review must cover:

- framing;
- clipping;
- camera behavior;
- motion naturalness;
- high/low child counts;
- dark/light modes;
- performance.

## Portability verification

Treat portability as security- and persistence-sensitive.

Never test only a happy path.

Require adversarial fixtures for:

- malicious ZIP paths;
- corrupted hashes;
- malformed rows;
- unsupported versions;
- relationship corruption;
- oversized data;
- embedded reference corruption;
- restore failure/rollback.

## Accessibility

Automated checks where practical plus manual keyboard review.

Critical interfaces:

- Search Master;
- native workspace selector and workspace explorer;
- slash menu;
- context menus;
- settings;
- database property controls.

The 3D canvas must have equivalent non-canvas navigation paths.

## Manual testing

The user will manually approve each phase.

Codex must not report "done" merely because automated tests pass.

See:

- `docs/13-manual-acceptance.md`
- per-phase manual checklist
- `docs/14-phase-report-template.md`
