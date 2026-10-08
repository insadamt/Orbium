import { createRoot } from 'react-dom/client';
import { EditorView } from '@codemirror/view';
import {
    BlockMenuSurface,
    type BlockMenuAction,
    type BlockMenuAnchor,
} from '../../ui/block-menu-surface';
import { Text } from '@codemirror/state';
import { logicalMarkdownText } from './markdown-logical-text';
import {
    adjacentMarkdownBlock,
    markdownBlockPresentation,
    moveMarkdownBlock,
    replaceMarkdownBlock,
    setMarkdownBlockPresentation,
    turnMarkdownBlockInto,
    type MarkdownBlockRange,
} from './markdown-block-actions';

const conversionPrefixes: Record<string, string> = {
    Text: '',
    'Heading 1': '# ',
    'Heading 2': '## ',
    'Heading 3': '### ',
    'Bullet list': '- ',
    'Numbered list': '1. ',
    Checklist: '- [ ] ',
    Quote: '> ',
    Code: '```',
};

export function mountMarkdownBlockMenu({
    view,
    block,
    host,
    anchor,
    onNotice,
    onClose,
}: {
    view: EditorView;
    block: MarkdownBlockRange;
    host: HTMLElement;
    anchor: BlockMenuAnchor;
    onNotice: (message: string) => void;
    onClose: () => void;
}) {
    const container = document.createElement('div');
    host.append(container);
    const root = createRoot(container);
    const presentation = markdownBlockPresentation(view, block);
    function perform(command: () => void) {
        try {
            onNotice('');
            command();
        } catch (error) {
            onNotice(
                error instanceof Error
                    ? error.message
                    : 'Could not edit this block.',
            );
        }
    }
    function runAction(action: BlockMenuAction) {
        if (action === 'delete') replaceMarkdownBlock(view, block, '');
        else if (action === 'duplicate')
            replaceMarkdownBlock(
                view,
                block,
                `${block.source}\n\n${block.source}`,
                block.source.length + 2,
            );
        else if (action === 'copy') {
            void navigator.clipboard
                .writeText(
                    logicalMarkdownText(
                        Text.of(block.source.split('\n')),
                    ).text.trimEnd(),
                )
                .catch(() =>
                    onNotice(
                        'Clipboard access failed. Select the block and copy it.',
                    ),
                );
        } else {
            const neighbor = adjacentMarkdownBlock(
                view,
                block,
                action === 'up',
            );
            if (neighbor) moveMarkdownBlock(view, block, neighbor);
        }
    }
    root.render(
        <BlockMenuSurface
            anchor={anchor}
            formatting={{
                alignment:
                    presentation.metadata.align ??
                    (anchor.direction === 'rtl' ? 'right' : 'left'),
                direction: presentation.metadata.dir ?? 'auto',
                canAlign: /^(?:Paragraph|(?:ATX|Setext)Heading[1-6])$/.test(
                    presentation.name,
                ),
            }}
            canMoveUp={Boolean(adjacentMarkdownBlock(view, block, true))}
            canMoveDown={Boolean(adjacentMarkdownBlock(view, block, false))}
            onClose={onClose}
            onFocusEditor={() => view.focus()}
            onConvert={(label) =>
                perform(() =>
                    turnMarkdownBlockInto(
                        view,
                        block,
                        conversionPrefixes[label],
                    ),
                )
            }
            onDirection={(dir) =>
                perform(() =>
                    setMarkdownBlockPresentation(view, block, { dir }),
                )
            }
            onAlignment={(align) =>
                perform(() =>
                    setMarkdownBlockPresentation(view, block, { align }),
                )
            }
            onAction={(action) => perform(() => runAction(action))}
        />,
    );
    return () => {
        container.remove();
        queueMicrotask(() => root.unmount());
    };
}
