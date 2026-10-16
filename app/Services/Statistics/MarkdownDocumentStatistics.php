<?php

namespace App\Services\Statistics;

use App\Services\Markdown\CalloutMarker;
use App\Services\Markdown\MathBlock;
use App\Services\Markdown\OrbiumBlock;
use App\Services\Markdown\OrbiumInline;
use League\CommonMark\Extension\CommonMark\Node\Block\BlockQuote;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Block\IndentedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\ListBlock;
use League\CommonMark\Extension\CommonMark\Node\Block\ListItem;
use League\CommonMark\Extension\CommonMark\Node\Block\ThematicBreak;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Extension\Table\Table;
use League\CommonMark\Extension\TaskList\TaskListItemMarker;
use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Node\Inline\Newline;
use League\CommonMark\Node\Node;
use League\CommonMark\Node\StringContainerInterface;

final class MarkdownDocumentStatistics
{
    public function project(Node $document): DocumentStatisticsData
    {
        $blocks = [];
        $checked = 0;
        $inlineMath = 0;
        $text = $this->visit($document, false, false, $blocks, $checked, $inlineMath);

        return new DocumentStatisticsData($text, $blocks, $checked, $inlineMath);
    }

    /** @param array<string, int> $blocks */
    private function visit(Node $node, bool $suppressParagraphs, bool $insideTable, array &$blocks, int &$checked, int &$inlineMath): string
    {
        if ($node instanceof Paragraph && $node->onlyContainsLinkReferenceDefinitions) {
            return '';
        }
        $kind = $node instanceof OrbiumBlock ? $node->kind() : null;
        $blockType = $this->blockType($node, $suppressParagraphs);
        if ($node instanceof OrbiumInline && $node->latex !== null) {
            $inlineMath++;
        }
        if ($node instanceof ListItem && ! $insideTable) {
            $marker = $node->firstChild()?->firstChild();
            if ($marker instanceof TaskListItemMarker && $marker->isChecked()) {
                $checked++;
            }
        }
        $parts = [];
        foreach ($node->children() as $child) {
            $suppressChildParagraph = $node instanceof ListItem || $node instanceof BlockQuote
                || ($node instanceof OrbiumBlock && in_array($kind, ['image', 'empty'], true))
                || ($node instanceof OrbiumBlock && $kind === 'block' && $suppressParagraphs);
            $parts[] = $this->visit($child, $suppressChildParagraph, $insideTable || $blockType === 'table', $blocks, $checked, $inlineMath);
        }
        $text = match (true) {
            $node instanceof TaskListItemMarker, $node instanceof CalloutMarker => '',
            $node instanceof OrbiumInline && $node->latex !== null => $node->latex,
            $node instanceof OrbiumBlock && $kind === 'math' => (string) $node->metadata['latex'],
            $node instanceof StringContainerInterface => $node->getLiteral(),
            $node instanceof Newline => ' ',
            default => implode($node instanceof AbstractBlock && $node->firstChild() instanceof AbstractBlock ? ' ' : '', $parts),
        };
        if ($node instanceof OrbiumBlock && $kind === 'image') {
            $text .= ' '.($node->metadata['caption'] ?? '');
        }
        if (! $insideTable && $blockType !== null && ($blockType !== 'paragraph' || preg_match('/[^\s\p{Z}]/u', $text))) {
            $blocks[$blockType] = ($blocks[$blockType] ?? 0) + 1;
        }

        return $text;
    }

    private function blockType(Node $node, bool $suppressParagraphs): ?string
    {
        if ($node instanceof OrbiumBlock) {
            return match ($node->kind()) {
                'table' => 'table',
                'math' => 'math',
                default => null,
            };
        }
        if ($node instanceof ListItem) {
            if ($node->firstChild()?->firstChild() instanceof TaskListItemMarker) {
                return 'checklist_item';
            }
            $parent = $node->parent();

            return $parent instanceof ListBlock && $parent->getListData()->type === ListBlock::TYPE_ORDERED ? 'numbered_list_item' : 'bullet_list_item';
        }
        if ($node instanceof BlockQuote) {
            return $node->firstChild()?->firstChild() instanceof CalloutMarker ? 'callout' : 'quote';
        }
        if ($node instanceof FencedCode) {
            $parent = $node->parent();
            $forcedCode = $parent instanceof OrbiumBlock && $parent->kind() === 'code';

            return ! $forcedCode && strtolower(strtok($node->getInfo(), " \t") ?: '') === 'mermaid' ? 'mermaid' : 'code';
        }

        return match (true) {
            $node instanceof Heading => 'heading_'.$node->getLevel(),
            $node instanceof Paragraph => $suppressParagraphs || $this->isMediaParagraph($node) ? null : 'paragraph',
            $node instanceof Table => 'table',
            $node instanceof MathBlock => 'math',
            $node instanceof IndentedCode => 'code',
            $node instanceof ThematicBreak => 'divider',
            $node instanceof Image => 'image',
            $node instanceof Link && $this->isFileLink($node) => 'file',
            default => null,
        };
    }

    private function isMediaParagraph(Paragraph $paragraph): bool
    {
        $hasMedia = false;
        foreach ($paragraph->children() as $child) {
            if ($child instanceof Image || ($child instanceof Link && $this->isFileLink($child))) {
                $hasMedia = true;
            } elseif (! $child instanceof Newline && ! ($child instanceof StringContainerInterface && trim($child->getLiteral()) === '')) {
                return false;
            }
        }

        return $hasMedia;
    }

    private function isFileLink(Link $link): bool
    {
        return str_starts_with($link->getUrl(), 'orbium:attachment/') || str_starts_with($link->getUrl(), '#orbium-missing-file-');
    }
}
