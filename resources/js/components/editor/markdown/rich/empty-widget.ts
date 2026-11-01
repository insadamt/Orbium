// Summary: Edits a styled empty paragraph and delegates its exit to the V3 owner; depends on rich body replacement, identified sibling insertion and legacy fallback controls.
import { EditorView } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import { dispatchV3ProductOperation } from '../runtime/v3-product-commands';
import { createOrFocusRichParagraph } from './rich-block-selection';
import { serializeOrbiumBlock } from '../dialect/metadata';
import type { RichBlock, RichWidgetMount } from './rich-model';
import { applyRichSource, element } from './widget-controls';

export function mountEmptyParagraph(mount: RichWidgetMount) {
    let block = mount.block;
    const input = element(
        'textarea',
        'block w-full resize-none bg-transparent font-inherit outline-none',
    );
    input.rows = 1;
    input.readOnly = !mount.view.state.facet(EditorView.editable);
    input.setAttribute('aria-label', 'Empty paragraph');
    input.dir = String(block.presentation.dir ?? 'auto');
    input.style.textAlign = String(block.presentation.align ?? '');
    input.addEventListener('input', () => {
        const metadata = { ...block.presentation, kind: 'block' as const };
        const source = serializeOrbiumBlock(metadata, input.value);
        const caret = source.indexOf('\n') + 1 + input.value.length;
        if (applyRichSource(mount.view, block, source, caret))
            mount.view.focus();
    });
    input.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey)) event.stopPropagation();
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (mount.view.state.field(v3StructureField, false)) {
            const identified = mount.view.state
                .field(v3StructureField)
                .current.blockAt(block.from);
            if (identified?.type === 'paragraph')
                dispatchV3ProductOperation(mount.view, {
                    kind: 'advance-empty',
                    blockId: identified.id,
                });
            else createOrFocusRichParagraph(mount.view, { block });
            return;
        }
        const source = `${block.source}\n\n`;
        if (applyRichSource(mount.view, block, source)) {
            mount.view.dispatch({
                selection: { anchor: block.from + source.length },
            });
            mount.view.focus();
        }
    });
    mount.root.addEventListener('orbium-edit-rich', () => input.focus());
    mount.root.append(input);
    return {
        update(next: RichBlock) {
            if (next.kind !== 'empty') return false;
            block = next;
            input.readOnly = !mount.view.state.facet(EditorView.editable);
            input.dir = String(next.presentation.dir ?? 'auto');
            input.style.textAlign = String(next.presentation.align ?? '');
            return true;
        },
        destroy() {},
    };
}
