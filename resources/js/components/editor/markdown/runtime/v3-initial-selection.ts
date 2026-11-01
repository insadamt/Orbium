// Summary: Places initial/imported document carets after visible type markers and presentation openers; depends on the validated V3 index and shared body focus rules.
import { EditorState } from '@codemirror/state';
import { parseV3Structure } from '../structure/v3-structure-parser';
import { V3DocumentIndex } from '../structure/v3-document-index';
import { v3BodyCaretPosition } from '../editing/v3-live-selection';

export function initialV3Caret(source: string) {
    const structure = parseV3Structure(source);
    const block = structure.blocks.find(
        (entry) => entry.type !== 'columns' && entry.type !== 'spacer',
    );
    return structure.diagnostics.length || !block
        ? 0
        : v3BodyCaretPosition(
              EditorState.create({ doc: source }),
              new V3DocumentIndex(structure),
              block,
          );
}
