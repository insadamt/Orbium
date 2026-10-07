<?php

namespace App\Services\Markdown;

use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Parser\Block\AbstractBlockContinueParser;
use League\CommonMark\Parser\Block\BlockContinue;
use League\CommonMark\Parser\Block\BlockContinueParserInterface;
use League\CommonMark\Parser\Block\BlockContinueParserWithInlinesInterface;
use League\CommonMark\Parser\Cursor;
use League\CommonMark\Parser\InlineParserEngineInterface;

final class CalloutParagraphParser extends AbstractBlockContinueParser implements BlockContinueParserWithInlinesInterface
{
    private Paragraph $block;

    /** @var list<string> */
    private array $lines = [];

    public function __construct()
    {
        $this->block = new Paragraph;
    }

    public function getBlock(): Paragraph
    {
        return $this->block;
    }

    public function canHaveLazyContinuationLines(): bool
    {
        return true;
    }

    public function tryContinue(Cursor $cursor, BlockContinueParserInterface $activeBlockParser): ?BlockContinue
    {
        return $cursor->isBlank() ? BlockContinue::none() : BlockContinue::at($cursor);
    }

    public function addLine(string $line): void
    {
        $this->lines[] = $line;
    }

    public function parseInlines(InlineParserEngineInterface $inlineParser): void
    {
        // A callout title beginning with ':' must not become a CommonMark reference definition.
        $inlineParser->parse(implode("\n", $this->lines), $this->block);
    }
}
