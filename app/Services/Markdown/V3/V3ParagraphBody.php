<?php

/**
 * Summary: Keeps an explicit paragraph from becoming a heading/list/code block through Markdown inference; depends on the validated body AST and shared safe inline parser, preserving presentation wrappers and reference scope.
 */

namespace App\Services\Markdown\V3;

use App\Services\Markdown\OrbiumBlock;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Node\Block\Document;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Parser\InlineParserEngine;

final class V3ParagraphBody
{
    public function enforce(Document $document, string $source, Environment $environment): Document
    {
        $container = $document;
        $first = $document->firstChild();
        $offset = 0;
        if ($first instanceof OrbiumBlock) {
            if ($first->kind() !== 'block') {
                return $document;
            }
            $container = $first;
            $lines = explode("\n", $source);
            $offset = $first->getStartLine();
            $source = implode("\n", array_slice($lines, $offset, $first->getEndLine() - $offset - 1));
        }
        $children = iterator_to_array($container->children(), false);
        if ($children === [] || array_all($children, fn ($node) => $node instanceof Paragraph)) {
            return $document;
        }
        foreach ($children as $child) {
            $child->detach();
        }
        foreach (preg_split('/\n[ \t]*\n/', trim($source, "\n")) as $part) {
            if ($part === '') {
                continue;
            }
            $paragraph = new Paragraph;
            $paragraph->setStartLine($offset + 1);
            $paragraph->setEndLine($offset + substr_count($part, "\n") + 1);
            (new InlineParserEngine($environment, $document->getReferenceMap()))->parse($part, $paragraph);
            $container->appendChild($paragraph);
            $offset += substr_count($part, "\n") + 2;
        }

        return $document;
    }
}
