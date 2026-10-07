<?php

namespace App\Services\Markdown;

use League\CommonMark\Parser\Inline\InlineParserInterface;
use League\CommonMark\Parser\Inline\InlineParserMatch;
use League\CommonMark\Parser\InlineParserContext;

final class ReservedReferenceInlineParser implements InlineParserInterface
{
    public function getMatchDefinition(): InlineParserMatch
    {
        return InlineParserMatch::string('orbium:');
    }

    public function parse(InlineParserContext $inlineContext): bool
    {
        $cursor = $inlineContext->getCursor();
        $prefix = $cursor->getSubstring(0, $cursor->getPosition());
        if (preg_match('/\]\([ \t]*<?$/', $prefix)) {
            MarkdownContract::invalid('An Orbium link destination is malformed or unclosed.', $inlineContext->getContainer()->getStartLine());
        }
        if (! preg_match('/^orbium:(node|attachment)\/([1-9][0-9]*)(?=$|[\s).,;!?\]])/', $cursor->getRemainder(), $matches)
            || filter_var($matches[2], FILTER_VALIDATE_INT) === false) {
            MarkdownContract::invalid('Malformed reserved Orbium reference.', $inlineContext->getContainer()->getStartLine());
        }

        return false;
    }
}
