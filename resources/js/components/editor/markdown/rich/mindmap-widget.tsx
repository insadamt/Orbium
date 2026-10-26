import { createRoot } from 'react-dom/client';
import { EditorView } from '@codemirror/view';
import { MindMapBlock } from '@/components/mindmap/mindmap-block';
import { serializeOrbiumBlock } from '../dialect/metadata';
import { applyRichSource, preservePresentation } from './widget-controls';
import type { RichBlock, RichController, RichWidgetMount } from './rich-model';

export function mountMindMap(mount: RichWidgetMount): RichController {
    let block = mount.block;
    let destroyed = false;
    const root = createRoot(mount.root);
    function render() {
        queueMicrotask(() => {
            if (destroyed || !block.metadata.mindmap) return;
            root.render(
                <MindMapBlock
                    data={block.metadata.mindmap}
                    editable={mount.view.state.facet(EditorView.editable)}
                    onChange={(mindmap) => {
                        const next = preservePresentation(
                            block,
                            serializeOrbiumBlock({ kind: 'mindmap', mindmap }),
                            serializeOrbiumBlock,
                        );
                        const accepted = applyRichSource(
                            mount.view,
                            block,
                            next,
                        );
                        if (accepted)
                            block = {
                                ...block,
                                source: next,
                                to: block.from + next.length,
                                metadata: { kind: 'mindmap', mindmap },
                            };
                        render();
                        return accepted;
                    }}
                />,
            );
        });
    }
    render();
    return {
        update(next: RichBlock) {
            block = next;
            render();
            return true;
        },
        destroy() {
            destroyed = true;
            queueMicrotask(() => root.unmount());
        },
    };
}
