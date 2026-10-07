<?php

namespace App\Services\Markdown;

use Illuminate\Validation\ValidationException;
use League\CommonMark\Parser\Block\BlockStart;
use League\CommonMark\Parser\Block\BlockStartParserInterface;
use League\CommonMark\Parser\Cursor;
use League\CommonMark\Parser\MarkdownParserStateInterface;

final class OrbiumBlockStartParser implements BlockStartParserInterface
{
    public function tryStart(Cursor $cursor, MarkdownParserStateInterface $parserState): ?BlockStart
    {
        if ($cursor->isIndented()) {
            return BlockStart::none();
        }
        $remainder = ltrim($cursor->getRemainder(), " \t");
        if (! preg_match('/^(:{3,})orbium\b/', $remainder, $match)) {
            return BlockStart::none();
        }
        if ($parserState->getParagraphContent() !== null || $parserState->getActiveBlockParser() instanceof CalloutParagraphParser) {
            MarkdownContract::invalid('An Orbium directive must start at a Markdown block boundary.');
        }
        $header = substr($remainder, strlen($match[0]));
        if (! str_starts_with($header, ' {')) {
            MarkdownContract::invalid('An Orbium directive needs one space and a JSON object.');
        }
        try {
            $metadata = (new OrbiumMetadata)->decode(rtrim(substr($header, 1), " \t"));
        } catch (ValidationException $exception) {
            MarkdownContract::invalid($exception->errors()['markdown'][0].' Near directive: '.mb_substr($remainder, 0, 120));
        }
        $fenceLength = strlen($match[1]);
        $parent = $parserState->getLastMatchedBlockParser()->getBlock();
        while ($parent !== null) {
            if ($parent instanceof OrbiumBlock && $fenceLength >= $parent->fenceLength) {
                MarkdownContract::invalid('Nested Orbium fences must be shorter than their parent.');
            }
            $parent = $parent->parent();
        }
        $cursor->advanceToEnd();

        return BlockStart::of(new OrbiumBlockParser(new OrbiumBlock($metadata, $fenceLength)))->at($cursor);
    }
}
