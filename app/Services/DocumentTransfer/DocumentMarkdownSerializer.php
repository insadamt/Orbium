<?php

namespace App\Services\DocumentTransfer;

use App\Services\Markdown\CalloutMarker;
use App\Services\Markdown\MarkdownParserService;
use App\Services\Markdown\MathBlock;
use App\Services\Markdown\OrbiumBlock;
use App\Services\Markdown\OrbiumInline;
use League\CommonMark\Extension\CommonMark\Node\Block\BlockQuote;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Block\IndentedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\ListBlock;
use League\CommonMark\Extension\CommonMark\Node\Block\ThematicBreak;
use League\CommonMark\Extension\CommonMark\Node\Inline\Code;
use League\CommonMark\Extension\CommonMark\Node\Inline\Emphasis;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Extension\CommonMark\Node\Inline\Strong;
use League\CommonMark\Extension\Strikethrough\Strikethrough;
use League\CommonMark\Extension\Table\Table;
use League\CommonMark\Extension\Table\TableCell;
use League\CommonMark\Extension\TaskList\TaskListItemMarker;
use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Node\Inline\Newline;
use League\CommonMark\Node\Inline\Text;
use League\CommonMark\Node\Node;
use League\CommonMark\Node\StringContainerInterface;

final class DocumentMarkdownSerializer
{
    private TransferSerializationOptions $options;

    public function serialize(string $source, ?TransferSerializationOptions $options = null): string
    {
        $serializer = clone $this;
        $serializer->options = $options ?? new TransferSerializationOptions;

        return $serializer->render(app(MarkdownParserService::class)->parse($source));
    }

