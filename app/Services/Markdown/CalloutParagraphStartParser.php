<?php

namespace App\Services\Markdown;

use League\CommonMark\Extension\CommonMark\Node\Block\BlockQuote;
use League\CommonMark\Parser\Block\BlockStart;
use League\CommonMark\Parser\Block\BlockStartParserInterface;
use League\CommonMark\Parser\Cursor;
use League\CommonMark\Parser\MarkdownParserStateInterface;

final class CalloutParagraphStartParser implements BlockStartParserInterface
{
    public function tryStart(Cursor $cursor, MarkdownParserStateInterface $parserState): ?BlockStart
    {
        $parent = $parserState->getLastMatchedBlockParser()->getBlock();
        if ($cursor->isIndented() || ! $parent instanceof BlockQuote || $parent->hasChildren()
            || ! preg_match('/^\[![A-Za-z][A-Za-z0-9_-]*\][+-]?/', ltrim($cursor->getRemainder(), " \t"))) {
            return BlockStart::none();
        }
        $cursor->advanceToNextNonSpaceOrTab();

        return BlockStart::of(new CalloutParagraphParser)->at($cursor);
    }
}
