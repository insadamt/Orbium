<?php

namespace App\Services\Markdown;

use League\CommonMark\Parser\Block\AbstractBlockContinueParser;
use League\CommonMark\Parser\Block\BlockContinue;
use League\CommonMark\Parser\Block\BlockContinueParserInterface;
use League\CommonMark\Parser\Cursor;

final class MathBlockParser extends AbstractBlockContinueParser
{
    private MathBlock $block;

    private bool $openingLine = true;

    /** @var list<string> */
    private array $lines = [];

    public function __construct()
    {
        $this->block = new MathBlock;
    }

    public function getBlock(): MathBlock
    {
        return $this->block;
    }

    public function tryContinue(Cursor $cursor, BlockContinueParserInterface $activeBlockParser): BlockContinue
    {
        if (! $cursor->isIndented() && ltrim($cursor->getRemainder(), " \t") === '$$') {
            return BlockContinue::finished();
        }

        return BlockContinue::at($cursor);
    }

    public function addLine(string $line): void
    {
        if ($this->openingLine) {
            $this->openingLine = false;

            return;
        }
        $this->lines[] = $line;
    }

    public function closeBlock(): void
    {
        $this->block->setLiteral(implode("\n", $this->lines));
    }
}
