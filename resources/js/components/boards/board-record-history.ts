import type { BoardObject } from './board-types';

export type BoardRecordChange = {
    id: string;
    before?: BoardObject;
    after?: BoardObject;
};
export type BoardHistoryEntry = {
    changes: Map<string, BoardRecordChange>;
    beforeOrder: string[];
    afterOrder: string[];
};

export class BoardRecordHistory {
    private past: BoardHistoryEntry[] = [];
    private future: BoardHistoryEntry[] = [];
    private group: string | null = null;
    private changedAt = 0;

    get state() {
        return (this.past.length ? 1 : 0) | (this.future.length ? 2 : 0);
    }

    record(entry: BoardHistoryEntry, group: string | null) {
        const now = performance.now();
        const previous = this.past.at(-1);
        if (
            previous &&
            group &&
            this.group === group &&
            now - this.changedAt <= 700
        ) {
            for (const [id, change] of entry.changes) {
                const original = previous.changes.get(id);
                previous.changes.set(id, {
                    ...change,
                    before: original ? original.before : change.before,
                });
            }
            previous.afterOrder = entry.afterOrder;
        } else {
            this.past = [...this.past.slice(-39), entry];
        }
        this.future = [];
        this.group = group;
        this.changedAt = now;
    }

    undo() {
        const entry = this.past.pop();
        if (entry) this.future.push(entry);
        this.breakGroup();
        return entry;
    }

    redo() {
        const entry = this.future.pop();
        if (entry) this.past.push(entry);
        this.breakGroup();
        return entry;
    }

    breakGroup() {
        this.group = null;
    }

    clear() {
        this.past = [];
        this.future = [];
        this.breakGroup();
    }
}
