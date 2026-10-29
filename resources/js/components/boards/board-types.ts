// Summary: Defines native Board records, shape appearance and envelope contracts shared by rendering, interaction and persistence.

import type { InlineIconAttributes } from '@/components/inline-icons/inline-icon-data';
import type { MindMapData } from '@/components/mindmap/mindmap-data';
import type { AttachmentMediaKind } from '@/components/media/attachment-media';

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
    'drawing',
    'mindmap',
    'shape',
] as const;
export type BoardBlockKind = (typeof boardBlockKinds)[number];
export type BoardPlacementKind =
    | Exclude<BoardBlockKind, 'resource' | 'drawing' | 'shape'>
    | BoardShapeKind
    | AttachmentMediaKind;
export type BoardDrawingTool = 'pen' | 'path' | 'highlighter' | 'eraser';
export type BoardTool =
    | 'select'
    | 'hand'
    | BoardPlacementKind
    | BoardDrawingTool;
export type BoardShapeKind =
    | 'circle'
    | 'rectangle'
    | 'rounded_rectangle'
    | 'ellipse'
    | 'diamond'
    | 'triangle'
    | 'hexagon';
export type BoardShape = {
    kind: BoardShapeKind;
    fill: string;
    stroke: string;
    stroke_width: number;
    stroke_style: 'solid' | 'dashed';
    corner_radius?: number;
};
export type BoardDrawing = {
    points: [number, number][];
    breaks?: number[];
    view_width: number;
    view_height: number;
    color: string;
    stroke_width: number;
    opacity: number;
};
export type BoardInline = {
    type: 'text' | 'hardBreak' | 'inlineIcon';
    attrs?: InlineIconAttributes;
    text?: string;
    marks?: {
        type:
            | 'bold'
            | 'italic'
            | 'underline'
            | 'strike'
            | 'code'
            | 'link'
            | 'textColor';
        attrs?: { href?: string; color?: string };
    }[];
};
export type BoardBlockData = {
    shape?: BoardShape;
    mindmap?: MindMapData;
    drawing?: BoardDrawing;
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
    table_source?: string;
    source?: string;
    language?: string;
    attachment_id?: number | null;
    media_kind?: AttachmentMediaKind;
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
    format_version: 9;
    mutation_version?: 1;
    revision: number;
    objects: BoardObject[];
};
export type BoardCamera = { x: number; y: number; zoom: number };
export type BoardPoint = { x: number; y: number };
export type BoardBounds = BoardPoint & { width: number; height: number };
export type BoardLocation = { workspaceId: number; boardId: number };
export const boardLimits = {
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
