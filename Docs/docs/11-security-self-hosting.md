# Security and self-hosting

## Deployment model

Initial deployment target:

```text
Docker Compose
├── nginx
├── app
└── postgres
```

Local file storage is the default.

Do not require external services for normal operation.

## Authentication

Use Laravel-supported authentication.

Requirements:

- password hashing using framework defaults;
- CSRF protection;
- authenticated routes;
- policy/authorization checks;
- rate limiting where appropriate;
- user-owned data isolation.

Collaboration/shared workspaces are not v0.1.0. A user must never access another user's workspace/node by guessing IDs.

## File uploads

Never trust:

- original filename;
- client MIME type;
- extension;
- user path.

Store using server-generated keys.

Enforce configurable size limits.

Serve through authorized application/storage routes as appropriate.

Dangerous active content should not be executed merely because it was uploaded.

## Editor/XSS

Rich editor content is structured input but still untrusted.

Sanitize/escape:

- rendered HTML;
- Mermaid/SVG output;
- pasted HTML;
- links/URLs;
- captions.

Do not allow arbitrary script/event-handler injection.

## URLs

URL properties/links should validate supported schemes.

Do not generate clickable `javascript:` URLs.

## Mermaid

Mermaid rendering must use safe configuration.

Invalid diagrams must fail as content errors, not execute scripts.

## Portability upload security

See `docs/10-portability-protocol.md`.

Important controls:

- ZIP path validation;
- no symlinks;
- duplicate rejection;
- size/entry/expanded limits;
- checksums;
- exact entry declaration;
- NDJSON bounded reads;
- row shape validation;
- relationship validation;
- no authentication-secret import.

## Restore concurrency

While restore replaces portable data:

- block conflicting writes;
- keep reads conservative if they could expose partial state;
- perform database replacement transactionally.

## Self-host defaults

The default installation should be secure without expecting the user to understand Laravel internals.

Documentation should state:

- which port is exposed;
- where persistent volumes live;
- how to configure HTTPS/reverse proxy when internet-exposed;
- how portable archive differs from server backup;
- how to update safely.

## Secrets

Never write real secrets into:

- repository;
- docs;
- tests;
- sample archive fixtures;
- screenshots.

Use generated test data.

## Logs

Avoid logging:

- document body content;
- archive raw rows;
- attachment bytes;
- passwords/tokens.

Log IDs/error classes and enough metadata to diagnose failures without turning logs into a second private-data store.

## Destructive actions

Require confirmation for:

- permanent workspace deletion;
- portability snapshot replacement;
- irreversible purge.

Normal moving/renaming should remain low-friction.
