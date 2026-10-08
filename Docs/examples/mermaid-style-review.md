# Mermaid style and contrast review

Import this into an empty Markdown document. Review each diagram in Light and Dark mode, inline and in Full preview. Labels should be readable on their actual node/region backgrounds; shapes and symbols remain specific to their diagram type.

## Flowchart: labels, groups and edges

```mermaid
flowchart LR
    subgraph Workspace
        A[Draft] -->|Review| B{Approved?}
        B -->|Yes| C[Publish]
        B -->|No| A
    end
```

## Sequence: notes, loops and sequence numbers

```mermaid
sequenceDiagram
    autonumber
    participant Writer
    participant Orbium
    Writer->>Orbium: Open document
    Note over Writer,Orbium: Keep source intact
    loop Each edit
        Writer->>Orbium: Save
        Orbium-->>Writer: Saved
    end
```

## Class: titles, members and relationships

```mermaid
classDiagram
    class Document {
        +String title
        +save()
    }
    class Workspace {
        +String name
    }
    Workspace --> Document : contains
```

## ER: entity titles, attribute rows and labels

```mermaid
erDiagram
    WORKSPACE ||--o{ DOCUMENT : contains
    WORKSPACE {
        int id PK
        string name
    }
    DOCUMENT {
        int id PK
        string title
        int workspace_id FK
    }
```

## State: composite regions and transitions

```mermaid
stateDiagram-v2
    [*] --> Draft
    state Review {
        [*] --> Reading
        Reading --> Approved
    }
    Draft --> Review : Submit
    Review --> Published
    Published --> [*]
```

## Pie: percentages, title and legend

```mermaid
pie title Document status
    "Draft" : 12
    "Review" : 8
    "Published" : 20
    "Archived" : 6
```

## XY chart: axis labels, title and bars

```mermaid
xychart-beta
    title "Documents per month"
    x-axis [Jan, Feb, Mar]
    y-axis "Documents" 0 --> 10
    bar [3, 5, 8]
```

## Gantt: section shading and task labels

```mermaid
gantt
    title Publishing schedule
    dateFormat YYYY-MM-DD
    section Writing
        Draft :done, draft, 2026-10-01, 3d
        Review :active, review, after draft, 2d
    section Publishing
        Publish :crit, publish, after review, 1d
```

## Timeline: section and event labels

```mermaid
timeline
    title Document lifecycle
    section Preparation
        Draft : Write content
        Review : Collect feedback
    section Release
        Publish : Share the document
```

## Journey: task and actor labels

```mermaid
journey
    title Review a document
    section Writing
        Draft: 5: Writer
        Submit: 4: Writer
    section Review
        Read: 4: Reviewer
        Approve: 5: Reviewer
```

## Git graph: branch, tag and commit labels

```mermaid
gitGraph
    commit id: "Draft"
    branch review
    checkout review
    commit id: "Feedback"
    checkout main
    merge review tag: "Published"
```

## Mindmap: root and branch labels

```mermaid
mindmap
    root((Workspace))
        Documents
            Drafts
            Published
        Databases
        Folders
```

## Quadrant: regions, axis labels and points

```mermaid
quadrantChart
    title Document priorities
    x-axis Low effort --> High effort
    y-axis Low value --> High value
    quadrant-1 Plan
    quadrant-2 Do first
    quadrant-3 Defer
    quadrant-4 Reconsider
    Draft: [0.25, 0.75]
    Archive: [0.75, 0.25]
```

## Requirement: titles, fields and relationships

```mermaid
requirementDiagram
    requirement saved_content {
        id: 1
        text: Preserve document source
        risk: low
        verifymethod: inspection
    }
    element editor {
        type: application
    }
    editor - satisfies -> saved_content
```

## Block: node labels and links

```mermaid
block-beta
    columns 3
    A["Draft"] B["Review"] C["Publish"]
    A --> B
    B --> C
```

## Architecture: groups, services and edges

```mermaid
architecture-beta
    group workspace(cloud)[Workspace]
    service editor(server)[Editor] in workspace
    service storage(database)[Documents] in workspace
    editor:R --> L:storage
```

## Packet: numeric markers and field labels

```mermaid
packet-beta
    0-7: "Header"
    8-15: "Version"
    16-31: "Content length"
```

## Sankey: labels and flow bands

```mermaid
sankey-beta

Draft,Review,12
Review,Published,8
Review,Changes,4
```

## C4: people, systems and relationship text

```mermaid
C4Context
    title Orbium context
    Person(writer, "Writer", "Creates documents")
    System(orbium, "Orbium", "Knowledge workspace")
    Rel(writer, orbium, "Writes and reviews")
```
