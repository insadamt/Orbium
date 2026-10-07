<?php

namespace App\Services\Markdown;

use Illuminate\Validation\ValidationException;
use League\CommonMark\Environment\EnvironmentAwareInterface;
use League\CommonMark\Environment\EnvironmentInterface;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Parser\Inline\InlineParserInterface;
use League\CommonMark\Parser\Inline\InlineParserMatch;
use League\CommonMark\Parser\InlineParserContext;
use League\CommonMark\Parser\InlineParserEngine;

final class OrbiumInlineParser implements EnvironmentAwareInterface, InlineParserInterface
{
    private EnvironmentInterface $environment;

    private int $depth = 0;

    public function setEnvironment(EnvironmentInterface $environment): void
    {
        $this->environment = $environment;
    }

    public function getMatchDefinition(): InlineParserMatch
    {
        return InlineParserMatch::oneOf(':orbium[', ':orbium-math', '$')->caseSensitive();
    }

    public function parse(InlineParserContext $inlineContext): bool
    {
        try {
            return $this->parseInline($inlineContext);
        } catch (ValidationException $exception) {
            MarkdownContract::invalid($exception->errors()['markdown'][0], $inlineContext->getContainer()->getStartLine());
        }
    }

    private function parseInline(InlineParserContext $inlineContext): bool
    {
        $cursor = $inlineContext->getCursor();
        $source = $cursor->getRemainder();
        if (str_starts_with($source, ':orbium-math')) {
            $jsonSource = substr($source, strlen(':orbium-math'));
            $metadataReader = new OrbiumMetadata;
            $length = $metadataReader->objectLength($jsonSource);
            $metadata = $metadataReader->decode('{"kind":"math",'.substr($jsonSource, 1, $length - 1));
            if (count($metadata) !== 2) {
                MarkdownContract::invalid('Inline math accepts only latex.');
            }
            $inlineContext->getContainer()->appendChild(new OrbiumInline([], (string) $metadata['latex']));
            $cursor->advanceBy(mb_strlen(substr($source, 0, strlen(':orbium-math') + $length), 'UTF-8'));

            return true;
        }
        if ($source[0] === '$') {
            if ($cursor->peek(-1) === '$') {
                return false;
            }

            return $this->parseDollarMath($inlineContext, $source);
        }
        $closingBracket = $this->findSpanEnd($source);
        $content = substr($source, strlen(':orbium['), $closingBracket - strlen(':orbium['));
        if (trim($content) === '') {
            MarkdownContract::invalid('An Orbium span must contain nonempty inline content within one Markdown block.');
        }
        $jsonSource = substr($source, $closingBracket + 1);
        $metadataReader = new OrbiumMetadata;
        $jsonLength = $metadataReader->objectLength($jsonSource);
        $json = substr($jsonSource, 0, $jsonLength);
        $metadata = $metadataReader->decode($json, true);
        if (++$this->depth > MarkdownContract::MAX_DEPTH) {
            MarkdownContract::invalid('Inline Orbium spans are nested too deeply.');
        }
        try {
            $paragraph = new Paragraph;
            (new InlineParserEngine($this->environment, $inlineContext->getReferenceMap()))->parse($content, $paragraph);
        } finally {
            $this->depth--;
        }
        $span = new OrbiumInline($metadata);
        foreach ($paragraph->children() as $child) {
            $span->appendChild($child);
        }
        $inlineContext->getContainer()->appendChild($span);
        $cursor->advanceBy(mb_strlen(substr($source, 0, $closingBracket + 1 + $jsonLength), 'UTF-8'));

        return true;
    }

    private function findSpanEnd(string $source): int
    {
        $depth = 1;
        for ($index = strlen(':orbium['), $length = strlen($source); $index < $length; $index++) {
            if ($source[$index] === '\\') {
                $index++;
            } elseif (substr($source, $index, strlen(':orbium-math{')) === ':orbium-math{') {
                $start = $index + strlen(':orbium-math');
                $index = $start + (new OrbiumMetadata)->objectLength(substr($source, $start)) - 1;
            } elseif ($source[$index] === '$' && ($end = $this->findDollarMathEnd($source, $index)) !== null) {
                $index = $end;
            } elseif ($source[$index] === '`') {
                $run = strspn($source, '`', $index);
                $search = $index + $run;
                $index += $run - 1;
                while (($end = strpos($source, str_repeat('`', $run), $search)) !== false) {
                    $endRun = strspn($source, '`', $end);
                    if ($endRun === $run && ($end === 0 || $source[$end - 1] !== '`')) {
                        $index = $end + $run - 1;
                        break;
                    }
                    $search = $end + $endRun;
                }
            } elseif ($source[$index] === '[') {
                $depth++;
            } elseif ($source[$index] === ']' && --$depth === 0) {
                return $index;
            }
        }
        MarkdownContract::invalid('Unclosed Orbium inline span.');
    }

    private function parseDollarMath(InlineParserContext $context, string $source): bool
    {
        $end = $this->findDollarMathEnd($source, 0);
        if ($end === null) {
            return false;
        }
        $context->getContainer()->appendChild(new OrbiumInline([], substr($source, 1, $end - 1)));
        $context->getCursor()->advanceBy(mb_strlen(substr($source, 0, $end + 1), 'UTF-8'));

        return true;
    }

    private function findDollarMathEnd(string $source, int $start): ?int
    {
        if (! isset($source[$start + 1]) || $source[$start + 1] === '$' || ctype_space($source[$start + 1])) {
            return null;
        }
        for ($index = $start + 1, $length = strlen($source); $index < $length; $index++) {
            if ($source[$index] === "\n") {
                return null;
            }
            if ($source[$index] === '\\') {
                $index++;
            } elseif ($source[$index] === '$') {
                return ctype_space($source[$index - 1]) || ($source[$index + 1] ?? null) === '$' ? null : $index;
            }
        }

        return null;
    }
}
