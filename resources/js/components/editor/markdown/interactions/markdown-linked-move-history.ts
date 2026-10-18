import {
    invertedEffects,
    undo,
    redo,
    undoDepth,
    redoDepth,
} from '@codemirror/commands';
import { StateEffect, StateField, type Text } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { MarkdownBlockRange } from './markdown-block-actions';
import type { RichTransferPreviews } from '../rich/rich-transfer-previews';

type Direction = 'undo' | 'redo';
type Phase = 'done' | 'undone';
const linkedMoveEffect = StateEffect.define<{ id: string; phase: Phase }>();
const movePhases = StateField.define<Map<string, Phase>>({
    create: () => new Map(),
    update(previous, transaction) {
        const effects = transaction.effects.filter((effect) =>
            effect.is(linkedMoveEffect),
        );
        if (!effects.length && !transaction.docChanged) return previous;
        const next = new Map(previous);
        if (
            transaction.docChanged &&
            !transaction.isUserEvent('undo') &&
            !transaction.isUserEvent('redo')
        )
            for (const [id, phase] of next)
                if (phase === 'undone') next.delete(id);
        for (const effect of effects)
            next.set(effect.value.id, effect.value.phase);
        return next;
    },
});

type Snapshot = { doc: Text; undoDepth: number; redoDepth: number };
type Endpoint = {
    id: string;
    view: EditorView;
    collect: (range: MarkdownBlockRange) => RichTransferPreviews;
    prepare: (
        previews: RichTransferPreviews,
        range: MarkdownBlockRange,
    ) => () => void;
    notice: (message: string) => void;
    available: () => boolean;
    snapshot: () => Snapshot;
    phase: (id: string) => Phase | undefined;
    applyHistory: (direction: Direction) => boolean;
};
type Move = {
    id: string;
    phase: Phase;
    sourceId: string;
    targetId: string;
    sourceRange: MarkdownBlockRange;
    targetRange: MarkdownBlockRange;
    source: Snapshot;
    target: Snapshot;
};
type Registry = {
    endpoints: Map<string, Endpoint>;
    moves: Move[];
    lastEndpointId?: string;
};
type HistoryHost = Window & { orbiumLinkedBlockHistory?: Registry };

function registry(view: EditorView): Registry {
    const host = (view.dom.ownerDocument.defaultView?.top ??
        window) as HistoryHost;
    return (host.orbiumLinkedBlockHistory ??= {
        endpoints: new Map(),
        moves: [],
    });
}

function snapshot(view: EditorView): Snapshot {
    return {
        doc: view.state.doc,
        undoDepth: undoDepth(view.state),
        redoDepth: redoDepth(view.state),
    };
}

function matches(endpoint: Endpoint, expected: Snapshot, direction: Direction) {
    const current = endpoint.snapshot();
    const depth = direction === 'undo' ? current.undoDepth : current.redoDepth;
    return (
        depth > 0 &&
        depth === expected[direction === 'undo' ? 'undoDepth' : 'redoDepth'] &&
        endpoint.view.state.doc.eq(expected.doc)
    );
}

export function linkedMarkdownMoveEffect(id?: string) {
    return id ? linkedMoveEffect.of({ id, phase: 'done' }) : [];
}

export function performLinkedMarkdownMove(options: {
    source: EditorView;
    target: EditorView;
    block: MarkdownBlockRange;
    perform: (id: string) => MarkdownBlockRange;
}) {
    const state = registry(options.source);
    const endpoints = [...state.endpoints.values()];
    const source = endpoints.find(
        (endpoint) => endpoint.view === options.source,
    );
    const target = endpoints.find(
        (endpoint) => endpoint.view === options.target,
    );
    if (!source || !target)
        throw new Error('Both pages must be open to move a block.');
    const id = crypto.randomUUID();
    const targetRange = options.perform(id);
    state.lastEndpointId = source.id;
    state.moves.push({
        id,
        phase: 'done',
        sourceId: source.id,
        targetId: target.id,
        sourceRange: options.block,
        targetRange,
        source: source.snapshot(),
        target: target.snapshot(),
    });
}

