// Summary: Retains rejected code drafts across widget remounts and guards preview replacement; depends on stable V3 block IDs, authoritative owners and explicit draft recovery controls.
import type { EditorView } from '@codemirror/view';
import { v3ColumnProjectionFor } from '../columns/v3/v3-column-registry';
import { v3StructureField } from '../structure/v3-structure-state';
import type { V3PreparedOperation } from '../transactions/v3-transaction-types';

type CodeDraft = { content: string; language: string };
const drafts = new WeakMap<EditorView, Map<string, CodeDraft>>();

function pendingOwnerDrafts(view: EditorView) {
    const owner = v3ColumnProjectionFor(view)?.owner ?? view;
    return drafts.get(owner);
}

function ensureOwnerDrafts(view: EditorView) {
    const owner = v3ColumnProjectionFor(view)?.owner ?? view;
    let pending = drafts.get(owner);
    if (!pending) drafts.set(owner, (pending = new Map()));
    return pending;
}

export function v3CodeDraftHandle(view: EditorView, position: number) {
    const id = view.state
        .field(v3StructureField, false)
        ?.current.blockAt(position)?.id;
    const pending = ensureOwnerDrafts(view);
    return {
        read: () => (id ? pending.get(id) : undefined),
        write: (draft: CodeDraft) => {
            if (id) pending.set(id, draft);
        },
        clear: () => {
            if (id) pending.delete(id);
        },
    };
}

export function hasV3RichDraft(view: EditorView | null) {
    return Boolean(
        view &&
        (pendingOwnerDrafts(view)?.size ||
            view.dom.querySelector('[data-unsaved-rich-draft="true"]')),
    );
}

export function assertV3DraftRangeWritable(
    view: EditorView,
    prepared: V3PreparedOperation,
) {
    const index = view.state.field(v3StructureField, false)?.current;
    if (!index || !prepared.before) return;
    for (const id of pendingOwnerDrafts(view)?.keys() ?? []) {
        const block = index.blockById(id);
        if (
            block &&
            block.from < prepared.before.to &&
            block.to > prepared.before.from
        )
            throw new Error(
                'Resolve the unsaved code draft, or copy it and discard the draft, before changing this block.',
            );
    }
}

export function guardV3DraftHistory(
    event: KeyboardEvent,
    view: EditorView,
    onNotice: (message: string) => void,
) {
    if (
        !['z', 'y'].includes(event.key.toLowerCase()) ||
        !view.dom.contains(event.target as Node | null) ||
        !hasV3RichDraft(view)
    )
        return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    onNotice(
        'Resolve the unsaved code draft, or copy it and discard the draft, before undo or redo.',
    );
    return true;
}

export function guardV3RichDraft(
    view: EditorView | null,
    onNotice: (message: string) => void,
    action: () => void,
) {
    if (hasV3RichDraft(view)) {
        onNotice(
            'Resolve the unsaved code draft, or copy it and discard the draft, before switching modes, importing or exporting.',
        );
        return;
    }
    action();
}
