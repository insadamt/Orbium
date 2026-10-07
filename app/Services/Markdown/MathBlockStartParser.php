<?php

namespace App\Services\Markdown;

use League\CommonMark\Parser\Block\BlockStart;
use League\CommonMark\Parser\Block\BlockStartParserInterface;
use League\CommonMark\Parser\Cursor;
use League\CommonMark\Parser\MarkdownParserStateInterface;

final class MathBlockStartParser implements BlockStartParserInterface
{
    public function tryStart(Cursor $cursor, MarkdownParserStateInterface $parserState): ?BlockStart
    {
        if ($cursor->isIndented() || ltrim($cursor->getRemainder(), " \t") !== '$$' || $parserState->getParagraphContent() !== null || $parserState->getActiveBlockParser() instanceof CalloutParagraphParser) {
            return BlockStart::none();
        }
        $cursor->advanceToEnd();

        return BlockStart::of(new MathBlockParser)->at($cursor);
    }
}
