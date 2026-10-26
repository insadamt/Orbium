import type { EditorView } from '@codemirror/view';
import type { MermaidPreviewSession } from '../../mermaid-preview-session';
import type { MarkdownUploadRequest } from '../markdown-slash-commands';
import type { OrbiumMetadata } from '../dialect/metadata';
import type { ContentOwnerKind } from '../../editor-api';

export type RichCell = {
    from: number;
    to: number;
    source: string;
    metadata: OrbiumMetadata;
};
export type RichTable = {
    rows: RichCell[][];
    alignments: string[];
    rich: boolean;
};
export type RichKind =
    | 'mindmap'
    | 'code'
    | 'mermaid'
    | 'math'
    | 'inline-math'
    | 'image'
    | 'file'
    | 'table'
    | 'callout'
    | 'metadata'
    | 'empty';
export type RichBlock = {
    kind: RichKind;
    from: number;
    to: number;
    source: string;
    content: string;
    contentFrom: number;
    contentTo: number;
    metadata: OrbiumMetadata;
    presentation: OrbiumMetadata;
    wrappers?: OrbiumMetadata[];
    language?: string;
    languageInfo?: string;
    attachmentId?: string;
    missingReference?: 'image' | 'file';
    label?: string;
    labelSource?: string;
    table?: RichTable;
    diagnostic?: string;
};
export type AttachmentMetadata = {
    id: number;
    name: string;
    mime_type: string;
    size_bytes: number;
    purpose: string;
};
export type RichContext = {
    ownerKind?: ContentOwnerKind;
    workspaceId: number;
    nodeId: number;
    mermaid: MermaidPreviewSession;
    metadata: Map<string, AttachmentMetadata>;
    diagramWidth?: number;
    documentSourceRanges?: boolean;
    mathPreviewScope?: object;
    schedulePreview?: (element: HTMLElement, render: () => void) => () => void;
    isVisible: () => boolean;
    onUpload: (request: MarkdownUploadRequest) => void;
};
export type RichController = {
    update: (block: RichBlock) => boolean;
    destroy: () => void;
};
export type RichWidgetMount = {
    onHistory?: (direction: 'undo' | 'redo') => void;
    view: EditorView;
    block: RichBlock;
    context: RichContext;
    root: HTMLElement;
};
