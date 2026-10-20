import { createRoot } from 'react-dom/client';
import { EditorView } from '@codemirror/view';
import {
    BlockMenuSurface,
    type BlockMenuAction,
    type BlockMenuAnchor,
} from '../../ui/block-menu-surface';
import { Text } from '@codemirror/state';
import { logicalMarkdownText } from './markdown-logical-text';
import { readCalloutSource } from '../dialect/callout-source';
import { syntaxTree } from '@codemirror/language';
import { readRichBlock } from '../rich/read-rich-block';
import {
    canAlignMarkdownBlock,
    markdownBlockConversionTargets,
    markdownConversionPrefixes,
} from './markdown-block-capabilities';
import {
    adjacentMarkdownBlock,
    deleteMarkdownBlock,
    markdownBlockPresentation,
    moveMarkdownBlock,
    replaceMarkdownBlock,
    setMarkdownBlockPresentation,
    turnMarkdownBlockInto,
    type MarkdownBlockRange,
} from './markdown-block-actions';

function currentBlockType(name: string, source: string) {
    if (name === 'Blockquote' && readCalloutSource(source)) return 'Callout';
    const heading = /^(?:ATX|Setext)Heading([1-6])$/.exec(name);
    if (heading) return `Heading ${heading[1]}`;
    if (name === 'BulletList')
        return /^\s*[-+*]\s+\[[ xX]\]/m.test(source)
            ? 'Checklist'
            : 'Bullet list';
    const labels: Record<string, string> = {
        Paragraph: 'Text',
        OrderedList: 'Numbered list',
        Blockquote: 'Quote',
        FencedCode: 'Code',
        CodeBlock: 'Code',
        Table: 'Table',
        OrbiumMathBlock: 'Math block',
        HorizontalRule: 'Divider',
    };
    return labels[name] ?? 'Rich block';
}

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
    const node = syntaxTree(view.state).topNode.childAfter(block.from);
    const rich = node ? readRichBlock(view.state, node) : null;
    const blockType = currentBlockType(presentation.name, presentation.body);
    const conversionTargets = markdownBlockConversionTargets(
        presentation.name,
        rich?.kind,
    ).filter((label) => label !== blockType);
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
        if (action === 'delete') deleteMarkdownBlock(view, block);
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
            currentBlockType={blockType}
            conversionTargets={conversionTargets}
            anchor={anchor}
            formatting={{
                alignment:
                    presentation.metadata.align ??
                    (anchor.direction === 'rtl' ? 'right' : 'left'),
                direction: presentation.metadata.dir ?? 'auto',
                canAlign: canAlignMarkdownBlock(
                    presentation.name,
                    presentation.body,
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
                        markdownConversionPrefixes[label],
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
