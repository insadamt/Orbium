import type { EditorView } from '@codemirror/view';
import type { MermaidPreviewSession } from '../../mermaid-preview-session';
import type { MarkdownUploadRequest } from '../markdown-slash-commands';
import type { OrbiumMetadata } from '../dialect/metadata';

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
    workspaceId: number;
    nodeId: number;
    mermaid: MermaidPreviewSession;
    metadata: Map<string, AttachmentMetadata>;
    diagramWidth?: number;
    isVisible: () => boolean;
    onUpload: (request: MarkdownUploadRequest) => void;
};
export type RichController = {
    update: (block: RichBlock) => boolean;
    destroy: () => void;
};
export type RichWidgetMount = {
    view: EditorView;
    block: RichBlock;
    context: RichContext;
    root: HTMLElement;
};
