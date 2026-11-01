// Summary: Provides scoped ID and binary range lookups over derived V3 structure; depends on validated parser ranges, never on surrounding Markdown node types.
import type {
    V3Block,
    V3Column,
    V3ParsedStructure,
    V3SourceRange,
} from './v3-structure-types';

function containingRange<T extends V3SourceRange>(
    ranges: readonly T[],
    position: number,
): T | null {
    let low = 0;
    let high = ranges.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (ranges[middle].from <= position) low = middle + 1;
        else high = middle;
    }
    const range = ranges[low - 1];
    return range && position < range.to ? range : null;
}

export class V3DocumentIndex {
    readonly valid: boolean;
    private readonly blocksById = new Map<string, V3Block>();
    private readonly columnsById = new Map<string, V3Column>();
    private readonly siblings = new Map<string | null, V3Block[]>();

    constructor(readonly structure: V3ParsedStructure) {
        this.valid = structure.diagnostics.length === 0;
        //
        // Invalid source remains inspectable, but must never yield a seemingly safe edit target.
        //
        if (!this.valid) return;
        for (const block of structure.blocks) {
            this.blocksById.set(block.id, block);
            const siblings = this.siblings.get(block.parentId) ?? [];
            siblings.push(block);
            this.siblings.set(block.parentId, siblings);
        }
        for (const column of structure.columns)
            this.columnsById.set(column.id, column);
    }

    blockById(id: string): V3Block | null {
        return this.blocksById.get(id) ?? null;
    }

    columnById(id: string): V3Column | null {
        return this.columnsById.get(id) ?? null;
    }

    blocksIn(parentId: string | null): readonly V3Block[] {
        return this.siblings.get(parentId) ?? [];
    }

    blockAt(position: number): V3Block | null {
        if (
            !this.valid ||
            position < 0 ||
            position > this.structure.sourceLength
        )
            return null;
        const column = containingRange(this.structure.columns, position);
        const parentId = column?.id ?? null;
        const siblings = this.blocksIn(parentId);
        const block = containingRange(siblings, position);
        if (block) return block;
        const final = siblings.at(-1);
        if (position === this.structure.sourceLength && final?.to === position)
            return final;
        return column ? this.blockById(column.layoutId) : null;
    }

    neighbor(id: string, direction: -1 | 1): V3Block | null {
        const block = this.blockById(id);
        return block
            ? (this.blocksIn(block.parentId)[block.order + direction] ?? null)
            : null;
    }
}
