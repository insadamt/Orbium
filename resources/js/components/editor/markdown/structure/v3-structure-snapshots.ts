// Summary: Shares derived structure for the same immutable CodeMirror Text across editor and syntax readers; depends on weak snapshot identity and never substitutes an index from another source revision.
import type { Text } from '@codemirror/state';
import type { V3DocumentIndex } from './v3-document-index';

const snapshots = new WeakMap<Text, V3DocumentIndex>();
export function rememberV3StructureSnapshot(
    source: Text,
    index: V3DocumentIndex,
) {
    snapshots.set(source, index);
    return index;
}
export function v3StructureSnapshot(source: Text) {
    return snapshots.get(source);
}
