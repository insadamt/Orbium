import { isolateHistory } from '@codemirror/commands';
import {
    EditorSelection,
    type EditorState,
    type ChangeSpec,
} from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
    selectedMarkdownBlocks,
    type FormattingRun,
    type TextMarks,
} from './markdown-formatting-runs';
import {
    serializeFormattingRuns,
    type SerializedFormatting,
} from './markdown-formatting-serialize';

export type ToggleTextMark =
    | 'bold'
    | 'italic'
    | 'strike'
    | 'code'
    | 'underline';
export type TextFormattingChange =
    | { kind: 'toggle'; mark: ToggleTextMark }
    | { kind: 'color'; color: string | null }
    | { kind: 'link'; href: string | null };

export type MarkdownFormattingOptions = {
    focusEditor?: boolean;
};

type PreparedBlock = {
    from: number;
    to: number;
    serialized: SerializedFormatting;
};

export function applyMarkdownSelectionFormatting(
    view: EditorView,
    change: TextFormattingChange,
    selection: EditorSelection = view.state.selection,
    options: MarkdownFormattingOptions = {},
) {
    if (view.compositionStarted || !view.state.facet(EditorView.editable))
        return;
    const blocks = selectedMarkdownBlocks(view.state, selection);
    const selectedRuns = blocks.flatMap((block) =>
        block.runs.filter((run) => run.selected),
    );
    if (!selectedRuns.length) return;
    const removeMark =
        change.kind === 'toggle' &&
        selectedRuns.every((run) => run.marks[change.mark]);
    const requestedPositions = selection.ranges.flatMap((range) => [
        range.anchor,
        range.head,
    ]);
    const prepared: PreparedBlock[] = [];
    for (const block of blocks) {
        let changed = false;
        const runs = block.runs.map((run) => {
            if (
                !run.selected ||
                (run.icon && change.kind === 'toggle' && change.mark === 'code')
            )
                return run;
            const marks = applyTextMarks(
                run.marks,
                change,
                Boolean(removeMark),
            );
            if (!sameTextMarks(run.marks, marks)) changed = true;
            return { ...run, marks };
        });
        if (!changed) continue;
        const serialized = serializeFormattingRuns(runs, requestedPositions);
        if (serialized.source !== view.state.sliceDoc(block.from, block.to))
            prepared.push({ from: block.from, to: block.to, serialized });
    }
    if (!prepared.length) return;
    const changes = view.state.changes(
        prepared.map((block): ChangeSpec => ({
            from: block.from,
            to: block.to,
            insert: block.serialized.source,
        })),
    );
    function mapPosition(position: number, association: number) {
        const block = prepared.find(
            (candidate) =>
                candidate.from <= position && candidate.to >= position,
        );
        if (!block) return changes.mapPos(position, association);
        let mapped = block.serialized.positions.get(position);
        if (mapped === undefined) {
            const boundaries = [...block.serialized.positions.keys()].sort(
                (a, b) => a - b,
            );
            const nearest =
                association > 0
                    ? boundaries.find((boundary) => boundary >= position)
                    : boundaries.findLast((boundary) => boundary <= position);
            mapped =
                nearest === undefined
                    ? association > 0
                        ? block.serialized.source.length
                        : 0
                    : block.serialized.positions.get(nearest)!;
        }
        return changes.mapPos(block.from, -1) + mapped;
    }
    const ranges = selection.ranges.map((range) => {
        const forward = range.anchor <= range.head;
        return EditorSelection.range(
            mapPosition(range.anchor, forward ? 1 : -1),
            mapPosition(range.head, forward ? -1 : 1),
        );
    });
    view.dispatch({
        changes,
        selection: EditorSelection.create(ranges, selection.mainIndex),
        annotations: isolateHistory.of('full'),
        userEvent: 'input.format',
    });
    if (options.focusEditor !== false) view.focus();
}

function applyTextMarks(
    previous: TextMarks,
    change: TextFormattingChange,
    removeMark: boolean,
): TextMarks {
    const marks = { ...previous };
    if (change.kind === 'toggle') {
        if (removeMark) delete marks[change.mark];
        else marks[change.mark] = true;
    } else if (change.kind === 'color') {
        if (change.color) marks.color = change.color;
        else delete marks.color;
    } else {
        if (change.href) marks.href = change.href;
        else delete marks.href;
        delete marks.linkTitle;
    }
    return marks;
}

function sameTextMarks(left: TextMarks, right: TextMarks) {
    return (
        [
            'bold',
            'italic',
            'strike',
            'code',
            'underline',
            'color',
            'href',
            'linkTitle',
        ] as const
    ).every((mark) => left[mark] === right[mark]);
}

export function selectedTextRuns(
    state: EditorState,
    selection = state.selection,
): FormattingRun[] {
    return selectedMarkdownBlocks(state, selection).flatMap((block) =>
        block.runs.filter((run) => run.selected),
    );
}
