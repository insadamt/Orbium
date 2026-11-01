// Summary: Binds the existing Mind Map surface to stable V3 body writes and paragraph insertion; depends on rich owner context, source baselines and the shared Mind Map component.
import { v3StructureField } from '../structure/v3-structure-state';
import { insertV3ParagraphAfter } from '../runtime/v3-product-commands';
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
                    owner={{
                        tabId: mount.context.tabId,
                        workspaceId: mount.context.workspaceId,
                        nodeId: mount.context.nodeId,
                        kind: mount.context.ownerKind ?? 'document',
                    }}
                    editable={mount.view.state.facet(EditorView.editable)}
                    onInsertParagraphAfter={
                        mount.view.state.field(v3StructureField, false)
                            ? () => {
                                  const identified = mount.view.state
                                      .field(v3StructureField)
                                      .current.blockAt(block.from);
                                  if (!identified) return false;
                                  try {
                                      insertV3ParagraphAfter(
                                          mount.view,
                                          identified.id,
                                      );
                                      return true;
                                  } catch {
                                      return false;
                                  }
                              }
                            : undefined
                    }
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
