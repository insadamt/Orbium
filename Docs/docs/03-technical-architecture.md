# Technical architecture

## Target stack

### Backend

- PHP 8.4
- Laravel 13
- Inertia.js
- PostgreSQL

### Frontend

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4

### Editor

- Tiptap / ProseMirror

### 3D and motion

- Three.js
- React Three Fiber
- Drei
- GSAP 3
- `@gsap/react`

### Client interaction state

- Zustand

### Testing

- Pest / Laravel test tooling
- Vitest + React Testing Library
- Playwright

### Deployment baseline

Docker Compose:

```text
nginx
app (PHP/Laravel)
postgres
```

Do not require Redis, Meilisearch, Elasticsearch, MinIO, RabbitMQ, or WebSockets for v0.1.0.

## Architectural boundaries

Recommended Laravel organization:

```text
app/
├── Actions/
│   ├── Nodes/
│   ├── Documents/
│   ├── Databases/
│   └── Portability/
├── Data/
├── Http/
│   ├── Controllers/
│   └── Requests/
├── Models/
├── Policies/
├── Services/
│   ├── Search/
│   ├── Editor/
│   ├── Files/
│   └── Portability/
└── Support/
```

Do not force a domain-driven folder hierarchy if it makes simple Laravel behavior harder to read. The important boundary is responsibility.

## Persistent vs transient state

### PostgreSQL/Laravel source of truth

- workspaces;
- nodes/hierarchy;
- documents;
- database schemas/values/views;
- tags;
- mentions;
- attachments metadata;
- user settings;
- portable-data metadata.

### Zustand / browser transient state

- active/hovered orbit node;
- camera state;
- Search Master open state;
- temporary command selection;
- unsaved lightweight UI state;
- tab UI state if intentionally browser-local.

Persist important workspace shell preferences only when product behavior requires cross-device persistence.

## Inertia

Use Inertia for:

- normal app navigation;
- document/database/settings pages;
- server-derived initial page state.

Use focused JSON endpoints where continuous interactive behavior needs lightweight fetches, such as:

- lazy loading direct orbit children;
- search suggestions/results;
- autosave payloads where Inertia navigation would be inappropriate.

Do not create a large separate REST API merely because JSON is needed for an interaction.

## Editor persistence

Recommended `documents` representation:

```text
content JSONB
content_format_version INTEGER
plain_text TEXT
```

`content` is authoritative.

`plain_text` is derived for search/snippets and must be regenerated on document save.

Mentions and attachment references contained inside editor JSON must be parsed by a dedicated editor-content service. Portability and indexing must never implement ad-hoc JSON traversal in multiple unrelated places.

Suggested service boundary:

```text
EditorContentInspector
├── extractPlainText()
├── extractMentions()
├── extractAttachmentIds()
├── remapReferences()
└── validateContentShape()
```

## Search

Initial engine:

- PostgreSQL Full Text Search;
- `pg_trgm` for fuzzy title/tag matching.

Suggested indexes:

- trigram index on normalized node title;
- GIN FTS index for document `plain_text`;
- trigram tag name;
- indexes on commonly queried database property/value fields.

Search Master should have one application service that merges/ranks result classes rather than duplicating search logic in React.

## Files

Initial storage backend:

```text
Laravel Filesystem → local disk
```

Abstraction must use Laravel Filesystem so S3-compatible storage can be added later without changing domain concepts.

Store:

- images;
- attachments;
- covers;
- avatar if implemented as an uploaded file;
- pending/safety portability archives.

Never use user-provided filenames directly as physical storage keys.

## 3D boundaries

React Three Fiber owns the scene.

GSAP owns choreographed transitions such as:

- entering a folder;
- leaving to parent;
- node creation reveal;
- Search Master world dim/pullback;
- document-to-orbit transition.

`useFrame()` owns continuous behavior:

- subtle drift;
- slow rotation;
- continuous interpolation.

Do not set React state every frame.

## Jobs/queues

Do not require queues in v0.1.0.

If portability of large archives proves too slow for normal HTTP execution during testing, document the measured problem before adding queue infrastructure. Prefer streaming and generous server request handling first.

## Error strategy

Domain/action errors should become precise user-facing validation/errors.

Examples:

- invalid containment;
- cycle attempt;
- missing mention target;
- unsupported archive format;
- checksum mismatch;
- save conflict/server unavailable.

Do not convert everything to generic "Something went wrong."

## Performance targets

These are interaction targets, not hard benchmarks:

- UI input should remain responsive during autosave/search.
- Search Master should return title-level results effectively immediately for normal personal datasets.
- Orbit transitions should target smooth 60 FPS on the Balanced setting on a normal modern laptop.
- Large workspaces must not render the entire hierarchy in 3D.
- NDJSON portability operations must be streaming/bounded rather than loading the complete graph into memory.