function handleLinkedHistory(endpoint: Endpoint, direction: Direction) {
    const state = registry(endpoint.view);
    const phase = direction === 'undo' ? 'done' : 'undone';
    const move = [...state.moves].reverse().find((candidate) => {
        if (candidate.phase !== phase || endpoint.phase(candidate.id) !== phase)
            return false;
        if (candidate.sourceId === endpoint.id)
            return matches(endpoint, candidate.source, direction);
        if (candidate.targetId === endpoint.id)
            return matches(endpoint, candidate.target, direction);
        return false;
    });
    if (!move) return false;
    const source = state.endpoints.get(move.sourceId);
    const target = state.endpoints.get(move.targetId);
    if (!source || !target || !source.available() || !target.available()) {
        endpoint.notice(
            'Keep both pages open and editable to undo or redo this move.',
        );
        return true;
    }
    if (
        source.phase(move.id) !== phase ||
        target.phase(move.id) !== phase ||
        !matches(source, move.source, direction) ||
        !matches(target, move.target, direction)
    ) {
        endpoint.notice(
            'Undo the newer edits in the other page before reversing this block move.',
        );
        return true;
    }
    const restoring = direction === 'undo' ? source : target;
    const removing = direction === 'undo' ? target : source;
    const range = direction === 'undo' ? move.targetRange : move.sourceRange;
    const restoredRange =
        direction === 'undo' ? move.sourceRange : move.targetRange;
    const release = restoring.prepare(removing.collect(range), restoredRange);
    try {
        // Restore first so the loaded viewer is claimed before its former widget is removed.

        restoring.applyHistory(direction);
        removing.applyHistory(direction);
        move.phase = direction === 'undo' ? 'undone' : 'done';
        move.source = source.snapshot();
        move.target = target.snapshot();
        endpoint.notice('');
    } finally {
        queueMicrotask(release);
    }
    return true;
}

export function registerLinkedMarkdownHistory(
    options: Omit<Endpoint, 'id' | 'snapshot' | 'phase' | 'applyHistory'>,
) {
    const endpoint: Endpoint = {
        ...options,
        id: crypto.randomUUID(),
        snapshot: () => snapshot(options.view),
        phase: (id) => options.view.state.field(movePhases).get(id),
        applyHistory: (direction) =>
            (direction === 'undo' ? undo : redo)(options.view),
    };
    const { view } = endpoint;
    view.dispatch({
        effects: StateEffect.appendConfig.of([
            movePhases,
            invertedEffects.of((transaction) =>
                transaction.effects.flatMap((effect) =>
                    effect.is(linkedMoveEffect)
                        ? [
                              linkedMoveEffect.of({
                                  id: effect.value.id,
                                  phase:
                                      effect.value.phase === 'done'
                                          ? 'undone'
                                          : 'done',
                              }),
                          ]
                        : [],
                ),
            ),
        ]),
    });
    const state = registry(view);
    state.endpoints.set(endpoint.id, endpoint);
    const eventDocuments = new Set([
        view.dom.ownerDocument,
        view.dom.ownerDocument.defaultView?.top?.document ??
            view.dom.ownerDocument,
    ]);
    const keydown = (event: KeyboardEvent) => {
        const target = event.target as Node | null;
        const fromEditor = target !== null && view.dom.contains(target);
        const fromBody =
            [...eventDocuments].some(
                (document) =>
                    target === document.body ||
                    target === document.documentElement,
            ) && state.lastEndpointId === endpoint.id;
        if (!fromEditor && !fromBody) return;
        if (
            !(event.ctrlKey || event.metaKey) ||
            event.altKey ||
            event.isComposing
        )
            return;
        const key = event.key.toLowerCase();
        if (key !== 'z' && key !== 'y') return;
        const direction = key === 'y' || event.shiftKey ? 'redo' : 'undo';
        if (!handleLinkedHistory(endpoint, direction)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    };
    const markInteracted = () => {
        state.lastEndpointId = endpoint.id;
    };
    view.dom.addEventListener('pointerdown', markInteracted, true);
    for (const document of eventDocuments)
        document.addEventListener('keydown', keydown, true);
    return () => {
        view.dom.removeEventListener('pointerdown', markInteracted, true);
        for (const document of eventDocuments)
            document.removeEventListener('keydown', keydown, true);
        state.endpoints.delete(endpoint.id);
        state.moves = state.moves.filter(
            (move) =>
                state.endpoints.has(move.sourceId) ||
                state.endpoints.has(move.targetId),
        );
    };
}
