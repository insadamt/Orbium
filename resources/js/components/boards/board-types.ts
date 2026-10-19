export const boardBlockKinds = [
    'text',
    'heading',
    'list',
    'quote',
    'callout',
    'code',
    'table',
    'image',
    'file',
    'math',
    'mermaid',
    'divider',
    'resource',
] as const;
export type BoardBlockKind = (typeof boardBlockKinds)[number];
export type BoardTool = 'select' | 'hand' | Exclude<BoardBlockKind, 'resource'>;
export type BoardInline = {
    type: 'text' | 'hardBreak';
    text?: string;
    marks?: {
        type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link';
        attrs?: { href: string };
    }[];
};
export type BoardBlockData = {
    text_scale?: number;
    manual_height?: boolean;
    image_fit?: 'contain' | 'cover';
    image_position?: { x: number; y: number };
    target_node_id?: number;
    content?: BoardInline[];
    level?: number;
    list_style?: 'bullet' | 'ordered' | 'check';
    items?: { content: BoardInline[]; checked: boolean; indent: number }[];
    rows?: BoardInline[][][];
    source?: string;
    language?: string;
    attachment_id?: number | null;
    name?: string;
    caption?: string;
    align?: 'left' | 'center' | 'right';
    dir?: 'auto' | 'ltr' | 'rtl';
    legacy_source?: string;
};
export type BoardObject = {
    id: string;
    block_type: BoardBlockKind;
    content_format_version: 1;
    data: BoardBlockData;
    x: number;
    y: number;
    width: number;
    height: number;
    layer: number;
};
export type BoardBlockReplacement = {
    kind: BoardBlockKind;
    data: BoardBlockData;
};
export type BoardSnapshot = {
    format_version: 4;
    revision: number;
    objects: BoardObject[];
};
export type BoardCamera = { x: number; y: number; zoom: number };
export type BoardPoint = { x: number; y: number };
export type BoardBounds = BoardPoint & { width: number; height: number };
export type BoardLocation = { workspaceId: number; boardId: number };
export const boardLimits = {
    objects: 1000,
    blockBytes: 262144,
    totalBytes: 4194304,
    coordinate: 10_000_000,
    minWidth: 80,
    minHeight: 32,
    maxSize: 4000,
    minZoom: 0.1,
    maxZoom: 4,
};
export const defaultBoardCamera: BoardCamera = { x: 0, y: 0, zoom: 1 };
export function boardStorageKey(location: BoardLocation, suffix: string) {
    return `orbium.board.${location.workspaceId}.${location.boardId}.${suffix}`;
}
