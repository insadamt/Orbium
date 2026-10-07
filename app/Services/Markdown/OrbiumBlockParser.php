<?php

namespace App\Services\Markdown;

use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Parser\Block\AbstractBlockContinueParser;
use League\CommonMark\Parser\Block\BlockContinue;
use League\CommonMark\Parser\Block\BlockContinueParserInterface;
use League\CommonMark\Parser\Cursor;

final class OrbiumBlockParser extends AbstractBlockContinueParser
{
    private bool $closed = false;

    public function __construct(private readonly OrbiumBlock $block) {}

    public function getBlock(): OrbiumBlock
    {
        return $this->block;
    }

    public function isContainer(): bool
    {
        return true;
    }

    public function canContain(AbstractBlock $childBlock): bool
    {
        return true;
    }

    public function tryContinue(Cursor $cursor, BlockContinueParserInterface $activeBlockParser): BlockContinue
    {
        $active = $activeBlockParser->getBlock();
        if ($active instanceof FencedCode || $active instanceof MathBlock) {
            return BlockContinue::at($cursor);
        }
        if (! $cursor->isIndented() && $cursor->getRemainder() === str_repeat(':', $this->block->fenceLength)) {
            $this->closed = true;

            return BlockContinue::finished();
        }

        return BlockContinue::at($cursor);
    }

    public function closeBlock(): void
    {
        if (! $this->closed) {
            MarkdownContract::invalid('Unclosed Orbium directive.', $this->block->getStartLine());
        }
    }
}
