# Database specification

The database page uses the shared floating top controls. Its title, view controls, table/gallery, and contextual settings sit inside one spacious floating island. Back remains in the top controls. Search expands there into a title filter for the current database documents. The last selected Table or Gallery view is remembered per database across tabs and reloads in the current browser.


## Concept

A database is a structured container of documents.

```text
Database
├── schema
├── view settings
└── Documents
    ├── structured property values
    └── free-form body
```

Views never own data.

Table, Gallery, filters, and sorts share a derived in-memory index of the current server-supplied values by document/property ID. Partial value reloads rebuild this index. Title search filters the existing sorted result without repeating property filtering and sorting for each keypress. All matching rows are still rendered; virtualization is not implemented.

## Built-in title

Every child document's Node title is the database title column.

It cannot be removed as a schema property.

## Initial property types

### Text

Plain textual value.

### Number

Numeric value with optional formatting config.

### Select

One option from configured options.

### Multi-select

Multiple configured options.

### Checkbox

Boolean.

### Date

Date, with future date-time/range extensions deferred unless trivial.

### URL

Validated/normalized URL string.

### Email

Validated email string.

### Files

One or more attachment references.

### Mention

One or more Node references according to the property's configuration.

Mention is contextual reference, not hierarchy relation.

## Property schema UX

At the end of Table headers, `+` creates a property.

Property controls:

- name;
- type;
- type-specific config;
- optional default;
- reorder;
- duplicate if useful;
- delete with confirmation when values exist.

There is no `required` feature in v0.1.0.

There are no database templates in v0.1.0.

## Table view

Primary structured editing surface.

Requirements:

- first column = document title;
- inline property editing;
- property header menus;
- resize columns;
- reorder properties;
- hide/show properties;
- filters;
- multi-sort;
- create document row;
- clicking title opens document.

Each row's options menu includes **Move to Trash** with confirmation. After confirmation, the document disappears from the database while the current view, search, filters, and scroll position are preserved. Documents retain their body and structured values and can be restored from the workspace Trash.

Header menu may contain:

- edit property;
- sort ascending/descending;
- filter by;
- hide;
- duplicate;
- delete.

## Gallery view

Gallery appearance offers natural masonry using each document's saved cover ratio, or uniform cards with a selected ratio and whole-image or fill-crop fit. Appearance changes previews only and is saved in the database Gallery view configuration. Existing Gallery views keep their uniform cropped presentation; newly created databases default to natural masonry. Documents retain their saved cover and ratio when moved to another database.

Card-based browse surface.

Configurable:

```text
Preview
- cover
- body/content preview
- none

Visible properties
- selected subset
```

Click card opens document.

Each card has a separate **Move to Trash** button using the same confirmation and recoverable deletion behavior as Table. Using this button does not open the document.

Keep visual treatment restrained; do not turn Gallery into a decorative image feed.

## Orbit view

The database node becomes the central orb.

Its direct document children occupy orbit positions.

No mention edges.

Document nodes may show at most a small amount of structured information, for example:

```text
Orbium
Active · High
```

Use semantic color only for property status indicators; keep the actual node material monochrome.

Orbit filters/sorts operate on the same documents as Table/Gallery.

## Filters

v0.1.0 needs simple filters.

Example:

```text
Status is Active
AND
Priority is High
```

Complex nested boolean expression builders are deferred.

Filter semantics must be shared between views where possible.

## Sorting

Support multiple ordered sort clauses.

Example:

```text
1. Priority ascending
2. Deadline descending
```

## Per-view settings

Table config:

- property visibility/order;
- widths;
- filters;
- sorts.

Gallery config:

- preview;
- visible properties;
- filters;
- sorts.

Orbit config:

- displayed property labels;
- filters;
- sorts;
- safe visual spacing options if needed.

## Creating database documents

All three views create the same document type.

New document:

- parent = database node;
- title starts empty/placeholder;
- configured property defaults may be applied;
- free-form body exists immediately.

## Integrity

On every property write:

- document must be child of target database;
- property must belong to target database;
- value must match the type schema;
- attachment/mention values must reference authorized nodes/files.

Deleting a property deletes or safely cascades its associated values.
