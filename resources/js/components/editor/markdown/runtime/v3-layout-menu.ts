// Summary: Exposes the existing column layout actions through the shared block menu surface; depends on identified layout commands, current column widths and checked owner dispatch.
import { copyV3MenuBlocks } from './v3-menu-clipboard';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import {
    BlockMenuSurface,
    type BlockMenuAnchor,
} from '../../ui/block-menu-surface';
import type { EditorView } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import {
    dispatchV3ProductOperation,
    insertV3ParagraphAfter,
    selectedV3ProductIds,
    v3ProductNeighbor,
    moveV3ProductBlock,
} from './v3-product-commands';
import { equalColumnWidths } from '../columns/column-source';
import type { V3BlockOperation } from '../transactions/v3-transaction-types';

export function mountV3LayoutMenu(options: {
    view: EditorView;
    blockId: string;
    host: HTMLElement;
    anchor: BlockMenuAnchor;
    onNotice: (message: string) => void;
    onClose: () => void;
}) {
    const block = options.view.state
        .field(v3StructureField)
        .current.blockById(options.blockId);
    if (block?.type !== 'columns') return null;
    const count = options.view.state
        .field(v3StructureField)
        .current.structure.columns.filter(
            (column) => column.layoutId === block.id,
        ).length;
    const container = document.createElement('div');
    options.host.append(container);
    const root = createRoot(container);
    const apply = (operation: V3BlockOperation) => {
        try {
            dispatchV3ProductOperation(options.view, operation);
            options.onClose();
        } catch (error) {
            options.onNotice(
                error instanceof Error
                    ? error.message
                    : 'Could not change the layout.',
            );
        }
    };
    root.render(
        createElement(BlockMenuSurface, {
            formatting: { alignment: null, direction: 'auto', canAlign: false },
            currentBlockType: 'Columns',
            conversionTargets: [],
            anchor: options.anchor,
            canMoveUp: Boolean(v3ProductNeighbor(options.view, block.id, true)),
            canMoveDown: Boolean(
                v3ProductNeighbor(options.view, block.id, false),
            ),
            onClose: options.onClose,
            onFocusEditor: () => options.view.focus(),
            onConvert: () => {},
            onDirection: () => {},
            onAlignment: () => {},
            onAction: (action) => {
                if (action === 'delete')
                    apply({
                        kind: 'delete',
                        blockIds: selectedV3ProductIds(options.view, block.id),
                        ensureParagraph: true,
                    });
                else if (action === 'duplicate')
                    apply({
                        kind: 'duplicate',
                        blockIds: selectedV3ProductIds(options.view, block.id),
                    });
                else if (action === 'copy') {
                    void copyV3MenuBlocks(options.view, block.id).catch(
                        (error) =>
                            options.onNotice(
                                error instanceof Error
                                    ? error.message
                                    : 'Could not copy this layout.',
                            ),
                    );
                } else {
                    const neighbor = v3ProductNeighbor(
                        options.view,
                        block.id,
                        action === 'up',
                    );
                    if (neighbor?.v3Id)
                        moveV3ProductBlock(
                            options.view,
                            block.id,
                            neighbor.v3Id,
                            action === 'up' ? 'before' : 'after',
                        );
                }
            },
            extraActions: [
                ...(count === 2
                    ? [
                          {
                              label: 'Add column',
                              onSelect: () =>
                                  apply({
                                      kind: 'add-column',
                                      layoutId: block.id,
                                  }),
                          },
                      ]
                    : []),
                {
                    label: 'Equal widths',
                    onSelect: () =>
                        apply({
                            kind: 'resize-columns',
                            layoutId: block.id,
                            widths: equalColumnWidths(count),
                        }),
                },
                {
                    label: 'Stack blocks',
                    onSelect: () =>
                        apply({ kind: 'stack-columns', layoutId: block.id }),
                },
                {
                    label: 'Add paragraph below',
                    onSelect: () => {
                        insertV3ParagraphAfter(options.view, block.id);
                        options.onClose();
                    },
                },
            ],
        }),
    );
    return () => {
        container.remove();
        queueMicrotask(() => root.unmount());
    };
}
