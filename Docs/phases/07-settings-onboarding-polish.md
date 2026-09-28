# Phase 7 — Settings, onboarding and product polish

## Goal

Complete the normal self-hosted product experience around the already-working core.

## Read first

- `docs/00-product-spec.md`
- `docs/05-ui-ux-system.md`
- `docs/11-security-self-hosting.md`

## Tasks

### 7.1 Settings shell

Sections:

- Appearance
- Workspace
- Editor
- Search
- Storage
- Portability
- Account

**Commit:** `feat(settings): add settings workspace`

### 7.2 Appearance/motion/3D settings

- Light/Dark/System
- Reduce Motion
- 3D Quality

**Commit:** `feat(settings): add appearance and motion preferences`

### 7.3 Editor preferences

- font size
- content width
- line height
- block handles
- code line numbers
- spellcheck

**Commit:** `feat(settings): add editor preferences`

### 7.4 Storage information

Show understandable usage categories where practical:

- document metadata estimate;
- images;
- attachments;
- total stored files.

Do not implement an object-storage provider UI not supported in v0.1.0.

**Commit:** `feat(settings): add storage information`

### 7.5 Onboarding

Maximum roughly three conceptual screens:

1. identity
2. Explore / Work / Jump
3. Create workspace or restore archive

**Commit:** `feat(onboarding): add Orbium introduction flow`

### 7.6 Contextual first-use hints

Examples:

- double-click/enter node to open;
- `/` for blocks;
- `Ctrl + Space` anywhere.

Hints should be dismissible/one-time.

**Commit:** `feat(onboarding): add contextual guidance`

### 7.7 Empty/error/server states

Polish:

- empty workspace/folder/database;
- no search results;
- save failure;
- server unavailable;
- storage error;
- invalid archive.

**Commit:** `feat(ui): refine empty and failure states`

### 7.8 Keyboard/accessibility pass

Audit all major surfaces.

**Commit:** `fix(a11y): complete keyboard and focus pass`

### 7.9 Performance pass

Profile:

- editor;
- search;
- large Table;
- large direct-child Orbit;
- initial load.

Fix measured bottlenecks without new infrastructure unless approved.

**Commit:** `perf(app): optimize core interaction paths`

## Expected result

Orbium feels like one coherent product rather than separate implemented features.

## Automated gate

- settings persistence;
- onboarding paths;
- restore onboarding path;
- reduced motion;
- keyboard tests;
- accessibility checks available in toolchain;
- full suite.

## Manual validation

1. Fresh user completes onboarding by creating workspace.
2. Fresh user completes onboarding by restoring archive.
3. Change each setting and reload.
4. Test reduced motion across Search/Orbit.
5. Test editor preference changes.
6. Test empty workspace/folder/database/search.
7. Simulate save/server failure.
   - Expected: precise, recoverable message.
8. Navigate primary product using keyboard as much as practical.
9. Test dark/light.
10. Review visual consistency of every major surface.

## Stop

Produce report and wait.
