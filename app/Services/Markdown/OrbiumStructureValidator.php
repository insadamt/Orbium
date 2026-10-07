<?php

namespace App\Services\Markdown;

use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Block\ListBlock;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Node\Node;

final class OrbiumStructureValidator
{
    public function validate(OrbiumBlock $block): void
    {
        $children = iterator_to_array($block->children(), false);
        $metadata = $block->metadata;
        switch ($block->kind()) {
            case 'empty':
            case 'math':
                if ($children !== []) {
                    $this->invalid($block, 'This Orbium atom cannot have a body.');
                }
                break;
            case 'block':
                if (count($children) !== 1) {
                    $this->invalid($block, 'Block metadata must wrap exactly one Markdown block.');
                }
                $child = $children[0];
                if (isset($metadata['align']) && ! ($child instanceof Paragraph || $child instanceof Heading)) {
                    $this->invalid($block, 'Block alignment requires a paragraph or heading.');
                }
                if (isset($metadata['listType']) && ! ($child instanceof ListBlock && $child->getListData()->type === ListBlock::TYPE_ORDERED)) {
                    $this->invalid($block, 'listType requires an ordered list.');
                }
                break;
            case 'image':
                if (count($children) !== 1 || ! $children[0] instanceof Paragraph) {
                    $this->invalid($block, 'Image metadata must wrap one attachment image.');
                }
                $inlines = iterator_to_array($children[0]->children(), false);
                if (count($inlines) !== 1 || ! $inlines[0] instanceof Image || ! str_starts_with($inlines[0]->getUrl(), 'orbium:attachment/')) {
                    $this->invalid($block, 'Image metadata must wrap one attachment image.');
                }
                break;
            case 'code':
                if (count($children) !== 1 || ! $children[0] instanceof FencedCode) {
                    $this->invalid($block, 'A code directive must wrap exactly one fenced code block.');
                }
                break;
            case 'table':
                $this->validateTable($block, $children);
                break;
            case 'row':
                if (! ($block->parent() instanceof OrbiumBlock && $block->parent()->kind() === 'table')) {
                    $this->invalid($block, 'Row directives must be direct table children.');
                }
                foreach ($children as $child) {
                    if (! ($child instanceof OrbiumBlock && $child->kind() === 'cell')) {
                        $this->invalid($block, 'Rows contain cell directives only.');
                    }
                }
                break;
            case 'cell':
                if (! ($block->parent() instanceof OrbiumBlock && $block->parent()->kind() === 'row')) {
                    $this->invalid($block, 'Cell directives must be direct row children.');
                }
                break;
        }
    }

    /** @param list<Node> $rows */
    private function validateTable(OrbiumBlock $table, array $rows): void
    {
        if ($rows === [] || count($rows) > 1000) {
            $this->invalid($table, 'A rich table needs 1–1000 rows.');
        }
        $grid = [];
        $columnWidths = [];
        $width = 0;
        $coordinates = 0;
        foreach ($rows as $rowIndex => $row) {
            if (! ($row instanceof OrbiumBlock && $row->kind() === 'row')) {
                $this->invalid($table, 'Tables contain row directives only.');
            }
            $column = 0;
            foreach ($row->children() as $cell) {
                if (! ($cell instanceof OrbiumBlock && $cell->kind() === 'cell')) {
                    $this->invalid($table, 'Rows contain cell directives only.');
                }
                while (isset($grid[$rowIndex][$column])) {
                    $column++;
                }
                $colspan = (int) ($cell->metadata['colspan'] ?? 1);
                $rowspan = (int) ($cell->metadata['rowspan'] ?? 1);
                if ($rowIndex + $rowspan > count($rows) || $column + $colspan > 1000 || $coordinates + $colspan * $rowspan > 10000) {
                    $this->invalid($table, 'Rich table spans exceed the grid or complexity limit.');
                }
                for ($x = $column; $x < $column + $colspan; $x++) {
                    $pixelWidth = $cell->metadata['colwidth'][$x - $column] ?? 0;
                    if ($pixelWidth > 0) {
                        if (isset($columnWidths[$x]) && $columnWidths[$x] !== $pixelWidth) {
                            $this->invalid($table, 'Rich table column widths are inconsistent.');
                        }
                        $columnWidths[$x] = $pixelWidth;
                    }
                    for ($y = $rowIndex; $y < $rowIndex + $rowspan; $y++) {
                        if (isset($grid[$y][$x])) {
                            $this->invalid($table, 'Rich table spans overlap.');
                        }
                        $grid[$y][$x] = true;
                        $coordinates++;
                    }
                }
                $column += $colspan;
                $width = max($width, $column);
            }
        }
        foreach ($rows as $index => $row) {
            if (count($grid[$index] ?? []) !== $width || $width === 0) {
                $this->invalid($table, 'Rich table rows must cover the same rectangular grid.');
            }
        }
    }

    private function invalid(OrbiumBlock $block, string $message): never
    {
        MarkdownContract::invalid($message, $block->getStartLine());
    }
}
