// Summary: Allows manual inspection of an isolated V3 CodeMirror state through Vite without mounting an editor or saving content; depends on the structural field and explicit source-change DTOs.
import { EditorState, type ChangeSpec } from '@codemirror/state';
import { v3StructureField } from './v3-structure-state';

export function createV3SourceInspection(source: string) {
    let state = EditorState.create({
        doc: source,
        extensions: [v3StructureField],
    });

    function inspect() {
        const structure = state.field(v3StructureField);
        return {
            valid: structure.current.valid,
            source: state.doc.toString(),
            updateKind: structure.updateKind,
            structure: structure.current.structure,
            lastValidSource: structure.lastValid?.source.toString() ?? null,
        };
    }

    return {
        inspect,
        applySourceChanges(changes: ChangeSpec) {
            //
            // Inspection uses a separate immutable state, never the application's mounted owner/history.
            //
            state = state.update({ changes }).state;
            return inspect();
        },
    };
}
