// Summary: Describes derived V3 source ranges without duplicating persistent content; depends on CodeMirror UTF-16 offsets and the shared explicit block-type contract.
import type { V3BlockType, V3DirectiveMetadata } from './v3-contract';

export type V3SourceRange = { from: number; to: number };
export type V3Block = V3SourceRange & {
    id: string;
    type: V3BlockType;
    parentId: string | null;
    order: number;
    headerTo: number;
    bodyFrom: number;
    bodyTo: number;
};
export type V3Column = V3SourceRange & {
    id: string;
    layoutId: string;
    order: number;
    headerTo: number;
    bodyFrom: number;
    bodyTo: number;
};
export type V3Directive = V3SourceRange & {
    blockId: string;
    fence: number;
    headerTo: number;
    bodyFrom: number;
    bodyTo: number;
    metadata: V3DirectiveMetadata;
};
export type V3Diagnostic = V3SourceRange & {
    code: string;
    message: string;
    line: number;
};
export type V3ParsedStructure = {
    offsetUnit: 'utf-16';
    sourceLength: number;
    sourceBytes: number;
    blocks: V3Block[];
    columns: V3Column[];
    directives: V3Directive[];
    diagnostics: V3Diagnostic[];
};
