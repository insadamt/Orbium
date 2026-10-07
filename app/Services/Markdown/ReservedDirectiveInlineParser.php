<?php

namespace App\Services\Markdown;

use League\CommonMark\Parser\Inline\InlineParserInterface;
use League\CommonMark\Parser\Inline\InlineParserMatch;
use League\CommonMark\Parser\InlineParserContext;

final class ReservedDirectiveInlineParser implements InlineParserInterface
{
    public function getMatchDefinition(): InlineParserMatch
    {
        return InlineParserMatch::regex(':{3,}orbium\\b');
    }

    public function parse(InlineParserContext $inlineContext): bool
    {
        MarkdownContract::invalid('Malformed or misplaced Orbium block directive.', $inlineContext->getContainer()->getStartLine());
    }
}
