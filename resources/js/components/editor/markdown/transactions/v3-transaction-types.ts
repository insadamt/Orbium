// Summary: Defines explicit owner-operation DTOs and immutable prepared transactions; depends on CodeMirror state, the V3 index and persistent identity rules.
import { Annotation } from '@codemirror/state';
import type {
    ChangeSpec,
    EditorState,
    Text,
    Transaction,
} from '@codemirror/state';
import type { V3BlockType } from '../structure/v3-contract';
import type { V3Block, V3SourceRange } from '../structure/v3-structure-types';
import type { V3DocumentIndex } from '../structure/v3-document-index';

export const v3OwnerOperation = Annotation.define<boolean>();

export type V3InsertionTarget = { parentId: string | null; beforeId?: string };
export type V3BlockOperation = V3OperationDetails & { motion?: 'none' };
type V3OperationDetails =
    | { kind: 'insert-source'; target: V3InsertionTarget; source: string }
    | {
          kind: 'create-columns';
          target: V3InsertionTarget;
          count: 2 | 3;
          replaceBlockId?: string;
      }
    | {
          kind: 'wrap-columns';
          blockIds: readonly string[];
          besideId: string;
          side: 'left' | 'right';
      }
    | {
          kind: 'add-column';
          layoutId: string;
          side?: 'left' | 'right';
          blockIds?: readonly string[];
      }
    | { kind: 'resize-columns'; layoutId: string; widths: readonly number[] }
    | { kind: 'stack-columns'; layoutId: string }
    | {
          kind: 'edit-column';
          columnId: string;
          ownerSource: Text;
          edits: readonly { from: number; to: number; insert: string }[];
          selection: { anchor: number; head: number };
          userEvent: string;
      }
    | {
          kind: 'edit-text';
          blockId: string;
          from: number;
          to: number;
          insert: string;
      }
    | { kind: 'exit-text'; blockId: string; from: number; to: number }
    | { kind: 'advance-empty'; blockId: string }
    | {
          kind: 'paste';
          blockId: string;
          from: number;
          to: number;
          source: string;
      }
    | { kind: 'paste-blocks'; blockIds: readonly string[]; source: string }
    | { kind: 'paste-at'; target: V3InsertionTarget; source: string }
    | {
          kind: 'insert';
          target: V3InsertionTarget;
          type: V3BlockType;
          body: string;
          caret?: number;
      }
    | {
          kind: 'replace-body';
          blockId: string;
          body: string;
          caret?: number;
          userEvent?: string;
          focus?: 'end';
      }
    | {
          kind: 'replace-block';
          blockId: string;
          type: V3BlockType;
          body: string;
          caret?: number;
      }
    | {
          kind: 'convert';
          blockId: string;
          type: V3BlockType;
          focus?: 'start' | 'end';
      }
    | { kind: 'split'; blockId: string; offset: number }
    | { kind: 'merge'; earlierId: string; laterId: string }
    | { kind: 'delete'; blockIds: readonly string[]; ensureParagraph?: boolean }
    | { kind: 'duplicate'; blockIds: readonly string[] }
    | { kind: 'move'; blockIds: readonly string[]; target: V3InsertionTarget };

export class V3OperationError extends Error {
    constructor(
        readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = 'V3OperationError';
    }
}

export type V3OperationContext = {
    state: EditorState;
    index: V3DocumentIndex;
    allocateIdentity: () => string;
};
export type V3IdentityExpectation = {
    type: V3BlockType;
    parentId: string | null;
};
export type V3OperationDraft = {
    changes: ChangeSpec[];
    affectedIds: Set<string>;
    createdBlocks: Map<string, V3IdentityExpectation>;
    createdColumns: Map<string, string>;
    removedBlocks: Set<string>;
    removedColumns: Set<string>;
    convertedTypes: Map<string, V3BlockType>;
    changedParents: Map<string, string | null>;
    changedColumnHeaders: Map<string, string>;
    newlinePaddingIds: Set<string>;
    focus: {
        blockId: string;
        bodyOffset: number | 'end';
        sourceOffset?: number;
        includeTrailing?: boolean;
    } | null;
    columnSelection?: { columnId: string; anchor: number; head: number };
    before?: V3SourceRange;
    afterIds: string[];
    movedRange?: V3SourceRange;
    copiedIds: Map<string, string>;
};
export type V3PreparedOperation = {
    animate: boolean;
    owner: object;
    startState: EditorState;
    source: Text;
    operation: V3BlockOperation['kind'];
    transaction: Transaction;
    before?: V3SourceRange;
    after?: V3SourceRange;
    move?: V3SourceRange & { destination: number };
    copiedIds: ReadonlyMap<string, string>;
    createdIds: readonly string[];
    removedIds: readonly string[];
    compositionColumnId?: string;
    compositionBodyBlockId?: string;
};

export function requireV3Block(
    context: V3OperationContext,
    id: string,
): V3Block {
    const block = context.index.blockById(id);
    if (!block)
        throw new V3OperationError(
            'missing-block',
            `Block ${id} is unavailable in this owner.`,
        );
    return block;
}

export function createV3OperationDraft(): V3OperationDraft {
    return {
        changes: [],
        affectedIds: new Set(),
        createdBlocks: new Map(),
        createdColumns: new Map(),
        removedBlocks: new Set(),
        removedColumns: new Set(),
        convertedTypes: new Map(),
        changedParents: new Map(),
        changedColumnHeaders: new Map(),
        newlinePaddingIds: new Set(),
        focus: null,
        afterIds: [],
        copiedIds: new Map(),
    };
}
