<?php

namespace App\Services\Markdown;

use League\CommonMark\Extension\CommonMark\Node\Block\BlockQuote;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Parser\Inline\InlineParserInterface;
use League\CommonMark\Parser\Inline\InlineParserMatch;
use League\CommonMark\Parser\InlineParserContext;

final class CalloutInlineParser implements InlineParserInterface
{
    public function getMatchDefinition(): InlineParserMatch
    {
        return InlineParserMatch::string('[!');
    }

    public function parse(InlineParserContext $inlineContext): bool
    {
        $block = $inlineContext->getContainer();
        $cursor = $inlineContext->getCursor();
        if ($cursor->getPosition() !== 0 || ! $block instanceof Paragraph || ! $block->parent() instanceof BlockQuote
            || $block->parent()->firstChild() !== $block
            || ! preg_match('/^\[!([A-Za-z][A-Za-z0-9_-]*)\]([+-])?/', $cursor->getRemainder(), $matches)) {
            return false;
        }
        $block->appendChild(new CalloutMarker(strtoupper($matches[1]), $matches[2] ?? null));
        $cursor->advanceBy(strlen($matches[0]));

        return true;
    }
}