    private function render(Node $node): string
    {
        if ($node instanceof OrbiumInline) {
            if ($this->options->preserveFormatting) {
                return $node->latex === null ? ':orbium['.$this->children($node, '').']'.json_encode($node->metadata, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)
                    : ':orbium-math'.json_encode(['latex' => $node->latex], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            }

            return $node->latex === null ? $this->children($node, '') : (str_contains($node->latex, '$') ? $this->inlineCode($node->latex) : '$'.$node->latex.'$');
        }
        if ($node instanceof Text) {
            return $this->escapeText($node->getLiteral());
        }
        if ($node instanceof Newline) {
            return $node->getType() === Newline::HARDBREAK ? "  \n" : "\n";
        }
        if ($node instanceof Code) {
            $fence = $this->fence($node->getLiteral(), 1);
            $value = $node->getLiteral();
            $padding = str_starts_with($value, '`') || str_ends_with($value, '`') || (str_starts_with($value, ' ') && str_ends_with($value, ' ')) ? ' ' : '';

            return $fence.$padding.$value.$padding.$fence;
        }
        if ($node instanceof FencedCode || $node instanceof IndentedCode) {
            $value = $node->getLiteral();
            $fence = $this->fence($value, 3);

            return $fence.($node instanceof FencedCode ? $node->getInfo() : '')."\n".$value.($value !== '' && ! str_ends_with($value, "\n") ? "\n" : '').$fence;
        }
        if ($node instanceof MathBlock) {
            return "$$\n".rtrim($node->getLiteral(), "\n")."\n$$";
        }
        if ($node instanceof CalloutMarker) {
            return '[!'.$node->type.']'.($node->folding ?? '');
        }
        if ($node instanceof TaskListItemMarker) {
            return '['.($node->isChecked() ? 'x' : ' ').'] ';
        }
        if ($node instanceof Image || $node instanceof Link) {
            $destination = $this->destination($node->getUrl());
            $isImage = $node instanceof Image;
            if ($isImage && str_starts_with($destination, '#orbium-missing-file-')) {
                $destination = str_replace('#orbium-missing-file-', '#orbium-missing-image-', $destination);
            }
            $title = $node->getTitle() === '' ? '' : ' "'.addcslashes($node->getTitle(), '\\"').'"';

            return ($isImage ? '!' : '').'['.$this->children($node, '').'](<'.str_replace(['<', '>'], ['%3C', '%3E'], $destination).'>'.$title.')';
        }
        if ($node instanceof Strong) {
            return '**'.$this->children($node, '').'**';
        }
        if ($node instanceof Emphasis) {
            return '*'.$this->children($node, '').'*';
        }
        if ($node instanceof Strikethrough) {
            return '~~'.$this->children($node, '').'~~';
        }
        if ($node instanceof Heading) {
            return str_repeat('#', $node->getLevel()).' '.$this->children($node, '');
        }
        if ($node instanceof ThematicBreak) {
            return '---';
        }
        if ($node instanceof BlockQuote) {
            return implode("\n", array_map(fn ($line) => '> '.$line, explode("\n", $this->children($node, "\n\n"))));
        }
        if ($node instanceof ListBlock) {
            $rows = [];
            $index = $node->getListData()->start ?? 1;
            foreach ($node->children() as $item) {
                $marker = $node->getListData()->type === ListBlock::TYPE_ORDERED ? $index++.'. ' : '- ';
                $rows[] = $marker.str_replace("\n", "\n".str_repeat(' ', strlen($marker)), $this->children($item, "\n\n"));
            }

            return implode($node->isTight() ? "\n" : "\n\n", $rows);
        }
        if ($node instanceof OrbiumBlock && $this->options->preserveFormatting) {
            $body = $this->children($node, "\n\n");
            preg_match_all('/:{3,}/', $body, $runs);
            $length = max([3, ...array_map(fn ($run) => strlen($run) + 1, $runs[0])]);
            $fence = str_repeat(':', $length);

            return $fence.'orbium '.json_encode($node->metadata, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n".($body !== '' ? $body."\n" : '').$fence;
        }
        if ($node instanceof Table || ($node instanceof OrbiumBlock && $node->kind() === 'table')) {
            return $this->table($node);
        }
        if ($node instanceof OrbiumBlock) {
            if ($node->kind() === 'empty') {
                return '';
            }
            if ($node->kind() === 'math') {
                return "$$\n".$node->metadata['latex']."\n$$";
            }
            $content = $this->children($node, "\n\n");
            if ($node->kind() === 'image' && ! empty($node->metadata['caption'])) {
                $content .= "\n\n".$this->escapeText($node->metadata['caption']);
            }

            return $content;
        }
        if ($node instanceof StringContainerInterface) {
            return $node->getLiteral();
        }
        $blockChildren = $node->firstChild() instanceof AbstractBlock;

        return $this->children($node, $blockChildren ? "\n\n" : '');
    }

    private function destination(string $url): string
    {
        if (! preg_match('~^orbium:(node|attachment)/([1-9][0-9]*)$~D', $url, $match)) {
            return $url;
        }
        $destinations = $match[1] === 'node' ? $this->options->nodeDestinations : $this->options->attachmentDestinations;

        return $destinations[(int) $match[2]] ?? $url;
    }

    private function escapeText(string $text): string
    {
        return preg_replace('/([\\\\`*_{}<>#.!|~\[\]()+:=-])/', '\\\\$1', $text) ?? $text;
    }

    private function inlineCode(string $text): string
    {
        $fence = $this->fence($text, 1);

        return $fence.' '.$text.' '.$fence;
    }

    private function children(Node $node, string $separator): string
    {
        $parts = [];
        foreach ($node->children() as $child) {
            $parts[] = $this->render($child);
        }

        return implode($separator, $parts);
    }

    private function fence(string $source, int $minimum): string
    {
        preg_match_all('/`+/', $source, $runs);

        return str_repeat('`', max([$minimum, ...array_map(fn ($run) => strlen($run) + 1, $runs[0])]));
    }

    private function table(Node $table): string
    {
        $rich = $table instanceof OrbiumBlock;
        $rows = [];
        foreach ($table->children() as $child) {
            if ($rich) {
                $rows[] = $child;
            } else {
                foreach ($child->children() as $row) {
                    $rows[] = $row;
                }
            }
        }
        $grid = [];
        foreach ($rows as $rowIndex => $row) {
            $grid[$rowIndex] ??= [];
            $column = 0;
            foreach ($row->children() as $cell) {
                while (isset($grid[$rowIndex][$column])) {
                    $column++;
                }
                $value = str_replace("\n", '<br>', trim($this->render($cell)));
                $width = $cell instanceof OrbiumBlock ? ($cell->metadata['colspan'] ?? 1) : 1;
                $height = $cell instanceof OrbiumBlock ? ($cell->metadata['rowspan'] ?? 1) : 1;
                for ($y = 0; $y < $height; $y++) {
                    for ($x = 0; $x < $width; $x++) {
                        $grid[$rowIndex + $y][$column + $x] = $x === 0 && $y === 0 ? $value : '';
                    }
                }
                $column += $width;
            }
        }
        $width = max([1, ...array_map(count(...), $grid)]);
        $line = fn ($cells) => '| '.implode(' | ', array_map(fn ($index) => $cells[$index] ?? '', range(0, $width - 1))).' |';

        $delimiters = array_fill(0, $width, '---');
        if (! $rich && isset($rows[0])) {
            foreach ($rows[0]->children() as $index => $cell) {
                if ($cell instanceof TableCell) {
                    $delimiters[$index] = match ($cell->getAlign()) {
                        'left' => ':---', 'right' => '---:', 'center' => ':---:', default => '---'
                    };
                }
            }
        }

        return implode("\n", [$line($grid[0] ?? []), $line($delimiters), ...array_map($line, array_slice($grid, 1))]);
    }
}
